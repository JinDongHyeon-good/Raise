import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const CACHE_TTL_MS = 30 * 1000;

const requestBuckets = new Map<string, { count: number; windowStart: number }>();
const analysisCache = new Map<string, { analysis: string; model: string; expiresAt: number; warning?: string }>();

type CandleInput = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type GeminiModelsResponse = {
  models?: Array<{
    name?: string;
    supportedGenerationMethods?: string[];
  }>;
};

type GeminiGenerateResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

type AnalyzeRequestBody = {
  symbol: string;
  market: "spot" | "linear";
  interval: string;
  candles: CandleInput[];
};

function normalizeModelName(name: string) {
  return name.startsWith("models/") ? name.replace("models/", "") : name;
}

function sanitizePreferredModel(raw?: string) {
  if (!raw) return "gemini-3.1-pro-preview";
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, "");
  const normalized = normalizeModelName(trimmed);
  return normalized || "gemini-3.1-pro-preview";
}

function sanitizeApiKey(raw?: string) {
  if (!raw) return "";
  return raw.trim().replace(/^['"]|['"]$/g, "");
}

function isValidModelName(model: string) {
  return /^gemini[a-z0-9.-]*$/i.test(model);
}

function isAllowedOrigin(origin: string, host: string) {
  try {
    const originHost = new URL(origin).host.toLowerCase();
    const requestHost = host.toLowerCase();
    if (originHost === requestHost) return true;
    const normalize = (value: string) => value.replace(/^www\./, "");
    if (normalize(originHost) === normalize(requestHost)) return true;
    if (originHost.startsWith("localhost") && requestHost.startsWith("localhost")) return true;
    return false;
  } catch {
    return false;
  }
}

function isQuotaExceededError(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("quota exceeded") || lower.includes("rate limit") || lower.includes("resource_exhausted");
}

function parseRetryAfterSeconds(message: string) {
  const match = message.match(/retry in\s+([0-9.]+)s/i);
  if (!match) return null;
  const seconds = Math.ceil(Number(match[1]));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(clientKey: string) {
  const now = Date.now();
  const current = requestBuckets.get(clientKey);

  if (!current || now - current.windowStart >= RATE_LIMIT_WINDOW_MS) {
    requestBuckets.set(clientKey, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: current.windowStart + RATE_LIMIT_WINDOW_MS };
  }

  current.count += 1;
  requestBuckets.set(clientKey, current);
  return {
    allowed: true,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - current.count),
    resetAt: current.windowStart + RATE_LIMIT_WINDOW_MS,
  };
}

function validateBody(input: unknown): { ok: true; body: AnalyzeRequestBody } | { ok: false; message: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, message: "요청 본문 형식이 올바르지 않습니다." };
  }

  const body = input as Partial<AnalyzeRequestBody>;
  if (!body.symbol || typeof body.symbol !== "string" || !/^[A-Z0-9]{3,20}$/.test(body.symbol)) {
    return { ok: false, message: "symbol 형식이 올바르지 않습니다." };
  }
  if (body.market !== "spot" && body.market !== "linear") {
    return { ok: false, message: "market 값이 올바르지 않습니다." };
  }
  if (!body.interval || typeof body.interval !== "string" || body.interval.length > 6) {
    return { ok: false, message: "interval 값이 올바르지 않습니다." };
  }
  if (!Array.isArray(body.candles) || body.candles.length < 10 || body.candles.length > 240) {
    return { ok: false, message: "candles 개수는 10~240개여야 합니다." };
  }

  for (const candle of body.candles) {
    if (!candle || typeof candle !== "object") return { ok: false, message: "candles 데이터 형식이 올바르지 않습니다." };
    const values = [candle.timestamp, candle.open, candle.high, candle.low, candle.close, candle.volume];
    if (!values.every((value) => typeof value === "number" && Number.isFinite(value))) {
      return { ok: false, message: "candles 숫자 데이터가 올바르지 않습니다." };
    }
  }

  return { ok: true, body: body as AnalyzeRequestBody };
}

function getCacheKey(body: AnalyzeRequestBody) {
  const tail = body.candles.slice(-60);
  return JSON.stringify({
    s: body.symbol,
    m: body.market,
    i: body.interval,
    c: tail.map((item) => [item.timestamp, item.close, item.volume]),
  });
}

function cleanupCaches() {
  const now = Date.now();
  for (const [key, value] of analysisCache.entries()) {
    if (value.expiresAt <= now) analysisCache.delete(key);
  }
}

function calcSimpleMA(values: number[], period: number) {
  if (values.length < period) return null;
  const slice = values.slice(values.length - period);
  return slice.reduce((acc, cur) => acc + cur, 0) / period;
}

function calcRsi(values: number[], period = 14) {
  if (values.length < period + 1) return null;
  let gain = 0;
  let loss = 0;
  for (let i = values.length - period; i < values.length; i += 1) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gain += diff;
    else loss += Math.abs(diff);
  }
  if (loss === 0) return 100;
  const rs = gain / loss;
  return 100 - 100 / (1 + rs);
}

function calcEma(values: number[], period: number) {
  if (values.length < period) return null;
  const multiplier = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i += 1) {
    ema = (values[i] - ema) * multiplier + ema;
  }
  return ema;
}

function calcStdDev(values: number[]) {
  if (values.length === 0) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function calcAtr(highs: number[], lows: number[], closes: number[], period = 14) {
  if (highs.length < period + 1 || lows.length < period + 1 || closes.length < period + 1) return null;
  const trueRanges: number[] = [];
  for (let i = 1; i < highs.length; i += 1) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1]),
    );
    trueRanges.push(tr);
  }
  const recent = trueRanges.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / period;
}

function calcStoch(highs: number[], lows: number[], closes: number[], period = 14) {
  if (highs.length < period || lows.length < period || closes.length < period) return null;
  const recentHigh = Math.max(...highs.slice(-period));
  const recentLow = Math.min(...lows.slice(-period));
  const lastClose = closes[closes.length - 1];
  if (recentHigh === recentLow) return 50;
  return ((lastClose - recentLow) / (recentHigh - recentLow)) * 100;
}

function isCompleteAnalysis(text: string, market: "spot" | "linear") {
  if (!text || text.length < 120) return false;
  if (market === "linear") {
    return text.includes("7) 현재 캔들 기준 한줄 결론");
  }
  return text.includes("5) 현재 캔들 기준 한줄 결론");
}

async function listGenerateModels(apiKey: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) return [];

  const data = (await response.json()) as GeminiModelsResponse;
  const available = (data.models ?? [])
    .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
    .map((model) => normalizeModelName(model.name ?? ""))
    .filter(Boolean);

  // pro 우선, 그다음 flash 우선 정렬
  return available.sort((a, b) => {
    const score = (model: string) => {
      if (model.includes("pro")) return 0;
      if (model.includes("flash")) return 1;
      return 2;
    };
    return score(a) - score(b);
  });
}

export async function POST(request: NextRequest) {
  try {
    if (process.env.AI_ANALYSIS_ENABLED?.toLowerCase() === "false") {
      return NextResponse.json({ error: "현재 AI 분석 기능이 비활성화되어 있습니다." }, { status: 503 });
    }

    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && !isAllowedOrigin(origin, host)) {
      return NextResponse.json({ error: "허용되지 않은 요청 출처입니다." }, { status: 403 });
    }

    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
          },
        },
      );
    }

    const apiKey = sanitizeApiKey(process.env.GEMINI_API_KEY);
    const preferredModel = sanitizePreferredModel(process.env.GEMINI_MODEL);
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const parsedBody = validateBody(await request.json());
    if (!parsedBody.ok) {
      return NextResponse.json({ error: parsedBody.message }, { status: 400 });
    }
    const body = parsedBody.body;

    cleanupCaches();
    const cacheKey = getCacheKey(body);
    const cached = analysisCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(
        { analysis: cached.analysis, model: cached.model, warning: cached.warning, cached: true },
        {
          headers: {
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
          },
        },
      );
    }

    console.log("[gemini-analysis] request received", {
      symbol: body.symbol,
      market: body.market,
      interval: body.interval,
      candles: Array.isArray(body.candles) ? body.candles.length : 0,
    });

    const candles = body.candles.slice(-180);
    const closes = candles.map((c) => c.close);
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const volumes = candles.map((c) => c.volume);
    const lastClose = closes[closes.length - 1];
    const prevClose = closes[closes.length - 2] ?? lastClose;
    const changePct = prevClose ? ((lastClose - prevClose) / prevClose) * 100 : 0;
    const recentHigh = Math.max(...highs.slice(-20));
    const recentLow = Math.min(...lows.slice(-20));
    const ma5 = calcSimpleMA(closes, 5);
    const ma20 = calcSimpleMA(closes, 20);
    const ma60 = calcSimpleMA(closes, 60);
    const avgVol20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(20, volumes.length));
    const lastVol = volumes[volumes.length - 1] ?? 0;
    const volRatio = avgVol20 > 0 ? lastVol / avgVol20 : 0;
    const rsi14 = calcRsi(closes, 14);
    const ema12 = calcEma(closes, 12);
    const ema26 = calcEma(closes, 26);
    const macd = ema12 !== null && ema26 !== null ? ema12 - ema26 : null;
    const macdSignalApprox = macd !== null ? calcEma(closes.slice(-35).map((_, i, arr) => {
      const start = Math.max(0, i - 25);
      const sub = arr.slice(start, i + 1);
      const e12 = calcEma(sub, 12);
      const e26 = calcEma(sub, 26);
      return e12 !== null && e26 !== null ? e12 - e26 : 0;
    }), 9) : null;
    const bbBasis20 = ma20;
    const bbStd20 = calcStdDev(closes.slice(-20));
    const bbUpper20 = bbBasis20 !== null && bbStd20 !== null ? bbBasis20 + bbStd20 * 2 : null;
    const bbLower20 = bbBasis20 !== null && bbStd20 !== null ? bbBasis20 - bbStd20 * 2 : null;
    const atr14 = calcAtr(highs, lows, closes, 14);
    const stochK14 = calcStoch(highs, lows, closes, 14);

    const basePrompt = [
      "너는 15년 경력의 최상위 크립토 트레이더이자 테크니컬 애널리스트다.",
      "반드시 현재 제공된 캔들 데이터만 근거로 분석하고, 추측/과장/허위 사실을 금지한다.",
      "문체: 한국어, 전문적이고 단호하게, 핵심만.",
      "차트 리포트처럼 읽기 쉽게 섹션별로 분리해 작성한다.",
      "",
      "[공통 규칙]",
      "- 숫자(가격/퍼센트/지표값)를 최대한 활용",
      "- 불확실한 내용은 '데이터상 확인 어려움'으로 명시",
      "- 사실 근거 없는 단정 금지",
      "- 답변은 반드시 모든 섹션을 완성해서 끝내고, 중간에 끊긴 문장을 남기지 말 것",
    ];

    const spotPrompt = [
      "[시장별 지침: 현물]",
      "- 투자 권유 금지. 관찰 기반 분석만 작성",
      "",
      "[출력 형식 - 정확히 이 순서]",
      "1) 현재 차트 진단",
      "- 추세 상태(상승/하락/횡보)와 근거 2개",
      "- 현재 위치(단기 고점권/중립/저점권 등) 1줄",
      "2) 핵심 레벨",
      "- 저항 2개 + 이유",
      "- 지지 2개 + 이유",
      "3) 지표 컨플루언스 해석",
      "- MA/RSI/MACD/볼린저/거래량 관점에서 같은 방향 신호와 상충 신호를 분리",
      "4) 시나리오 플랜",
      "- 상방 시나리오: 트리거/확인/무효",
      "- 하방 시나리오: 트리거/확인/무효",
      "5) 현재 캔들 기준 한줄 결론",
    ];

    const linearPrompt = [
      "[시장별 지침: 선물]",
      "- 롱/숏 관점 분석을 반드시 포함",
      "- 단, 과도한 확정 표현은 금지하고 조건부로 서술",
      "",
      "[출력 형식 - 정확히 이 순서]",
      "1) 현재 차트 진단",
      "- 추세 상태(상승/하락/횡보)와 근거 2개",
      "- 현재 위치(추세 초입/추세 중반/과열/과매도) 1줄",
      "2) 핵심 레벨",
      "- 저항 2개 + 이유",
      "- 지지 2개 + 이유",
      "3) 지표 컨플루언스 해석",
      "- MA/RSI/MACD/볼린저/ATR/거래량 관점에서 롱 우위 근거와 숏 우위 근거를 분리",
      "4) 롱/숏 전략 관점",
      "- 롱 아이디어: 진입 트리거, 무효 가격, 1차 목표",
      "- 숏 아이디어: 진입 트리거, 무효 가격, 1차 목표",
      "- 현재 우세 포지션: 롱/숏/관망 중 하나 + 근거 2개",
      "5) 확률 평가 (현재 선택 기간봉 기준)",
      "- 롱 확률: XX% + 근거 2개",
      "- 숏 확률: XX% + 근거 2개",
      "- 확률 산정 시 불확실성 요인 1개 명시",
      "6) 리스크 관리 메모",
      "- 변동성/휩쏘/뉴스 리스크 포함 1~2줄",
      "7) 현재 캔들 기준 한줄 결론",
    ];

    const compactCandles = candles.slice(-80).map((c) => ({
      t: c.timestamp,
      o: Number(c.open.toFixed(4)),
      h: Number(c.high.toFixed(4)),
      l: Number(c.low.toFixed(4)),
      c: Number(c.close.toFixed(4)),
      v: Number(c.volume.toFixed(4)),
    }));

    const prompt = [
      ...basePrompt,
      "",
      ...(body.market === "linear" ? linearPrompt : spotPrompt),
      "",
      `시장: ${body.market === "spot" ? "현물" : "선물"}`,
      `심볼: ${body.symbol}`,
      `간격: ${body.interval}`,
      `현재가(last close): ${lastClose}`,
      `직전 대비 변화율(%): ${changePct.toFixed(2)}`,
      `최근 20봉 고가/저가: ${recentHigh} / ${recentLow}`,
      `MA5/MA20/MA60: ${ma5 ?? "N/A"} / ${ma20 ?? "N/A"} / ${ma60 ?? "N/A"}`,
      `EMA12/EMA26: ${ema12 ?? "N/A"} / ${ema26 ?? "N/A"}`,
      `MACD(EMA12-EMA26): ${macd ?? "N/A"}`,
      `MACD Signal(approx): ${macdSignalApprox ?? "N/A"}`,
      `RSI14: ${rsi14 ?? "N/A"}`,
      `Stochastic %K(14): ${stochK14 ?? "N/A"}`,
      `Bollinger20 Upper/Basis/Lower: ${bbUpper20 ?? "N/A"} / ${bbBasis20 ?? "N/A"} / ${bbLower20 ?? "N/A"}`,
      `ATR14: ${atr14 ?? "N/A"}`,
      `현재 거래량 / 20평균 비율: ${volRatio.toFixed(2)}x`,
      `최근 캔들 JSON(최신 80봉, 압축): ${JSON.stringify(compactCandles)}`,
    ].join("\n");

    const discovered = await listGenerateModels(apiKey);
    const candidateModels = Array.from(new Set([preferredModel, ...discovered]))
      .map((item) => item.trim())
      .filter(Boolean)
      .filter(isValidModelName);
    if (candidateModels.length === 0) {
      candidateModels.push("gemini-3.1-pro-preview");
    }
    console.log("[gemini-analysis] model candidates", candidateModels);

    let lastErrorMessage = "Gemini 요청 실패";
    for (const model of candidateModels) {
      console.log("[gemini-analysis] trying model", model);
      let analysis = "";

      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const attemptPrompt =
          attempt === 1
            ? prompt
            : [
                prompt,
                "",
                "[재요청 지시]",
                "직전 응답이 중간에 잘렸다. 번호 섹션을 빠짐없이 끝까지 완성해서 다시 작성해라.",
              ].join("\n");

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: attemptPrompt }] }],
              generationConfig: {
                temperature: 0.35,
                topP: 0.9,
                maxOutputTokens: 2200,
              },
            }),
          },
        );

        const data = (await response.json()) as GeminiGenerateResponse;

        if (!response.ok) {
          lastErrorMessage = data.error?.message || `Gemini 요청 실패 (${model})`;
          console.error("[gemini-analysis] model failed", { model, attempt, error: lastErrorMessage });
          if (isQuotaExceededError(lastErrorMessage)) {
            const retryAfter = parseRetryAfterSeconds(lastErrorMessage) ?? 10;
            return NextResponse.json(
              {
                error: `Gemini 쿼터가 초과되었습니다. 약 ${retryAfter}초 후 다시 시도해 주세요.`,
                code: "quota_exceeded",
              },
              {
                status: 429,
                headers: {
                  "Retry-After": String(retryAfter),
                },
              },
            );
          }
          break;
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!text) {
          lastErrorMessage = `Gemini 응답이 비어 있습니다. (${model})`;
          console.error("[gemini-analysis] empty response", { model, attempt });
          continue;
        }

        analysis = text;
        if (isCompleteAnalysis(text, body.market)) {
          console.log("[gemini-analysis] success", { model, attempt, length: analysis.length });
          analysisCache.set(cacheKey, { analysis, model, expiresAt: Date.now() + CACHE_TTL_MS });
          return NextResponse.json(
            { analysis, model },
            {
              headers: {
                "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
                "X-RateLimit-Remaining": String(rateLimit.remaining),
                "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
              },
            },
          );
        }

        console.warn("[gemini-analysis] incomplete response, retrying", { model, attempt, length: text.length });
      }

      if (analysis) {
        // 완전하지 않더라도 마지막으로 받은 분석을 반환하여 빈 화면을 방지
        analysisCache.set(cacheKey, { analysis, model, warning: "partial_response", expiresAt: Date.now() + CACHE_TTL_MS });
        return NextResponse.json(
          { analysis, model, warning: "partial_response" },
          {
            headers: {
              "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
              "X-RateLimit-Remaining": String(rateLimit.remaining),
              "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
            },
          },
        );
      }
    }

    console.error("[gemini-analysis] all models failed", { lastErrorMessage });
    return NextResponse.json({ error: lastErrorMessage }, { status: 502 });
  } catch (error) {
    console.error("[gemini-analysis] unexpected error", error);
    return NextResponse.json({ error: "Gemini 분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
