import { NextRequest, NextResponse } from "next/server";
import { apiTranslator } from "@/lib/server-i18n";
import { getStockCandles, isAllowedStockSymbol } from "@/lib/stocks";

export const runtime = "nodejs";

/** ?symbol=^IXIC&interval=15|60|240|D|W — 미국 지수 캔들 (Yahoo Finance, 60초 캐시) */
export async function GET(request: NextRequest) {
  const t = apiTranslator(request);
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "";
  const interval = searchParams.get("interval") ?? "60";
  if (!isAllowedStockSymbol(symbol)) return NextResponse.json({ error: t("stocks.unsupportedSymbol") }, { status: 400 });
  try {
    const candles = await getStockCandles(symbol, interval);
    return NextResponse.json({ symbol, interval, candles }, { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } });
  } catch {
    return NextResponse.json({ error: t("stocks.chartFailed") }, { status: 502 });
  }
}
