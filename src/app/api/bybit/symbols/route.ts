import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

type MarketCategory = "spot" | "linear";

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
    nextPageCursor?: string;
  };
};

type BybitTickersResponse = {
  retCode: number;
  retMsg: string;
  result?: {
    list?: Array<{
      symbol: string;
      turnover24h?: string;
    }>;
  };
};

function getCategory(input: string | null): MarketCategory {
  return input === "linear" ? "linear" : "spot";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = getCategory(searchParams.get("category"));

    const allSymbols: Array<{ symbol: string; baseCoin: string; quoteCoin: string }> = [];
    let cursor = "";

    // spot은 단일 요청으로 충분하고, linear는 cursor가 존재할 수 있어 반복 처리
    do {
      const endpoint = new URL("https://api.bybit.com/v5/market/instruments-info");
      endpoint.searchParams.set("category", category);
      if (category === "linear") {
        endpoint.searchParams.set("limit", "1000");
        if (cursor) endpoint.searchParams.set("cursor", cursor);
      }

      const response = await fetch(endpoint.toString(), {
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

      const filtered = data.result.list
        .filter((item) => item.quoteCoin === "USDT" && item.status === "Trading")
        .filter((item) => (category === "linear" ? !item.symbol.includes("-") : true))
        .map((item) => ({
          symbol: item.symbol,
          baseCoin: item.baseCoin,
          quoteCoin: item.quoteCoin,
        }));

      allSymbols.push(...filtered);
      cursor = category === "linear" ? data.result.nextPageCursor ?? "" : "";
    } while (cursor);

    const uniqueBySymbol = new Map<string, { symbol: string; baseCoin: string; quoteCoin: string }>();
    for (const item of allSymbols) {
      uniqueBySymbol.set(item.symbol, item);
    }

    const tickersEndpoint = new URL("https://api.bybit.com/v5/market/tickers");
    tickersEndpoint.searchParams.set("category", category);
    const tickersResponse = await fetch(tickersEndpoint.toString(), {
      method: "GET",
      cache: "no-store",
    });
    if (!tickersResponse.ok) {
      return NextResponse.json({ error: "Bybit tickers API 요청 실패" }, { status: 502 });
    }

    const tickersData = (await tickersResponse.json()) as BybitTickersResponse;
    if (tickersData.retCode !== 0 || !tickersData.result?.list) {
      return NextResponse.json({ error: tickersData.retMsg || "Bybit tickers 응답 오류" }, { status: 502 });
    }

    const turnoverBySymbol = new Map<string, number>();
    for (const item of tickersData.result.list) {
      const turnover = Number(item.turnover24h ?? 0);
      turnoverBySymbol.set(item.symbol, Number.isNaN(turnover) ? 0 : turnover);
    }

    const symbols = Array.from(uniqueBySymbol.values())
      .map((item) => ({
        ...item,
        turnover24h: turnoverBySymbol.get(item.symbol) ?? 0,
      }))
      .sort((a, b) => b.turnover24h - a.turnover24h)
      .map(({ turnover24h: _turnover24h, ...rest }) => rest);

    return NextResponse.json({ category, symbols });
  } catch {
    return NextResponse.json({ error: "Bybit API 통신 중 오류가 발생했습니다." }, { status: 500 });
  }
}
