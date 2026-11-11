/**
 * 미국 지수 시세·캔들 — Yahoo Finance 차트 API (키 없음)
 *
 * 주의: 공식 공개 API가 아니어서 막히거나 형식이 바뀔 수 있다.
 * 그래서 메모리 캐시(시세 30초, 캔들 60초)를 두고, 실패하면 마지막으로 받은 값(최대 1일)을 돌려준다.
 */

export type StockIndex = { symbol: string; ticker: string; name: string; fullName: string };

/** 화면에 보여줄 미국 지수 (순서 = 화면 순서) — markets.ts US_ASSETS 와 심볼 동기화 */
export const US_INDICES: StockIndex[] = [
  { symbol: "^IXIC", ticker: "IXIC", name: "나스닥", fullName: "나스닥 종합지수" },
  { symbol: "^NDX", ticker: "NDX", name: "나스닥100", fullName: "나스닥 100" },
  { symbol: "^GSPC", ticker: "SPX", name: "S&P500", fullName: "S&P 500" },
  { symbol: "^DJI", ticker: "DJI", name: "다우존스", fullName: "다우존스 산업평균" },
  { symbol: "^RUT", ticker: "RUT", name: "러셀2000", fullName: "러셀 2000" },
  { symbol: "^SOX", ticker: "SOX", name: "필라델피아 반도체", fullName: "필라델피아 반도체지수" },
  { symbol: "^VIX", ticker: "VIX", name: "VIX 공포지수", fullName: "VIX 변동성지수" },
  { symbol: "^TNX", ticker: "TNX", name: "미국 10년물 금리", fullName: "미국 10년 국채금리" },
];

/** 한국 주식 — markets.ts KR_ASSETS 와 심볼 동기화 */
export const KR_STOCKS: StockIndex[] = [
  { symbol: "005930.KS", ticker: "005930", name: "삼성전자", fullName: "삼성전자" },
  { symbol: "000660.KS", ticker: "000660", name: "SK하이닉스", fullName: "SK하이닉스" },
  { symbol: "035420.KS", ticker: "035420", name: "NAVER", fullName: "NAVER" },
  { symbol: "035720.KS", ticker: "035720", name: "카카오", fullName: "카카오" },
  { symbol: "005380.KS", ticker: "005380", name: "현대차", fullName: "현대차" },
  { symbol: "051910.KS", ticker: "051910", name: "LG화학", fullName: "LG화학" },
  { symbol: "006400.KS", ticker: "006400", name: "삼성SDI", fullName: "삼성SDI" },
  { symbol: "068270.KS", ticker: "068270", name: "셀트리온", fullName: "셀트리온" },
];

/** 미국 개별 주식 — markets.ts US_STOCK_ASSETS 와 심볼 동기화 */
export const US_STOCKS: StockIndex[] = [
  { symbol: "AAPL", ticker: "AAPL", name: "애플", fullName: "Apple" },
  { symbol: "MSFT", ticker: "MSFT", name: "마이크로소프트", fullName: "Microsoft" },
  { symbol: "NVDA", ticker: "NVDA", name: "엔비디아", fullName: "NVIDIA" },
  { symbol: "GOOGL", ticker: "GOOGL", name: "알파벳", fullName: "Alphabet" },
  { symbol: "AMZN", ticker: "AMZN", name: "아마존", fullName: "Amazon" },
  { symbol: "META", ticker: "META", name: "메타", fullName: "Meta" },
  { symbol: "TSLA", ticker: "TSLA", name: "테슬라", fullName: "Tesla" },
  { symbol: "AVGO", ticker: "AVGO", name: "브로드컴", fullName: "Broadcom" },
];

const ALLOWED = new Set([...US_INDICES, ...KR_STOCKS, ...US_STOCKS].map((i) => i.symbol));
export const isAllowedStockSymbol = (symbol: string) => ALLOWED.has(symbol);

export type StockQuote = {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  /** 마지막 거래 시각 (ms) */
  marketTime: number;
};

export type StockCandle = { timestamp: number; open: number; high: number; low: number; close: number; volume: number };

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?: string;
        regularMarketPrice?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        regularMarketTime?: number;
      };
      timestamp?: number[];
      indicators?: { quote?: Array<{ open?: (number | null)[]; high?: (number | null)[]; low?: (number | null)[]; close?: (number | null)[]; volume?: (number | null)[] }> };
    }>;
    error?: { description?: string } | null;
  };
};

const QUOTE_TTL_MS = 30_000;
const CANDLE_TTL_MS = 60_000;
const STALE_MAX_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

async function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value as T;
  let pending = inflight.get(key) as Promise<T> | undefined;
  if (!pending) {
    pending = load().then((value) => {
      cache.set(key, { at: Date.now(), value });
      return value;
    });
    inflight.set(key, pending);
    pending.finally(() => inflight.delete(key)).catch(() => undefined);
  }
  try {
    return await pending;
  } catch (error) {
    // 실패하면 하루 이내의 마지막 값으로 버틴다
    if (hit && Date.now() - hit.at < STALE_MAX_MS) return hit.value as T;
    throw error;
  }
}

async function yahooChart(symbol: string, interval: string, range: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`;
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; jjintuBot/1.0)", accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  const data = (await res.json()) as YahooChart;
  const result = data.chart?.result?.[0];
  if (!result) throw new Error(data.chart?.error?.description ?? "Yahoo 응답 없음");
  return result;
}

function toCandles(result: Awaited<ReturnType<typeof yahooChart>>): StockCandle[] {
  const q = result.indicators?.quote?.[0] ?? {};
  return (result.timestamp ?? [])
    .map((ts, i) => ({
      timestamp: ts * 1000,
      open: Number(q.open?.[i]),
      high: Number(q.high?.[i]),
      low: Number(q.low?.[i]),
      close: Number(q.close?.[i]),
      volume: Number(q.volume?.[i] ?? 0) || 0,
    }))
    .filter((c) => [c.open, c.high, c.low, c.close].every((v) => Number.isFinite(v) && v > 0));
}

export async function getStockQuotes(symbols: string[]): Promise<StockQuote[]> {
  const list = symbols.filter(isAllowedStockSymbol);
  const results = await Promise.allSettled(
    list.map((symbol) =>
      cached(`quote:${symbol}`, QUOTE_TTL_MS, async () => {
        const result = await yahooChart(symbol, "1d", "5d");
        const closes = toCandles(result).map((c) => c.close);
        const meta = result.meta ?? {};
        const price = Number(meta.regularMarketPrice ?? closes.at(-1));
        // 마지막 일봉이 오늘이면 그 전날 종가가 기준
        const prevClose = closes.length >= 2 ? closes[closes.length - 2] : price;
        return {
          symbol,
          price,
          change24h: prevClose ? ((price - prevClose) / prevClose) * 100 : 0,
          high24h: Number(meta.regularMarketDayHigh ?? price),
          low24h: Number(meta.regularMarketDayLow ?? price),
          marketTime: Number(meta.regularMarketTime ?? 0) * 1000,
        } satisfies StockQuote;
      }),
    ),
  );
  return results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
}

/** 화면의 봉 주기 → Yahoo interval/range. 4시간봉은 Yahoo에 없어서 1시간봉 4개를 묶는다 */
const INTERVALS: Record<string, { interval: string; range: string; group?: number }> = {
  "15": { interval: "15m", range: "5d" },
  "60": { interval: "60m", range: "1mo" },
  "240": { interval: "60m", range: "3mo", group: 4 },
  D: { interval: "1d", range: "6mo" },
  W: { interval: "1wk", range: "2y" },
};

function groupCandles(candles: StockCandle[], size: number): StockCandle[] {
  const out: StockCandle[] = [];
  for (let i = 0; i < candles.length; i += size) {
    const g = candles.slice(i, i + size);
    out.push({
      timestamp: g[0].timestamp,
      open: g[0].open,
      high: Math.max(...g.map((c) => c.high)),
      low: Math.min(...g.map((c) => c.low)),
      close: g[g.length - 1].close,
      volume: g.reduce((s, c) => s + c.volume, 0),
    });
  }
  return out;
}

export async function getStockCandles(symbol: string, intervalKey: string): Promise<StockCandle[]> {
  if (!isAllowedStockSymbol(symbol)) throw new Error("지원하지 않는 종목");
  const cfg = INTERVALS[intervalKey] ?? INTERVALS["60"];
  return cached(`candles:${symbol}:${intervalKey}`, CANDLE_TTL_MS, async () => {
    let candles = toCandles(await yahooChart(symbol, cfg.interval, cfg.range));
    if (cfg.group) candles = groupCandles(candles, cfg.group);
    return candles.slice(-120);
  });
}
