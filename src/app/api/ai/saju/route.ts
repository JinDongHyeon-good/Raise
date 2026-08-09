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
  openGeminiGenerateContentStream,
  parseRetryAfterSeconds,
  readGeminiTextDeltas,
} from "@/lib/gemini-fetch";
import { getGeminiModelChain, MAX_MODEL_ATTEMPTS, modelForAttempt } from "@/lib/gemini-models";
import { getRelayConfig, signRelayToken } from "@/lib/ai-relay-token";
import {
  SlidingRateLimiter,
  acquireInFlightLock,
  pruneStaleLocks,
  releaseInFlightLock,
} from "@/lib/sliding-rate-limit";

export const runtime = "nodejs";
/**
 * Amplify Hosting은 SSR/API 응답을 30초에서 강제로 끊는다(조정 불가, maxDuration은 Vercel 전용이라
 * 여기선 무시된다). 그래서 이 라우트는 인증·명식 계산·프롬프트 생성까지만 하고 1초 안에 끝낸다.
 * 실제로 오래 걸리는 Gemini 호출은 supabase/functions/saju-stream 으로 넘긴다.
 */
export const maxDuration = 30;

const IP_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const IP_RATE_LIMIT_MAX = 20;
const USER_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const USER_RATE_LIMIT_MAX = 6;
const IN_FLIGHT_TTL_MS = 110 * 1000;

const GEMINI_HTTP_TIMEOUT_MS = 75_000;
const GEMINI_TOTAL_BUDGET_MS = 110_000;
const MAX_OUTPUT_TOKENS = 4096;
const TEMPERATURE = 0.7;
const MAX_ATTEMPTS = MAX_MODEL_ATTEMPTS;
/** 릴레이 토큰 수명. 발급 직후 바로 쓰이므로 짧게 잡는다. */
const RELAY_TOKEN_TTL_MS = 2 * 60 * 1000;

const ipRateLimiter = new SlidingRateLimiter(IP_RATE_LIMIT_MAX, IP_RATE_LIMIT_WINDOW_MS);
const userRateLimiter = new SlidingRateLimiter(USER_RATE_LIMIT_MAX, USER_RATE_LIMIT_WINDOW_MS);

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
      temperature: TEMPERATURE,
      thinkingLevel: "LOW",
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
const MIN_USABLE_CHARS = 80;
const LAST_RESORT_READING =
  "## 안내\n\n일시적으로 AI 해석을 가져오지 못했습니다. 위의 명식은 정상적으로 계산되었습니다. " +
  "잠시 후 '다시 풀이하기'를 눌러 주세요.\n\n이 해석은 참고용입니다.";

function stripEndMarker(text: string) {
  return text.replace(/\n?\[END\]\s*$/g, "").replace(/\[END\]/g, "");
}

/**
 * 첫 모델 스트림이 이미 열린 상태에서 시작해, 응답이 짧거나(MAX_TOKENS로 잘림) 부족하면
 * 같은 모델로 이어쓰기 요청을 추가로 열어가며 하나의 outgoing 스트림으로 계속 이어 붙인다.
 * 그래도 비면 generateContent 폴백 → 최후 안내문으로 클라이언트 빈 응답 에러를 막는다.
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
  let flushedAny = false;

  const flush = (text: string) => {
    if (!text) return;
    holdback += text;
    if (holdback.length <= END_MARKER_HOLDBACK) return;
    const releasable = holdback.slice(0, holdback.length - END_MARKER_HOLDBACK).replace(/\[END\]/g, "");
    holdback = holdback.slice(holdback.length - END_MARKER_HOLDBACK);
    if (releasable) {
      controller.enqueue(TEXT_ENCODER.encode(releasable));
      flushedAny = true;
    }
  };

  while (body && rounds < MAX_ATTEMPTS + 2) {
    rounds += 1;
    let truncated = false;
    try {
      for await (const chunk of readGeminiTextDeltas(body)) {
        if (chunk.error) {
          console.warn("[saju] sse error event", chunk.error);
          break;
        }
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

    if (accumulated.includes("[END]")) break;
    if (accumulated.trim().length >= MIN_USABLE_CHARS && !truncated) break;

    const remaining = deadlineAt - Date.now();
    if (remaining < 12_000) break;

    const continuationPrompt = `${originalPrompt}\n\n지금까지 작성된 내용입니다. 잘린 부분부터 이어서 끝까지 완성하세요(반복 금지). 끝나면 [END]를 출력하세요:\n"""\n${accumulated.slice(-1500)}\n"""`;
    const timeoutMs = Math.max(12_000, Math.min(GEMINI_HTTP_TIMEOUT_MS, remaining - 2000));
    const next = await openGeminiGenerateContentStream({
      apiKey,
      model: firstModel,
      prompt: continuationPrompt,
      timeoutMs,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: TEMPERATURE,
      thinkingLevel: "LOW",
    });
    body = next.ok ? next.body : null;
  }

  if (accumulated.trim().length < MIN_USABLE_CHARS) {
    const remaining = deadlineAt - Date.now();
    if (remaining >= 12_000) {
      try {
        const fallback = await callGeminiGenerateContent({
          apiKey,
          model: firstModel,
          prompt: originalPrompt,
          timeoutMs: Math.min(GEMINI_HTTP_TIMEOUT_MS, remaining - 2000),
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          temperature: TEMPERATURE,
          thinkingLevel: "LOW",
          deadlineAt,
        });
        if (fallback.ok && fallback.text.trim().length >= MIN_USABLE_CHARS) {
          accumulated = fallback.text;
          flush(fallback.text);
        }
      } catch (error) {
        console.error("[saju] generateContent fallback error", error);
      }
    }
  }

  const tail = stripEndMarker(holdback);
  if (tail) {
    controller.enqueue(TEXT_ENCODER.encode(tail));
    flushedAny = true;
  }

  if (!flushedAny && accumulated.trim().length === 0) {
    controller.enqueue(TEXT_ENCODER.encode(LAST_RESORT_READING));
  }
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
    userRateLimiter.prune();

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

    const modelChain = getGeminiModelChain();
    const relay = getRelayConfig();

    if (relay) {
      // 릴레이 경로: 여기서는 Gemini를 부르지 않는다. 프롬프트를 서명한 토큰만 발급하고,
      // 브라우저가 Supabase Edge Function을 직접 호출해 스트리밍을 받는다.
      // 긴 생성이 이 라우트를 붙들지 않으므로 in-flight 락 대신 사용자별 발급 제한을 건다.
      const userRateLimit = userRateLimiter.check(`saju:${user.id}`);
      if (!userRateLimit.allowed) {
        return NextResponse.json(
          { error: "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.", code: "user_rate_limit" },
          {
            status: 429,
            headers: {
              ...rateLimitHeaders(USER_RATE_LIMIT_MAX, userRateLimit.remaining, userRateLimit.resetAt),
              "Retry-After": String(Math.ceil((userRateLimit.resetAt - Date.now()) / 1000)),
            },
          },
        );
      }

      const relayToken = await signRelayToken(
        {
          v: 1,
          sub: user.id,
          kind,
          prompt,
          model: modelChain[0],
          fallbackModel: modelChain[1],
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          temperature: TEMPERATURE,
          exp: Date.now() + RELAY_TOKEN_TTL_MS,
        },
        relay.secret,
      );

      return NextResponse.json(
        {
          mode: "relay",
          kind,
          model: modelChain[0],
          relayUrl: relay.url,
          relayToken,
          ...(chartsPayload as object),
        },
        {
          headers: {
            ...rateLimitHeaders(IP_RATE_LIMIT_MAX, ipRateLimit.remaining, ipRateLimit.resetAt),
            "Cache-Control": "no-store",
          },
        },
      );
    }

    // 폴백 경로(로컬 개발 · Edge Function 배포 전): Next.js 안에서 직접 Gemini를 호출한다.
    // Amplify에서는 30초에서 끊기므로 프로덕션에서는 릴레이 설정을 반드시 채워야 한다.
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
