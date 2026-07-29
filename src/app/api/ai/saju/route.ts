import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase-server";
import { isAppLocale } from "@/i18n/routing";
import { computeSaju, type CalendarType, type SajuChart, type SajuInput } from "@/lib/saju/engine";
import { isLunarYearSupported } from "@/lib/saju/lunar";
import {
  buildCompatibilityPrompt,
  buildDailyPrompt,
  buildNatalPrompt,
  type ReadingKind,
} from "@/lib/saju/prompt";
import {
  callGeminiGenerateContent,
  isRetryableGeminiError,
  parseRetryAfterSeconds,
} from "@/lib/gemini-fetch";
import { getGeminiModelChain, MAX_MODEL_ATTEMPTS, modelForAttempt } from "@/lib/gemini-models";
import {
  SlidingRateLimiter,
  acquireInFlightLock,
  pruneStaleLocks,
  releaseInFlightLock,
} from "@/lib/sliding-rate-limit";

export const runtime = "nodejs";
export const maxDuration = 120;

const IP_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const IP_RATE_LIMIT_MAX = 20;
const IN_FLIGHT_TTL_MS = 110 * 1000;

const GEMINI_HTTP_TIMEOUT_MS = 42_000;
const GEMINI_TOTAL_BUDGET_MS = 100_000;
const MAX_OUTPUT_TOKENS = 4096;
const MAX_ATTEMPTS = MAX_MODEL_ATTEMPTS;

const ipRateLimiter = new SlidingRateLimiter(IP_RATE_LIMIT_MAX, IP_RATE_LIMIT_WINDOW_MS);

type PersonInput = {
  name?: string;
  gender?: "male" | "female" | "unknown";
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  calendar: CalendarType;
  isLeapMonth?: boolean;
  timeKnown: boolean;
};

function sanitizeApiKey(raw?: string) {
  if (!raw) return "";
  return raw.trim().replace(/^['"]|['"]$/g, "");
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
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

function rateLimitHeaders(limit: number, remaining: number, resetAt: number) {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
  };
}

function isInt(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && Number.isInteger(v);
}

function validatePerson(input: unknown): { ok: true; value: PersonInput } | { ok: false; message: string } {
  if (!input || typeof input !== "object") return { ok: false, message: "생년월일 정보를 입력해 주세요." };
  const p = input as Record<string, unknown>;

  const calendar: CalendarType = p.calendar === "lunar" ? "lunar" : "solar";
  const timeKnown = p.timeKnown !== false;

  if (!isInt(p.year) || p.year < 1900 || p.year > 2100) {
    return { ok: false, message: "태어난 연도는 1900~2100 사이여야 합니다." };
  }
  if (!isInt(p.month) || p.month < 1 || p.month > 12) {
    return { ok: false, message: "태어난 월이 올바르지 않습니다." };
  }
  if (!isInt(p.day) || p.day < 1 || p.day > 31) {
    return { ok: false, message: "태어난 일이 올바르지 않습니다." };
  }
  if (calendar === "lunar" && !isLunarYearSupported(p.year)) {
    return { ok: false, message: "음력은 1900~2100년만 지원합니다." };
  }

  let hour: number | undefined;
  let minute: number | undefined;
  if (timeKnown) {
    if (!isInt(p.hour) || (p.hour as number) < 0 || (p.hour as number) > 23) {
      return { ok: false, message: "태어난 시(0~23)가 올바르지 않습니다." };
    }
    hour = p.hour as number;
    minute = isInt(p.minute) && (p.minute as number) >= 0 && (p.minute as number) <= 59 ? (p.minute as number) : 0;
  }

  const gender = p.gender === "male" || p.gender === "female" ? p.gender : "unknown";
  const name = typeof p.name === "string" ? p.name.trim().slice(0, 40) : undefined;

  return {
    ok: true,
    value: {
      name: name || undefined,
      gender,
      year: p.year,
      month: p.month,
      day: p.day,
      hour,
      minute,
      calendar,
      isLeapMonth: p.isLeapMonth === true,
      timeKnown,
    },
  };
}

function toSajuInput(p: PersonInput): SajuInput {
  return {
    year: p.year,
    month: p.month,
    day: p.day,
    hour: p.hour,
    minute: p.minute,
    calendar: p.calendar,
    isLeapMonth: p.isLeapMonth,
    timeKnown: p.timeKnown,
  };
}

/** KST 기준 오늘 날짜 YYYY-MM-DD */
function todayInKst(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function stripEndMarker(text: string) {
  return text.replace(/\n?\[END\]\s*$/g, "").replace(/\[END\]/g, "").trim();
}

async function generateReading(apiKey: string, prompt: string) {
  const startedAt = Date.now();
  const deadlineAt = startedAt + GEMINI_TOTAL_BUDGET_MS;
  const modelChain = getGeminiModelChain();
  let accumulated = "";
  let lastError = "AI 해석 요청에 실패했습니다.";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const elapsed = Date.now() - startedAt;
    if (elapsed > GEMINI_TOTAL_BUDGET_MS) break;
    const remaining = GEMINI_TOTAL_BUDGET_MS - elapsed;
    const timeoutMs = Math.max(12_000, Math.min(GEMINI_HTTP_TIMEOUT_MS, remaining - 2000));
    const model = modelForAttempt(modelChain, attempt);

    const attemptPrompt =
      attempt > 1 && accumulated
        ? `${prompt}\n\n지금까지 작성된 내용입니다. 잘린 부분부터 이어서 끝까지 완성하세요(반복 금지):\n"""\n${accumulated.slice(-1500)}\n"""`
        : prompt;

    try {
      const result = await callGeminiGenerateContent({
        apiKey,
        model,
        prompt: attemptPrompt,
        timeoutMs,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: 0.7,
        maxHttpRetries: 2,
        deadlineAt,
      });

      if (!result.ok) {
        lastError = result.error;
        const retryAfter = parseRetryAfterSeconds(result.error);
        const quotaLike =
          result.response.status === 429 ||
          result.error.toLowerCase().includes("quota") ||
          result.error.toLowerCase().includes("resource_exhausted");
        if (quotaLike) {
          return {
            ok: false as const,
            error: `AI 사용량이 일시적으로 많습니다. ${retryAfter ?? 10}초 후 다시 시도해 주세요.`,
            code: "quota_exceeded" as const,
            status: 429,
            retryAfter: retryAfter ?? 10,
          };
        }
        // 모델 오류는 종류를 가리지 않고 남은 시도만큼 재시도한다.
        // (모델 은퇴 404처럼 재시도 불가로 분류되는 오류도 폴백 모델에서는 성공할 수 있다)
        console.warn("[saju] gemini error", {
          attempt,
          model,
          status: result.response.status,
          error: result.error,
        });
        if (attempt < MAX_ATTEMPTS) continue;
        return {
          ok: false as const,
          error: lastError,
          code: "gemini_error" as const,
          status: isRetryableGeminiError(result.response.status, result.error) ? 504 : 502,
        };
      }

      if (result.text) {
        accumulated = accumulated
          ? `${accumulated}${result.text.startsWith(accumulated.slice(-30)) ? "" : "\n"}${result.text}`.trim()
          : result.text.trim();
      }

      const truncated = result.finishReason === "MAX_TOKENS";
      if (accumulated.length >= 400 && !truncated) {
        return { ok: true as const, reading: stripEndMarker(accumulated), model };
      }
      if (!truncated && accumulated.length >= 200) {
        return { ok: true as const, reading: stripEndMarker(accumulated), model };
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        lastError = "AI 응답 시간이 초과되었습니다.";
        if (attempt < MAX_ATTEMPTS) continue;
        return { ok: false as const, error: lastError, code: "timeout" as const, status: 504 };
      }
      throw error;
    }
  }

  if (accumulated.trim().length >= 200) {
    return {
      ok: true as const,
      reading: stripEndMarker(accumulated),
      model: modelForAttempt(modelChain, MAX_ATTEMPTS),
    };
  }

  return {
    ok: false as const,
    error: lastError || "AI 해석이 완성되지 못했습니다. 잠시 후 다시 시도해 주세요.",
    code: "incomplete" as const,
    status: 504,
  };
}

/** 명식에서 UI로 내보낼 안전한 요약 */
function serializeChart(chart: SajuChart) {
  return {
    solar: chart.solar,
    calendar: chart.input.calendar,
    timeKnown: chart.input.timeKnown,
    pillars: chart.pillars,
    dayMaster: chart.dayMaster,
    zodiac: chart.zodiac,
    elementCounts: chart.elementCounts,
    dominantElements: chart.dominantElements,
    lackingElements: chart.lackingElements,
  };
}

export async function POST(request: NextRequest) {
  let inFlightKey: string | null = null;
  let inFlightToken: string | null = null;

  try {
    pruneStaleLocks();
    ipRateLimiter.prune();

    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && !isAllowedOrigin(origin, host)) {
      return NextResponse.json({ error: "허용되지 않은 요청 출처입니다." }, { status: 403 });
    }

    const supabase = await createSupabaseRouteHandlerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "로그인이 필요합니다.", code: "auth_required" }, { status: 401 });
    }

    const clientIp = getClientIp(request);
    const ipRateLimit = ipRateLimiter.check(clientIp);
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", code: "ip_rate_limit" },
        {
          status: 429,
          headers: {
            ...rateLimitHeaders(IP_RATE_LIMIT_MAX, ipRateLimit.remaining, ipRateLimit.resetAt),
            "Retry-After": String(Math.ceil((ipRateLimit.resetAt - Date.now()) / 1000)),
          },
        },
      );
    }

    const raw = (await request.json()) as Record<string, unknown>;
    const kind = raw.kind as ReadingKind;
    if (kind !== "daily" && kind !== "natal" && kind !== "compatibility") {
      return NextResponse.json({ error: "요청 종류가 올바르지 않습니다." }, { status: 400 });
    }
    const locale = isAppLocale(typeof raw.locale === "string" ? raw.locale : undefined)
      ? (raw.locale as string)
      : "ko";
    void locale;

    const apiKey = sanitizeApiKey(process.env.GEMINI_API_KEY);
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    let prompt: string;
    let chartsPayload: unknown;

    if (kind === "compatibility") {
      const va = validatePerson(raw.personA);
      if (!va.ok) return NextResponse.json({ error: va.message }, { status: 400 });
      const vb = validatePerson(raw.personB);
      if (!vb.ok) return NextResponse.json({ error: vb.message }, { status: 400 });

      let chartA: SajuChart;
      let chartB: SajuChart;
      try {
        chartA = computeSaju(toSajuInput(va.value));
        chartB = computeSaju(toSajuInput(vb.value));
      } catch {
        return NextResponse.json({ error: "사주 계산에 실패했습니다. 입력을 확인해 주세요." }, { status: 400 });
      }
      prompt = buildCompatibilityPrompt(chartA, chartB, {
        nameA: va.value.name,
        genderA: va.value.gender,
        nameB: vb.value.name,
        genderB: vb.value.gender,
      });
      chartsPayload = { chartA: serializeChart(chartA), chartB: serializeChart(chartB) };
    } else {
      const v = validatePerson(raw.person);
      if (!v.ok) return NextResponse.json({ error: v.message }, { status: 400 });
      let chart: SajuChart;
      try {
        chart = computeSaju(toSajuInput(v.value));
      } catch {
        return NextResponse.json({ error: "사주 계산에 실패했습니다. 입력을 확인해 주세요." }, { status: 400 });
      }
      prompt =
        kind === "daily"
          ? buildDailyPrompt(chart, todayInKst(), { name: v.value.name, gender: v.value.gender })
          : buildNatalPrompt(chart, { name: v.value.name, gender: v.value.gender });
      chartsPayload = { chart: serializeChart(chart), today: kind === "daily" ? todayInKst() : undefined };
    }

    inFlightKey = `saju:${user.id}`;
    const token = acquireInFlightLock(inFlightKey, IN_FLIGHT_TTL_MS);
    if (!token) {
      return NextResponse.json(
        { error: "이미 해석이 진행 중입니다. 잠시만 기다려 주세요.", code: "in_flight" },
        { status: 409 },
      );
    }
    inFlightToken = token;

    const result = await generateReading(apiKey, prompt);

    if (!result.ok) {
      const headers: Record<string, string> = {
        ...rateLimitHeaders(IP_RATE_LIMIT_MAX, ipRateLimit.remaining, ipRateLimit.resetAt),
      };
      if (result.code === "quota_exceeded" && result.retryAfter) {
        headers["Retry-After"] = String(result.retryAfter);
      }
      return NextResponse.json({ error: result.error, code: result.code }, { status: result.status ?? 502, headers });
    }

    return NextResponse.json(
      { kind, reading: result.reading, model: result.model, ...(chartsPayload as object) },
      { headers: rateLimitHeaders(IP_RATE_LIMIT_MAX, ipRateLimit.remaining, ipRateLimit.resetAt) },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.", code: "timeout" },
        { status: 504 },
      );
    }
    console.error("[saju] unexpected error", error);
    return NextResponse.json({ error: "사주 해석 중 오류가 발생했습니다." }, { status: 500 });
  } finally {
    if (inFlightKey && inFlightToken) {
      releaseInFlightLock(inFlightKey, inFlightToken);
    }
  }
}
