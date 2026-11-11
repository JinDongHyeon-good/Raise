import { COINS, type Coin } from "@/lib/coins";

export type Market = "crypto" | "us";

/** 화면에서 고를 수 있는 종목 (코인 또는 미국 지수) — CoinTickerStrip이 그대로 쓸 수 있는 모양 */
export type Asset = Coin & {
  market: Market;
  /** 차트 위 작은 라벨 (예: BTC/USDT, 나스닥 종합지수) */
  label: string;
};

export const MARKETS: Array<{ value: Market; label: string }> = [
  { value: "crypto", label: "코인" },
  { value: "us", label: "미국증시" },
];

export const CRYPTO_ASSETS: Asset[] = COINS.map((c) => ({ ...c, market: "crypto", label: `${c.ticker}/USDT` }));

/** src/lib/stocks.ts 의 US_INDICES 와 같은 순서·심볼 (서버 모듈을 클라이언트로 끌고 오지 않으려고 따로 둠) */
export const US_ASSETS: Asset[] = [
  { symbol: "^IXIC", ticker: "IXIC", name: "나스닥", market: "us", label: "나스닥 종합지수" },
  { symbol: "^NDX", ticker: "NDX", name: "나스닥100", market: "us", label: "나스닥 100" },
  { symbol: "^GSPC", ticker: "SPX", name: "S&P500", market: "us", label: "S&P 500" },
  { symbol: "^DJI", ticker: "DJI", name: "다우존스", market: "us", label: "다우존스 산업평균" },
];

export const ASSETS: Record<Market, Asset[]> = { crypto: CRYPTO_ASSETS, us: US_ASSETS };

export function klineUrl(asset: Asset, interval: string) {
  return asset.market === "us"
    ? `/api/stocks/kline?symbol=${encodeURIComponent(asset.symbol)}&interval=${interval}`
    : `/api/bybit/kline?category=spot&symbol=${asset.symbol}&interval=${interval}`;
}
