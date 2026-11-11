"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VideoSummaryPanel } from "@/components/raise/video-summary-panel";
import { useAuth } from "@/components/auth/auth-provider";
import { useFavoriteChannels } from "@/hooks/use-favorite-channels";
import { VideoFilterModal } from "@/components/raise/video-filter-modal";
import { KeywordModal } from "@/components/raise/keyword-modal";
import { useSearchKeywords } from "@/hooks/use-search-keywords";
import { useVideoFilterDefault } from "@/hooks/use-video-filter-default";
import {
  activeFilterCount,
  applyVideoFilters,
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

/** 조회수 — ko: 1.2만회 / en: 12K views */
export function formatCount(n: number | null, locale = "ko") {
  if (n === null) return "";
  if (locale !== "ko") {
    const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
    return `${compact} ${n === 1 ? "view" : "views"}`;
  }
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

/** 업로드 시점 — ko: 3시간 전 / en: 3 hours ago */
export function timeAgo(iso: string, locale = "ko") {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  const mon = Math.floor(day / 30);
  if (locale !== "ko") {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always" });
    if (min < 60) return rtf.format(-Math.max(1, min), "minute");
    if (hr < 24) return rtf.format(-hr, "hour");
    if (day < 30) return rtf.format(-day, "day");
    return mon < 12 ? rtf.format(-mon, "month") : rtf.format(-Math.floor(mon / 12), "year");
  }
  if (min < 60) return `${Math.max(1, min)}분 전`;
  if (hr < 24) return `${hr}시간 전`;
  if (day < 30) return `${day}일 전`;
  return mon < 12 ? `${mon}개월 전` : `${Math.floor(mon / 12)}년 전`;
}

/**
 * 검색 배지는 현재 언어의 종목 이름으로 만든다
 * ko: "비트코인 분석/전망/차트분석", en: "Bitcoin analysis/prediction/chart analysis"
 */
export function VideoSection({
  coinName,
  coinNameEn,
  hideTitle = false,
}: {
  /** 한국어 종목 이름 */
  coinName: string;
  /** 영어 종목 이름 (없으면 coinName) */
  coinNameEn?: string;
  hideTitle?: boolean;
}) {
  const t = useTranslations("video");
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ko";
  const name = locale === "ko" ? coinName : (coinNameEn ?? coinName);
  const presets = useMemo(
    () => [t("presetAnalysis", { name }), t("presetPrediction", { name }), t("presetChart", { name })],
    [t, name],
  );
  const loadFailed = t("loadFailed");
  const [query, setQuery] = useState(presets[0]);
  const [queryInput, setQueryInput] = useState(presets[0]);
  // 필터 (정렬·업로드 날짜·길이). 저장된 기본값 위에 이번 화면에서 바꾼 값을 덮어쓴다
  const filterDefault = useVideoFilterDefault();
  const savedFilters = filterDefault.saved;
  const [filterOverride, setFilterOverride] = useState<VideoFilters | null>(null);
  const filters = filterOverride ?? savedFilters;
  const [filterOpen, setFilterOpen] = useState(false);
  // 내가 추가한 검색 키워드 (이 브라우저에 저장)
  const searchKeywords = useSearchKeywords();
  const savedKeywords = searchKeywords.items.map((k) => k.keyword);
  const [keywordOpen, setKeywordOpen] = useState(false);
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
  const [lastCoin, setLastCoin] = useState(name);
  if (lastCoin !== name) {
    setLastCoin(name);
    setMode("search");
    setQuery(presets[0]);
    setQueryInput(presets[0]);
    setPlaying(null);
    setVisible(REVEAL_STEP);
  }

  // 첫 페이지
  useEffect(() => {
    let alive = true;
    fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&lang=${lang}`, { headers: { "x-ui-locale": locale } })
      .then(async (res) => {
        const data = (await res.json()) as Partial<Page> & { error?: string };
        if (!alive) return;
        setPages(
          data.videos
            ? { key: query, list: [{ videos: data.videos, nextPageToken: data.nextPageToken ?? null }], error: null }
            : { key: query, list: [], error: data.error ?? loadFailed },
        );
      })
      .catch(() => alive && setPages({ key: query, list: [], error: loadFailed }));
    return () => {
      alive = false;
    };
  }, [query, lang, locale, loadFailed]);

  // 즐겨찾기 피드
  useEffect(() => {
    if (mode !== "favorites" || !favorites.loggedIn) return;
    let alive = true;
    const key = favKey;
    fetch(`/api/youtube/favorites/feed${favFilter ? `?channelId=${encodeURIComponent(favFilter)}` : ""}`, {
      cache: "no-store",
      headers: { "x-ui-locale": locale },
    })
      .then(async (res) => {
        const data = (await res.json()) as { videos?: Video[]; error?: string };
        if (!alive) return;
        setFavFeed(data.videos ? { key, videos: data.videos, error: null } : { key, videos: [], error: data.error ?? loadFailed });
      })
      .catch(() => alive && setFavFeed({ key, videos: [], error: loadFailed }));
    return () => {
      alive = false;
    };
  }, [mode, favFilter, favKey, favorites.loggedIn, locale, loadFailed]);

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
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&page=${pageIndex}&lang=${lang}`, {
        headers: { "x-ui-locale": locale },
      });
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
  }, [visible, all.length, canFetchMore, loadingMore, pages.list, query, lang, locale]);

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
      {hideTitle ? null : <h2 className="mb-3 text-lg font-semibold">{t("relatedVideos")}</h2>}

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
          placeholder={t("searchPlaceholder")}
          maxLength={100}
          className="min-w-0 flex-1 rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--rz-accent)]/60"
        />
        <button
          type="submit"
          aria-label={t("search")}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[var(--rz-accent)] px-3 py-2.5 text-sm font-medium text-[var(--rz-accent-fg)] transition hover:brightness-110 sm:px-4"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">{t("search")}</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label={filterCount ? t("filterButtonActive", { count: filterCount }) : t("filterButton")}
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
          <span className="hidden sm:inline">{t("filterButton")}</span>
          {filterCount ? (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[var(--rz-accent)] px-1 text-[10px] font-semibold text-[var(--rz-accent-fg)]">
              {filterCount}
            </span>
          ) : null}
        </button>
      </form>


      <KeywordModal
        open={keywordOpen}
        keywords={searchKeywords.items}
        onAdd={searchKeywords.add}
        onRemove={searchKeywords.remove}
        onClose={() => setKeywordOpen(false)}
      />

      <VideoFilterModal
        open={filterOpen}
        value={filters}
        savedDefault={savedFilters}
        loggedIn={filterDefault.loggedIn}
        onSaveDefault={filterDefault.save}
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
          ★ {t("myChannels")}
          {favorites.channels.length ? ` ${favorites.channels.length}` : ""}
        </button>
        <button
          type="button"
          onClick={() => {
            if (requireLogin()) setKeywordOpen(true);
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-dashed border-[var(--rz-line-strong)] px-3 py-1.5 text-xs text-[var(--rz-muted)] transition hover:border-[var(--rz-accent)]/50 hover:text-[var(--rz-text)]"
        >
          <span aria-hidden className="inline-flex h-3.5 w-3.5 items-center justify-center text-[13px] font-semibold leading-none">
            +
          </span>
          <span className="leading-none">{t("keywords.button")}</span>
          {savedKeywords.length ? <span className="leading-none tabular-nums">{savedKeywords.length}</span> : null}
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
        {savedKeywords
          .filter((k) => !presets.includes(k))
          .map((p) => (
            <button
              key={`kw:${p}`}
              type="button"
              onClick={() => runSearch(p)}
              title={t("keywords.chipTitle")}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs transition ${
                !inFavorites && query === p
                  ? "border-[var(--rz-accent)]/50 bg-[var(--rz-accent-soft)] text-[var(--rz-text)]"
                  : "border-[var(--rz-line)] text-[var(--rz-muted)] hover:border-[var(--rz-line-strong)] hover:text-[var(--rz-text)]"
              }`}
            >
              # {p}
            </button>
          ))}
      </div>

      {inFavorites ? (
        <div className="mb-4 rounded-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-3">
          {favorites.channels.length === 0 ? (
            <p className="text-xs leading-5 text-[var(--rz-muted)]">
              {t.rich("noFavorites", { b: (chunks) => <b className="text-[var(--rz-text)]">{chunks}</b> })}
            </p>
          ) : (
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setFavFilter(null)}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs ${favFilter === null ? "bg-[var(--rz-panel-2)] text-[var(--rz-text)]" : "text-[var(--rz-muted)]"}`}
              >
                {t("allChannels")}
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
                    aria-label={t("unfavoriteChannel", { channel: c.title })}
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
          <div className="bg-[var(--rz-panel)] p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{playing.title}</p>
                <p className="mt-1 text-xs text-[var(--rz-muted)]">
                  {[playing.channelTitle, formatCount(playing.viewCount, locale), timeAgo(playing.publishedAt, locale)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:justify-end">
                {playing.channelId ? (
                  <button
                    type="button"
                    onClick={() => void favorites.toggle(playing.channelId!)}
                    disabled={favorites.busyId === playing.channelId}
                    aria-pressed={favorites.isFavorite(playing.channelId)}
                    title={favorites.isFavorite(playing.channelId) ? t("unfavoriteTitle") : t("favoriteTitle")}
                    className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition disabled:opacity-50 ${
                      favorites.isFavorite(playing.channelId)
                        ? "bg-amber-400 text-[#1a1408] shadow-[0_6px_16px_rgb(251_191_36_/_0.35)] hover:brightness-110"
                        : "border border-amber-400/45 bg-amber-400/15 text-amber-100 hover:border-amber-300/70 hover:bg-amber-400/25"
                    }`}
                  >
                    <span aria-hidden>{favorites.isFavorite(playing.channelId) ? "★" : "☆"}</span>
                    {favorites.isFavorite(playing.channelId) ? t("favorited") : t("favoriteChannel")}
                  </button>
                ) : null}
                <a
                  href={`https://www.youtube.com/watch?v=${playing.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-[#ff0033] px-3.5 py-2.5 text-xs font-semibold text-white shadow-[0_6px_16px_rgb(255_0_51_/_0.28)] transition hover:brightness-110"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
                  </svg>
                  YouTube
                </a>
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
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="space-y-1.5 sm:space-y-2">
                  <div className="aspect-video animate-pulse rounded-lg bg-[var(--rz-panel-2)] sm:rounded-xl" />
                  <div className="mt-0.5 h-4 w-full animate-pulse rounded bg-[var(--rz-panel-2)] sm:h-5" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--rz-panel-2)]" />
                  <div className="hidden h-3 w-1/2 animate-pulse rounded bg-[var(--rz-panel-2)] sm:block" />
                </div>
              ))
            : shown.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => play(v)}
                  className={`group flex h-full w-full flex-col text-left ${playing?.id === v.id ? "opacity-60" : ""}`}
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[var(--rz-panel-2)] ring-1 ring-[var(--rz-line)] sm:rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                    <span className="absolute right-1 top-1 rounded-md bg-[linear-gradient(135deg,#fb7185,#e11d48)] px-1.5 py-0.5 text-[9px] font-bold tracking-tight text-white shadow-[0_4px_12px_rgb(225_29_72_/_0.45)] ring-1 ring-white/20 sm:right-1.5 sm:top-1.5 sm:rounded-lg sm:px-2 sm:py-1 sm:text-[10px]">
                      {t("aiBadge")}
                    </span>
                    {v.duration ? (
                      <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 font-mono text-[10px] text-white sm:bottom-1.5 sm:right-1.5 sm:rounded-md sm:px-1.5 sm:text-[11px]">
                        {formatDuration(v.duration)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 truncate text-[13px] font-medium leading-snug transition group-hover:text-white sm:mt-2.5 sm:text-sm">
                    {v.title}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--rz-muted)] sm:mt-1 sm:text-xs">{v.channelTitle}</p>
                  <p className="truncate text-[11px] text-[var(--rz-muted)] sm:text-xs">
                    {[formatCount(v.viewCount, locale), timeAgo(v.publishedAt, locale)].filter(Boolean).join(" · ")}
                  </p>
                </button>
              ))}
          {!loading && all.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-[var(--rz-muted)]">
              {loadedCount > 0 && filterCount
                ? t("noFilterMatch")
                : inFavorites
                  ? favorites.channels.length
                    ? t("noFavoriteVideos")
                    : ""
                  : t("noResults")}
            </p>
          ) : null}
        </div>
      )}

      {!loading && hasMore ? (
        <div ref={sentinel} className="flex justify-center py-5" aria-hidden={!loadingMore}>
          {loadingMore ? (
            <div className="rz-linear-indeterminate w-full max-w-xs" role="status" aria-label={t("loadingMore")}>
              <span />
            </div>
          ) : (
            <span className="h-1 w-full max-w-xs" />
          )}
        </div>
      ) : null}
    </section>
  );
}
