"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import type { Ticker } from "@/lib/coins";
import { ASSETS, isYahooMarket, type Market } from "@/lib/markets";

/** 코인(Bybit, 10초) 또는 주식·지수(Yahoo, 30초) 시세 */
export function useMarketTickers(market: Market) {
  const locale = useLocale();
  const [state, setState] = useState<{ market: Market; tickers: Record<string, Ticker> }>({ market, tickers: {} });

  useEffect(() => {
    let alive = true;
    const symbols = ASSETS[market].map((a) => a.symbol).join(",");
    const yahoo = isYahooMarket(market);
    const url = yahoo
      ? `/api/stocks/quotes?symbols=${encodeURIComponent(symbols)}`
      : `/api/bybit/tickers?symbols=${symbols}`;
    const load = async () => {
      try {
        const res = await fetch(url, { headers: { "x-ui-locale": locale } });
        const data = (await res.json()) as { tickers?: Ticker[] };
        if (alive && data.tickers) {
          setState({ market, tickers: Object.fromEntries(data.tickers.map((t) => [t.symbol, t])) });
        }
      } catch {
        /* 다음 주기에 재시도 */
      }
    };
    void load();
    const id = window.setInterval(load, yahoo ? 30_000 : 10_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [market, locale]);

  // 시장을 바꾼 직후 이전 시장 시세가 섞여 보이지 않게
  return state.market === market ? state.tickers : {};
}
