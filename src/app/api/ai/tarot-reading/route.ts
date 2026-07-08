import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase-server";
import type { CardOrientation, TarotSpreadId, TarotSuit, TarotTopicId } from "@/lib/tarot-deck";
import { TAROT_TOPIC_IDS } from "@/lib/tarot-deck";
import { isAppLocale, type AppLocale } from "@/i18n/routing";
import {
  buildLocalizedMissingSectionsPrompt,
  buildLocalizedPrompt,
  buildLocalizedTruncatedRetryPrompt,
  type TarotPromptBody,
} from "@/lib/tarot-prompt-i18n";
import { localizedSpreadPositions } from "@/lib/tarot-deck-i18n";
import { localizedCardKeywords } from "@/lib/tarot-keywords-i18n";
import { assessTarotReading } from "@/lib/tarot-reading-format";
import {
  callGeminiGenerateContent,
  isRetryableGeminiError,
  parseRetryAfterSeconds,
} from "@/lib/gemini-fetch";
import {
  SlidingRateLimiter,
  acquireInFlightLock,
  pruneStaleLocks,
  releaseInFlightLock,
} from "@/lib/sliding-rate-limit";

export const runtime = "nodejs";
export const maxDuration = 120;

const IP_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const IP_RATE_LIMIT_MAX = 30;
const IN_FLIGHT_TTL_MS = 110 * 1000;

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_TAROT_MODEL?.trim() || "gemini-3.1-pro-preview";
const FALLBACK_GEMINI_MODEL = process.env.GEMINI_TAROT_FALLBACK_MODEL?.trim() || "gemini-2.0-flash";
const GEMINI_HTTP_TIMEOUT_MS = 42_000;
const GEMINI_TOTAL_BUDGET_MS = 70_000;
const MAX_OUTPUT_TOKENS = 6144;
const MAX_READING_ATTEMPTS = 3;
const GEMINI_HTTP_RETRIES = 2;

const ipRateLimiter = new SlidingRateLimiter(IP_RATE_LIMIT_MAX, IP_RATE_LIMIT_WINDOW_MS);

type TarotCardInput = {
  id: string;
  suit?: TarotSuit;
  nameKo: string;
  nameEn: string;
  position: string;
  orientation: CardOrientation;
  keywords: string;
};

type TarotRequestBody = TarotPromptBody & {
  locale?: AppLocale;
};

function resolveLocale(value: unknown): AppLocale {
  return isAppLocale(typeof value === "string" ? value : undefined) ? (value as AppLocale) : "ko";
}

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

function validateBody(input: unknown): { ok: true; body: TarotRequestBody } | { ok: false; message: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, message: "요청 형식이 올바르지 않습니다." };
  }

  const body = input as Partial<TarotRequestBody>;
  const topics: TarotTopicId[] = TAROT_TOPIC_IDS;
  const spreads: TarotSpreadId[] = ["single", "three"];

  if (!body.topic || !topics.includes(body.topic)) {
    return { ok: false, message: "주제를 선택해 주세요." };
  }
  if (!body.spread || !spreads.includes(body.spread)) {
    return { ok: false, message: "스프레드를 선택해 주세요." };
  }
  if (!Array.isArray(body.cards) || body.cards.length < 1 || body.cards.length > 3) {
    return { ok: false, message: "카드 정보가 올바르지 않습니다." };
  }

  const expectedCount = body.spread === "three" ? 3 : 1;
  if (body.cards.length !== expectedCount) {
    return { ok: false, message: "선택한 스프레드와 카드 수가 맞지 않습니다." };
  }

  for (const card of body.cards) {
    if (!card?.id || !card.nameKo || !card.nameEn || !card.position || !card.orientation) {
      return { ok: false, message: "카드 데이터가 불완전합니다." };
    }
    if (card.orientation !== "upright" && card.orientation !== "reversed") {
      return { ok: false, message: "카드 방향 값이 올바르지 않습니다." };
    }
  }

  const question = typeof body.question === "string" ? body.question.trim().slice(0, 400) : "";
  const locale = resolveLocale((input as { locale?: unknown }).locale);
  const spreadId = body.spread as TarotSpreadId;
  const positions = localizedSpreadPositions(spreadId, locale);
  const cards = (body.cards as TarotCardInput[]).map((card, index) => ({
    ...card,
    position: positions[index] ?? card.position,
    keywords: localizedCardKeywords(card.id, card.keywords, locale),
  }));

  return {
    ok: true,
    body: {
      topic: body.topic,
      spread: spreadId,
      question: question || undefined,
      cards,
      locale,
    },
  };
}

function stripEndMarker(text: string) {
  return text.replace(/\n?\[END_READING\]\s*$/g, "").replace(/\[END_READING\]/g, "").trim();
}

function mergeReadingChunks(previous: string, chunk: string) {
  const normalized = chunk.replace(/\n?\[END_READING\]\s*$/g, "").trim();
  if (!previous) return normalized;
  if (!normalized) return previous;
  if (previous.endsWith(normalized) || previous.includes(normalized)) return previous;
  return `${previous}\n\n${normalized}`.trim();
}

function pickModelForAttempt(attempt: number) {
  return attempt >= 2 ? FALLBACK_GEMINI_MODEL : DEFAULT_GEMINI_MODEL;
}

async function generateFullReading(apiKey: string, body: TarotRequestBody) {
  const locale = body.locale ?? "ko";
  const basePrompt = buildLocalizedPrompt(body, locale);
  let accumulated = "";
  const requestStartedAt = Date.now();
  let lastError = "AI 리딩 요청에 실패했습니다.";

  for (let attempt = 1; attempt <= MAX_READING_ATTEMPTS; attempt += 1) {
    const elapsedMs = Date.now() - requestStartedAt;
    if (elapsedMs > GEMINI_TOTAL_BUDGET_MS) {
      break;
    }

    const remainingBudgetMs = GEMINI_TOTAL_BUDGET_MS - elapsedMs;
    const perRequestTimeoutMs = Math.max(12_000, Math.min(GEMINI_HTTP_TIMEOUT_MS, remainingBudgetMs - 2000));

    const assessmentBefore = accumulated ? assessTarotReading(accumulated) : null;
    if (assessmentBefore?.quality === "complete" || assessmentBefore?.quality === "usable") {
      return { ok: true as const, reading: stripEndMarker(accumulated), model: pickModelForAttempt(attempt) };
    }

    let attemptPrompt = basePrompt;
    if (attempt > 1 && accumulated) {
      const missing = assessmentBefore?.missingSectionNumbers.length
        ? assessmentBefore.missingSectionNumbers
        : [1, 2, 3, 4, 5].filter((n) => !assessmentBefore?.presentSectionNumbers.includes(n));

      attemptPrompt =
        missing.length > 0
          ? buildLocalizedMissingSectionsPrompt(body, accumulated, missing, locale)
          : buildLocalizedTruncatedRetryPrompt(basePrompt, accumulated, locale);
    }

    const model = pickModelForAttempt(attempt);

    try {
      const result = await callGeminiGenerateContent({
        apiKey,
        model,
        prompt: attemptPrompt,
        timeoutMs: perRequestTimeoutMs,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        maxHttpRetries: GEMINI_HTTP_RETRIES,
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

        if (result.retryable && attempt < MAX_READING_ATTEMPTS) {
          console.warn("[tarot-reading] retryable gemini error", { attempt, model, error: result.error });
          continue;
        }

        return {
          ok: false as const,
          error: lastError,
          code: "gemini_error" as const,
          status: isRetryableGeminiError(result.response.status, result.error) ? 504 : 502,
        };
      }

      if (!result.text) {
        continue;
      }

      accumulated = mergeReadingChunks(accumulated, result.text);

      const assessment = assessTarotReading(accumulated);
      if (assessment.quality === "complete" || assessment.quality === "usable") {
        return { ok: true as const, reading: stripEndMarker(accumulated), model };
      }

      console.warn("[tarot-reading] incomplete response", {
        attempt,
        model,
        finishReason: result.finishReason,
        length: accumulated.length,
        missing: assessment.missingSectionNumbers,
        present: assessment.presentSectionNumbers,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        lastError = "AI 응답 시간이 초과되었습니다.";
        console.warn("[tarot-reading] gemini timeout", { attempt, model });
        if (attempt < MAX_READING_ATTEMPTS) continue;
        return { ok: false as const, error: lastError, code: "timeout" as const, status: 504 };
      }
      throw error;
    }
  }

  const finalAssessment = assessTarotReading(accumulated);
  if (finalAssessment.quality !== "incomplete" && accumulated.trim()) {
    return { ok: true as const, reading: stripEndMarker(accumulated), model: FALLBACK_GEMINI_MODEL };
  }

  if (accumulated.trim()) {
    return {
      ok: true as const,
      reading: stripEndMarker(accumulated),
      model: FALLBACK_GEMINI_MODEL,
      warning: "partial_response" as const,
    };
  }

  return {
    ok: false as const,
    error: lastError || "AI 리딩이 완성되지 못했습니다. 잠시 후 다시 시도해 주세요.",
    code: "incomplete" as const,
    status: 504,
  };
}

async function logTarotReadingRequest(
  supabase: SupabaseClient,
  params: {
    authId: string;
    clientIp: string;
    body: TarotRequestBody;
    outcome:
      | { status: "success"; model: string }
      | { status: "failed"; code?: string; message: string };
  },
) {
  const { error } = await supabase.from("TAROT_READING_LOG").insert({
    auth_id: params.authId,
    topic: params.body.topic,
    spread: params.body.spread,
    question: params.body.question ?? null,
    card_count: params.body.cards.length,
    cards: params.body.cards,
    status: params.outcome.status,
    model: params.outcome.status === "success" ? params.outcome.model : null,
    error_code: params.outcome.status === "failed" ? params.outcome.code ?? null : null,
    error_message: params.outcome.status === "failed" ? params.outcome.message : null,
    client_ip: params.clientIp,
  });

  if (error) {
    console.error("[tarot-reading] failed to log request", error);
  }
}

export async function POST(request: NextRequest) {
  let inFlightKey: string | null = null;

  try {
    pruneStaleLocks();
    ipRateLimiter.prune();

    if (process.env.AI_ANALYSIS_ENABLED?.toLowerCase() === "false") {
      return NextResponse.json({ error: "현재 AI 타로 기능이 비활성화되어 있습니다." }, { status: 503 });
    }

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

    const parsed = validateBody(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.message }, { status: 400 });
    }

    const apiKey = sanitizeApiKey(process.env.GEMINI_API_KEY);
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    inFlightKey = user.id;
    if (!acquireInFlightLock(inFlightKey, IN_FLIGHT_TTL_MS)) {
      return NextResponse.json(
        { error: "이미 리딩이 진행 중입니다. 완료될 때까지 잠시만 기다려 주세요.", code: "in_flight" },
        { status: 409 },
      );
    }

    const result = await generateFullReading(apiKey, parsed.body);

    await logTarotReadingRequest(supabase, {
      authId: user.id,
      clientIp,
      body: parsed.body,
      outcome: result.ok
        ? { status: "success", model: result.model }
        : { status: "failed", code: result.code, message: result.error },
    });

    if (!result.ok) {
      const status = result.status ?? 502;
      const headers: Record<string, string> = {
        ...rateLimitHeaders(IP_RATE_LIMIT_MAX, ipRateLimit.remaining, ipRateLimit.resetAt),
      };
      if (result.code === "quota_exceeded" && result.retryAfter) {
        headers["Retry-After"] = String(result.retryAfter);
      }
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status, headers },
      );
    }

    return NextResponse.json(
      {
        reading: result.reading,
        model: result.model,
        warning: "warning" in result ? result.warning : undefined,
      },
      {
        headers: rateLimitHeaders(IP_RATE_LIMIT_MAX, ipRateLimit.remaining, ipRateLimit.resetAt),
      },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.", code: "timeout" },
        { status: 504 },
      );
    }
    console.error("[tarot-reading] unexpected error", error);
    return NextResponse.json({ error: "AI 타로 리딩 중 오류가 발생했습니다." }, { status: 500 });
  } finally {
    if (inFlightKey) {
      releaseInFlightLock(inFlightKey);
    }
  }
}
