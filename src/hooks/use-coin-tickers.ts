"use client";

import { useEffect, useMemo, useState } from "react";
import { COINS, type Ticker } from "@/lib/coins";

const DEFAULT_SYMBOLS = COINS.map((c) => c.symbol);

export function useCoinTickers(symbols: string[] = DEFAULT_SYMBOLS) {
  const [tickers, setTickers] = useState<Record<string, Ticker>>({});
  const symbolsKey = useMemo(() => symbols.join(","), [symbols]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/bybit/tickers?symbols=${symbolsKey}`);
        const data = (await res.json()) as { tickers?: Ticker[] };
        if (alive && data.tickers) {
          setTickers(Object.fromEntries(data.tickers.map((t) => [t.symbol, t])));
        }
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
  }, [symbolsKey]);

  return tickers;
}
