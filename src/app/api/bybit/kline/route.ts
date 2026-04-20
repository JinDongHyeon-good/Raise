import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

type MarketCategory = "spot" | "linear";

type BybitKlineResponse = {
  retCode: number;
  retMsg: string;
  result?: {
    list?: string[][];
  };
};

function getCategory(input: string | null): MarketCategory {
  return input === "linear" ? "linear" : "spot";
}

function getInterval(input: string | null) {
  const supported = new Set(["1", "3", "5", "15", "30", "60", "120", "240", "360", "720", "D", "W", "M"]);
  return input && supported.has(input) ? input : "15";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = getCategory(searchParams.get("category"));
    const symbol = searchParams.get("symbol");
    const interval = getInterval(searchParams.get("interval"));

    if (!symbol) {
      return NextResponse.json({ error: "symbol 파라미터가 필요합니다." }, { status: 400 });
    }

    const endpoint = new URL("https://api.bybit.com/v5/market/kline");
    endpoint.searchParams.set("category", category);
    endpoint.searchParams.set("symbol", symbol);
    endpoint.searchParams.set("interval", interval);
    endpoint.searchParams.set("limit", "120");

    const response = await fetch(endpoint.toString(), {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Bybit kline API 요청 실패" }, { status: 502 });
    }

    const data = (await response.json()) as BybitKlineResponse;
    if (data.retCode !== 0 || !data.result?.list) {
      return NextResponse.json({ error: data.retMsg || "Bybit kline 응답 오류" }, { status: 502 });
    }

    const candles = data.result.list
      .map((item) => ({
        timestamp: Number(item[0]),
        open: Number(item[1]),
        high: Number(item[2]),
        low: Number(item[3]),
        close: Number(item[4]),
        volume: Number(item[5]),
        turnover: Number(item[6]),
      }))
      .filter((item) => Number.isFinite(item.timestamp) && Number.isFinite(item.close))
      .sort((a, b) => a.timestamp - b.timestamp);

    return NextResponse.json({ category, symbol, interval, candles });
  } catch {
    return NextResponse.json({ error: "Bybit API 통신 중 오류가 발생했습니다." }, { status: 500 });
  }
}
