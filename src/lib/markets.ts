import { COINS, type Coin } from "@/lib/coins";

export { localizedName } from "@/lib/coins";

export type Market = "crypto" | "us";

/** 화면에서 고를 수 있는 종목 (코인 또는 미국 지수) — CoinTickerStrip이 그대로 쓸 수 있는 모양 */
export type Asset = Coin & {
  market: Market;
  /** 차트 위 작은 라벨 (예: BTC/USDT, 나스닥 종합지수) */
  label: string;
  labelEn: string;
};

/** 시장 탭 — 화면 라벨은 home 메시지의 market.<value> */
export const MARKETS: Array<{ value: Market }> = [{ value: "crypto" }, { value: "us" }];

export const CRYPTO_ASSETS: Asset[] = COINS.map((c) => ({
  ...c,
  market: "crypto",
  label: `${c.ticker}/USDT`,
  labelEn: `${c.ticker}/USDT`,
}));

/** src/lib/stocks.ts 의 US_INDICES 와 같은 순서·심볼 (서버 모듈을 클라이언트로 끌고 오지 않으려고 따로 둠) */
export const US_ASSETS: Asset[] = [
  { symbol: "^IXIC", ticker: "IXIC", name: "나스닥", nameEn: "Nasdaq", market: "us", label: "나스닥 종합지수", labelEn: "Nasdaq Composite" },
  { symbol: "^NDX", ticker: "NDX", name: "나스닥100", nameEn: "Nasdaq 100", market: "us", label: "나스닥 100", labelEn: "Nasdaq 100" },
  { symbol: "^GSPC", ticker: "SPX", name: "S&P500", nameEn: "S&P 500", market: "us", label: "S&P 500", labelEn: "S&P 500" },
  { symbol: "^DJI", ticker: "DJI", name: "다우존스", nameEn: "Dow Jones", market: "us", label: "다우존스 산업평균", labelEn: "Dow Jones Industrial Average" },
];

/** 현재 언어의 차트 라벨 */
export function localizedLabel(asset: Asset, locale: string) {
  return locale === "ko" ? asset.label : asset.labelEn;
}

export const ASSETS: Record<Market, Asset[]> = { crypto: CRYPTO_ASSETS, us: US_ASSETS };

export function klineUrl(asset: Asset, interval: string) {
  return asset.market === "us"
    ? `/api/stocks/kline?symbol=${encodeURIComponent(asset.symbol)}&interval=${interval}`
    : `/api/bybit/kline?category=spot&symbol=${asset.symbol}&interval=${interval}`;
}
