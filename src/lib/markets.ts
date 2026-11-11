import { COINS, type Coin } from "@/lib/coins";

export { localizedName } from "@/lib/coins";

export type Market = "crypto" | "us" | "kr" | "usStock";

/** 화면에서 고를 수 있는 종목 — CoinTickerStrip이 그대로 쓸 수 있는 모양 */
export type Asset = Coin & {
  market: Market;
  /** 차트 위 작은 라벨 (예: BTC/USDT, 나스닥 종합지수) */
  label: string;
  labelEn: string;
};

/** 시장 탭 — 화면 라벨은 chart 메시지의 market.<value> */
export const MARKETS: Array<{ value: Market }> = [
  { value: "crypto" },
  { value: "us" },
  { value: "kr" },
  { value: "usStock" },
];

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
  { symbol: "^RUT", ticker: "RUT", name: "러셀2000", nameEn: "Russell 2000", market: "us", label: "러셀 2000", labelEn: "Russell 2000" },
  { symbol: "^SOX", ticker: "SOX", name: "필라델피아 반도체", nameEn: "PHLX Semiconductor", market: "us", label: "필라델피아 반도체지수", labelEn: "PHLX Semiconductor Index" },
  { symbol: "^VIX", ticker: "VIX", name: "VIX 공포지수", nameEn: "VIX", market: "us", label: "VIX 변동성지수", labelEn: "CBOE Volatility Index" },
  { symbol: "^TNX", ticker: "TNX", name: "미국 10년물 금리", nameEn: "US 10Y Yield", market: "us", label: "미국 10년 국채금리 (%)", labelEn: "US 10-Year Treasury Yield (%)" },
];

/** 한국 주식 (Yahoo .KS) — stocks.ts 허용 목록과 심볼 맞출 것 */
export const KR_ASSETS: Asset[] = [
  { symbol: "005930.KS", ticker: "005930", name: "삼성전자", nameEn: "Samsung Electronics", market: "kr", label: "삼성전자", labelEn: "Samsung Electronics", currency: "KRW" },
  { symbol: "000660.KS", ticker: "000660", name: "SK하이닉스", nameEn: "SK hynix", market: "kr", label: "SK하이닉스", labelEn: "SK hynix", currency: "KRW" },
  { symbol: "035420.KS", ticker: "035420", name: "NAVER", nameEn: "NAVER", market: "kr", label: "NAVER", labelEn: "NAVER", currency: "KRW" },
  { symbol: "035720.KS", ticker: "035720", name: "카카오", nameEn: "Kakao", market: "kr", label: "카카오", labelEn: "Kakao", currency: "KRW" },
  { symbol: "005380.KS", ticker: "005380", name: "현대차", nameEn: "Hyundai Motor", market: "kr", label: "현대차", labelEn: "Hyundai Motor", currency: "KRW" },
  { symbol: "051910.KS", ticker: "051910", name: "LG화학", nameEn: "LG Chem", market: "kr", label: "LG화학", labelEn: "LG Chem", currency: "KRW" },
  { symbol: "006400.KS", ticker: "006400", name: "삼성SDI", nameEn: "Samsung SDI", market: "kr", label: "삼성SDI", labelEn: "Samsung SDI", currency: "KRW" },
  { symbol: "068270.KS", ticker: "068270", name: "셀트리온", nameEn: "Celltrion", market: "kr", label: "셀트리온", labelEn: "Celltrion", currency: "KRW" },
];

/** 미국 개별 주식 — stocks.ts 허용 목록과 심볼 맞출 것 */
export const US_STOCK_ASSETS: Asset[] = [
  { symbol: "AAPL", ticker: "AAPL", name: "애플", nameEn: "Apple", market: "usStock", label: "Apple", labelEn: "Apple", currency: "USD" },
  { symbol: "MSFT", ticker: "MSFT", name: "마이크로소프트", nameEn: "Microsoft", market: "usStock", label: "Microsoft", labelEn: "Microsoft", currency: "USD" },
  { symbol: "NVDA", ticker: "NVDA", name: "엔비디아", nameEn: "NVIDIA", market: "usStock", label: "NVIDIA", labelEn: "NVIDIA", currency: "USD" },
  { symbol: "GOOGL", ticker: "GOOGL", name: "알파벳", nameEn: "Alphabet", market: "usStock", label: "Alphabet", labelEn: "Alphabet", currency: "USD" },
  { symbol: "AMZN", ticker: "AMZN", name: "아마존", nameEn: "Amazon", market: "usStock", label: "Amazon", labelEn: "Amazon", currency: "USD" },
  { symbol: "META", ticker: "META", name: "메타", nameEn: "Meta", market: "usStock", label: "Meta", labelEn: "Meta", currency: "USD" },
  { symbol: "TSLA", ticker: "TSLA", name: "테슬라", nameEn: "Tesla", market: "usStock", label: "Tesla", labelEn: "Tesla", currency: "USD" },
  { symbol: "AVGO", ticker: "AVGO", name: "브로드컴", nameEn: "Broadcom", market: "usStock", label: "Broadcom", labelEn: "Broadcom", currency: "USD" },
];

/** 현재 언어의 차트 라벨 */
export function localizedLabel(asset: Asset, locale: string) {
  return locale === "ko" ? asset.label : asset.labelEn;
}

export const ASSETS: Record<Market, Asset[]> = {
  crypto: CRYPTO_ASSETS,
  us: US_ASSETS,
  kr: KR_ASSETS,
  usStock: US_STOCK_ASSETS,
};

export function isYahooMarket(market: Market) {
  return market === "us" || market === "kr" || market === "usStock";
}

export function klineUrl(asset: Asset, interval: string) {
  return isYahooMarket(asset.market)
    ? `/api/stocks/kline?symbol=${encodeURIComponent(asset.symbol)}&interval=${interval}`
    : `/api/bybit/kline?category=spot&symbol=${asset.symbol}&interval=${interval}`;
}
