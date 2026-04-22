"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type MarketTab = "spot" | "linear";
type FloorTab = "market" | "news" | "board";
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
type IndicatorVisibility = {
  ma5: boolean;
  ma20: boolean;
  ma60: boolean;
  bollinger: boolean;
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
const CHART_WIDTH = 640;
const CHART_AXIS_WIDTH = 84;
const CHART_PLOT_WIDTH = CHART_WIDTH - CHART_AXIS_WIDTH;
const CHART_HEIGHT = 300;
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

function getDefaultNicknameFromSessionUser(user: { email?: string; user_metadata?: Record<string, unknown> } | null) {
  if (!user) return "트레이더";
  const userMeta = user.user_metadata ?? {};
  const displayName =
    (typeof userMeta.display_name === "string" && userMeta.display_name.trim()) ||
    (typeof userMeta.full_name === "string" && userMeta.full_name.trim()) ||
    (typeof userMeta.name === "string" && userMeta.name.trim()) ||
    (typeof userMeta.user_name === "string" && userMeta.user_name.trim()) ||
    (typeof userMeta.nickname === "string" && userMeta.nickname.trim()) ||
    (typeof userMeta.preferred_username === "string" && userMeta.preferred_username.trim()) ||
    "";
  if (displayName) return displayName;
  if (user.email) return user.email.split("@")[0] || "트레이더";
  return "트레이더";
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
  const [isIndicatorDropdownOpen, setIsIndicatorDropdownOpen] = useState(false);
  const [indicatorVisibility, setIndicatorVisibility] = useState<IndicatorVisibility>({
    ma5: true,
    ma20: true,
    ma60: true,
    bollinger: true,
  });
  const [klineData, setKlineData] = useState<CandlePoint[]>([]);
  const [liveSecondCloses, setLiveSecondCloses] = useState<Array<{ timestamp: number; close: number }>>([]);
  const [isKlineLoading, setIsKlineLoading] = useState(false);
  const [klineError, setKlineError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiCopied, setIsAiCopied] = useState(false);
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
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);
  const [isFilterInfoOpen, setIsFilterInfoOpen] = useState(false);
  const [isFilterInfoHovered, setIsFilterInfoHovered] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isNicknameSaving, setIsNicknameSaving] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const shouldReconnectRef = useRef(true);
  const tickerBufferRef = useRef<Record<string, TickerPatch>>({});
  const flushTimerRef = useRef<number | null>(null);
  const filterPanelRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const detailPriceRef = useRef<number | null>(null);
  const latestKlineCloseRef = useRef<number | null>(null);

  const ensureUserProfile = async (
    user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null,
    options?: { openModalIfMissing?: boolean },
  ) => {
    if (!user) {
      setIsNicknameModalOpen(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.from("USER_MST").select("auth_id, nickname").eq("auth_id", user.id).maybeSingle();

    if (error) {
      console.error("[user-profile] fetch failed", error);
      return;
    }

    if (data?.auth_id) {
      setIsNicknameModalOpen(false);
      return;
    }

    const defaultNickname = getDefaultNicknameFromSessionUser(user);
    setNicknameDraft(defaultNickname);
    if (options?.openModalIfMissing !== false) {
      setNicknameError(null);
      setIsNicknameModalOpen(true);
    }
  };

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    const syncAuthState = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const sessionUser = data.session?.user ?? null;
      setIsLoggedIn(Boolean(sessionUser));
      setUserAvatarUrl(
        (sessionUser?.user_metadata?.avatar_url as string | undefined) ??
          (sessionUser?.user_metadata?.picture as string | undefined) ??
          null,
      );
      await ensureUserProfile(
        sessionUser
          ? { id: sessionUser.id, email: sessionUser.email, user_metadata: sessionUser.user_metadata as Record<string, unknown> }
          : null,
      );
    };

    syncAuthState();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      setIsLoggedIn(Boolean(sessionUser));
      setUserAvatarUrl(
        (sessionUser?.user_metadata?.avatar_url as string | undefined) ??
          (sessionUser?.user_metadata?.picture as string | undefined) ??
          null,
      );
      setIsUserMenuOpen(false);
      await ensureUserProfile(
        sessionUser
          ? { id: sessionUser.id, email: sessionUser.email, user_metadata: sessionUser.user_metadata as Record<string, unknown> }
          : null,
      );
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

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
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
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
    setIsIndicatorDropdownOpen(false);
  }, [klineInterval, detailSymbol]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTopButton(window.scrollY > 240);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleToggleSymbol = (symbol: string) => {
    setSelectedSymbols((prev) => {
      const current = prev[tab];
      const next = current.includes(symbol) ? current.filter((item) => item !== symbol) : [...current, symbol];
      return { ...prev, [tab]: next };
    });
  };

  const handleOpenAnalysisModal = async (symbol: BybitSymbol) => {
    if (!isLoggedIn) {
      setAuthError(null);
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const userResult = await Promise.race([
        supabase.auth.getUser(),
        new Promise<{
          data: { user: null };
          error: Error;
        }>((resolve) =>
          window.setTimeout(
            () => resolve({ data: { user: null }, error: new Error("로그인 확인 시간이 초과되었습니다.") }),
            3500,
          ),
        ),
      ]);
      const { data, error } = userResult;
      if (error) {
        setAuthError(null);
        setIsAuthModalOpen(true);
        return;
      }
      if (!data.user) {
        setAuthError(null);
        setIsAuthModalOpen(true);
        return;
      }
      setDetailSymbol(symbol);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "로그인 상태 확인 중 오류가 발생했습니다.");
      setIsAuthModalOpen(true);
    }
  };

  useEffect(() => {
    if (!detailSymbol) return;
    let cancelled = false;
    setIsKlineLoading(true);
    setKlineError(null);

    const normalizedInterval = klineInterval === "1s" ? "1" : klineInterval;
    let isInitialFetch = true;
    let hasSuccessfulFetch = false;

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
          hasSuccessfulFetch = true;
          setKlineError(null);
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
          // 초기 진입에서만 에러를 노출하고, 이후 주기 갱신 실패는 기존 차트를 유지한다.
          if (isInitialFetch && !hasSuccessfulFetch) {
            setKlineError(error instanceof Error ? error.message : "차트 조회 실패");
            setKlineData([]);
          } else {
            console.warn("[kline] transient fetch failure, keeping previous chart", error);
          }
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
      if (typeof latest !== "number" || !Number.isFinite(latest)) return;
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
    if (!isLoggedIn) {
      setAuthError(null);
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const userResult = await Promise.race([
        supabase.auth.getUser(),
        new Promise<{
          data: { user: null };
          error: Error;
        }>((resolve) =>
          window.setTimeout(
            () => resolve({ data: { user: null }, error: new Error("로그인 확인 시간이 초과되었습니다.") }),
            3500,
          ),
        ),
      ]);
      const { data, error } = userResult;
      if (error) {
        setAuthError(null);
        setIsAuthModalOpen(true);
        return;
      }
      if (!data.user) {
        setAuthError(null);
        setIsAuthModalOpen(true);
        return;
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "로그인 상태 확인 중 오류가 발생했습니다.");
      return;
    }

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
    let usageReserved = true;

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
      let data: { analysis?: string; error?: string } = {};
      try {
        data = (await response.json()) as { analysis?: string; error?: string };
      } catch {
        data = {};
      }
      if (!response.ok) {
        console.error("[ai-analysis] request failed", {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
        });
        if (usageReserved) {
          writeAiDailyUsageCount(latestUsageCount);
          setAiDailyUsageCount(latestUsageCount);
          usageReserved = false;
        }
        const fallbackMessage =
          response.status === 429
            ? "요청이 많거나 외부 AI 쿼터가 초과되었습니다. 잠시 후 다시 시도해 주세요."
            : response.status === 403
              ? "요청 출처 검증에 실패했습니다. 새로고침 후 다시 시도해 주세요."
              : response.status === 503
                ? "AI 분석 기능이 현재 비활성화되어 있습니다."
                : "분석 요청 실패";
        throw new Error(data.error || fallbackMessage);
      }
      console.log("[ai-analysis] request success", { length: data.analysis?.length ?? 0 });
      setAiAnalysis(data.analysis || "");
    } catch (error) {
      if (usageReserved) {
        writeAiDailyUsageCount(latestUsageCount);
        setAiDailyUsageCount(latestUsageCount);
      }
      setAiAnalysis("");
      setAiError(error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.");
      console.error("[ai-analysis] unexpected error", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsAuthLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", "/");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Google 로그인 요청에 실패했습니다.");
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      setIsUserMenuOpen(false);
      setIsLoggedIn(false);
      setUserAvatarUrl(null);
      setIsNicknameModalOpen(false);
      window.location.href = "/";
    } catch {
      setIsUserMenuOpen(false);
    }
  };

  const saveUserNickname = async (nicknameInput?: string) => {
    try {
      setIsNicknameSaving(true);
      setNicknameError(null);
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.user) {
        throw new Error("로그인 세션을 확인할 수 없습니다.");
      }

      const user = sessionData.session.user;
      const fallbackNickname = getDefaultNicknameFromSessionUser({
        email: user.email,
        user_metadata: user.user_metadata as Record<string, unknown>,
      });
      const isSkipped = nicknameInput !== undefined;
      const finalNickname = isSkipped ? fallbackNickname : nicknameDraft.trim() || fallbackNickname;

      const { error } = await supabase.from("USER_MST").upsert(
        {
          auth_id: user.id,
          nickname: finalNickname,
        },
        { onConflict: "auth_id" },
      );
      if (error) throw error;

      setNicknameDraft(finalNickname);
      setIsNicknameModalOpen(false);
    } catch (error) {
      setNicknameError(error instanceof Error ? error.message : "닉네임 저장 중 오류가 발생했습니다.");
    } finally {
      setIsNicknameSaving(false);
    }
  };

  const handleCopyAiAnalysis = async () => {
    if (!aiAnalysis.trim()) return;
    try {
      await navigator.clipboard.writeText(aiAnalysis);
      setIsAiCopied(true);
      window.setTimeout(() => setIsAiCopied(false), 1400);
    } catch (error) {
      console.error("[ai-analysis] copy failed", error);
      setAiError("복사에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  const chartPath = useMemo(() => {
    if (displayKlineData.length < 2) return "";
    const min = Math.min(...displayKlineData.map((p) => p.close));
    const max = Math.max(...displayKlineData.map((p) => p.close));
    const range = max - min || 1;
    return displayKlineData
      .map((point, idx) => {
        const x = (idx / (displayKlineData.length - 1)) * CHART_PLOT_WIDTH;
        const y = CHART_HEIGHT - ((point.close - min) / range) * CHART_HEIGHT;
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
          const x = (idx / (displayKlineData.length - 1)) * CHART_PLOT_WIDTH;
          const y = CHART_HEIGHT - ((value - min) / range) * CHART_HEIGHT;
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

  const visibleMaPaths = useMemo(
    () =>
      maPaths.filter((ma) => {
        if (ma.period === 5) return indicatorVisibility.ma5;
        if (ma.period === 20) return indicatorVisibility.ma20;
        if (ma.period === 60) return indicatorVisibility.ma60;
        return true;
      }),
    [maPaths, indicatorVisibility],
  );

  const bollingerPaths = useMemo(() => {
    if (displayKlineData.length < 20) return { upper: "", lower: "" };
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
          const x = (idx / (displayKlineData.length - 1)) * CHART_PLOT_WIDTH;
          const y = CHART_HEIGHT - ((value - min) / range) * CHART_HEIGHT;
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

  const chartScale = useMemo(() => {
    if (displayKlineData.length < 2) return null;
    const allValues = [
      ...displayKlineData.map((p) => p.close),
      ...maSeriesList.flatMap((series) => series.points.filter((p): p is number => p !== null)),
    ];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 1;
    return { min, max, range };
  }, [displayKlineData, maSeriesList]);

  const currentDisplayPrice = useMemo(() => {
    const tickerPrice = Number(detailTicker?.lastPrice);
    if (Number.isFinite(tickerPrice)) return tickerPrice;
    return displayKlineData[displayKlineData.length - 1]?.close ?? null;
  }, [detailTicker?.lastPrice, displayKlineData]);

  const currentPriceY = useMemo(() => {
    if (!chartScale || typeof currentDisplayPrice !== "number") return null;
    const normalized = (currentDisplayPrice - chartScale.min) / chartScale.range;
    const y = CHART_HEIGHT - normalized * CHART_HEIGHT;
    return Math.max(0, Math.min(CHART_HEIGHT, y));
  }, [chartScale, currentDisplayPrice]);

  const yAxisTicks = useMemo(() => {
    if (!chartScale) return [];
    const tickCount = 5;
    return Array.from({ length: tickCount }, (_, idx) => {
      const ratio = idx / (tickCount - 1);
      const value = chartScale.max - chartScale.range * ratio;
      const y = CHART_HEIGHT * ratio;
      return { value, y };
    });
  }, [chartScale]);

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
    <main className="trading-floor-page relative min-h-dvh overflow-hidden bg-slate-950 px-0 py-0 text-slate-100 sm:px-0 sm:py-0">
      <div className="trading-floor-stars" />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-5 px-3 py-6 sm:gap-6 sm:px-6 sm:py-8">
        <header className="sticky top-0 z-[220] -mx-3 -mt-6 overflow-visible border-b border-slate-800/90 bg-slate-950/95 px-3 py-3 backdrop-blur sm:-mx-6 sm:-mt-8 sm:px-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-fuchsia-500/20 blur-2xl" />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => (window.location.href = "/")}
              className="flex cursor-pointer items-center gap-2 text-lg font-bold tracking-tight transition hover:text-sky-200 sm:text-2xl"
            >
              <span>JJINDONG</span>
              <img
                src="/doge.png"
                alt="Doge"
                className="h-8 w-8 rounded-full border border-slate-700 object-cover sm:h-10 sm:w-10"
              />
            </button>
            <div ref={userMenuRef} className="relative shrink-0">
              {isLoggedIn ? (
                <button
                  type="button"
                  aria-label="사용자 메뉴 열기"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="group relative h-10 w-10 overflow-hidden rounded-full border border-slate-600 bg-slate-900 transition hover:border-sky-400"
                >
                  {userAvatarUrl ? (
                    <img src={userAvatarUrl} alt="Google avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="inline-flex h-full w-full items-center justify-center text-xs font-semibold text-slate-200">
                      USER
                    </span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setIsAuthModalOpen(true);
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-slate-900 text-[11px] font-semibold text-slate-100 transition hover:border-sky-400 hover:text-white"
                >
                  Login
                </button>
              )}

              <div
                className={`absolute right-0 top-12 z-[120] w-40 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/95 shadow-xl transition-all duration-300 ease-out ${
                  isLoggedIn && isUserMenuOpen
                    ? "max-h-40 translate-y-0 p-1.5 opacity-100"
                    : "pointer-events-none max-h-0 -translate-y-1 p-0 opacity-0"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                      window.location.href = "/mypage";
                  }}
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                >
                  마이페이지
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-rose-300 transition hover:bg-slate-800"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="relative inline-flex w-full rounded-2xl border border-slate-700 bg-slate-900/80 p-1">
          <span
            aria-hidden="true"
            className={`absolute bottom-1 top-1 z-0 w-[calc((100%-0.5rem)/3)] rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 shadow-md shadow-sky-900/30 transition-transform duration-300 ease-out ${
              floorTab === "market"
                ? "translate-x-0"
                : floorTab === "news"
                  ? "translate-x-[100%]"
                  : "translate-x-[200%]"
            }`}
          />
          <button
            type="button"
            onClick={() => setFloorTab("market")}
            className={`relative z-10 flex flex-1 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
              floorTab === "market" ? "text-white" : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            <span className="leading-none">Trading</span>
          </button>
          <button
            type="button"
            onClick={() => setFloorTab("news")}
            className={`relative z-10 flex flex-1 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
              floorTab === "news" ? "text-white" : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            <span className="leading-none">News</span>
          </button>
          <button
            type="button"
            onClick={() => setFloorTab("board")}
            className={`relative z-10 flex flex-1 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
              floorTab === "board" ? "text-white" : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            <span className="leading-none">게시판</span>
          </button>
        </div>

        {floorTab === "market" && (
          <>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-slate-300">Coin Filter</p>
            <div
              className="relative"
              onMouseEnter={() => setIsFilterInfoHovered(true)}
              onMouseLeave={() => setIsFilterInfoHovered(false)}
            >
              <button
                type="button"
                aria-label="코인 필터 안내"
                onClick={() => setIsFilterInfoOpen((prev) => !prev)}
                onBlur={() => setIsFilterInfoOpen(false)}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-600 text-[11px] font-semibold text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
              >
                i
              </button>
              <div
                className={`absolute right-0 top-7 z-40 w-64 rounded-md border border-slate-700 bg-slate-950/95 p-2 text-xs leading-5 text-slate-300 shadow-xl transition-all duration-200 ${
                  isFilterInfoOpen || isFilterInfoHovered ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"
                }`}
              >
                해당 데이터는 Bybit linear 마진거래 기준이며, 체크한 코인만 목록에 표시됩니다.
              </div>
            </div>
          </div>
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
              <span className="ml-3 shrink-0 text-slate-400">
                <svg
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  className={`h-4 w-4 transition-transform duration-200 ${isFilterOpen ? "rotate-180" : "rotate-0"}`}
                >
                  <path
                    d="M5.5 7.5L10 12l4.5-4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            <div
              className={`absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl transition-all duration-300 ease-out ${
                isFilterOpen ? "max-h-[560px] translate-y-0 p-3 opacity-100" : "max-h-0 -translate-y-1 p-0 opacity-0"
              }`}
            >
              <div className={isFilterOpen ? "block" : "pointer-events-none"}>
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
            </div>
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
                        onClick={() =>
                          handleOpenAnalysisModal({
                            symbol: row.symbol,
                            baseCoin: row.baseCoin,
                            quoteCoin: row.quoteCoin,
                          })
                        }
                        className="rounded-md bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 px-2.5 py-1 text-xs font-semibold text-white shadow-md shadow-violet-900/40 transition hover:scale-[1.03] hover:brightness-110"
                      >
                        AI 분석하기
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
                          onClick={() =>
                            handleOpenAnalysisModal({
                              symbol: row.symbol,
                              baseCoin: row.baseCoin,
                              quoteCoin: row.quoteCoin,
                            })
                          }
                          className="rounded-md bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-900/40 transition hover:scale-[1.03] hover:brightness-110"
                        >
                          AI 분석하기
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

        {floorTab === "board" && (
          <section className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center">
            <p className="text-sm text-slate-300">준비중입니다.</p>
          </section>
        )}
      </div>

      {detailSymbol && (
        <div className="fixed inset-0 z-50 w-screen max-w-[100vw] overflow-x-hidden bg-slate-950">
          <div className="h-full w-full overflow-x-hidden overflow-y-auto">
            <div className="mx-auto box-border min-h-dvh w-full max-w-[100vw] overflow-x-hidden px-3 py-3 text-slate-100 sm:p-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold">
                    {detailSymbol.baseCoin} ({getKoreanCoinName(detailSymbol.baseCoin)})
                    <span
                      className={`text-base leading-none font-semibold tabular-nums ${
                        Number(detailTicker?.price24hPcnt ?? 0) > 0
                          ? "text-emerald-300"
                          : Number(detailTicker?.price24hPcnt ?? 0) < 0
                            ? "text-rose-300"
                            : "text-slate-300"
                      }`}
                    >
                      {formatPercent(detailTicker?.price24hPcnt)}
                    </span>
                    <span className="text-base leading-none font-semibold tabular-nums text-slate-200">
                      {formatPrice(detailTicker?.lastPrice)}
                    </span>
                  </h2>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
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
              </div>

              <div className="grid min-w-0 gap-4">
                <div className="grid min-w-0 gap-3">
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
                        <span className="text-slate-400">
                          <svg
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isIntervalDropdownOpen ? "rotate-180" : "rotate-0"
                            }`}
                          >
                            <path
                              d="M5.5 7.5L10 12l4.5-4.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </button>

                      <div
                        className={`absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-md border border-slate-700 bg-slate-950 shadow-xl transition-all duration-300 ease-out ${
                          isIntervalDropdownOpen
                            ? "max-h-56 translate-y-0 p-1 opacity-100"
                            : "pointer-events-none max-h-0 -translate-y-1 p-0 opacity-0"
                        }`}
                      >
                        <div className={`overflow-y-auto ${isIntervalDropdownOpen ? "max-h-56" : "max-h-0"}`}>
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
                      </div>
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

                  <div className="relative mb-3 w-full sm:w-[360px]">
                    <label className="mb-1 block text-xs text-slate-400">지표 선택</label>
                    <button
                      type="button"
                      onClick={() => setIsIndicatorDropdownOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-left text-sm text-slate-100"
                    >
                      <span>지표</span>
                      <span className="text-slate-400">
                        <svg
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isIndicatorDropdownOpen ? "rotate-180" : "rotate-0"
                          }`}
                        >
                          <path
                            d="M5.5 7.5L10 12l4.5-4.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </button>
                    <div
                      className={`absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-md border border-slate-700 bg-slate-950 shadow-xl transition-all duration-300 ease-out ${
                        isIndicatorDropdownOpen
                          ? "max-h-[420px] translate-y-0 p-1 opacity-100"
                          : "pointer-events-none max-h-0 -translate-y-1 p-0 opacity-0"
                      }`}
                    >
                      <div className="space-y-1">
                        <label className="block rounded px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800">
                          <span className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={indicatorVisibility.ma5}
                              onChange={(event) =>
                                setIndicatorVisibility((prev) => ({
                                  ...prev,
                                  ma5: event.target.checked,
                                }))
                              }
                              className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                            />
                            MA5
                          </span>
                          <p className="mt-1 pl-6 text-xs leading-5 text-slate-400">
                            최근 5개 봉 평균 가격으로 단기 흐름을 빠르게 보여줍니다.
                          </p>
                        </label>
                        <label className="block rounded px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800">
                          <span className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={indicatorVisibility.ma20}
                              onChange={(event) =>
                                setIndicatorVisibility((prev) => ({
                                  ...prev,
                                  ma20: event.target.checked,
                                }))
                              }
                              className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                            />
                            MA20
                          </span>
                          <p className="mt-1 pl-6 text-xs leading-5 text-slate-400">
                            최근 20개 봉 평균 가격으로 중단기 추세와 눌림/이탈 기준으로 자주 사용됩니다.
                          </p>
                        </label>
                        <label className="block rounded px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800">
                          <span className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={indicatorVisibility.ma60}
                              onChange={(event) =>
                                setIndicatorVisibility((prev) => ({
                                  ...prev,
                                  ma60: event.target.checked,
                                }))
                              }
                              className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                            />
                            MA60
                          </span>
                          <p className="mt-1 pl-6 text-xs leading-5 text-slate-400">
                            최근 60개 봉 평균 가격으로 더 큰 방향성(중기 추세)을 확인할 때 참고합니다.
                          </p>
                        </label>
                        <label className="block rounded px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800">
                          <span className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={indicatorVisibility.bollinger}
                              onChange={(event) =>
                                setIndicatorVisibility((prev) => ({
                                  ...prev,
                                  bollinger: event.target.checked,
                                }))
                              }
                              className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                            />
                            Bollinger(20,2)
                          </span>
                          <p className="mt-1 pl-6 text-xs leading-5 text-slate-400">
                            20기간 평균선 기준 표준편차 2배 상/하단 밴드로 변동성 확대/수축과 과열·과매도 구간을 봅니다.
                          </p>
                        </label>
                      </div>
                    </div>
                  </div>

                  {isKlineLoading && (
                    <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
                      <div className="h-[260px] animate-pulse rounded-md bg-slate-800/60 sm:h-[300px]" />
                      <div className="mt-2 flex flex-wrap gap-3">
                        <div className="h-4 w-16 animate-pulse rounded bg-slate-800/60" />
                        <div className="h-4 w-16 animate-pulse rounded bg-slate-800/60" />
                        <div className="h-4 w-16 animate-pulse rounded bg-slate-800/60" />
                        <div className="h-4 w-24 animate-pulse rounded bg-slate-800/60" />
                      </div>
                      <div className="mt-3 border-t border-slate-800 pt-3">
                        <div className="mb-2 h-4 w-14 animate-pulse rounded bg-slate-800/60" />
                        <div className="mb-3 h-[70px] animate-pulse rounded-md bg-slate-800/60 sm:h-[80px]" />
                        <div className="mb-2 h-4 w-12 animate-pulse rounded bg-slate-800/60" />
                        <div className="rounded-md border border-slate-800 bg-slate-900/70 p-2">
                          <div className="mb-2 h-3 w-40 animate-pulse rounded bg-slate-800/60" />
                          <div className="h-2 animate-pulse rounded-full bg-slate-800/70" />
                        </div>
                      </div>
                    </div>
                  )}
                  {klineError && <p className="text-sm text-red-300">{klineError}</p>}
                  {!isKlineLoading && !klineError && displayKlineData.length > 1 && (
                    <div className="min-w-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-950 p-3">
                      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-[260px] w-full sm:h-[300px]">
                        {yAxisTicks.map((tick, idx) => (
                          <g key={`tick-${idx}`}>
                            <line
                              x1={0}
                              y1={tick.y}
                              x2={CHART_PLOT_WIDTH}
                              y2={tick.y}
                              stroke="rgb(51 65 85 / 0.6)"
                              strokeWidth="1"
                              strokeDasharray="3 4"
                            />
                            <text
                              x={CHART_PLOT_WIDTH + 8}
                              y={Math.max(10, Math.min(CHART_HEIGHT - 4, tick.y - 4))}
                              textAnchor="start"
                              fontSize="10"
                              fill="rgb(148 163 184)"
                            >
                              {formatPrice(String(tick.value))}
                            </text>
                          </g>
                        ))}
                        {currentPriceY !== null && currentDisplayPrice !== null && (
                          <g>
                            <line
                              x1={0}
                              y1={currentPriceY}
                              x2={CHART_PLOT_WIDTH}
                              y2={currentPriceY}
                              stroke="rgb(248 113 113)"
                              strokeWidth="1.5"
                              strokeDasharray="2 2"
                              opacity="0.95"
                            />
                            <text
                              x={CHART_PLOT_WIDTH + 8}
                              y={Math.max(10, Math.min(CHART_HEIGHT - 4, currentPriceY - 4))}
                              textAnchor="start"
                              fontSize="10"
                              fontWeight="600"
                              fill="rgb(252 165 165)"
                            >
                              {formatPrice(String(currentDisplayPrice))}
                            </text>
                          </g>
                        )}
                        <line
                          x1={CHART_PLOT_WIDTH}
                          y1={0}
                          x2={CHART_PLOT_WIDTH}
                          y2={CHART_HEIGHT}
                          stroke="rgb(71 85 105 / 0.8)"
                          strokeWidth="1"
                        />
                        <path d={chartPath} fill="none" stroke="rgb(56 189 248)" strokeWidth="2.5" />
                        {indicatorVisibility.bollinger && bollingerPaths.upper && (
                          <path
                            d={bollingerPaths.upper}
                            fill="none"
                            stroke="rgb(192 132 252)"
                            strokeWidth="1.3"
                            strokeDasharray="4 4"
                            opacity="0.95"
                          />
                        )}
                        {indicatorVisibility.bollinger && bollingerPaths.lower && (
                          <path
                            d={bollingerPaths.lower}
                            fill="none"
                            stroke="rgb(192 132 252)"
                            strokeWidth="1.3"
                            strokeDasharray="4 4"
                            opacity="0.95"
                          />
                        )}
                        {visibleMaPaths.map((ma) =>
                          ma.d ? (
                            <path key={ma.period} d={ma.d} fill="none" stroke={ma.color} strokeWidth="1.7" opacity="0.95" />
                          ) : null,
                        )}
                      </svg>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-300">
                        {visibleMaPaths.map((ma) => (
                          <span key={`legend-${ma.period}`} className="inline-flex items-center gap-1.5">
                            <span className="inline-block h-1.5 w-4 rounded-full" style={{ backgroundColor: ma.color }} />
                            MA{ma.period}
                          </span>
                        ))}
                        {indicatorVisibility.bollinger && (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-block h-1.5 w-4 rounded-full bg-purple-300" />
                            Bollinger(20,2)
                          </span>
                        )}
                      </div>
                      <div className="mt-3 border-t border-slate-800 pt-3">
                        <p className="mb-2 text-xs text-slate-400">거래량</p>
                        <svg viewBox="0 0 640 80" className="mb-3 h-[70px] w-full sm:h-[80px]">
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
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCopyAiAnalysis}
                            className="rounded-md border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-400"
                          >
                            {isAiCopied ? "복사됨" : "복사하기"}
                          </button>
                          <button
                            type="button"
                            onClick={handleAnalyzeClick}
                            disabled={isAiLimitReached}
                            className="rounded-md bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-900/40 transition hover:brightness-110"
                          >
                            {isAiLimitReached ? "오늘 사용 한도 도달" : `${selectedIntervalLabel} 기준 다시 분석하기`}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {analysisSections.map((section, idx) => (
                          <section
                            key={`${section.title}-${idx}`}
                            className="rounded-none border-none bg-transparent p-0"
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
                                (() => {
                                  const line = item.trim();
                                  const bulletText = line.replace(/^[-•]\s+/, "");
                                  const isBullet = /^[-•]\s+/.test(line);
                                  const bulletLabelOnlyMatch = line.match(/^[-•]\s*([^:]{1,40}):\s*$/);
                                  const bulletLabelDescMatch = line.match(/^[-•]\s*([^:]{1,40}):\s+(.+)$/);
                                  const labelOnlyMatch = line.match(/^([^:]{1,40}):\s*$/);
                                  const labelDescMatch = line.match(/^([^:]{1,40}):\s+(.+)$/);

                                  if (bulletLabelOnlyMatch) {
                                    return (
                                      <p
                                        key={`${idx}-${itemIdx}`}
                                        className="mt-2 break-words pl-4 font-semibold text-sky-100"
                                      >
                                        {bulletLabelOnlyMatch[1]}
                                      </p>
                                    );
                                  }

                                  if (bulletLabelDescMatch) {
                                    return (
                                      <p
                                        key={`${idx}-${itemIdx}`}
                                        className="mt-2 break-words pl-6 text-slate-100"
                                      >
                                        <span className="mr-1 font-semibold text-sky-100">{bulletLabelDescMatch[1]}</span>
                                        <span className="mr-1 text-slate-300">•</span>
                                        <span>{bulletLabelDescMatch[2]}</span>
                                      </p>
                                    );
                                  }

                                  if (isBullet) {
                                    return (
                                      <p key={`${idx}-${itemIdx}`} className="break-words pl-7 text-slate-200">
                                        • {bulletText}
                                      </p>
                                    );
                                  }

                                  if (labelOnlyMatch) {
                                    return (
                                      <p key={`${idx}-${itemIdx}`} className="mt-2 break-words font-semibold text-sky-100">
                                        {labelOnlyMatch[1]}
                                      </p>
                                    );
                                  }

                                  if (labelDescMatch) {
                                    return (
                                      <p key={`${idx}-${itemIdx}`} className="break-words pl-2 text-slate-100">
                                        <span className="mr-1 font-medium text-slate-300">{labelDescMatch[1]}</span>
                                        <span>{labelDescMatch[2]}</span>
                                      </p>
                                    );
                                  }

                                  return (
                                    <p key={`${idx}-${itemIdx}`} className="break-words text-slate-100">
                                      {line}
                                    </p>
                                  );
                                })()
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

      <button
        type="button"
        aria-label="맨 위로 이동"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 text-white shadow-lg shadow-violet-900/40 transition-all duration-300 hover:brightness-110 ${
          showScrollTopButton ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
          <path
            d="M12 18V6M12 6l-5 5M12 6l5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center px-0 sm:items-center sm:px-4">
          <div className="relative w-full max-w-full overflow-hidden rounded-t-3xl border border-slate-700/80 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:max-w-sm sm:rounded-3xl">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-sky-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-fuchsia-500/10 blur-2xl" />
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-600/70 sm:hidden" />

            <button
              type="button"
              aria-label="로그인 모달 닫기"
              onClick={() => {
                setIsAuthModalOpen(false);
                setAuthError(null);
                setIsAuthLoading(false);
              }}
              className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full border border-slate-600/80 bg-slate-900/85 p-0 text-slate-300 leading-none transition hover:border-slate-400 hover:text-white"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" className="pointer-events-none h-4 w-4">
                <path
                  d="M5 5l10 10M15 5L5 15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="relative z-10">
              <h2 className="text-center text-2xl font-semibold tracking-tight text-white">Login</h2>
              <p className="mt-2 text-center text-sm leading-6 text-slate-300">
                지금 시작하고, AI 차트 분석과 포지션 인사이트를
                <br />
                무료로 가장 먼저 받아보세요.
              </p>

              {authError && (
                <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{authError}</p>
              )}

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isAuthLoading}
                className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                  <path
                    d="M21.35 12.2c0-.72-.06-1.25-.2-1.8H12v3.4h5.37c-.1.84-.66 2.1-1.9 2.95l-.02.11 2.76 2.13.19.02c1.73-1.6 2.95-3.95 2.95-6.81Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 21.7c2.63 0 4.84-.87 6.45-2.37l-3.08-2.38c-.83.58-1.95.99-3.37.99-2.57 0-4.74-1.69-5.52-4.02l-.11.01-2.86 2.22-.04.1C5.08 19.44 8.29 21.7 12 21.7Z"
                    fill="#34A853"
                  />
                  <path
                    d="M6.48 13.92A5.8 5.8 0 0 1 6.16 12c0-.67.11-1.32.3-1.92l-.01-.13-2.9-2.25-.09.04A9.72 9.72 0 0 0 2.3 12c0 1.55.37 3.02 1.15 4.26l3.03-2.34Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 6.06c1.8 0 3.01.78 3.7 1.44l2.7-2.63C16.83 3.4 14.63 2.3 12 2.3c-3.71 0-6.92 2.25-8.55 5.44l3 2.34C7.25 7.75 9.43 6.06 12 6.06Z"
                    fill="#EA4335"
                  />
                </svg>
                <span>{isAuthLoading ? "Google로 이동 중..." : "Google로 가입/로그인"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isNicknameModalOpen && (
        <div className="fixed inset-0 z-[320] flex items-end justify-center px-0 sm:items-center sm:px-4">
          <div className="relative w-full max-w-full overflow-hidden rounded-t-3xl border border-slate-700/80 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:max-w-sm sm:rounded-3xl">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-600/70 sm:hidden" />
            <p className="text-center text-lg font-extrabold tracking-wide text-sky-300 sm:text-xl">WELCOME!!</p>
            <p className="mt-2 text-center text-sm text-slate-300">
              가입을 환영합니다! 닉네임을 입력해 주세요
              <br />
              닉네임을 설정하지 않으면 구글 표시이름으로 세팅되며
              <br />
              마이페이에서 수정 가능합니다.
            </p>

            <div className="mt-5">
              <label htmlFor="welcome-nickname-input" className="mb-1 block text-xs text-slate-400">
                닉네임 설정
              </label>
              <input
                id="welcome-nickname-input"
                value={nicknameDraft}
                onChange={(event) => setNicknameDraft(event.target.value)}
                placeholder="닉네임 입력"
                maxLength={30}
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400"
              />
              {nicknameError && (
                <p className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{nicknameError}</p>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => saveUserNickname()}
                disabled={isNicknameSaving}
                className="rounded-lg bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isNicknameSaving ? "저장 중..." : "저장"}
              </button>
              <button
                type="button"
                onClick={() => saveUserNickname("")}
                disabled={isNicknameSaving}
                className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                건너뛰기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
