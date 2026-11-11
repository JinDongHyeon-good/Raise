import { NextRequest, NextResponse } from "next/server";
import { apiTranslator } from "@/lib/server-i18n";
import { getStockQuotes, US_INDICES } from "@/lib/stocks";

export const runtime = "nodejs";

/** ?symbols=^IXIC,^GSPC — 미국 지수 시세 (Yahoo Finance, 30초 캐시) */
export async function GET(request: NextRequest) {
  const t = apiTranslator(request);
  const raw = new URL(request.url).searchParams.get("symbols");
  const symbols = raw ? raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 12) : US_INDICES.map((i) => i.symbol);
  try {
    const tickers = await getStockQuotes(symbols);
    if (tickers.length === 0) return NextResponse.json({ error: t("stocks.quotesFailed") }, { status: 502 });
    return NextResponse.json({ tickers }, { headers: { "Cache-Control": "public, max-age=15, s-maxage=30" } });
  } catch {
    return NextResponse.json({ error: t("stocks.quotesFailed") }, { status: 502 });
  }
}
