"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VideoSummaryPanel } from "@/components/raise/video-summary-panel";

export type Video = {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
  viewCount: number | null;
  duration: string | null;
};

type Page = { videos: Video[]; nextPageToken: string | null };

const ORDERS = [
  { value: "relevance", label: "관련도" },
  { value: "date", label: "최신" },
  { value: "viewCount", label: "조회수" },
];

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

export function VideoSection({ coinName }: { coinName: string }) {
  const presets = useMemo(() => presetQueries(coinName), [coinName]);
  const [query, setQuery] = useState(presets[0]);
  const [queryInput, setQueryInput] = useState(presets[0]);
  const [order, setOrder] = useState("relevance");
  const [pages, setPages] = useState<{ key: string; list: Page[]; error: string | null }>({ key: "", list: [], error: null });
  const [loadingMore, setLoadingMore] = useState(false);
  const [visible, setVisible] = useState(REVEAL_STEP);
  const [playing, setPlaying] = useState<Video | null>(null);
  const [playStart, setPlayStart] = useState(0);
  const sentinel = useRef<HTMLDivElement | null>(null);

  // 코인이 바뀌면 그 코인의 첫 배지로 검색 (렌더 중 상태 조정 — effect 불필요)
  const [lastCoin, setLastCoin] = useState(coinName);
  if (lastCoin !== coinName) {
    setLastCoin(coinName);
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

  const loading = pages.key !== query;
  const all = useMemo(() => {
    const seen = new Set<string>();
    const merged = pages.list.flatMap((p) => p.videos).filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)));
    if (order === "date") merged.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    if (order === "viewCount") merged.sort((a, b) => (b.viewCount ?? -1) - (a.viewCount ?? -1));
    return merged;
  }, [pages.list, order]);
  const shown = all.slice(0, visible);
  const lastPage = pages.list[pages.list.length - 1];
  const canFetchMore = !loading && !!lastPage?.nextPageToken && pages.list.length < MAX_PAGES;
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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">관련 영상</h2>
        <div className="flex rounded-lg border border-[var(--rz-line)] p-0.5 text-xs">
          {ORDERS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setOrder(o.value)}
              className={`rounded-md px-2.5 py-1.5 transition ${
                order === o.value ? "bg-[var(--rz-panel-2)] text-[var(--rz-text)]" : "text-[var(--rz-muted)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

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
          className="min-w-0 flex-1 rounded-lg border border-[var(--rz-line)] bg-[var(--rz-panel)] px-3 py-2 text-sm outline-none focus:border-[var(--rz-accent)]"
        />
        <button type="submit" className="rounded-lg bg-[var(--rz-accent)] px-4 py-2 text-sm font-medium text-white">
          검색
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => runSearch(p)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              query === p
                ? "border-[var(--rz-accent)] text-[var(--rz-text)]"
                : "border-[var(--rz-line)] text-[var(--rz-muted)] hover:text-[var(--rz-text)]"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {playing ? (
        <div className="mb-5 overflow-hidden rounded-xl border border-[var(--rz-line)] bg-black">
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
          <div className="bg-[var(--rz-panel)] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-medium">{playing.title}</p>
                <p className="mt-0.5 text-xs text-[var(--rz-muted)]">
                  {[playing.channelTitle, formatCount(playing.viewCount), timeAgo(playing.publishedAt)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-2 text-xs">
                <a
                  href={`https://www.youtube.com/watch?v=${playing.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-[var(--rz-line)] px-2.5 py-1.5 text-[var(--rz-muted)] hover:text-[var(--rz-text)]"
                >
                  YouTube
                </a>
                <button
                  type="button"
                  onClick={() => setPlaying(null)}
                  className="rounded-md border border-[var(--rz-line)] px-2.5 py-1.5 text-[var(--rz-muted)] hover:text-[var(--rz-text)]"
                >
                  닫기
                </button>
              </div>
            </div>
            <VideoSummaryPanel key={playing.id} videoId={playing.id} onSeek={(sec) => play(playing, sec)} />
          </div>
        </div>
      ) : null}

      {pages.error && !loading ? (
        <p className="rounded-lg border border-[var(--rz-line)] bg-[var(--rz-panel)] p-6 text-center text-sm text-[var(--rz-down)]">
          {pages.error}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-video animate-pulse rounded-lg bg-[var(--rz-panel-2)]" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--rz-panel-2)]" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--rz-panel-2)]" />
                </div>
              ))
            : shown.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => play(v)}
                  className={`group text-left ${playing?.id === v.id ? "opacity-60" : ""}`}
                >
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-[var(--rz-panel-2)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
                    {v.duration ? (
                      <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[11px] text-white">
                        {formatDuration(v.duration)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug group-hover:text-white">{v.title}</p>
                  <p className="mt-1 text-xs text-[var(--rz-muted)]">{v.channelTitle}</p>
                  <p className="text-xs text-[var(--rz-muted)]">
                    {[formatCount(v.viewCount), timeAgo(v.publishedAt)].filter(Boolean).join(" · ")}
                  </p>
                </button>
              ))}
          {!loading && all.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-[var(--rz-muted)]">검색 결과가 없어요.</p>
          ) : null}
        </div>
      )}

      {!loading && hasMore ? (
        <div ref={sentinel} className="flex justify-center py-6">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="rounded-lg border border-[var(--rz-line)] px-4 py-2 text-xs text-[var(--rz-muted)] hover:text-[var(--rz-text)]"
          >
            {loadingMore ? "불러오는 중…" : "영상 더 보기"}
          </button>
        </div>
      ) : null}
      {!loading && !hasMore && all.length > 0 ? (
        <p className="py-6 text-center text-xs text-[var(--rz-muted)]">영상을 모두 불러왔어요.</p>
      ) : null}
    </section>
  );
}
