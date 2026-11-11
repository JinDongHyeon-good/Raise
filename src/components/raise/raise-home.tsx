"use client";

import { useEffect, useState } from "react";
import { CandleChart, formatPrice, type Candle } from "@/components/raise/candle-chart";
import { RaiseFooter, RaiseHeader } from "@/components/raise/raise-chrome";
import { VideoSection } from "@/components/raise/video-section";
import { SERVICE_NAME } from "@/lib/brand";

type Coin = { symbol: string; ticker: string; name: string };

const COINS: Coin[] = [
  { symbol: "BTCUSDT", ticker: "BTC", name: "비트코인" },
  { symbol: "ETHUSDT", ticker: "ETH", name: "이더리움" },
  { symbol: "XRPUSDT", ticker: "XRP", name: "리플" },
  { symbol: "SOLUSDT", ticker: "SOL", name: "솔라나" },
];

const INTERVALS = [
  { value: "15", label: "15분" },
  { value: "60", label: "1시간" },
  { value: "240", label: "4시간" },
  { value: "D", label: "일" },
  { value: "W", label: "주" },
];

type Ticker = { symbol: string; price: number; change24h: number; high24h: number; low24h: number; turnover24h: number };

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

  const ticker = tickers[coin.symbol];
  const candles = chart.candles;
  const chartLoading = chart.key !== chartKey;
  const chartError = chartLoading ? null : chart.error;

  return (
    <div className="raise-app min-h-dvh bg-[var(--rz-bg)] text-[var(--rz-text)]">
      <RaiseHeader />

      {/* 코인 스트립 */}
      <div className="border-b border-[var(--rz-line)]">
        <div className="rz-container grid grid-cols-2 gap-2 py-3 sm:grid-cols-4">
          {COINS.map((c) => {
            const t = tickers[c.symbol];
            const selected = c.symbol === coin.symbol;
            return (
              <button
                key={c.symbol}
                type="button"
                onClick={() => setCoin(c)}
                className={`flex min-w-0 flex-col items-start rounded-lg border px-3 py-2 text-left transition ${
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
        <h1 className="sr-only">{SERVICE_NAME} — 실시간 코인 차트 AI 분석 · 코인 유튜브 요약 · 코인 커뮤니티</h1>
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

        <VideoSection coinName={coin.name} />
      </main>

      <RaiseFooter />
    </div>
  );
}
