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
  isRetryableGeminiError,
  openGeminiGenerateContentStream,
  parseRetryAfterSeconds,
  readGeminiTextDeltas,
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

type OpenStreamFailure = {
  ok: false;
  error: string;
  code: "quota_exceeded" | "gemini_error" | "timeout";
  status: number;
  retryAfter?: number;
};

/**
 * 모델 체인을 순서대로 시도해 SSE 연결이 열리는 첫 모델을 찾는다.
 * 이 시점까지는 클라이언트에 아직 응답을 시작하지 않았으므로(첫 바이트 미전송),
 * 실패 시 지금까지처럼 평범한 JSON 에러 응답으로 되돌아갈 수 있다.
 */
async function openFirstAvailableStream(
  apiKey: string,
  prompt: string,
  deadlineAt: number,
): Promise<{ ok: true; model: string; body: ReadableStream<Uint8Array> } | OpenStreamFailure> {
  const modelChain = getGeminiModelChain();
  let lastError = "AI 해석 요청에 실패했습니다.";
  let lastStatus = 502;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const remaining = deadlineAt - Date.now();
    if (remaining < 12_000) break;
    const model = modelForAttempt(modelChain, attempt);
    const timeoutMs = Math.max(12_000, Math.min(GEMINI_HTTP_TIMEOUT_MS, remaining - 2000));

    const opened = await openGeminiGenerateContentStream({
      apiKey,
      model,
      prompt,
      timeoutMs,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.7,
    });

    if (opened.ok) return { ok: true, model, body: opened.body };

    lastError = opened.error;
    lastStatus = opened.status;
    const retryAfter = parseRetryAfterSeconds(opened.error);
    const quotaLike =
      opened.status === 429 ||
      opened.error.toLowerCase().includes("quota") ||
      opened.error.toLowerCase().includes("resource_exhausted");
    if (quotaLike) {
      return {
        ok: false,
        error: `AI 사용량이 일시적으로 많습니다. ${retryAfter ?? 10}초 후 다시 시도해 주세요.`,
        code: "quota_exceeded",
        status: 429,
        retryAfter: retryAfter ?? 10,
      };
    }
    // 모델 오류는 종류를 가리지 않고 남은 모델로 폴백한다 (모델 은퇴 404 등도 다른 모델에선 성공 가능).
    console.warn("[saju] gemini stream open error", { attempt, model, status: opened.status, error: opened.error });
  }

  return {
    ok: false,
    error: lastError,
    code: isRetryableGeminiError(lastStatus, lastError) ? "timeout" : "gemini_error",
    status: isRetryableGeminiError(lastStatus, lastError) ? 504 : 502,
  };
}

const TEXT_ENCODER = new TextEncoder();
/** 스트림 맨 끝에서만 나타나는 [END] 마커가 화면에 잠깐 비치지 않도록, 꼬리 일부를 항상 붙들고 있다가 마지막에 정리해서 내보낸다. */
const END_MARKER_HOLDBACK = 12;

function stripEndMarker(text: string) {
  return text.replace(/\n?\[END\]\s*$/g, "").replace(/\[END\]/g, "");
}

/**
 * 첫 모델 스트림이 이미 열린 상태에서 시작해, 응답이 짧거나(MAX_TOKENS로 잘림) 부족하면
 * 같은 모델로 이어쓰기 요청을 추가로 열어가며 하나의 outgoing 스트림으로 계속 이어 붙인다.
 * 이 단계부터는 이미 클라이언트로 바이트가 나가고 있으므로, 실패해도 지금까지 받은 내용으로 마무리한다.
 */
function buildReadingStream(
  apiKey: string,
  originalPrompt: string,
  firstModel: string,
  firstBody: ReadableStream<Uint8Array>,
  deadlineAt: number,
  meta: Record<string, unknown>,
  onDone: () => void,
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await streamReadingBody(apiKey, originalPrompt, firstModel, firstBody, deadlineAt, meta, controller);
      } finally {
        onDone();
      }
      controller.close();
    },
  });
}

async function streamReadingBody(
  apiKey: string,
  originalPrompt: string,
  firstModel: string,
  firstBody: ReadableStream<Uint8Array>,
  deadlineAt: number,
  meta: Record<string, unknown>,
  controller: ReadableStreamDefaultController<Uint8Array>,
) {
  controller.enqueue(TEXT_ENCODER.encode(`${JSON.stringify(meta)}\n`));

  let accumulated = "";
  let holdback = "";
  let body: ReadableStream<Uint8Array> | null = firstBody;
  let rounds = 0;

  const flush = (text: string) => {
    if (!text) return;
    holdback += text;
    if (holdback.length <= END_MARKER_HOLDBACK) return;
    const releasable = holdback.slice(0, holdback.length - END_MARKER_HOLDBACK);
    holdback = holdback.slice(holdback.length - END_MARKER_HOLDBACK);
    if (releasable) controller.enqueue(TEXT_ENCODER.encode(releasable));
  };

  while (body && rounds < MAX_ATTEMPTS + 2) {
    rounds += 1;
    let truncated = false;
    try {
      for await (const chunk of readGeminiTextDeltas(body)) {
        if (chunk.text) {
          accumulated += chunk.text;
          flush(chunk.text);
        }
        if (chunk.finishReason === "MAX_TOKENS") truncated = true;
      }
    } catch (error) {
      console.error("[saju] stream relay error", error);
      break;
    }

    if (accumulated.trim().length >= 200 && !truncated) break;

    const remaining = deadlineAt - Date.now();
    if (remaining < 12_000) break;

    const continuationPrompt = `${originalPrompt}\n\n지금까지 작성된 내용입니다. 잘린 부분부터 이어서 끝까지 완성하세요(반복 금지):\n"""\n${accumulated.slice(-1500)}\n"""`;
    const timeoutMs = Math.max(12_000, Math.min(GEMINI_HTTP_TIMEOUT_MS, remaining - 2000));
    const next = await openGeminiGenerateContentStream({
      apiKey,
      model: firstModel,
      prompt: continuationPrompt,
      timeoutMs,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.7,
    });
    body = next.ok ? next.body : null;
  }

  const tail = stripEndMarker(holdback);
  if (tail) controller.enqueue(TEXT_ENCODER.encode(tail));
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

    const deadlineAt = Date.now() + GEMINI_TOTAL_BUDGET_MS;
    const opened = await openFirstAvailableStream(apiKey, prompt, deadlineAt);

    if (!opened.ok) {
      const headers: Record<string, string> = {
        ...rateLimitHeaders(IP_RATE_LIMIT_MAX, ipRateLimit.remaining, ipRateLimit.resetAt),
      };
      if (opened.code === "quota_exceeded" && opened.retryAfter) {
        headers["Retry-After"] = String(opened.retryAfter);
      }
      return NextResponse.json({ error: opened.error, code: opened.code }, { status: opened.status, headers });
    }

    // 이 시점부터 응답 스트리밍이 실제로 시작된다. in-flight 락은 스트림이 끝날 때(성공/실패 무관) 풀어야
    // 하므로, 아래 finally에서 곧바로 풀리지 않도록 소유권을 스트림 쪽으로 넘긴다.
    const lockKey = inFlightKey;
    const lockToken = inFlightToken;
    inFlightKey = null;
    inFlightToken = null;

    const meta = { kind, model: opened.model, ...(chartsPayload as object) };
    const stream = buildReadingStream(apiKey, prompt, opened.model, opened.body, deadlineAt, meta, () => {
      if (lockKey && lockToken) releaseInFlightLock(lockKey, lockToken);
    });

    return new NextResponse(stream, {
      headers: {
        ...rateLimitHeaders(IP_RATE_LIMIT_MAX, ipRateLimit.remaining, ipRateLimit.resetAt),
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
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
