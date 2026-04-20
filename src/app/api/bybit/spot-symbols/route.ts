import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

type BybitInstrumentsResponse = {
  retCode: number;
  retMsg: string;
  result?: {
    list?: Array<{
      symbol: string;
      baseCoin: string;
      quoteCoin: string;
      status?: string;
    }>;
  };
};

export async function GET() {
  try {
    const response = await fetch("https://api.bybit.com/v5/market/instruments-info?category=spot", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Bybit instruments API 요청 실패" }, { status: 502 });
    }

    const data = (await response.json()) as BybitInstrumentsResponse;
    if (data.retCode !== 0 || !data.result?.list) {
      return NextResponse.json({ error: data.retMsg || "Bybit 응답 오류" }, { status: 502 });
    }

    const symbols = data.result.list
      .filter((item) => item.quoteCoin === "USDT" && item.status === "Trading")
      .map((item) => ({
        symbol: item.symbol,
        baseCoin: item.baseCoin,
        quoteCoin: item.quoteCoin,
      }))
      .sort((a, b) => a.symbol.localeCompare(b.symbol));

    return NextResponse.json({ symbols });
  } catch {
    return NextResponse.json({ error: "Bybit API 통신 중 오류가 발생했습니다." }, { status: 500 });
  }
}
