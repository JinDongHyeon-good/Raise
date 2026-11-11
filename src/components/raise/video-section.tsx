"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VideoSummaryPanel } from "@/components/raise/video-summary-panel";
import { useAuth } from "@/components/auth/auth-provider";
import { useFavoriteChannels } from "@/hooks/use-favorite-channels";
import { VideoFilterModal } from "@/components/raise/video-filter-modal";
import {
  activeFilterCount,
  applyVideoFilters,
  useSavedVideoFilters,
  type VideoFilters,
} from "@/lib/video-filters";

export type Video = {
  id: string;
  title: string;
  channelTitle: string;
  channelId?: string;
  publishedAt: string;
  thumbnail: string;
  viewCount: number | null;
  duration: string | null;
};

type Page = { videos: Video[]; nextPageToken: string | null };


/** 한 번에 더 보여줄 개수 / 서버에서 받을 수 있는 최대 페이지 (서버 MAX_PAGES와 맞춤) */
const REVEAL_STEP = 12;
const MAX_PAGES = 4;

export function formatCount(n: number | null) {
  if (n === null) return "";
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억회`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(n >= 100_000 ? 0 : 1)}만회`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}천회`;
  return `${n}회`;
}

function formatDuration(iso: string | null) {
  if (!iso) return "";
  const m = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const [, d, h, min, s] = m.map((v) => Number(v ?? 0));
  const hours = d * 24 + h;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(min)}:${pad(s)}` : `${min}:${pad(s)}`;
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${Math.max(1, min)}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  const mon = Math.floor(day / 30);
  return mon < 12 ? `${mon}개월 전` : `${Math.floor(mon / 12)}년 전`;
}

export function presetQueries(coinName: string) {
  return [`${coinName} 분석`, `${coinName} 전망`, `${coinName} 차트분석`];
}

export function VideoSection({ coinName, hideTitle = false }: { coinName: string; hideTitle?: boolean }) {
  const presets = useMemo(() => presetQueries(coinName), [coinName]);
  const [query, setQuery] = useState(presets[0]);
  const [queryInput, setQueryInput] = useState(presets[0]);
  // 필터 (정렬·업로드 날짜·길이). 저장된 기본값 위에 이번 화면에서 바꾼 값을 덮어쓴다
  const savedFilters = useSavedVideoFilters();
  const [filterOverride, setFilterOverride] = useState<VideoFilters | null>(null);
  const filters = filterOverride ?? savedFilters;
  const [filterOpen, setFilterOpen] = useState(false);
  const filterCount = activeFilterCount(filters);
  const [pages, setPages] = useState<{ key: string; list: Page[]; error: string | null }>({ key: "", list: [], error: null });
  const [loadingMore, setLoadingMore] = useState(false);
  const [visible, setVisible] = useState(REVEAL_STEP);
  const [playing, setPlaying] = useState<Video | null>(null);
  const [playStart, setPlayStart] = useState(0);
  const sentinel = useRef<HTMLDivElement | null>(null);

  // ⭐ 내 채널 (즐겨찾기 채널 최신 영상)
  const { requireLogin } = useAuth();
  const favorites = useFavoriteChannels();
  const [mode, setMode] = useState<"search" | "favorites">("search");
  const [favFilter, setFavFilter] = useState<string | null>(null);
  const favKey = `fav:${favFilter ?? "all"}:${favorites.channels.map((c) => c.id).join(",")}`;
  const [favFeed, setFavFeed] = useState<{ key: string; videos: Video[]; error: string | null }>({ key: "", videos: [], error: null });

  // 코인이 바뀌면 그 코인의 첫 배지로 검색 (렌더 중 상태 조정 — effect 불필요)
  const [lastCoin, setLastCoin] = useState(coinName);
  if (lastCoin !== coinName) {
    setLastCoin(coinName);
    setMode("search");
    setQuery(presets[0]);
    setQueryInput(presets[0]);
    setPlaying(null);
    setVisible(REVEAL_STEP);
  }

  // 첫 페이지
  useEffect(() => {
    let alive = true;
    fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`)
      .then(async (res) => {
        const data = (await res.json()) as Partial<Page> & { error?: string };
        if (!alive) return;
        setPages(
          data.videos
            ? { key: query, list: [{ videos: data.videos, nextPageToken: data.nextPageToken ?? null }], error: null }
            : { key: query, list: [], error: data.error ?? "영상을 불러오지 못했어요." },
        );
      })
      .catch(() => alive && setPages({ key: query, list: [], error: "영상을 불러오지 못했어요." }));
    return () => {
      alive = false;
    };
  }, [query]);

  // 즐겨찾기 피드
  useEffect(() => {
    if (mode !== "favorites" || !favorites.loggedIn) return;
    let alive = true;
    const key = favKey;
    fetch(`/api/youtube/favorites/feed${favFilter ? `?channelId=${encodeURIComponent(favFilter)}` : ""}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as { videos?: Video[]; error?: string };
        if (!alive) return;
        setFavFeed(data.videos ? { key, videos: data.videos, error: null } : { key, videos: [], error: data.error ?? "영상을 불러오지 못했어요." });
      })
      .catch(() => alive && setFavFeed({ key, videos: [], error: "영상을 불러오지 못했어요." }));
    return () => {
      alive = false;
    };
  }, [mode, favFilter, favKey, favorites.loggedIn]);

  const inFavorites = mode === "favorites";
  const loading = inFavorites ? favFeed.key !== favKey : pages.key !== query;
  const listError = inFavorites ? favFeed.error : pages.error;
  const all = useMemo(() => {
    const seen = new Set<string>();
    const source = inFavorites ? favFeed.videos : pages.list.flatMap((p) => p.videos);
    const merged = source.filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)));
    return applyVideoFilters(merged, filters);
  }, [pages.list, favFeed.videos, inFavorites, filters]);
  const loadedCount = inFavorites ? favFeed.videos.length : pages.list.reduce((n, p) => n + p.videos.length, 0);
  const shown = all.slice(0, visible);
  const lastPage = pages.list[pages.list.length - 1];
  const canFetchMore = !inFavorites && !loading && !!lastPage?.nextPageToken && pages.list.length < MAX_PAGES;
  const hasMore = visible < all.length || canFetchMore;

  const loadMore = useCallback(async () => {
    if (visible < all.length) {
      setVisible((v) => v + REVEAL_STEP);
      return;
    }
    if (!canFetchMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const pageIndex = pages.list.length;
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&page=${pageIndex}`);
      const data = (await res.json()) as Partial<Page>;
      if (data.videos) {
        const next = { videos: data.videos, nextPageToken: data.nextPageToken ?? null };
        setPages((prev) => (prev.key === query ? { ...prev, list: [...prev.list, next] } : prev));
        setVisible((v) => v + REVEAL_STEP);
      } else {
        // 더 못 받으면 멈춤
        setPages((prev) => (prev.key === query ? { ...prev, list: prev.list.map((p, i, arr) => (i === arr.length - 1 ? { ...p, nextPageToken: null } : p)) } : prev));
      }
    } finally {
      setLoadingMore(false);
    }
  }, [visible, all.length, canFetchMore, loadingMore, pages.list, query]);

  // 무한 스크롤: 목록 끝이 보이면 더 불러오기
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) void loadMore();
    }, { rootMargin: "600px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const runSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQueryInput(trimmed);
    setQuery(trimmed);
    setMode("search");
    setPlaying(null);
    setVisible(REVEAL_STEP);
  };

  const openFavorites = () => {
    if (!requireLogin()) return;
    setMode("favorites");
    setFavFilter(null);
    setPlaying(null);
    setVisible(REVEAL_STEP);
  };

  const play = (video: Video, start = 0) => {
    setPlaying(video);
    setPlayStart(start);
    document.getElementById("videos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="videos" className="scroll-mt-20">
      {hideTitle ? null : <h2 className="mb-3 text-lg font-semibold">관련 영상</h2>}

      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(queryInput);
        }}
      >
        <input
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="유튜브 검색"
          maxLength={100}
          className="min-w-0 flex-1 rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--rz-accent)]/60"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-[var(--rz-accent)] px-4 py-2.5 text-sm font-medium text-[var(--rz-accent-fg)] transition hover:brightness-110"
        >
          검색
        </button>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label={`필터${filterCount ? ` (${filterCount}개 적용됨)` : ""}`}
          aria-haspopup="dialog"
          className={`relative flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm transition ${
            filterCount
              ? "border-[var(--rz-accent)]/50 bg-[var(--rz-accent-soft)] text-[var(--rz-text)]"
              : "border-[var(--rz-line)] bg-[var(--rz-panel)] text-[var(--rz-muted)] hover:text-[var(--rz-text)]"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">필터</span>
          {filterCount ? (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[var(--rz-accent)] px-1 text-[10px] font-semibold text-[var(--rz-accent-fg)]">
              {filterCount}
            </span>
          ) : null}
        </button>
      </form>


      <VideoFilterModal
        open={filterOpen}
        value={filters}
        savedDefault={savedFilters}
        onClose={() => setFilterOpen(false)}
        onApply={(next) => {
          setFilterOverride(next);
          setFilterOpen(false);
          setVisible(REVEAL_STEP);
        }}
      />

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={openFavorites}
          aria-pressed={inFavorites}
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs transition ${
            inFavorites
              ? "border-amber-400/50 bg-amber-400/10 text-amber-200"
              : "border-[var(--rz-line)] text-[var(--rz-muted)] hover:border-[var(--rz-line-strong)] hover:text-[var(--rz-text)]"
          }`}
        >
          ★ 내 채널 추가하기{favorites.channels.length ? ` ${favorites.channels.length}` : ""}
        </button>
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => runSearch(p)}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs transition ${
              !inFavorites && query === p
                ? "border-[var(--rz-accent)]/50 bg-[var(--rz-accent-soft)] text-[var(--rz-text)]"
                : "border-[var(--rz-line)] text-[var(--rz-muted)] hover:border-[var(--rz-line-strong)] hover:text-[var(--rz-text)]"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {inFavorites ? (
        <div className="mb-4 rounded-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-3">
          {favorites.channels.length === 0 ? (
            <p className="text-xs leading-5 text-[var(--rz-muted)]">
              아직 즐겨찾기한 채널이 없어요. 영상을 재생한 뒤 <b className="text-[var(--rz-text)]">★ 채널 즐겨찾기</b>를 누르면 그 채널의 새 영상이 여기에 모여요.
            </p>
          ) : (
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setFavFilter(null)}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs ${favFilter === null ? "bg-[var(--rz-panel-2)] text-[var(--rz-text)]" : "text-[var(--rz-muted)]"}`}
              >
                전체
              </button>
              {favorites.channels.map((c) => (
                <span
                  key={c.id}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg py-1 pl-1.5 pr-1 text-xs ${
                    favFilter === c.id ? "bg-[var(--rz-panel-2)] text-[var(--rz-text)]" : "text-[var(--rz-muted)]"
                  }`}
                >
                  <button type="button" onClick={() => setFavFilter(c.id)} className="flex items-center gap-1.5">
                    {c.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.thumbnail} alt="" className="h-5 w-5 rounded-full" />
                    ) : null}
                    <span className="max-w-[140px] truncate">{c.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (favFilter === c.id) setFavFilter(null);
                      void favorites.toggle(c.id);
                    }}
                    aria-label={`${c.title} 즐겨찾기 해제`}
                    className="rounded px-1 text-[var(--rz-muted)] hover:text-[var(--rz-up)]"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {playing ? (
        <div className="mb-5 overflow-hidden rounded-2xl border border-[var(--rz-line)] bg-black shadow-[var(--rz-shadow)]">
          <div className="aspect-video w-full">
            <iframe
              key={`${playing.id}:${playStart}`}
              src={`https://www.youtube-nocookie.com/embed/${playing.id}?autoplay=1&rel=0${playStart ? `&start=${playStart}` : ""}`}
              title={playing.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          <div className="bg-[var(--rz-panel)] p-3.5 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{playing.title}</p>
                <p className="mt-1 text-xs text-[var(--rz-muted)]">
                  {[playing.channelTitle, formatCount(playing.viewCount), timeAgo(playing.publishedAt)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-2 text-xs">
                {playing.channelId ? (
                  <button
                    type="button"
                    onClick={() => void favorites.toggle(playing.channelId!)}
                    disabled={favorites.busyId === playing.channelId}
                    aria-pressed={favorites.isFavorite(playing.channelId)}
                    title={favorites.isFavorite(playing.channelId) ? "채널 즐겨찾기 해제" : "이 채널 즐겨찾기"}
                    className={`rounded-lg border px-2.5 py-1.5 transition disabled:opacity-50 ${
                      favorites.isFavorite(playing.channelId)
                        ? "border-amber-400/50 bg-amber-400/10 text-amber-200"
                        : "border-[var(--rz-line)] text-[var(--rz-muted)] hover:text-[var(--rz-text)]"
                    }`}
                  >
                    {favorites.isFavorite(playing.channelId) ? "★ 즐겨찾기됨" : "☆ 채널 즐겨찾기"}
                  </button>
                ) : null}
                <a
                  href={`https://www.youtube.com/watch?v=${playing.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-[var(--rz-line)] px-2.5 py-1.5 text-[var(--rz-muted)] transition hover:text-[var(--rz-text)]"
                >
                  YouTube
                </a>
                <button
                  type="button"
                  onClick={() => setPlaying(null)}
                  className="rounded-lg border border-[var(--rz-line)] px-2.5 py-1.5 text-[var(--rz-muted)] transition hover:text-[var(--rz-text)]"
                >
                  닫기
                </button>
              </div>
            </div>
            <VideoSummaryPanel key={playing.id} videoId={playing.id} onSeek={(sec) => play(playing, sec)} />
          </div>
        </div>
      ) : null}

      {listError && !loading ? (
        <p className="rounded-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-6 text-center text-sm text-[var(--rz-down)]">
          {listError}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-video animate-pulse rounded-xl bg-[var(--rz-panel-2)]" />
                  <div className="mt-0.5 h-5 w-full animate-pulse rounded bg-[var(--rz-panel-2)]" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--rz-panel-2)]" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--rz-panel-2)]" />
                </div>
              ))
            : shown.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => play(v)}
                  className={`group flex h-full w-full flex-col text-left ${playing?.id === v.id ? "opacity-60" : ""}`}
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--rz-panel-2)] ring-1 ring-[var(--rz-line)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                    {v.duration ? (
                      <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 font-mono text-[11px] text-white">
                        {formatDuration(v.duration)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2.5 truncate text-sm font-medium leading-snug transition group-hover:text-white">
                    {v.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-[var(--rz-muted)]">{v.channelTitle}</p>
                  <p className="truncate text-xs text-[var(--rz-muted)]">
                    {[formatCount(v.viewCount), timeAgo(v.publishedAt)].filter(Boolean).join(" · ")}
                  </p>
                </button>
              ))}
          {!loading && all.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-[var(--rz-muted)]">
              {loadedCount > 0 && filterCount
                ? "필터 조건에 맞는 영상이 없어요. 필터를 바꿔 보세요."
                : inFavorites
                  ? favorites.channels.length
                    ? "즐겨찾기 채널에 새 영상이 없어요."
                    : ""
                  : "검색 결과가 없어요."}
            </p>
          ) : null}
        </div>
      )}

      {!loading && hasMore ? (
        <div ref={sentinel} className="flex justify-center py-5" aria-hidden={!loadingMore}>
          {loadingMore ? (
            <div className="rz-linear-indeterminate w-full max-w-xs" role="status" aria-label="더 불러오는 중">
              <span />
            </div>
          ) : (
            <span className="h-1 w-full max-w-xs" />
          )}
        </div>
      ) : null}
      {!loading && !hasMore && all.length > 0 ? (
        <p className="py-6 text-center text-xs text-[var(--rz-muted)]">영상을 모두 불러왔어요.</p>
      ) : null}
    </section>
  );
}
