import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type BybitTicker = {
  symbol: string;
  lastPrice: string;
  price24hPcnt: string;
  highPrice24h: string;
  lowPrice24h: string;
  turnover24h: string;
  volume24h: string;
};

type Ticker = {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  turnover24h: number;
};

/** Bybit 전체 현물 시세를 5초간 공유 캐시, 실패하면 직전 값으로 응답 */
let snapshot: { at: number; list: Ticker[] } | null = null;
const FRESH_MS = 5_000;

async function loadAll(): Promise<Ticker[]> {
  if (snapshot && Date.now() - snapshot.at < FRESH_MS) return snapshot.list;
  const response = await fetch("https://api.bybit.com/v5/market/tickers?category=spot", { cache: "no-store" });
  if (!response.ok) throw new Error("Bybit tickers API 요청 실패");
  const data = (await response.json()) as { retCode: number; retMsg: string; result?: { list?: BybitTicker[] } };
  if (data.retCode !== 0 || !data.result?.list) throw new Error(data.retMsg || "Bybit tickers 응답 오류");
  const list = data.result.list.map((t) => ({
    symbol: t.symbol,
    price: Number(t.lastPrice),
    change24h: Number(t.price24hPcnt) * 100,
    high24h: Number(t.highPrice24h),
    low24h: Number(t.lowPrice24h),
    turnover24h: Number(t.turnover24h),
  }));
  snapshot = { at: Date.now(), list };
  return list;
}

/** ?symbols=BTCUSDT,ETHUSDT — 현물 24h 시세 */
export async function GET(request: NextRequest) {
  const wanted = new Set(
    (new URL(request.url).searchParams.get("symbols") ?? "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-Z0-9]{2,20}$/.test(s))
      .slice(0, 30),
  );

  try {
    const list = await loadAll();
    return NextResponse.json({ tickers: list.filter((t) => wanted.size === 0 || wanted.has(t.symbol)) });
  } catch (error) {
    if (snapshot) {
      return NextResponse.json({ tickers: snapshot.list.filter((t) => wanted.size === 0 || wanted.has(t.symbol)), stale: true });
    }
    const message = error instanceof Error ? error.message : "Bybit API 통신 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
