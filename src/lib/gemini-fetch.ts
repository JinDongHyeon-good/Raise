const RETRYABLE_HTTP_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message?: string; status?: string };
};

export type GeminiCallResult =
  | {
      ok: true;
      response: Response;
      data: GeminiGenerateResponse;
      text: string;
      finishReason?: string;
    }
  | {
      ok: false;
      response: Response;
      data: GeminiGenerateResponse;
      text: string;
      finishReason?: string;
      error: string;
      retryable: boolean;
    };

export function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function isRetryableGeminiError(status: number, message: string) {
  if (RETRYABLE_HTTP_STATUS.has(status)) return true;
  const lower = message.toLowerCase();
  return (
    lower.includes("resource_exhausted") ||
    lower.includes("quota exceeded") ||
    lower.includes("rate limit") ||
    lower.includes("overloaded") ||
    lower.includes("unavailable") ||
    lower.includes("deadline") ||
    lower.includes("timeout")
  );
}

export function parseRetryAfterSeconds(message: string) {
  const match = message.match(/retry in\s+([0-9.]+)s/i);
  if (!match) return null;
  const seconds = Math.ceil(Number(match[1]));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

export async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function callGeminiGenerateContent(options: {
  apiKey: string;
  model: string;
  prompt: string;
  timeoutMs: number;
  maxOutputTokens: number;
  temperature?: number;
  topP?: number;
  maxHttpRetries?: number;
  /** Absolute Date.now()-style timestamp all internal retries/backoffs must finish before. */
  deadlineAt?: number;
}): Promise<GeminiCallResult> {
  const {
    apiKey,
    model,
    prompt,
    timeoutMs,
    maxOutputTokens,
    temperature = 0.6,
    topP = 0.92,
    maxHttpRetries = 2,
    deadlineAt,
  } = options;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      topP,
      maxOutputTokens,
    },
  });

  let lastError = "AI 리딩 요청에 실패했습니다.";
  const MIN_ATTEMPT_MS = 1_000;

  for (let retry = 0; retry <= maxHttpRetries; retry += 1) {
    const remainingMs = deadlineAt !== undefined ? deadlineAt - Date.now() : Infinity;
    if (remainingMs < MIN_ATTEMPT_MS) {
      return {
        ok: false,
        response: new Response(null, { status: 504 }),
        data: {},
        text: "",
        error: lastError,
        retryable: false,
      };
    }

    if (retry > 0) {
      const backoffMs = Math.min(Math.min(1500 * 2 ** (retry - 1), 6000), remainingMs - MIN_ATTEMPT_MS);
      if (backoffMs > 0) await sleep(backoffMs);
    }

    const attemptRemainingMs = deadlineAt !== undefined ? deadlineAt - Date.now() : Infinity;
    const attemptTimeoutMs = Math.max(MIN_ATTEMPT_MS, Math.min(timeoutMs, attemptRemainingMs));

    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        },
        attemptTimeoutMs,
      );

      const data = (await response.json()) as GeminiGenerateResponse;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
      const finishReason = data.candidates?.[0]?.finishReason;

      if (!response.ok) {
        const message = data.error?.message || "AI 리딩 요청에 실패했습니다.";
        lastError = message;
        const retryable = isRetryableGeminiError(response.status, message);
        const hasBudgetLeft = deadlineAt === undefined || deadlineAt - Date.now() >= MIN_ATTEMPT_MS;
        if (retry < maxHttpRetries && retryable && hasBudgetLeft) {
          continue;
        }
        return {
          ok: false,
          response,
          data,
          text,
          finishReason,
          error: message,
          retryable,
        };
      }

      return { ok: true, response, data, text, finishReason };
    } catch (error) {
      const isAbort = error instanceof Error && error.name === "AbortError";
      lastError = isAbort ? "AI 응답 시간이 초과되었습니다." : "AI 서버와 통신하지 못했습니다.";
      const hasBudgetLeft = deadlineAt === undefined || deadlineAt - Date.now() >= MIN_ATTEMPT_MS;
      if (retry < maxHttpRetries && hasBudgetLeft) {
        continue;
      }
      throw error;
    }
  }

  return {
    ok: false,
    response: new Response(null, { status: 502 }),
    data: {},
    text: "",
    error: lastError,
    retryable: true,
  };
}
