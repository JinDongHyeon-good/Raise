/** name = 한국어 이름, nameEn = 영어 이름 — 화면에는 localizedName()으로 현재 언어에 맞춰 보여 준다 */
export type Coin = {
  symbol: string;
  ticker: string;
  name: string;
  nameEn: string;
  /** 주식만: 가격 통화 (코인 USDT·지수 포인트는 없음) */
  currency?: "KRW" | "USD";
};

export const COINS: Coin[] = [
  { symbol: "BTCUSDT", ticker: "BTC", name: "비트코인", nameEn: "Bitcoin" },
  { symbol: "ETHUSDT", ticker: "ETH", name: "이더리움", nameEn: "Ethereum" },
  { symbol: "XRPUSDT", ticker: "XRP", name: "리플", nameEn: "XRP" },
  { symbol: "SOLUSDT", ticker: "SOL", name: "솔라나", nameEn: "Solana" },
];

/** 현재 언어의 종목 이름 (ko 외에는 영어) */
export function localizedName(coin: Pick<Coin, "name" | "nameEn">, locale: string) {
  return locale === "ko" ? coin.name : coin.nameEn;
}

/** 봉 간격 — 화면 라벨은 chart 메시지의 interval.<key> */
export const INTERVALS = [
  { value: "15", key: "m15" },
  { value: "60", key: "h1" },
  { value: "240", key: "h4" },
  { value: "D", key: "d1" },
  { value: "W", key: "w1" },
] as const;

export type Ticker = {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  /** 코인만 (미국 지수는 없음) */
  turnover24h?: number;
};

export function formatTurnover(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${Math.round(n).toLocaleString()}`;
}
