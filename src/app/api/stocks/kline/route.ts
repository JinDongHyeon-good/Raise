import { NextRequest, NextResponse } from "next/server";
import { getStockCandles, isAllowedStockSymbol } from "@/lib/stocks";

export const runtime = "nodejs";

/** ?symbol=^IXIC&interval=15|60|240|D|W — 미국 지수 캔들 (Yahoo Finance, 60초 캐시) */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";
  const interval = searchParams.get("interval") ?? "60";
  if (!isAllowedStockSymbol(symbol)) return NextResponse.json({ error: "지원하지 않는 종목이에요." }, { status: 400 });
  try {
    const candles = await getStockCandles(symbol, interval);
    return NextResponse.json({ symbol, interval, candles }, { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } });
  } catch {
    return NextResponse.json({ error: "차트를 불러오지 못했어요." }, { status: 502 });
  }
}
