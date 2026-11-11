"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CandleChart, formatPrice, type Candle } from "@/components/raise/candle-chart";
import Link from "next/link";
import { RaiseFooter, RaiseHeader } from "@/components/raise/raise-chrome";
import { SERVICE_NAME, SERVICE_VALUES } from "@/lib/brand";

type Coin = { symbol: string; ticker: string; name: string };

const COINS: Coin[] = [
  { symbol: "BTCUSDT", ticker: "BTC", name: "비트코인" },
  { symbol: "ETHUSDT", ticker: "ETH", name: "이더리움" },
  { symbol: "XRPUSDT", ticker: "XRP", name: "리플" },
  { symbol: "SOLUSDT", ticker: "SOL", name: "솔라나" },
  { symbol: "DOGEUSDT", ticker: "DOGE", name: "도지코인" },
  { symbol: "ADAUSDT", ticker: "ADA", name: "에이다" },
  { symbol: "TRXUSDT", ticker: "TRX", name: "트론" },
  { symbol: "SUIUSDT", ticker: "SUI", name: "수이" },
];

const INTERVALS = [
  { value: "15", label: "15분" },
  { value: "60", label: "1시간" },
  { value: "240", label: "4시간" },
  { value: "D", label: "일" },
  { value: "W", label: "주" },
];

const ORDERS = [
  { value: "relevance", label: "관련도" },
  { value: "date", label: "최신" },
  { value: "viewCount", label: "조회수" },
];

type Ticker = { symbol: string; price: number; change24h: number; high24h: number; low24h: number; turnover24h: number };

type Video = {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
  viewCount: number | null;
  duration: string | null;
};

function formatCount(n: number | null) {
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
  if (hours === 0 && min === 0 && s === 0) return "LIVE";
  return hours > 0 ? `${hours}:${pad(min)}:${pad(s)}` : `${min}:${pad(s)}`;
}

function timeAgo(iso: string) {
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

function formatTurnover(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${Math.round(n).toLocaleString()}`;
}

export default function RaiseHome() {
  const [coin, setCoin] = useState<Coin>(COINS[0]);
  const [interval, setInterval_] = useState("60");
  const [tickers, setTickers] = useState<Record<string, Ticker>>({});
  const [chart, setChart] = useState<{ key: string; candles: Candle[]; error: string | null }>({
    key: "",
    candles: [],
    error: null,
  });

  const [queryInput, setQueryInput] = useState(`${COINS[0].name} 전망`);
  const [query, setQuery] = useState(`${COINS[0].name} 전망`);
  const [order, setOrder] = useState("relevance");
  const [videoResult, setVideoResult] = useState<{ key: string; videos: Video[]; error: string | null }>({
    key: "",
    videos: [],
    error: null,
  });
  const [playing, setPlaying] = useState<Video | null>(null);

  // 시세 (10초마다)
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/bybit/tickers?symbols=${COINS.map((c) => c.symbol).join(",")}`);
        const data = (await res.json()) as { tickers?: Ticker[] };
        if (alive && data.tickers) setTickers(Object.fromEntries(data.tickers.map((t) => [t.symbol, t])));
      } catch {
        /* 다음 주기에 재시도 */
      }
    };
    void load();
    const id = window.setInterval(load, 10_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  // 캔들 (코인/주기 변경 시 + 30초마다)
  const chartKey = `${coin.symbol}:${interval}`;
  useEffect(() => {
    let alive = true;
    const key = `${coin.symbol}:${interval}`;
    const load = async (initial: boolean) => {
      try {
        const res = await fetch(`/api/bybit/kline?category=spot&symbol=${coin.symbol}&interval=${interval}`);
        const data = (await res.json()) as { candles?: Candle[]; error?: string };
        if (!alive) return;
        if (data.candles) {
          setChart({ key, candles: data.candles, error: null });
        } else if (initial) {
          setChart((prev) => ({ key, candles: prev.candles, error: data.error ?? "차트를 불러오지 못했어요." }));
        }
      } catch {
        if (alive && initial) setChart((prev) => ({ key, candles: prev.candles, error: "차트를 불러오지 못했어요." }));
      }
    };
    void load(true);
    const id = window.setInterval(() => load(false), 30_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [coin.symbol, interval]);

  // 영상 검색
  // 정렬은 API를 다시 부르지 않고 받아둔 결과를 화면에서 정렬 (YouTube 할당량 절약)
  const videoKey = query;
  useEffect(() => {
    let alive = true;
    const key = query;
    fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`)
      .then(async (res) => {
        const data = (await res.json()) as { videos?: Video[]; error?: string };
        if (!alive) return;
        setVideoResult(
          data.videos
            ? { key, videos: data.videos, error: null }
            : { key, videos: [], error: data.error ?? "영상을 불러오지 못했어요." },
        );
      })
      .catch(() => alive && setVideoResult({ key, videos: [], error: "영상을 불러오지 못했어요." }));
    return () => {
      alive = false;
    };
  }, [query]);

  const selectCoin = useCallback((next: Coin) => {
    setCoin(next);
    const q = `${next.name} 전망`;
    setQueryInput(q);
    setQuery(q);
    setPlaying(null);
  }, []);

  const runSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQueryInput(trimmed);
    setQuery(trimmed);
    setPlaying(null);
  };

  const ticker = tickers[coin.symbol];
  const candles = chart.candles;
  const chartLoading = chart.key !== chartKey;
  const chartError = chartLoading ? null : chart.error;
  const videoLoading = videoResult.key !== videoKey;
  const videos = useMemo(() => {
    const list = [...videoResult.videos];
    if (order === "date") list.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    if (order === "viewCount") list.sort((a, b) => (b.viewCount ?? -1) - (a.viewCount ?? -1));
    return list.slice(0, 24);
  }, [videoResult.videos, order]);
  const videoError = videoLoading ? null : videoResult.error;
  const presets = useMemo(
    () => [`${coin.name} 전망`, `${coin.name} 뉴스`, `${coin.ticker} 차트 분석`, `${coin.name} 실시간`],
    [coin],
  );

  return (
    <div className="raise-app min-h-dvh bg-[var(--rz-bg)] text-[var(--rz-text)]">
      <RaiseHeader />

      {/* 코인 스트립 */}
      <div className="border-b border-[var(--rz-line)]">
        <div className="rz-container flex gap-2 overflow-x-auto py-3 [scrollbar-width:none]">
          {COINS.map((c) => {
            const t = tickers[c.symbol];
            const selected = c.symbol === coin.symbol;
            return (
              <button
                key={c.symbol}
                type="button"
                onClick={() => selectCoin(c)}
                className={`flex min-w-[124px] shrink-0 flex-col items-start rounded-lg border px-3 py-2 text-left transition ${
                  selected
                    ? "border-[var(--rz-accent)] bg-[var(--rz-panel-2)]"
                    : "border-[var(--rz-line)] bg-[var(--rz-panel)] hover:border-[var(--rz-muted)]"
                }`}
              >
                <span className="text-xs text-[var(--rz-muted)]">
                  <b className="text-[var(--rz-text)]">{c.ticker}</b> {c.name}
                </span>
                <span className="font-mono text-sm">{t ? formatPrice(t.price) : "—"}</span>
                <span
                  className={`font-mono text-xs ${
                    t ? (t.change24h >= 0 ? "text-[var(--rz-up)]" : "text-[var(--rz-down)]") : "text-[var(--rz-muted)]"
                  }`}
                >
                  {t ? `${t.change24h >= 0 ? "+" : ""}${t.change24h.toFixed(2)}%` : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="rz-container space-y-6 py-6">
        {/* 차트 */}
        <section id="chart" className="scroll-mt-20 rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm text-[var(--rz-muted)]">
                {coin.name} <span className="font-mono">{coin.ticker}/USDT</span>
              </h2>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-2xl font-semibold sm:text-3xl">
                  {ticker ? formatPrice(ticker.price) : "—"}
                </span>
                {ticker ? (
                  <span
                    className={`font-mono text-sm ${ticker.change24h >= 0 ? "text-[var(--rz-up)]" : "text-[var(--rz-down)]"}`}
                  >
                    {ticker.change24h >= 0 ? "▲" : "▼"} {Math.abs(ticker.change24h).toFixed(2)}%
                  </span>
                ) : null}
              </div>
              {ticker ? (
                <div className="mt-1 flex flex-wrap gap-x-4 font-mono text-xs text-[var(--rz-muted)]">
                  <span>고가 {formatPrice(ticker.high24h)}</span>
                  <span>저가 {formatPrice(ticker.low24h)}</span>
                  <span>거래대금 {formatTurnover(ticker.turnover24h)}</span>
                </div>
              ) : null}
            </div>
            <div className="flex rounded-lg border border-[var(--rz-line)] p-0.5 text-xs">
              {INTERVALS.map((iv) => (
                <button
                  key={iv.value}
                  type="button"
                  onClick={() => setInterval_(iv.value)}
                  className={`rounded-md px-2.5 py-1.5 transition ${
                    interval === iv.value ? "bg-[var(--rz-panel-2)] text-[var(--rz-text)]" : "text-[var(--rz-muted)]"
                  }`}
                >
                  {iv.label}
                </button>
              ))}
            </div>
          </div>

          {chartError ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-[var(--rz-down)]">{chartError}</div>
          ) : chartLoading && candles.length === 0 ? (
            <div className="h-[300px] animate-pulse rounded-lg bg-[var(--rz-panel-2)] sm:h-[400px]" />
          ) : (
            <div className={chartLoading ? "opacity-50 transition" : "transition"}>
              <CandleChart candles={candles} interval={interval} />
            </div>
          )}
        </section>

        {/* 영상 */}
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
                  key={playing.id}
                  src={`https://www.youtube-nocookie.com/embed/${playing.id}?autoplay=1&rel=0`}
                  title={playing.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
              <div className="flex items-start justify-between gap-3 bg-[var(--rz-panel)] p-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium">{playing.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--rz-muted)]">
                    {playing.channelTitle} · {formatCount(playing.viewCount)} · {timeAgo(playing.publishedAt)}
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
            </div>
          ) : null}

          {videoError ? (
            <p className="rounded-lg border border-[var(--rz-line)] bg-[var(--rz-panel)] p-6 text-center text-sm text-[var(--rz-down)]">
              {videoError}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {videoLoading
                ? Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="aspect-video animate-pulse rounded-lg bg-[var(--rz-panel-2)]" />
                      <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--rz-panel-2)]" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--rz-panel-2)]" />
                    </div>
                  ))
                : videos.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setPlaying(v);
                        document.getElementById("videos")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`group text-left ${playing?.id === v.id ? "opacity-60" : ""}`}
                    >
                      <div className="relative aspect-video overflow-hidden rounded-lg bg-[var(--rz-panel-2)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.thumbnail}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                        />
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
              {!videoLoading && videos.length === 0 ? (
                <p className="col-span-full py-10 text-center text-sm text-[var(--rz-muted)]">검색 결과가 없어요.</p>
              ) : null}
            </div>
          )}
        </section>

        {/* 서비스 소개 (검색엔진·처음 온 사람용) */}
        <section aria-labelledby="about-jinco" className="rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-5 sm:p-6">
          <h1 id="about-jinco" className="text-lg font-bold sm:text-xl">
            {SERVICE_NAME} — 실시간 코인 차트 AI 분석 · 코인 유튜브 요약 · 코인 커뮤니티
          </h1>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {SERVICE_VALUES.map((value) => (
              <div key={value.title}>
                <h2 className="text-sm font-semibold">{value.title}</h2>
                <p className="mt-1 text-xs leading-5 text-[var(--rz-muted)]">{value.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs">
            <Link href="/community" className="underline">
              커뮤니티 둘러보기 →
            </Link>
          </p>
        </section>
      </main>

      <RaiseFooter />
    </div>
  );
}
