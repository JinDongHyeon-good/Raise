/**
 * saju-stream — Supabase Edge Function (Deno)
 *
 * 왜 존재하는가:
 * Amplify Hosting은 SSR/API 응답을 30초에서 강제로 끊고(조정 불가), Next.js 스트리밍도 미지원이라
 * 응답을 통째로 버퍼링한다. gemini-3.1-pro-preview로 4000토큰짜리 사주 해석을 만들면 30초를 넘겨서
 * 500이 난다. 그래서 "오래 걸리는 Gemini 호출"만 여기로 뺐다. 브라우저가 Amplify/CloudFront를 거치지
 * 않고 이 함수를 직접 호출하므로 30초 제한이 적용되지 않는다(Supabase 무료 플랜 기준 요청당 150초).
 *
 * 흐름:
 *   1. 브라우저 → Next.js /api/ai/saju : 인증·검증·명식 계산·프롬프트 생성 (1초 이내)
 *   2. Next.js → 브라우저 : 명식 JSON + HMAC 서명된 릴레이 토큰(프롬프트 포함, 2분 만료)
 *   3. 브라우저 → 이 함수 : 릴레이 토큰 전달
 *   4. 이 함수 → Gemini SSE → 브라우저로 실시간 텍스트 스트리밍
 *
 * 서명 검증이 없으면 이 함수는 아무 프롬프트나 실행해 주는 공짜 Gemini 게이트웨이가 된다.
 * 토큰 형식은 src/lib/ai-relay-token.ts와 반드시 같아야 한다.
 * (대시보드에 그대로 붙여넣어 배포할 수 있도록 의존성 없는 단일 파일로 유지한다.)
 *
 * 필요한 시크릿:
 *   GEMINI_API_KEY   — Gemini API 키
 *   AI_RELAY_SECRET  — Next.js와 공유하는 HMAC 시크릿
 *   RELAY_ALLOWED_ORIGINS — (선택) 쉼표로 구분한 허용 오리진. 없으면 요청 오리진을 그대로 허용.
 */

declare const Deno: { env: { get(key: string): string | undefined } };

/** Supabase 무료 플랜은 요청당 150초. 여유를 두고 끊는다. */
const TOTAL_BUDGET_MS = 140_000;
const GEMINI_HTTP_TIMEOUT_MS = 90_000;
/** 이어쓰기를 포함한 최대 Gemini 호출 횟수(모델당) */
const MAX_ROUNDS_PER_MODEL = 3;
/** 이 길이 이상이면 성공으로 본다 */
const MIN_USABLE_CHARS = 80;
/** 스트림 맨 끝의 [END] 마커가 화면에 잠깐 비치지 않도록 꼬리를 붙들어 둔다. */
const END_MARKER_HOLDBACK = 12;

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

/** 모든 모델/경로가 실패해도 클라이언트가 빈 응답 에러를 보지 않도록 내는 최후 본문 */
const LAST_RESORT_READING =
  "## 안내\n\n일시적으로 AI 해석을 가져오지 못했습니다. 위의 명식은 정상적으로 계산되었습니다. " +
  "잠시 후 '다시 풀이하기'를 눌러 주세요.\n\n이 해석은 참고용입니다.";

type RelayTokenPayload = {
  v: 1;
  sub: string;
  kind: string;
  prompt: string;
  model: string;
  fallbackModel?: string;
  maxOutputTokens: number;
  temperature: number;
  exp: number;
};

// ---------------------------------------------------------------- 릴레이 토큰

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function verifyRelayToken(token: string, secret: string): Promise<RelayTokenPayload | null> {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    TEXT_ENCODER.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  let valid = false;
  try {
    valid = await crypto.subtle.verify("HMAC", key, base64UrlDecode(signature), TEXT_ENCODER.encode(body));
  } catch {
    return null;
  }
  if (!valid) return null;

  try {
    const payload = JSON.parse(TEXT_DECODER.decode(base64UrlDecode(body))) as RelayTokenPayload;
    if (payload.v !== 1 || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (typeof payload.prompt !== "string" || !payload.prompt) return null;
    return payload;
  } catch {
    return null;
  }
}

function readJwtSubject(authorization: string | null): string | null {
  const raw = authorization?.replace(/^Bearer\s+/i, "").trim();
  const body = raw?.split(".")[1];
  if (!body) return null;
  try {
    const payload = JSON.parse(TEXT_DECODER.decode(base64UrlDecode(body))) as { sub?: string };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ------------------------------------------------------------------- Gemini

type GeminiChunk = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
  error?: { message?: string };
};

function extractText(chunk: GeminiChunk) {
  const parts = chunk.candidates?.[0]?.content?.parts ?? [];
  let text = "";
  for (const part of parts) {
    if (!part?.text || part.thought) continue;
    text += part.text;
  }
  return text;
}

function buildGenerationConfig(maxOutputTokens: number, temperature: number) {
  return {
    temperature,
    topP: 0.92,
    maxOutputTokens,
    thinkingConfig: { thinkingLevel: "LOW" },
  };
}

async function openGeminiStream(options: {
  apiKey: string;
  model: string;
  prompt: string;
  maxOutputTokens: number;
  temperature: number;
  timeoutMs: number;
}): Promise<{ ok: true; body: ReadableStream<Uint8Array> } | { ok: false; status: number; error: string }> {
  const { apiKey, model, prompt, maxOutputTokens, temperature, timeoutMs } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: buildGenerationConfig(maxOutputTokens, temperature),
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok || !response.body) {
      let message = "AI 해석 요청에 실패했습니다.";
      try {
        const data = (await response.json()) as GeminiChunk;
        message = data.error?.message || message;
      } catch {
        // JSON이 아니면 기본 메시지
      }
      return { ok: false, status: response.status, error: message };
    }

    return { ok: true, body: response.body };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      status: 504,
      error: isAbort ? "AI 응답 시간이 초과되었습니다." : "AI 서버와 통신하지 못했습니다.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** 스트리밍이 비었을 때 쓰는 비스트림 폴백 */
async function generateContentOnce(options: {
  apiKey: string;
  model: string;
  prompt: string;
  maxOutputTokens: number;
  temperature: number;
  timeoutMs: number;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const { apiKey, model, prompt, maxOutputTokens, temperature, timeoutMs } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: buildGenerationConfig(maxOutputTokens, temperature),
        }),
        signal: controller.signal,
      },
    );
    const data = (await response.json()) as GeminiChunk;
    if (!response.ok) {
      return { ok: false, error: data.error?.message || "AI 해석 요청에 실패했습니다." };
    }
    const text = extractText(data).trim();
    if (!text) return { ok: false, error: "AI 응답이 비어 있습니다." };
    return { ok: true, text };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      error: isAbort ? "AI 응답 시간이 초과되었습니다." : "AI 서버와 통신하지 못했습니다.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function* readTextDeltas(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<{ text: string; finishReason?: string; error?: string }, void, void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const parseEvent = (rawEvent: string) => {
    const dataLines = rawEvent
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart());
    if (dataLines.length === 0) return null;
    const dataLine = dataLines.join("\n").trim();
    if (!dataLine || dataLine === "[DONE]") return null;

    try {
      const parsed = JSON.parse(dataLine) as GeminiChunk;
      if (parsed.error?.message) return { text: "", error: parsed.error.message };
      const text = extractText(parsed);
      const finishReason = parsed.candidates?.[0]?.finishReason;
      if (text || finishReason) return { text, finishReason };
      return null;
    } catch {
      return null;
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r/g, "");

      let separatorIndex: number;
      while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        const parsed = parseEvent(rawEvent);
        if (parsed) yield parsed;
      }
    }

    const trailing = buffer.trim();
    if (trailing) {
      const parsed = parseEvent(trailing);
      if (parsed) yield parsed;
    }
  } finally {
    reader.releaseLock();
  }
}

function stripEndMarker(text: string) {
  return text.replace(/\n?\[END\]\s*$/g, "").replace(/\[END\]/g, "");
}

function buildModelAttempts(payload: RelayTokenPayload): string[] {
  const chain = [payload.model, payload.fallbackModel, "gemini-3.5-flash", "gemini-flash-latest"].filter(
    (v): v is string => Boolean(v),
  );
  // primary → fallback → flash 순으로, 각각 최대 2회까지 재시도
  const attempts: string[] = [];
  for (const model of Array.from(new Set(chain))) {
    attempts.push(model, model);
  }
  return attempts;
}

/**
 * 인증이 끝난 뒤에는 항상 text/plain 스트림을 연다.
 * Gemini 연결 실패·빈 응답·SSE JSON 파싱 누락이 있어도 모델 체인·비스트림 폴백·최후 문구로
 * 클라이언트에 본문이 반드시 나가게 한다(빈 스트림 → UI 에러 방지).
 */
function buildGuaranteedReadingStream(
  apiKey: string,
  payload: RelayTokenPayload,
  deadlineAt: number,
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let accumulated = "";
      let holdback = "";
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

      const flushTail = () => {
        const tail = stripEndMarker(holdback);
        holdback = "";
        if (tail) {
          controller.enqueue(TEXT_ENCODER.encode(tail));
          flushedAny = true;
        }
      };

      try {
        const models = buildModelAttempts(payload);

        for (let i = 0; i < models.length; i += 1) {
          if (accumulated.trim().length >= MIN_USABLE_CHARS && accumulated.includes("[END]")) break;
          if (accumulated.trim().length >= 200) break;

          const remaining = deadlineAt - Date.now();
          if (remaining < 15_000) break;

          const model = models[i];
          if (i > 0) await sleep(Math.min(1200 * i, 4000));

          const prompt =
            accumulated.trim().length > 0
              ? `${payload.prompt}\n\n지금까지 작성된 내용입니다. 잘린 부분부터 이어서 끝까지 완성하세요(반복 금지). 끝나면 [END]를 출력하세요:\n"""\n${accumulated.slice(-1500)}\n"""`
              : payload.prompt;

          const opened = await openGeminiStream({
            apiKey,
            model,
            prompt,
            maxOutputTokens: payload.maxOutputTokens,
            temperature: payload.temperature,
            timeoutMs: Math.min(GEMINI_HTTP_TIMEOUT_MS, remaining - 5_000),
          });

          if (!opened.ok) {
            console.warn("[saju-stream] gemini open error", {
              model,
              status: opened.status,
              error: opened.error,
            });
            // 쿼터면 같은 모델 재시도는 낭비. 다른 모델로 넘어간다.
            const lower = opened.error.toLowerCase();
            if (opened.status === 429 || lower.includes("quota") || lower.includes("resource_exhausted")) {
              continue;
            }
            continue;
          }

          let rounds = 0;
          let body: ReadableStream<Uint8Array> | null = opened.body;
          let streamError: string | null = null;

          while (body && rounds < MAX_ROUNDS_PER_MODEL) {
            rounds += 1;
            let truncated = false;
            try {
              for await (const chunk of readTextDeltas(body)) {
                if (chunk.error) {
                  streamError = chunk.error;
                  break;
                }
                if (chunk.text) {
                  accumulated += chunk.text;
                  flush(chunk.text);
                }
                if (chunk.finishReason === "MAX_TOKENS") truncated = true;
              }
            } catch (error) {
              console.error("[saju-stream] relay error", error);
              break;
            }

            if (streamError) break;
            if (accumulated.includes("[END]")) break;
            if (accumulated.trim().length >= MIN_USABLE_CHARS && !truncated) break;

            const left = deadlineAt - Date.now();
            if (left < 20_000) break;

            const continuationPrompt =
              `${payload.prompt}\n\n지금까지 작성된 내용입니다. ` +
              `잘린 부분부터 이어서 끝까지 완성하세요(반복 금지). 끝나면 [END]를 출력하세요:\n"""\n${accumulated.slice(-1500)}\n"""`;

            const next = await openGeminiStream({
              apiKey,
              model,
              prompt: continuationPrompt,
              maxOutputTokens: payload.maxOutputTokens,
              temperature: payload.temperature,
              timeoutMs: Math.min(GEMINI_HTTP_TIMEOUT_MS, left - 5_000),
            });
            body = next.ok ? next.body : null;
          }

          if (accumulated.trim().length >= MIN_USABLE_CHARS) break;
        }

        // 스트리밍이 비었거나 너무 짧으면 비스트림 generateContent로 한 번 더 보장한다.
        if (accumulated.trim().length < MIN_USABLE_CHARS) {
          const uniqueModels = Array.from(new Set(buildModelAttempts(payload)));
          for (const model of uniqueModels) {
            const left = deadlineAt - Date.now();
            if (left < 12_000) break;

            const result = await generateContentOnce({
              apiKey,
              model,
              prompt: payload.prompt,
              maxOutputTokens: payload.maxOutputTokens,
              temperature: payload.temperature,
              timeoutMs: Math.min(GEMINI_HTTP_TIMEOUT_MS, left - 3_000),
            });

            if (result.ok && result.text.trim().length >= MIN_USABLE_CHARS) {
              // 아직 클라이언트에 거의 안 보냈다면 통째로 보낸다.
              if (!flushedAny && !holdback) {
                accumulated = result.text;
                flush(result.text);
              } else if (result.text.length > accumulated.length) {
                const addon = result.text.slice(accumulated.length);
                accumulated = result.text;
                flush(addon);
              }
              break;
            }
            console.warn("[saju-stream] generateContent fallback failed", { model, error: result.ok ? "short" : result.error });
          }
        }

        flushTail();

        if (!flushedAny && accumulated.trim().length === 0) {
          console.error("[saju-stream] all paths empty — sending last-resort reading");
          controller.enqueue(TEXT_ENCODER.encode(LAST_RESORT_READING));
        }
      } catch (error) {
        console.error("[saju-stream] unexpected stream error", error);
        if (!flushedAny) {
          try {
            controller.enqueue(TEXT_ENCODER.encode(LAST_RESORT_READING));
          } catch {
            // already closed
          }
        }
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });
}

// --------------------------------------------------------------------- HTTP

function corsHeaders(origin: string | null): Record<string, string> {
  const allowList = Deno.env.get("RELAY_ALLOWED_ORIGINS")?.split(",").map((v) => v.trim()).filter(Boolean);
  const allowed = !allowList?.length || (origin && allowList.includes(origin)) ? origin ?? "*" : "";

  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonError(message: string, status: number, origin: string | null, code?: string) {
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (request.method !== "POST") {
    return jsonError("허용되지 않은 메서드입니다.", 405, origin);
  }
  if (!corsHeaders(origin)["Access-Control-Allow-Origin"]) {
    return jsonError("허용되지 않은 요청 출처입니다.", 403, origin);
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY")?.trim();
  const secret = Deno.env.get("AI_RELAY_SECRET")?.trim();
  if (!apiKey || !secret) {
    console.error("[saju-stream] missing secrets", { hasApiKey: Boolean(apiKey), hasSecret: Boolean(secret) });
    return jsonError("서버 설정이 완료되지 않았습니다.", 500, origin);
  }

  let token: string | undefined;
  try {
    token = ((await request.json()) as { token?: string }).token;
  } catch {
    return jsonError("요청 본문 형식이 올바르지 않습니다.", 400, origin);
  }
  if (!token) {
    return jsonError("요청 토큰이 없습니다.", 400, origin);
  }

  const payload = await verifyRelayToken(token, secret);
  if (!payload) {
    return jsonError("요청 토큰이 만료되었거나 유효하지 않습니다. 다시 시도해 주세요.", 401, origin, "invalid_token");
  }

  const callerSub = readJwtSubject(request.headers.get("authorization"));
  if (!callerSub || callerSub !== payload.sub) {
    return jsonError("인증 정보가 일치하지 않습니다.", 401, origin, "auth_mismatch");
  }

  const deadlineAt = Date.now() + TOTAL_BUDGET_MS;

  // Gemini 연결을 기다리지 않고 즉시 스트림을 연다.
  // 연결/파싱/빈 응답은 스트림 안에서 모델 체인·비스트림·최후 문구로 흡수한다.
  return new Response(buildGuaranteedReadingStream(apiKey, payload, deadlineAt), {
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
});
