export type Coin = { symbol: string; ticker: string; name: string };

export const COINS: Coin[] = [
  { symbol: "BTCUSDT", ticker: "BTC", name: "비트코인" },
  { symbol: "ETHUSDT", ticker: "ETH", name: "이더리움" },
  { symbol: "XRPUSDT", ticker: "XRP", name: "리플" },
  { symbol: "SOLUSDT", ticker: "SOL", name: "솔라나" },
];

export const INTERVALS = [
  { value: "15", label: "15분" },
  { value: "60", label: "1시간" },
  { value: "240", label: "4시간" },
  { value: "D", label: "일" },
  { value: "W", label: "주" },
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
