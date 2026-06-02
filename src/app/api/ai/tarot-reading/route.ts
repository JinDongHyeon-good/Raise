import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase-server";
import type { CardOrientation, TarotSpreadId, TarotSuit, TarotTopicId } from "@/lib/tarot-deck";
import { TAROT_TOPIC_IDS, topicGuidance, topicLabel, suitLabel } from "@/lib/tarot-deck";
import { assessTarotReading } from "@/lib/tarot-reading-format";

export const runtime = "nodejs";
export const maxDuration = 120;

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 6;
const TOTAL_LIMIT_PER_USER = 3;
const DEFAULT_GEMINI_MODEL = "gemini-3.1-pro-preview";
const GEMINI_HTTP_TIMEOUT_MS = 55000;
const GEMINI_TOTAL_BUDGET_MS = 100000;
const MAX_OUTPUT_TOKENS = 8192;
const MAX_READING_ATTEMPTS = 5;

const requestBuckets = new Map<string, { count: number; windowStart: number }>();

type TarotCardInput = {
  id: string;
  suit?: TarotSuit;
  nameKo: string;
  nameEn: string;
  position: string;
  orientation: CardOrientation;
  keywords: string;
};

type TarotRequestBody = {
  topic: TarotTopicId;
  spread: TarotSpreadId;
  question?: string;
  cards: TarotCardInput[];
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message?: string };
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

function checkRateLimit(clientKey: string) {
  const now = Date.now();
  const current = requestBuckets.get(clientKey);

  if (!current || now - current.windowStart >= RATE_LIMIT_WINDOW_MS) {
    requestBuckets.set(clientKey, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  current.count += 1;
  requestBuckets.set(clientKey, current);
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - current.count };
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
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
  return {
    ok: true,
    body: {
      topic: body.topic,
      spread: body.spread,
      question: question || undefined,
      cards: body.cards as TarotCardInput[],
    },
  };
}

function stripEndMarker(text: string) {
  return text.replace(/\n?\[END_READING\]\s*$/g, "").replace(/\[END_READING\]/g, "").trim();
}

const SECTION_CONTINUATION_GUIDE: Record<number, (body: TarotRequestBody) => string> = {
  1: () => "1) 한 줄 요약 — 2~3문장",
  2: (body) =>
    body.cards.length === 1
      ? "2) 카드 해석 — 뽑힌 카드 1장을 5문장 이상"
      : "2) 카드별 해석 — 각 카드 4문장 이상, 과거/현재/미래 연결",
  3: () => "3) 카드들이 만드는 전체 흐름 — 6문장 이상",
  4: () => "4) 지금 실천하면 좋은 행동 — '- '로 시작하는 줄 3개",
  5: () => "5) 마음가짐 한 문장 — 격려 마무리",
};

function buildMissingSectionsPrompt(body: TarotRequestBody, accumulated: string, missing: number[]) {
  const guides = missing.map((n) => SECTION_CONTINUATION_GUIDE[n]?.(body)).filter(Boolean);

  return [
    "너는 전문 타로 리더다. 반드시 한국어로 작성한다.",
    "아래 [기존 응답]은 수정·요약·반복하지 말고, [누락 섹션]만 새로 이어서 작성한다.",
    "누락 섹션 작성이 끝나면 마지막 줄에만 [END_READING]을 출력한다.",
    "",
    `[누락 섹션 번호: ${missing.join(", ")}]`,
    ...guides,
    "",
    "[기존 응답]",
    accumulated,
  ].join("\n");
}

function mergeReadingChunks(previous: string, chunk: string) {
  const normalized = chunk.replace(/\n?\[END_READING\]\s*$/g, "").trim();
  if (!previous) return normalized;
  if (!normalized) return previous;
  if (previous.endsWith(normalized) || previous.includes(normalized)) return previous;
  return `${previous}\n\n${normalized}`.trim();
}

function buildPrompt(body: TarotRequestBody) {
  const cardsText = body.cards
    .map((card) => {
      const suitPart = card.suit ? `[${suitLabel(card.suit)}] ` : "";
      return `- ${card.position}: ${suitPart}${card.nameKo} (${card.nameEn}) / ${
        card.orientation === "reversed" ? "역방향" : "정방향"
      } / 키워드: ${card.keywords}`;
    })
    .join("\n");

  const questionLine = body.question ? `질문: ${body.question}` : "질문: (구체적 질문 없음 — 카드 흐름 중심으로 읽기)";
  const cardSectionRule =
    body.cards.length === 1
      ? "2) 카드 해석: 뽑힌 카드 1장을 최소 5문장으로 깊게 풀어 쓴다."
      : "2) 카드별 해석: 뽑힌 카드 각각을 최소 4문장씩, 위치(과거/현재/미래)와 연결해 풀어 쓴다.";

  return [
    "너는 15년 경력의 전문 타로 리더다. 반드시 한국어로, 따뜻하고 명확한 톤으로 작성한다.",
    "미신을 조장하거나 절대적 예언(100% 확정)을 하지 말고, 관찰과 가능성 중심으로 쓴다.",
    "투자·의료·법률 등 전문 조언은 금지한다.",
    "",
    "[작성 규칙 — 반드시 준수]",
    "- 긴 인사말·자기소개·서비스 홍보 문구로 시작하지 말 것. (예: '안녕하세요, 멜로타로...' 같은 서두 금지)",
    "- 요약만 하고 끝내지 말 것. 각 섹션을 충분히 풀어서 서술한다.",
    "- 문장을 중간에 끊지 말고, 모든 섹션을 끝까지 완성한다.",
    "- 5개 섹션을 빠짐없이 완성할 것. 각 섹션은 읽기 좋은 분량으로 균형 있게 작성한다.",
    "- 마지막 줄은 반드시 단독으로 [END_READING] 을 출력한다.",
    "",
    `서비스: 멜로타로 AI 타로`,
    `주제: ${topicLabel(body.topic)}`,
    `주제 해석 가이드: ${topicGuidance(body.topic)}`,
    `스프레드: ${body.spread === "three" ? "3장 (과거-현재-미래)" : "1장 (핵심 메시지)"}`,
    "덱: 78장 풀 덱(메이저+마이너)에서 뽑힌 카드이다.",
    questionLine,
    "",
    "뽑힌 카드:",
    cardsText,
    "",
    "[출력 형식 — 아래 5개 섹션을 모두 작성. 각 섹션은 반드시 '1)', '2)' … 번호로 시작]",
    "1) 한 줄 요약",
    "(이 줄 다음 줄부터 2~3문장으로 핵심만 요약)",
    cardSectionRule,
    "3) 카드들이 만드는 전체 흐름 (6문장 이상, 인과와 감정 흐름 포함)",
    "4) 지금 실천하면 좋은 행동",
    "(- 로 시작하는 줄 3개, 각 1~2문장)",
    "5) 마음가짐 한 문장 (격려가 담긴 마무리)",
    "",
    "위 5개 섹션을 모두 쓴 뒤, 마지막 줄에만 [END_READING]을 출력한다.",
  ].join("\n");
}

async function callGemini(apiKey: string, prompt: string, timeoutMs: number) {
  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          topP: 0.92,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
      }),
    },
    timeoutMs,
  );

  const data = (await response.json()) as GeminiGenerateResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  const finishReason = data.candidates?.[0]?.finishReason;

  return { response, data, text, finishReason };
}

async function generateFullReading(apiKey: string, body: TarotRequestBody) {
  const basePrompt = buildPrompt(body);
  let accumulated = "";
  const requestStartedAt = Date.now();

  for (let attempt = 1; attempt <= MAX_READING_ATTEMPTS; attempt += 1) {
    const elapsedMs = Date.now() - requestStartedAt;
    if (elapsedMs > GEMINI_TOTAL_BUDGET_MS) break;

    const remainingBudgetMs = GEMINI_TOTAL_BUDGET_MS - elapsedMs;
    const perRequestTimeoutMs = Math.max(8000, Math.min(GEMINI_HTTP_TIMEOUT_MS, remainingBudgetMs - 1500));

    const assessmentBefore = accumulated ? assessTarotReading(accumulated) : null;
    if (assessmentBefore?.quality === "complete" || assessmentBefore?.quality === "usable") {
      return { ok: true as const, reading: stripEndMarker(accumulated) };
    }

    let attemptPrompt = basePrompt;
    if (attempt > 1 && accumulated) {
      const missing = assessmentBefore?.missingSectionNumbers.length
        ? assessmentBefore.missingSectionNumbers
        : [1, 2, 3, 4, 5].filter((n) => !assessmentBefore?.presentSectionNumbers.includes(n));

      attemptPrompt =
        missing.length > 0
          ? buildMissingSectionsPrompt(body, accumulated, missing)
          : [
              basePrompt,
              "",
              "[재요청]",
              "응답이 중간에 잘렸다. 기존 응답에 이어 누락된 섹션만 작성하고 마지막에 [END_READING]을 출력한다.",
              "",
              "[기존 응답]",
              accumulated,
            ].join("\n");
    }

    const { response, data, text, finishReason } = await callGemini(apiKey, attemptPrompt, perRequestTimeoutMs);

    if (!response.ok) {
      const message = data.error?.message || "AI 리딩 요청에 실패했습니다.";
      return { ok: false as const, error: message };
    }

    if (!text) {
      continue;
    }

    accumulated = mergeReadingChunks(accumulated, text);

    const assessment = assessTarotReading(accumulated);
    if (assessment.quality === "complete" || assessment.quality === "usable") {
      return { ok: true as const, reading: stripEndMarker(accumulated) };
    }

    console.warn("[tarot-reading] incomplete response", {
      attempt,
      finishReason,
      length: accumulated.length,
      missing: assessment.missingSectionNumbers,
      present: assessment.presentSectionNumbers,
    });
  }

  const finalAssessment = assessTarotReading(accumulated);
  if (finalAssessment.quality !== "incomplete") {
    return { ok: true as const, reading: stripEndMarker(accumulated) };
  }

  return { ok: false as const, error: "AI 리딩이 완성되지 못했습니다. 잠시 후 다시 시도해 주세요." };
}

export async function POST(request: NextRequest) {
  try {
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
    const rateLimit = checkRateLimit(`${user.id}:${clientIp}`);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
    }

    const { data: profileRow, error: profileError } = await supabase
      .from("USER_MST")
      .select("use_count")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "사용자 정보 조회에 실패했습니다." }, { status: 500 });
    }

    const currentUseCount = Number(profileRow?.use_count ?? 0);
    if (currentUseCount >= TOTAL_LIMIT_PER_USER) {
      return NextResponse.json(
        { error: "AI 타로 리딩은 가입 후 총 3회까지 이용할 수 있습니다.", code: "total_limit" },
        { status: 429 },
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

    const result = await generateFullReading(apiKey, parsed.body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    const nextUseCount = currentUseCount + 1;
    const { error: updateError } = await supabase
      .from("USER_MST")
      .update({ use_count: nextUseCount })
      .eq("auth_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "사용 횟수 저장에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({
      reading: result.reading,
      model: DEFAULT_GEMINI_MODEL,
      remainingToday: Math.max(TOTAL_LIMIT_PER_USER - nextUseCount, 0),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요." }, { status: 504 });
    }
    console.error("[tarot-reading] unexpected error", error);
    return NextResponse.json({ error: "AI 타로 리딩 중 오류가 발생했습니다." }, { status: 500 });
  }
}
