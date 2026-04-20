"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MarketTab = "spot" | "linear";
type FloorTab = "market" | "news";
type ConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

type BybitSymbol = {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
};

type TickerState = {
  lastPrice?: string;
  price24hPcnt?: string;
  volume24h?: string;
  updatedAt?: number;
};

type TickerPatch = Partial<TickerState>;
type KlineInterval = "1s" | "1" | "3" | "5" | "15" | "30" | "60" | "120" | "240" | "360" | "720" | "D" | "W" | "M";
type CandlePoint = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
type MaSeries = {
  period: number;
  color: string;
  points: Array<number | null>;
};
type BriefNewsItem = {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
};
type BriefEconEvent = {
  title: string;
  country?: string;
  date?: string;
  impact?: string;
  previous?: string;
  forecast?: string;
  actual?: string;
};
type UsEventItem = {
  title: string;
  source: string;
  publishedAt?: string;
  url?: string;
  impact?: string;
  country?: string;
};

const DEFAULT_SELECTED_LIMIT = 20;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 15000;
const TICKER_FLUSH_INTERVAL_MS = 250;
const WS_URL_MAP: Record<MarketTab, string> = {
  spot: "wss://stream.bybit.com/v5/public/spot",
  linear: "wss://stream.bybit.com/v5/public/linear",
};
const FILTER_PAGE_SIZE = 20;
const NEWS_PAGE_SIZE = 5;
const AI_DAILY_LIMIT = 2;
const AI_DAILY_USAGE_STORAGE_KEY = "trading-floor-ai-daily-usage-v1";
const KLINE_INTERVAL_OPTIONS: Array<{ value: KlineInterval; label: string }> = [
  { value: "1s", label: "1초" },
  { value: "1", label: "1분" },
  { value: "3", label: "3분" },
  { value: "5", label: "5분" },
  { value: "15", label: "15분" },
  { value: "30", label: "30분" },
  { value: "60", label: "1시간" },
  { value: "120", label: "2시간" },
  { value: "240", label: "4시간" },
  { value: "360", label: "6시간" },
  { value: "720", label: "12시간" },
  { value: "D", label: "1일" },
  { value: "W", label: "1주" },
  { value: "M", label: "1개월" },
];
const KOREAN_COIN_NAME_MAP: Record<string, string> = {
  BTC: "비트코인",
  ETH: "이더리움",
  SOL: "솔라나",
  XRP: "리플",
  DOGE: "도지코인",
  BNB: "바이낸스코인",
  ADA: "에이다",
  AVAX: "아발란체",
  DOT: "폴카닷",
  LINK: "체인링크",
  TRX: "트론",
  LTC: "라이트코인",
  PEPE: "페페",
  AAVE: "에이브",
  BOME: "보메",
};

function formatPrice(price?: string) {
  if (!price) return "-";
  const numeric = Number(price);
  if (Number.isNaN(numeric)) return price;
  if (numeric >= 1000) return numeric.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
  if (numeric >= 1) return numeric.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  return numeric.toLocaleString("ko-KR", { minimumFractionDigits: 6, maximumFractionDigits: 10 });
}

function formatPercent(pct?: string) {
  if (!pct) return "-";
  const n = Number(pct) * 100;
  if (Number.isNaN(n)) return pct;
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function getKoreanCoinName(baseCoin: string) {
  return KOREAN_COIN_NAME_MAP[baseCoin] ?? `${baseCoin} 코인`;
}

function toTimestamp(value?: string) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getTodayDateKey() {
  return new Date().toLocaleDateString("sv-SE");
}

function readAiDailyUsageCount() {
  if (typeof window === "undefined") return 0;
  const today = getTodayDateKey();
  const raw = window.localStorage.getItem(AI_DAILY_USAGE_STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(AI_DAILY_USAGE_STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
    return 0;
  }
  try {
    const parsed = JSON.parse(raw) as { date?: string; count?: number };
    const parsedCount = Number(parsed.count ?? 0);
    if (parsed.date !== today || !Number.isFinite(parsedCount) || parsedCount < 0) {
      window.localStorage.setItem(AI_DAILY_USAGE_STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
      return 0;
    }
    return Math.min(AI_DAILY_LIMIT, parsedCount);
  } catch {
    window.localStorage.setItem(AI_DAILY_USAGE_STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
    return 0;
  }
}

function writeAiDailyUsageCount(count: number) {
  if (typeof window === "undefined") return;
  const today = getTodayDateKey();
  window.localStorage.setItem(
    AI_DAILY_USAGE_STORAGE_KEY,
    JSON.stringify({ date: today, count: Math.min(AI_DAILY_LIMIT, Math.max(0, count)) }),
  );
}

function parseAnalysisSections(text: string) {
  const normalizeLine = (line: string) =>
    line
      .trim()
      .replace(/^#{1,6}\s*/, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/^\*\s+/, "- ")
      .replace(/^\-\s+/, "- ");

  const lines = text.split("\n").map(normalizeLine).filter(Boolean);
  const sections: Array<{ title: string; items: string[] }> = [];
  let current: { title: string; items: string[] } | null = null;

  for (const line of lines) {
    if (/^\d+\)/.test(line)) {
      if (current) sections.push(current);
      current = { title: line, items: [] };
      continue;
    }
    if (!current) {
      current = { title: "분석 요약", items: [] };
    }
    current.items.push(line);
  }

  if (current) sections.push(current);
  return sections;
}

function normalizeCalendarDate(raw?: string) {
  if (!raw) return "미정";
  const trimmed = raw.trim();
  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  const slashMatch = trimmed.match(/^(\d{4}\/\d{2}\/\d{2})/);
  if (slashMatch) return slashMatch[1].replaceAll("/", "-");
  const dotMatch = trimmed.match(/^(\d{4}\.\d{2}\.\d{2})/);
  if (dotMatch) return dotMatch[1].replaceAll(".", "-");
  return trimmed;
}

function extractDateKey(raw?: string) {
  if (!raw) return null;
  const normalized = normalizeCalendarDate(raw);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function calculateMovingAverage(data: CandlePoint[], period: number) {
  return data.map((_, index) => {
    if (index < period - 1) return null;
    let sum = 0;
    for (let i = index - period + 1; i <= index; i += 1) {
      sum += data[i].close;
    }
    return sum / period;
  });
}

function calculateRsi(data: CandlePoint[], period = 14) {
  if (data.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = data.length - period; i < data.length; i += 1) {
    const prev = data[i - 1]?.close;
    const cur = data[i]?.close;
    if (prev === undefined || cur === undefined) continue;
    const diff = cur - prev;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function calculateBollinger(data: CandlePoint[], period = 20, stdMultiplier = 2) {
  const basis = calculateMovingAverage(data, period);
  const upper: Array<number | null> = [];
  const lower: Array<number | null> = [];

  for (let i = 0; i < data.length; i += 1) {
    if (i < period - 1 || basis[i] === null) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    const window = data.slice(i - period + 1, i + 1).map((item) => item.close);
    const mean = basis[i] as number;
    const variance = window.reduce((acc, value) => acc + (value - mean) ** 2, 0) / window.length;
    const stdDev = Math.sqrt(variance);
    upper.push(mean + stdDev * stdMultiplier);
    lower.push(mean - stdDev * stdMultiplier);
  }

  return { upper, lower };
}

export default function TradingFloorPage() {
  const tab: MarketTab = "linear";
  const [floorTab, setFloorTab] = useState<FloorTab>("market");
  const [symbols, setSymbols] = useState<Record<MarketTab, BybitSymbol[]>>({
    spot: [],
    linear: [],
  });
  const [selectedSymbols, setSelectedSymbols] = useState<Record<MarketTab, string[]>>({
    spot: [],
    linear: [],
  });
  const [tickers, setTickers] = useState<Record<string, TickerState>>({});
  const [isSymbolsLoading, setIsSymbolsLoading] = useState(false);
  const [symbolsError, setSymbolsError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [connectionMessage, setConnectionMessage] = useState<string>("대기 중");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [filterPage, setFilterPage] = useState(1);
  const [detailSymbol, setDetailSymbol] = useState<BybitSymbol | null>(null);
  const [klineInterval, setKlineInterval] = useState<KlineInterval>("15");
  const [isIntervalDropdownOpen, setIsIntervalDropdownOpen] = useState(false);
  const [klineData, setKlineData] = useState<CandlePoint[]>([]);
  const [liveSecondCloses, setLiveSecondCloses] = useState<Array<{ timestamp: number; close: number }>>([]);
  const [isKlineLoading, setIsKlineLoading] = useState(false);
  const [klineError, setKlineError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDailyUsageCount, setAiDailyUsageCount] = useState(0);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [cryptoNews, setCryptoNews] = useState<BriefNewsItem[]>([]);
  const [exchangeNews, setExchangeNews] = useState<BriefNewsItem[]>([]);
  const [econEvents, setEconEvents] = useState<BriefEconEvent[]>([]);
  const [usMacroNews, setUsMacroNews] = useState<BriefNewsItem[]>([]);
  const [cryptoNewsPage, setCryptoNewsPage] = useState(1);
  const [exchangeNewsPage, setExchangeNewsPage] = useState(1);
  const [usEventsPage, setUsEventsPage] = useState(1);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const shouldReconnectRef = useRef(true);
  const tickerBufferRef = useRef<Record<string, TickerPatch>>({});
  const flushTimerRef = useRef<number | null>(null);
  const filterPanelRef = useRef<HTMLDivElement | null>(null);
  const detailPriceRef = useRef<number | null>(null);
  const latestKlineCloseRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchSymbols = async () => {
      setIsSymbolsLoading(true);
      setSymbolsError(null);
      try {
        const response = await fetch(`/api/bybit/symbols?category=${tab}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("심볼 목록 조회에 실패했습니다.");
        }
        const data = (await response.json()) as { symbols?: BybitSymbol[] };
        if (!data.symbols || !Array.isArray(data.symbols)) {
          throw new Error("심볼 데이터 형식이 올바르지 않습니다.");
        }
        if (!cancelled) {
          const fetchedSymbols = data.symbols ?? [];
          setSymbols((prev) => ({ ...prev, [tab]: fetchedSymbols }));
          setSelectedSymbols((prev) => {
            const currentSelected = prev[tab];
            const availableSet = new Set(fetchedSymbols.map((item) => item.symbol));
            const nextSelected = currentSelected.filter((symbol) => availableSet.has(symbol));
            if (nextSelected.length >= DEFAULT_SELECTED_LIMIT) {
              return { ...prev, [tab]: nextSelected.slice(0, DEFAULT_SELECTED_LIMIT) };
            }

            const topSymbols = fetchedSymbols.slice(0, DEFAULT_SELECTED_LIMIT).map((item) => item.symbol);
            const merged = Array.from(new Set([...nextSelected, ...topSymbols])).slice(0, DEFAULT_SELECTED_LIMIT);
            return { ...prev, [tab]: merged };
          });
        }
      } catch (error) {
        if (!cancelled) {
          setSymbolsError(error instanceof Error ? error.message : "알 수 없는 오류");
        }
      } finally {
        if (!cancelled) {
          setIsSymbolsLoading(false);
        }
      }
    };

    fetchSymbols();

    return () => {
      cancelled = true;
    };
  }, [tab]);

  useEffect(() => {
    setFilterQuery("");
    setIsFilterOpen(false);
    setFilterPage(1);
  }, [tab]);

  useEffect(() => {
    setFilterPage(1);
  }, [filterQuery]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!filterPanelRef.current) return;
      if (!filterPanelRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (floorTab !== "news") return;
    let cancelled = false;
    setNewsLoading(true);
    setNewsError(null);

    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news/brief", { cache: "no-store" });
        if (!res.ok) throw new Error("뉴스 데이터를 불러오지 못했습니다.");
        const data = (await res.json()) as {
          cryptoPanic?: BriefNewsItem[];
          exchangeAnnouncements?: BriefNewsItem[];
          economicCalendar?: BriefEconEvent[];
          usMacroEvents?: BriefNewsItem[];
        };
        if (cancelled) return;
        setCryptoNews(data.cryptoPanic ?? []);
        setExchangeNews(data.exchangeAnnouncements ?? []);
        setEconEvents(data.economicCalendar ?? []);
        setUsMacroNews(data.usMacroEvents ?? []);
        setCryptoNewsPage(1);
        setExchangeNewsPage(1);
        setUsEventsPage(1);
      } catch (error) {
        if (!cancelled) {
          setNewsError(error instanceof Error ? error.message : "뉴스 조회 실패");
        }
      } finally {
        if (!cancelled) setNewsLoading(false);
      }
    };

    fetchNews();
    return () => {
      cancelled = true;
    };
  }, [floorTab]);

  const visibleSymbols = useMemo(() => {
    const currentSymbols = symbols[tab];
    const selectedList = selectedSymbols[tab];
    return currentSymbols.filter((item) => selectedList.includes(item.symbol));
  }, [symbols, tab, selectedSymbols]);

  useEffect(() => {
    if (visibleSymbols.length === 0) {
      setConnectionStatus("idle");
      setConnectionMessage("필터에서 코인을 선택해 주세요");
      return;
    }

    shouldReconnectRef.current = true;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const closeSocket = () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };

    const flushTickerBuffer = () => {
      const buffered = tickerBufferRef.current;
      const symbolsToUpdate = Object.keys(buffered);
      if (symbolsToUpdate.length === 0) return;

      setTickers((prev) => {
        let changed = false;
        const next = { ...prev };

        for (const symbol of symbolsToUpdate) {
          const incoming = buffered[symbol];
          const current = prev[symbol] ?? {};
          const merged: TickerState = {
            lastPrice: incoming.lastPrice ?? current.lastPrice,
            price24hPcnt: incoming.price24hPcnt ?? current.price24hPcnt,
            volume24h: incoming.volume24h ?? current.volume24h,
            updatedAt: incoming.updatedAt ?? current.updatedAt ?? Date.now(),
          };

          if (
            current.lastPrice === merged.lastPrice &&
            current.price24hPcnt === merged.price24hPcnt &&
            current.volume24h === merged.volume24h
          ) {
            continue;
          }

          next[symbol] = merged;
          changed = true;
        }

        return changed ? next : prev;
      });

      tickerBufferRef.current = {};
    };

    const startFlushTimer = () => {
      if (flushTimerRef.current !== null) return;
      flushTimerRef.current = window.setInterval(flushTickerBuffer, TICKER_FLUSH_INTERVAL_MS);
    };

    const stopFlushTimer = () => {
      if (flushTimerRef.current !== null) {
        window.clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      flushTickerBuffer();
    };

    const connect = () => {
      clearReconnectTimer();
      setConnectionStatus(reconnectAttemptRef.current > 0 ? "reconnecting" : "connecting");
      setConnectionMessage(reconnectAttemptRef.current > 0 ? "재연결 시도 중..." : "연결 중...");

      const socket = new WebSocket(WS_URL_MAP[tab]);
      wsRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptRef.current = 0;
        setConnectionStatus("connected");
        setConnectionMessage("실시간 연결됨");
        const args = visibleSymbols.map((item) => `tickers.${item.symbol}`);
        socket.send(JSON.stringify({ op: "subscribe", args }));
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            topic?: string;
            data?: {
              symbol?: string;
              lastPrice?: string;
              price24hPcnt?: string;
              volume24h?: string;
            } | Array<{
              symbol?: string;
              lastPrice?: string;
              price24hPcnt?: string;
              volume24h?: string;
            }>;
          };

          if (!payload.topic?.startsWith("tickers.")) return;

          const items = Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : [];
          if (items.length === 0) return;

          for (const item of items) {
            if (!item.symbol) continue;
            const currentPatch = tickerBufferRef.current[item.symbol] ?? {};
            tickerBufferRef.current[item.symbol] = {
              ...currentPatch,
              ...(item.lastPrice !== undefined ? { lastPrice: item.lastPrice } : {}),
              ...(item.price24hPcnt !== undefined ? { price24hPcnt: item.price24hPcnt } : {}),
              ...(item.volume24h !== undefined ? { volume24h: item.volume24h } : {}),
              updatedAt: Date.now(),
            };
          }
        } catch {
          // ignore malformed payloads
        }
      };

      socket.onclose = () => {
        wsRef.current = null;
        if (!shouldReconnectRef.current) {
          setConnectionStatus("disconnected");
          setConnectionMessage("연결 종료");
          return;
        }

        reconnectAttemptRef.current += 1;
        const delay = Math.min(RECONNECT_BASE_MS * 2 ** (reconnectAttemptRef.current - 1), RECONNECT_MAX_MS);
        setConnectionStatus("reconnecting");
        setConnectionMessage(`연결 끊김, ${Math.round(delay / 1000)}초 후 재시도`);
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };

      socket.onerror = () => {
        setConnectionStatus("error");
        setConnectionMessage("소켓 오류 발생");
      };
    };

    startFlushTimer();
    connect();

    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimer();
      closeSocket();
      stopFlushTimer();
    };
  }, [tab, visibleSymbols]);

  const rows = useMemo(
    () =>
      visibleSymbols.map((symbol) => {
        const ticker = tickers[symbol.symbol];
        return {
          ...symbol,
          lastPrice: ticker?.lastPrice,
          price24hPcnt: ticker?.price24hPcnt,
          volume24h: ticker?.volume24h,
        };
      }),
    [visibleSymbols, tickers],
  );

  const filteredSymbols = useMemo(() => {
    const query = filterQuery.trim().toUpperCase();
    if (!query) return symbols[tab];
    return symbols[tab].filter(
      (item) => item.symbol.toUpperCase().includes(query) || item.baseCoin.toUpperCase().includes(query),
    );
  }, [symbols, tab, filterQuery]);

  const filterTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredSymbols.length / FILTER_PAGE_SIZE)),
    [filteredSymbols.length],
  );

  useEffect(() => {
    setFilterPage((prev) => Math.min(prev, filterTotalPages));
  }, [filterTotalPages]);

  const pagedFilterSymbols = useMemo(() => {
    const safePage = Math.min(filterPage, filterTotalPages);
    const start = (safePage - 1) * FILTER_PAGE_SIZE;
    return filteredSymbols.slice(start, start + FILTER_PAGE_SIZE);
  }, [filteredSymbols, filterPage, filterTotalPages]);

  const detailTicker = detailSymbol ? tickers[detailSymbol.symbol] : undefined;
  const selectedIntervalLabel =
    KLINE_INTERVAL_OPTIONS.find((option) => option.value === klineInterval)?.label ?? klineInterval;
  const analysisSections = useMemo(() => parseAnalysisSections(aiAnalysis), [aiAnalysis]);
  const calendarData = useMemo(() => {
    const eventMap = new Map<string, BriefEconEvent[]>();
    const validDateKeys = econEvents
      .map((event) => extractDateKey(event.date))
      .filter((key): key is string => Boolean(key));

    for (const event of econEvents) {
      const dateKey = extractDateKey(event.date);
      if (!dateKey) continue;
      if (!eventMap.has(dateKey)) eventMap.set(dateKey, []);
      eventMap.get(dateKey)!.push(event);
    }

    const baseDate = validDateKeys.length > 0 ? new Date(`${validDateKeys[0]}T00:00:00`) : new Date();
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const startWeekday = monthStart.getDay();
    const totalDays = monthEnd.getDate();

    const cells: Array<{ dateKey: string | null; day: number | null; events: BriefEconEvent[] }> = [];
    for (let i = 0; i < startWeekday; i += 1) {
      cells.push({ dateKey: null, day: null, events: [] });
    }
    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(year, month, day);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ dateKey, day, events: eventMap.get(dateKey) ?? [] });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ dateKey: null, day: null, events: [] });
    }

    return {
      year,
      monthLabel: `${month + 1}월`,
      cells,
      totalEvents: econEvents.length,
    };
  }, [econEvents]);

  const usMajorEvents = useMemo(() => {
    const majorKeywords = [
      "fomc",
      "powell",
      "fed",
      "speech",
      "cpi",
      "ppi",
      "nfp",
      "payroll",
      "pce",
      "gdp",
      "unemployment",
      "jobless",
      "ism",
      "rate",
      "minutes",
    ];

    return econEvents
      .filter((event) => {
        const country = (event.country ?? "").toLowerCase();
        const title = (event.title ?? "").toLowerCase();
        const impact = (event.impact ?? "").toLowerCase();
        const isUs = country.includes("united states") || country === "us" || country === "usd";
        const isMajorKeyword = majorKeywords.some((keyword) => title.includes(keyword));
        const isHighImpact = impact.includes("high") || impact.includes("3") || impact.includes("bull3");
        return isUs && (isMajorKeyword || isHighImpact);
      });
  }, [econEvents]);

  const sortedCryptoNews = useMemo(
    () => [...cryptoNews].sort((a, b) => toTimestamp(b.publishedAt) - toTimestamp(a.publishedAt)),
    [cryptoNews],
  );
  const sortedExchangeNews = useMemo(
    () => [...exchangeNews].sort((a, b) => toTimestamp(b.publishedAt) - toTimestamp(a.publishedAt)),
    [exchangeNews],
  );
  const mergedUsEvents = useMemo<UsEventItem[]>(() => {
    if (usMacroNews.length > 0) {
      return usMacroNews.map((item) => ({
        title: item.title,
        source: item.source,
        publishedAt: item.publishedAt,
        url: item.url,
      }));
    }
    return usMajorEvents.map((event) => ({
      title: event.title,
      source: event.country || "US",
      publishedAt: event.date,
      impact: event.impact,
      country: event.country,
    }));
  }, [usMacroNews, usMajorEvents]);

  const sortedUsMajorEvents = useMemo(
    () => [...mergedUsEvents].sort((a, b) => toTimestamp(b.publishedAt) - toTimestamp(a.publishedAt)),
    [mergedUsEvents],
  );

  const cryptoNewsTotalPages = Math.max(1, Math.ceil(sortedCryptoNews.length / NEWS_PAGE_SIZE));
  const exchangeNewsTotalPages = Math.max(1, Math.ceil(sortedExchangeNews.length / NEWS_PAGE_SIZE));
  const usEventsTotalPages = Math.max(1, Math.ceil(sortedUsMajorEvents.length / NEWS_PAGE_SIZE));

  useEffect(() => {
    setCryptoNewsPage((prev) => Math.min(prev, cryptoNewsTotalPages));
  }, [cryptoNewsTotalPages]);
  useEffect(() => {
    setExchangeNewsPage((prev) => Math.min(prev, exchangeNewsTotalPages));
  }, [exchangeNewsTotalPages]);
  useEffect(() => {
    setUsEventsPage((prev) => Math.min(prev, usEventsTotalPages));
  }, [usEventsTotalPages]);

  const pagedCryptoNews = useMemo(() => {
    const start = (cryptoNewsPage - 1) * NEWS_PAGE_SIZE;
    return sortedCryptoNews.slice(start, start + NEWS_PAGE_SIZE);
  }, [sortedCryptoNews, cryptoNewsPage]);
  const pagedExchangeNews = useMemo(() => {
    const start = (exchangeNewsPage - 1) * NEWS_PAGE_SIZE;
    return sortedExchangeNews.slice(start, start + NEWS_PAGE_SIZE);
  }, [sortedExchangeNews, exchangeNewsPage]);
  const pagedUsEvents = useMemo(() => {
    const start = (usEventsPage - 1) * NEWS_PAGE_SIZE;
    return sortedUsMajorEvents.slice(start, start + NEWS_PAGE_SIZE);
  }, [sortedUsMajorEvents, usEventsPage]);

  const getSectionNumber = (title: string) => {
    const match = title.match(/^(\d+)\)/);
    return match?.[1] ?? "•";
  };

  const getSectionTitle = (title: string) => title.replace(/^\d+\)\s*/, "");
  const isAiLimitReached = aiDailyUsageCount >= AI_DAILY_LIMIT;
  const aiRemainingCount = Math.max(0, AI_DAILY_LIMIT - aiDailyUsageCount);

  useEffect(() => {
    setAiDailyUsageCount(readAiDailyUsageCount());
  }, []);

  useEffect(() => {
    const price = Number(detailTicker?.lastPrice);
    detailPriceRef.current = Number.isFinite(price) ? price : null;
  }, [detailTicker?.lastPrice]);

  useEffect(() => {
    const latest = klineData[klineData.length - 1]?.close;
    latestKlineCloseRef.current = Number.isFinite(latest) ? latest : null;
  }, [klineData]);

  useEffect(() => {
    setIsIntervalDropdownOpen(false);
  }, [klineInterval, detailSymbol]);

  const handleToggleSymbol = (symbol: string) => {
    setSelectedSymbols((prev) => {
      const current = prev[tab];
      const next = current.includes(symbol) ? current.filter((item) => item !== symbol) : [...current, symbol];
      return { ...prev, [tab]: next };
    });
  };

  useEffect(() => {
    if (!detailSymbol) return;
    let cancelled = false;
    setIsKlineLoading(true);
    setKlineError(null);

    const normalizedInterval = klineInterval === "1s" ? "1" : klineInterval;
    let isInitialFetch = true;

    const fetchKline = async () => {
      try {
        if (isInitialFetch) setIsKlineLoading(true);
        const response = await fetch(
          `/api/bybit/kline?category=${tab}&symbol=${detailSymbol.symbol}&interval=${normalizedInterval}`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          throw new Error("차트 데이터를 가져오지 못했습니다.");
        }
        const data = (await response.json()) as {
          candles?: Array<{ timestamp: number; open: number; high: number; low: number; close: number; volume: number }>;
        };
        if (!data.candles || !Array.isArray(data.candles)) {
          throw new Error("차트 데이터 형식이 올바르지 않습니다.");
        }
        if (!cancelled) {
          setKlineData(
            data.candles.map((c) => ({
              timestamp: c.timestamp,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
              volume: c.volume,
            })),
          );
        }
      } catch (error) {
        if (!cancelled) {
          setKlineError(error instanceof Error ? error.message : "차트 조회 실패");
          setKlineData([]);
        }
      } finally {
        if (!cancelled) {
          if (isInitialFetch) setIsKlineLoading(false);
          isInitialFetch = false;
        }
      }
    };

    fetchKline();
    const refreshTimer = window.setInterval(fetchKline, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [detailSymbol, tab, klineInterval]);

  useEffect(() => {
    if (!detailSymbol || klineInterval !== "1s") {
      setLiveSecondCloses([]);
      return;
    }

    setLiveSecondCloses([]);
    const timer = window.setInterval(() => {
      const latest = detailPriceRef.current ?? latestKlineCloseRef.current;
      if (!Number.isFinite(latest)) return;
      setLiveSecondCloses((prev) => [...prev, { timestamp: Date.now(), close: latest }].slice(-120));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [detailSymbol, klineInterval]);

  const displayKlineData = useMemo(() => {
    if (klineInterval !== "1s" || liveSecondCloses.length === 0) return klineData;
    const synthetic = liveSecondCloses.map((point) => ({
      timestamp: point.timestamp,
      open: point.close,
      high: point.close,
      low: point.close,
      close: point.close,
      volume: 0,
    }));
    const baseKeepCount = Math.max(2, 120 - synthetic.length);
    return [...klineData.slice(-baseKeepCount), ...synthetic].sort((a, b) => a.timestamp - b.timestamp);
  }, [klineData, klineInterval, liveSecondCloses]);

  const handleAnalyzeClick = async () => {
    const latestUsageCount = readAiDailyUsageCount();
    if (latestUsageCount >= AI_DAILY_LIMIT) {
      setAiDailyUsageCount(latestUsageCount);
      setAiError("AI 분석은 하루 2회까지만 사용할 수 있습니다. 내일 다시 시도해 주세요.");
      return;
    }

    if (klineInterval === "1s") {
      setAiError("AI 분석은 1분 봉 이상부터 지원됩니다.");
      return;
    }
    if (!detailSymbol || klineData.length < 10) {
      setAiError("차트 데이터가 부족해서 분석할 수 없습니다.");
      console.warn("[ai-analysis] skipped: insufficient chart data", {
        hasDetailSymbol: Boolean(detailSymbol),
        candles: klineData.length,
      });
      return;
    }

    const nextUsageCount = latestUsageCount + 1;
    writeAiDailyUsageCount(nextUsageCount);
    setAiDailyUsageCount(nextUsageCount);

    setIsAiLoading(true);
    setAiError(null);
    console.log("[ai-analysis] request start", {
      symbol: detailSymbol.symbol,
      market: tab,
      interval: klineInterval,
      candles: klineData.length,
    });
    try {
      const response = await fetch("/api/ai/gemini-chart-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: detailSymbol.symbol,
          market: tab,
          interval: klineInterval,
          candles: klineData.slice(-120),
        }),
      });
      const data = (await response.json()) as { analysis?: string; error?: string };
      if (!response.ok) {
        console.error("[ai-analysis] request failed", { status: response.status, error: data.error });
        throw new Error(data.error || "분석 요청 실패");
      }
      console.log("[ai-analysis] request success", { length: data.analysis?.length ?? 0 });
      setAiAnalysis(data.analysis || "");
    } catch (error) {
      setAiAnalysis("");
      setAiError(error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.");
      console.error("[ai-analysis] unexpected error", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const chartPath = useMemo(() => {
    if (displayKlineData.length < 2) return "";
    const width = 640;
    const height = 220;
    const min = Math.min(...displayKlineData.map((p) => p.close));
    const max = Math.max(...displayKlineData.map((p) => p.close));
    const range = max - min || 1;
    return displayKlineData
      .map((point, idx) => {
        const x = (idx / (displayKlineData.length - 1)) * width;
        const y = height - ((point.close - min) / range) * height;
        return `${idx === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [displayKlineData]);

  const maSeriesList = useMemo<MaSeries[]>(() => {
    if (displayKlineData.length < 2) return [];
    return [
      { period: 5, color: "rgb(250 204 21)", points: calculateMovingAverage(displayKlineData, 5) },
      { period: 20, color: "rgb(96 165 250)", points: calculateMovingAverage(displayKlineData, 20) },
      { period: 60, color: "rgb(248 113 113)", points: calculateMovingAverage(displayKlineData, 60) },
    ];
  }, [displayKlineData]);

  const maPaths = useMemo(() => {
    if (displayKlineData.length < 2) return [];
    const width = 640;
    const height = 220;
    const allValues = [
      ...displayKlineData.map((p) => p.close),
      ...maSeriesList.flatMap((series) => series.points.filter((p): p is number => p !== null)),
    ];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 1;

    return maSeriesList.map((series) => {
      let started = false;
      const d = series.points
        .map((value, idx) => {
          if (value === null) return "";
          const x = (idx / (displayKlineData.length - 1)) * width;
          const y = height - ((value - min) / range) * height;
          const prefix = started ? "L" : "M";
          started = true;
          return `${prefix}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .filter(Boolean)
        .join(" ");
      return {
        period: series.period,
        color: series.color,
        d,
      };
    });
  }, [displayKlineData, maSeriesList]);

  const bollingerPaths = useMemo(() => {
    if (displayKlineData.length < 20) return { upper: "", lower: "" };
    const width = 640;
    const height = 220;
    const bollinger = calculateBollinger(displayKlineData, 20, 2);
    const allValues = [
      ...displayKlineData.map((p) => p.close),
      ...bollinger.upper.filter((v): v is number => v !== null),
      ...bollinger.lower.filter((v): v is number => v !== null),
    ];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 1;

    const buildPath = (series: Array<number | null>) => {
      let started = false;
      return series
        .map((value, idx) => {
          if (value === null) return "";
          const x = (idx / (displayKlineData.length - 1)) * width;
          const y = height - ((value - min) / range) * height;
          const prefix = started ? "L" : "M";
          started = true;
          return `${prefix}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .filter(Boolean)
        .join(" ");
    };

    return {
      upper: buildPath(bollinger.upper),
      lower: buildPath(bollinger.lower),
    };
  }, [displayKlineData]);

  const rsiValue = useMemo(() => calculateRsi(displayKlineData, 14), [displayKlineData]);

  const volumeBars = useMemo(() => {
    if (klineData.length < 2) return [];
    const width = 640;
    const maxVolume = Math.max(...klineData.map((p) => p.volume), 1);
    const barWidth = Math.max(width / klineData.length - 1, 1);

    return klineData.map((point, idx) => {
      const x = (idx / klineData.length) * width;
      const height = (point.volume / maxVolume) * 80;
      return {
        x,
        y: 80 - height,
        width: barWidth,
        height,
      };
    });
  }, [klineData]);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-slate-950 px-3 py-8 text-slate-100 sm:px-6 sm:py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage: "url('/doge.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "280px 280px",
          backgroundPosition: "24px 24px",
        }}
      />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-5 sm:gap-6">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">TRADING FLOOR</h1>
          <p className="text-xs text-slate-400 sm:text-sm">서울역 가던가 시그니엘 가던가 우리에게 중간은 없다.</p>
          <p className="text-xs text-slate-300 sm:text-sm">해당 데이터는 linear 마진거래 금액 기준입니다.</p>
        </div>

        <div className="inline-flex w-full rounded-2xl border border-slate-700 bg-slate-900/80 p-1">
          <button
            type="button"
            onClick={() => setFloorTab("market")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              floorTab === "market"
                ? "bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-md shadow-sky-900/30"
                : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            Trading
          </button>
          <button
            type="button"
            onClick={() => setFloorTab("news")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              floorTab === "news"
                ? "bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-md shadow-sky-900/30"
                : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            News
          </button>
        </div>

        {floorTab === "market" && (
          <>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="mb-3 text-sm text-slate-300">Coin Filter</p>
          <div ref={filterPanelRef} className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left text-sm text-slate-100 transition hover:border-sky-400"
            >
              <span className="truncate">
                {selectedSymbols[tab].length > 0
                  ? `${selectedSymbols[tab].length}개 선택됨: ${selectedSymbols[tab].join(", ")}`
                  : "심볼을 선택해 주세요"}
              </span>
              <span className="ml-3 shrink-0 text-slate-400">{isFilterOpen ? "닫기" : "열기"}</span>
            </button>

            {isFilterOpen && (
              <div className="mt-2 rounded-xl border border-slate-700 bg-slate-950 p-3 shadow-2xl">
                <input
                  value={filterQuery}
                  onChange={(event) => setFilterQuery(event.target.value)}
                  placeholder="전체 코인 검색 (예: BTC, ETH, SOL)"
                  className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400"
                />
                <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {pagedFilterSymbols.map((item) => (
                      <label
                        key={item.symbol}
                        className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-200 transition hover:bg-slate-800"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSymbols[tab].includes(item.symbol)}
                          onChange={() => handleToggleSymbol(item.symbol)}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                        />
                        <span className="font-medium">
                          {item.baseCoin}({getKoreanCoinName(item.baseCoin)}){" "}
                          <span className="text-xs text-slate-400">[{item.symbol}]</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {filteredSymbols.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-400">검색 결과가 없습니다.</p>
                  )}
                </div>
                {filteredSymbols.length > 0 && (
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {Math.min((filterPage - 1) * FILTER_PAGE_SIZE + 1, filteredSymbols.length)}-
                      {Math.min(filterPage * FILTER_PAGE_SIZE, filteredSymbols.length)} / {filteredSymbols.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFilterPage((prev) => Math.max(1, prev - 1))}
                        disabled={filterPage <= 1}
                        className="rounded-md border border-slate-600 px-2 py-1 text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        이전
                      </button>
                      <span>
                        {filterPage} / {filterTotalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFilterPage((prev) => Math.min(filterTotalPages, prev + 1))}
                        disabled={filterPage >= filterTotalPages}
                        className="rounded-md border border-slate-600 px-2 py-1 text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {isSymbolsLoading && (
          <div className="space-y-4">
            <div className="h-14 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="grid grid-cols-4 gap-0 border-b border-slate-800">
                <div className="h-11 animate-pulse bg-slate-800/60" />
                <div className="h-11 animate-pulse bg-slate-800/40" />
                <div className="h-11 animate-pulse bg-slate-800/60" />
                <div className="h-11 animate-pulse bg-slate-800/40" />
              </div>
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-0 border-b border-slate-800/60 last:border-none">
                  <div className="h-12 animate-pulse bg-slate-900/70" />
                  <div className="h-12 animate-pulse bg-slate-900/50" />
                  <div className="h-12 animate-pulse bg-slate-900/70" />
                  <div className="h-12 animate-pulse bg-slate-900/50" />
                </div>
              ))}
            </div>
          </div>
        )}
        {symbolsError && <p className="text-red-300">오류: {symbolsError}</p>}

        {!isSymbolsLoading && !symbolsError && (
          <>
            <div className="space-y-3 sm:hidden">
              {rows.map((row) => {
                const pct = Number(row.price24hPcnt ?? 0);
                const pctClass = pct > 0 ? "text-emerald-300" : pct < 0 ? "text-rose-300" : "text-slate-200";
                return (
                  <div key={`mobile-${row.symbol}`} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          {row.baseCoin}({getKoreanCoinName(row.baseCoin)})
                        </p>
                        <p className="text-xs text-slate-400">{row.symbol}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDetailSymbol({ symbol: row.symbol, baseCoin: row.baseCoin, quoteCoin: row.quoteCoin })}
                        className="rounded-md bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 px-2.5 py-1 text-xs font-semibold text-white shadow-md shadow-violet-900/40 transition hover:scale-[1.03] hover:brightness-110"
                      >
                        분석하기
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                        <p className="mb-1 text-[11px] text-slate-400">현재가</p>
                        <p className="text-sm font-semibold tabular-nums text-slate-100">{formatPrice(row.lastPrice)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                        <p className="mb-1 text-[11px] text-slate-400">24h 변동률</p>
                        <p className={`text-sm font-semibold tabular-nums ${pctClass}`}>{formatPercent(row.price24hPcnt)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 sm:block">
            <table className="w-full min-w-[640px] table-fixed text-center text-sm">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[23%]" />
                <col className="w-[23%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead className="border-b border-slate-800 text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-center">Coin</th>
                  <th className="px-4 py-3 text-center">현재가</th>
                  <th className="px-4 py-3 text-center">24h 변동률</th>
                  <th className="px-4 py-3 text-center">상세</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const pct = Number(row.price24hPcnt ?? 0);
                  const pctClass = pct > 0 ? "text-emerald-300" : pct < 0 ? "text-rose-300" : "text-slate-200";
                  return (
                    <tr key={row.symbol} className="border-b border-slate-800/70 last:border-none">
                      <td className="px-4 py-3 font-medium text-center">
                        <span className="block truncate text-center">
                          {row.baseCoin}({getKoreanCoinName(row.baseCoin)})
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center tabular-nums">{formatPrice(row.lastPrice)}</td>
                      <td className={`px-4 py-3 whitespace-nowrap text-center tabular-nums ${pctClass}`}>{formatPercent(row.price24hPcnt)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setDetailSymbol({ symbol: row.symbol, baseCoin: row.baseCoin, quoteCoin: row.quoteCoin })}
                          className="rounded-md bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-900/40 transition hover:scale-[1.03] hover:brightness-110"
                        >
                          분석하기
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </>
        )}

        {!isSymbolsLoading && !symbolsError && rows.length === 0 && (
          <p className="text-slate-300">체크된 코인이 없어 표시할 심볼이 없습니다.</p>
        )}
          </>
        )}

        {floorTab === "news" && (
          <div className="space-y-4">
            {newsLoading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, sectionIdx) => (
                  <section
                    key={`news-skeleton-section-${sectionIdx}`}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="mb-3 h-4 w-52 animate-pulse rounded bg-slate-800/80" />
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((__, itemIdx) => (
                        <div
                          key={`news-skeleton-item-${sectionIdx}-${itemIdx}`}
                          className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2"
                        >
                          <div className="h-3.5 w-11/12 animate-pulse rounded bg-slate-800/80" />
                          <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-slate-800/60" />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
            {newsError && <p className="text-sm text-red-300">{newsError}</p>}

            {!newsLoading && !newsError && (
              <>
                <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <h2 className="mb-3 text-sm font-semibold text-sky-300">미국 주요 연설/지표</h2>
                  <div className="space-y-2">
                    {pagedUsEvents.map((event, idx) => (
                      event.url ? (
                        <a
                          key={`${event.url}-${idx}`}
                          href={event.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 hover:border-sky-400"
                        >
                          <p className="text-sm text-slate-100">{event.title}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {event.source}
                            {event.publishedAt ? ` | ${normalizeCalendarDate(event.publishedAt)}` : ""}
                          </p>
                        </a>
                      ) : (
                        <div
                          key={`${event.title}-${event.publishedAt}-${idx}`}
                          className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2"
                        >
                          <p className="text-sm text-slate-100">{event.title}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {normalizeCalendarDate(event.publishedAt)} | {event.country || event.source || "US"} | impact:{" "}
                            {event.impact || "-"}
                          </p>
                        </div>
                      )
                    ))}
                    {sortedUsMajorEvents.length === 0 && (
                      <p className="text-sm text-slate-400">표시할 미국 주요 예정 이벤트가 없습니다.</p>
                    )}
                    {sortedUsMajorEvents.length > 0 && (
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                        <span>
                          {usEventsPage} / {usEventsTotalPages}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setUsEventsPage((prev) => Math.max(1, prev - 1))}
                            disabled={usEventsPage <= 1}
                            className="rounded-md border border-slate-600 px-2 py-1 text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            이전
                          </button>
                          <button
                            type="button"
                            onClick={() => setUsEventsPage((prev) => Math.min(usEventsTotalPages, prev + 1))}
                            disabled={usEventsPage >= usEventsTotalPages}
                            className="rounded-md border border-slate-600 px-2 py-1 text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            다음
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <h2 className="mb-3 text-sm font-semibold text-sky-300">CryptoPanic 속보</h2>
                  <div className="space-y-2">
                    {pagedCryptoNews.map((item, idx) => (
                      <a
                        key={`${item.url}-${idx}`}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 hover:border-sky-400"
                      >
                        <p className="text-sm text-slate-100">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{item.source}</p>
                      </a>
                    ))}
                    {cryptoNews.length === 0 && <p className="text-sm text-slate-400">표시할 속보가 없습니다.</p>}
                    {cryptoNews.length > 0 && (
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                        <span>
                          {cryptoNewsPage} / {cryptoNewsTotalPages}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCryptoNewsPage((prev) => Math.max(1, prev - 1))}
                            disabled={cryptoNewsPage <= 1}
                            className="rounded-md border border-slate-600 px-2 py-1 text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            이전
                          </button>
                          <button
                            type="button"
                            onClick={() => setCryptoNewsPage((prev) => Math.min(cryptoNewsTotalPages, prev + 1))}
                            disabled={cryptoNewsPage >= cryptoNewsTotalPages}
                            className="rounded-md border border-slate-600 px-2 py-1 text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            다음
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <h2 className="mb-3 text-sm font-semibold text-sky-300">거래소 공지 (Bybit/Binance)</h2>
                  <div className="space-y-2">
                    {pagedExchangeNews.map((item, idx) => (
                      <a
                        key={`${item.url}-${idx}`}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 hover:border-sky-400"
                      >
                        <p className="text-sm text-slate-100">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{item.source}</p>
                      </a>
                    ))}
                    {exchangeNews.length === 0 && <p className="text-sm text-slate-400">표시할 공지가 없습니다.</p>}
                    {exchangeNews.length > 0 && (
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                        <span>
                          {exchangeNewsPage} / {exchangeNewsTotalPages}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExchangeNewsPage((prev) => Math.max(1, prev - 1))}
                            disabled={exchangeNewsPage <= 1}
                            className="rounded-md border border-slate-600 px-2 py-1 text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            이전
                          </button>
                          <button
                            type="button"
                            onClick={() => setExchangeNewsPage((prev) => Math.min(exchangeNewsTotalPages, prev + 1))}
                            disabled={exchangeNewsPage >= exchangeNewsTotalPages}
                            className="rounded-md border border-slate-600 px-2 py-1 text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            다음
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

              </>
            )}
          </div>
        )}
      </div>

      {detailSymbol && (
        <div className="fixed inset-0 z-50 w-screen max-w-[100vw] overflow-x-hidden bg-slate-950">
          <div className="h-full w-full overflow-x-hidden overflow-y-auto">
            <div className="mx-auto box-border min-h-dvh w-full max-w-[100vw] overflow-x-hidden px-3 py-3 text-slate-100 sm:p-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">
                    {detailSymbol.baseCoin} ({getKoreanCoinName(detailSymbol.baseCoin)})
                  </h2>
                  <p className="text-sm text-slate-400">{detailSymbol.symbol} / 선물</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDetailSymbol(null);
                    setKlineError(null);
                    setKlineData([]);
                    setAiAnalysis("");
                    setAiError(null);
                  }}
                  className="rounded-md border border-slate-600 px-2.5 py-1 text-sm text-slate-200 transition hover:border-slate-400"
                >
                  닫기
                </button>
              </div>

              <div className="grid min-w-0 gap-4">
                <div className="grid min-w-0 gap-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 sm:bg-slate-950">
                      <p className="mb-1 text-xs text-slate-400">현재가</p>
                      <p className="text-xl font-semibold tabular-nums">{formatPrice(detailTicker?.lastPrice)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 sm:bg-slate-950">
                      <p className="mb-1 text-xs text-slate-400">24h 변동률</p>
                      <p className="text-xl font-semibold tabular-nums">{formatPercent(detailTicker?.price24hPcnt)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 sm:bg-slate-950">
                      <p className="mb-1 text-xs text-slate-400">24h 거래량</p>
                      <p className="text-xl font-semibold tabular-nums">
                        {detailTicker?.volume24h ? Number(detailTicker.volume24h).toLocaleString("ko-KR") : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 rounded-xl border border-slate-700 bg-slate-900/40 p-4 sm:bg-slate-950">
                  <div className="mb-3 sm:hidden">
                    <label className="mb-1 block text-xs text-slate-400">기간 선택</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsIntervalDropdownOpen((prev) => !prev)}
                        className="flex w-full items-center justify-between rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                      >
                        <span>{selectedIntervalLabel}</span>
                        <span className="text-slate-400">{isIntervalDropdownOpen ? "닫기" : "열기"}</span>
                      </button>

                      {isIntervalDropdownOpen && (
                        <div className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-slate-700 bg-slate-950 p-1 shadow-xl">
                          {KLINE_INTERVAL_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setKlineInterval(option.value)}
                              className={`flex w-full items-center rounded px-3 py-2 text-left text-sm ${
                                klineInterval === option.value
                                  ? "bg-sky-500/20 text-sky-200"
                                  : "text-slate-200 hover:bg-slate-800"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-3 hidden w-full max-w-full overflow-x-auto overflow-y-hidden pb-1 [-webkit-overflow-scrolling:touch] sm:block">
                    <div className="inline-flex w-max gap-2 whitespace-nowrap pr-1">
                      {KLINE_INTERVAL_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setKlineInterval(option.value)}
                          className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${
                            klineInterval === option.value
                              ? "bg-sky-500 text-white"
                              : "border border-slate-600 text-slate-200 hover:border-sky-400"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isKlineLoading && <div className="h-[220px] animate-pulse rounded-lg bg-slate-800/60" />}
                  {klineError && <p className="text-sm text-red-300">{klineError}</p>}
                  {!isKlineLoading && !klineError && displayKlineData.length > 1 && (
                    <div className="min-w-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-950 p-3">
                      <svg viewBox="0 0 640 220" className="h-[200px] w-full sm:h-[220px]">
                        <path d={chartPath} fill="none" stroke="rgb(56 189 248)" strokeWidth="2.5" />
                        {bollingerPaths.upper && (
                          <path
                            d={bollingerPaths.upper}
                            fill="none"
                            stroke="rgb(192 132 252)"
                            strokeWidth="1.3"
                            strokeDasharray="4 4"
                            opacity="0.95"
                          />
                        )}
                        {bollingerPaths.lower && (
                          <path
                            d={bollingerPaths.lower}
                            fill="none"
                            stroke="rgb(192 132 252)"
                            strokeWidth="1.3"
                            strokeDasharray="4 4"
                            opacity="0.95"
                          />
                        )}
                        {maPaths.map((ma) =>
                          ma.d ? (
                            <path key={ma.period} d={ma.d} fill="none" stroke={ma.color} strokeWidth="1.7" opacity="0.95" />
                          ) : null,
                        )}
                      </svg>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-300">
                        {maPaths.map((ma) => (
                          <span key={`legend-${ma.period}`} className="inline-flex items-center gap-1.5">
                            <span className="inline-block h-1.5 w-4 rounded-full" style={{ backgroundColor: ma.color }} />
                            MA{ma.period}
                          </span>
                        ))}
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-block h-1.5 w-4 rounded-full bg-purple-300" />
                          Bollinger(20,2)
                        </span>
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-400">
                        <p>
                          MA5: 최근 5개 봉 평균 가격으로 단기 흐름을 빠르게 보여줍니다.
                        </p>
                        <p>
                          MA20: 최근 20개 봉 평균 가격으로 중단기 추세와 눌림/이탈 기준으로 자주 사용됩니다.
                        </p>
                        <p>
                          MA60: 최근 60개 봉 평균 가격으로 더 큰 방향성(중기 추세)을 확인할 때 참고합니다.
                        </p>
                        <p>
                          Bollinger(20,2): 20기간 평균선 기준으로 표준편차 2배 상/하단 밴드를 표시해 변동성 확대/수축과
                          과열·과매도 구간 판단에 활용합니다.
                        </p>
                      </div>
                      <div className="mt-3 border-t border-slate-800 pt-3">
                        <p className="mb-1 text-xs text-slate-400">RSI(14)</p>
                        <div className="mb-3 rounded-md border border-slate-800 bg-slate-900/70 p-2">
                          <div className="mb-1 flex items-center justify-between text-[11px] text-slate-300">
                            <span>과매도 30 / 과매수 70</span>
                            <span>{rsiValue !== null ? rsiValue.toFixed(1) : "-"}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-rose-400 transition-all"
                              style={{ width: `${Math.max(0, Math.min(100, rsiValue ?? 0))}%` }}
                            />
                          </div>
                        </div>
                        <p className="mb-2 text-xs text-slate-400">거래량</p>
                        <svg viewBox="0 0 640 80" className="h-[70px] w-full sm:h-[80px]">
                          {volumeBars.map((bar, idx) => (
                            <rect
                              key={`${idx}-${bar.x}`}
                              x={bar.x}
                              y={bar.y}
                              width={bar.width}
                              height={bar.height}
                              rx="1"
                              fill="rgb(34 197 94 / 0.8)"
                            />
                          ))}
                        </svg>
                      </div>
                    </div>
                  )}
                  </div>
                </div>

                <aside className="min-w-0 rounded-xl border border-slate-700 bg-slate-900/40 p-4 sm:bg-slate-950">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-md font-semibold text-slate-100">AI 차트분석</h3>
                  </div>
                  <p className="mb-3 text-xs leading-5 text-white">
                    선택한 기간 봉 데이터를 기준으로, 전문 트레이딩 AI가 핵심 흐름과 시나리오를 정밀 분석합니다.
                  </p>
                  <p className="mb-3 text-[11px] text-slate-400">
                    오늘 사용량: {aiDailyUsageCount}/{AI_DAILY_LIMIT}회
                    {isAiLimitReached ? " (한도 도달)" : ` (남은 횟수 ${aiRemainingCount}회)`}
                  </p>
                  {!aiAnalysis && !isAiLoading && !aiError && (
                    <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                      <button
                        type="button"
                        onClick={handleAnalyzeClick}
                        disabled={!detailSymbol || klineInterval === "1s" || isAiLimitReached}
                        className="rounded-md bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-900/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isAiLimitReached
                          ? "오늘 AI 분석 사용 한도(2회) 도달"
                          : klineInterval === "1s"
                          ? "AI 분석은 1분 봉 이상부터 지원"
                          : `${selectedIntervalLabel} 차트 기준으로 분석하기`}
                      </button>
                    </div>
                  )}

                  {isAiLoading && (
                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                      <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-lg bg-slate-900/60">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-500 border-t-sky-400" />
                        <p className="text-sm text-slate-300">{selectedIntervalLabel} 기준 AI 분석 로딩 중...</p>
                      </div>
                    </div>
                  )}

                  {aiError && (
                    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                      <p className="text-sm text-red-300">{aiError}</p>
                      <button
                        type="button"
                        onClick={handleAnalyzeClick}
                        disabled={isAiLimitReached}
                        className="rounded-md bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-900/40 transition hover:brightness-110"
                      >
                        {isAiLimitReached ? "오늘 사용 한도 도달" : `${selectedIntervalLabel} 기준 다시 분석하기`}
                      </button>
                    </div>
                  )}

                  {aiAnalysis && !isAiLoading && !aiError && (
                    <div className="space-y-4 rounded-xl border border-slate-700 bg-gradient-to-b from-slate-950/90 to-slate-900/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                          <p className="text-xs font-medium tracking-wide text-slate-300">AI REPORT</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAnalyzeClick}
                          disabled={isAiLimitReached}
                          className="rounded-md bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-900/40 transition hover:brightness-110"
                        >
                          {isAiLimitReached ? "오늘 사용 한도 도달" : `${selectedIntervalLabel} 기준 다시 분석하기`}
                        </button>
                      </div>
                      <div className="space-y-3">
                        {analysisSections.map((section, idx) => (
                          <section
                            key={`${section.title}-${idx}`}
                            className="rounded-lg border border-slate-800/90 bg-slate-950/70 p-3"
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-sky-500/20 px-2 text-xs font-bold text-sky-200">
                                {getSectionNumber(section.title)}
                              </span>
                              <h4 className="text-sm font-semibold text-sky-200">
                                {getSectionTitle(section.title)}
                              </h4>
                            </div>
                            <div className="space-y-1.5 break-words text-sm leading-6 text-slate-100">
                              {section.items.map((item, itemIdx) => (
                                <p
                                  key={`${idx}-${itemIdx}`}
                                  className={
                                    item.startsWith("-")
                                      ? "break-words rounded-md bg-slate-900/70 px-2 py-1 text-slate-200"
                                      : "break-words"
                                  }
                                >
                                  {item.startsWith("-") ? item.replace(/^-+\s*/, "• ") : item}
                                </p>
                              ))}
                            </div>
                          </section>
                        ))}
                      </div>
                    </div>
                  )}
                </aside>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
