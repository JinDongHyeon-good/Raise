const RETRYABLE_HTTP_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
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

export type GeminiStreamOpenResult =
  | { ok: true; body: ReadableStream<Uint8Array> }
  | { ok: false; status: number; error: string; retryable: boolean };

/**
 * SSE(:streamGenerateContent?alt=sse)로 연결을 연다. 응답 헤더 단계에서 실패하면(모델 오류·429 등)
 * 그 시점까지는 클라이언트에 아무 바이트도 안 나간 상태이므로 호출부가 다음 모델로 재시도할 수 있다.
 * 연결이 열린 뒤(첫 청크 이후)의 오류는 스트림 소비 쪽(readGeminiTextDeltas)에서 처리한다.
 */
/** Gemini 3.x thinking 모델의 추론 깊이. Pro는 끌 수 없고 LOW가 최소. */
export type GeminiThinkingLevel = "LOW" | "MEDIUM" | "HIGH";

function buildGenerationConfig(options: {
  maxOutputTokens: number;
  temperature: number;
  topP: number;
  thinkingLevel?: GeminiThinkingLevel;
}) {
  const generationConfig: Record<string, unknown> = {
    temperature: options.temperature,
    topP: options.topP,
    maxOutputTokens: options.maxOutputTokens,
  };
  // gemini-3.1-pro 등은 기본 thinking=HIGH라 TTFB가 수십 초까지 늘어날 수 있다.
  if (options.thinkingLevel) {
    generationConfig.thinkingConfig = { thinkingLevel: options.thinkingLevel };
  }
  return generationConfig;
}

/** candidates.parts 에서 thought 조각을 건너뛰고 본문 텍스트만 이어 붙인다. */
export function extractGeminiText(data: GeminiGenerateResponse) {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  let text = "";
  for (const part of parts) {
    if (!part?.text || part.thought) continue;
    text += part.text;
  }
  return text;
}

export async function openGeminiGenerateContentStream(options: {
  apiKey: string;
  model: string;
  prompt: string;
  timeoutMs: number;
  maxOutputTokens: number;
  temperature?: number;
  topP?: number;
  thinkingLevel?: GeminiThinkingLevel;
}): Promise<GeminiStreamOpenResult> {
  const {
    apiKey,
    model,
    prompt,
    timeoutMs,
    maxOutputTokens,
    temperature = 0.6,
    topP = 0.92,
    thinkingLevel = "LOW",
  } = options;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: buildGenerationConfig({ maxOutputTokens, temperature, topP, thinkingLevel }),
  });

  let response: Response;
  try {
    response = await fetchWithTimeout(url, { method: "POST", headers: { "Content-Type": "application/json" }, body }, timeoutMs);
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      status: 504,
      error: isAbort ? "AI 응답 시간이 초과되었습니다." : "AI 서버와 통신하지 못했습니다.",
      retryable: true,
    };
  }

  if (!response.ok || !response.body) {
    let message = "AI 리딩 요청에 실패했습니다.";
    try {
      const data = (await response.json()) as GeminiGenerateResponse;
      message = data.error?.message || message;
    } catch {
      // 본문이 JSON이 아니면 기본 메시지 사용
    }
    return { ok: false, status: response.status, error: message, retryable: isRetryableGeminiError(response.status, message) };
  }

  return { ok: true, body: response.body };
}

/** SSE 스트림에서 텍스트 델타를 순서대로 뽑아낸다. */
export async function* readGeminiTextDeltas(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<{ text: string; finishReason?: string; error?: string }, void, void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const parseEvent = (rawEvent: string): { text: string; finishReason?: string; error?: string } | null => {
    const dataLines = rawEvent
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart());
    if (dataLines.length === 0) return null;
    // 스펙상 data: 가 여러 줄이면 이어 붙인다.
    const dataLine = dataLines.join("\n").trim();
    if (!dataLine || dataLine === "[DONE]") return null;

    try {
      const parsed = JSON.parse(dataLine) as GeminiGenerateResponse & { error?: { message?: string } };
      if (parsed.error?.message) return { text: "", error: parsed.error.message };
      const text = extractGeminiText(parsed);
      const finishReason = parsed.candidates?.[0]?.finishReason;
      if (text || finishReason) return { text, finishReason };
      return null;
    } catch {
      // 파싱 안 되는 조각은 건너뛴다 (keep-alive 주석 등)
      return null;
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // Gemini SSE는 이벤트 구분자로 "\r\n\r\n"을 쓴다. JSON 페이로드 안의 실제 개행은 이스케이프된
      // "\\r"/"\\n"이라 원본 바이트의 "\r"을 지워도 내용이 손상되지 않는다.
      buffer += decoder.decode(value, { stream: true }).replace(/\r/g, "");

      let separatorIndex: number;
      while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        const parsed = parseEvent(rawEvent);
        if (parsed) yield parsed;
      }
    }

    // 스트림이 끝나도 마지막 이벤트에 \n\n 이 빠진 경우가 있어 꼬리를 한 번 더 파싱한다.
    const trailing = buffer.trim();
    if (trailing) {
      const parsed = parseEvent(trailing);
      if (parsed) yield parsed;
    }
  } finally {
    reader.releaseLock();
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
  thinkingLevel?: GeminiThinkingLevel;
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
    thinkingLevel = "LOW",
    maxHttpRetries = 2,
    deadlineAt,
  } = options;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: buildGenerationConfig({ maxOutputTokens, temperature, topP, thinkingLevel }),
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
      const text = extractGeminiText(data).trim();
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
