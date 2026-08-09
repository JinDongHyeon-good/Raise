/**
 * saju-stream Edge Function 회귀 테스트.
 *
 * Deno나 Supabase를 띄우지 않고 Node에서 index.ts를 그대로 import한 뒤,
 * Deno 전역과 fetch(Gemini)를 스텁으로 갈아끼워 실제 핸들러를 호출한다.
 * tsconfig의 exclude에 supabase/functions가 들어 있어 next build에는 영향이 없다.
 *
 *   node --experimental-strip-types supabase/functions/saju-stream/test.ts
 */
import { signRelayToken } from "../../../src/lib/ai-relay-token.ts";

const SECRET = "shared-secret-abc";
const USER = "user-123";

let handler: ((req: Request) => Promise<Response>) | null = null;
const env: Record<string, string> = { GEMINI_API_KEY: "fake-key", AI_RELAY_SECRET: SECRET };

(globalThis as unknown as { Deno: unknown }).Deno = {
  serve: (h: (req: Request) => Promise<Response>) => {
    handler = h;
  },
  env: { get: (k: string) => env[k] },
};

/** Gemini SSE 응답을 흉내 낸다. chunks 각각이 하나의 텍스트 델타. */
function fakeGeminiSse(chunks: string[], finishReason = "STOP") {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      chunks.forEach((text, i) => {
        const payload = {
          candidates: [
            {
              content: { parts: [{ text }] },
              ...(i === chunks.length - 1 ? { finishReason } : {}),
            },
          ],
        };
        controller.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\r\n\r\n`));
      });
      controller.close();
    },
  });
}

let geminiCalls = 0;
let nextGeminiResponse: () => Response = () =>
  new Response(fakeGeminiSse(["안녕하세요. ", "오늘의 운세는 ", "매우 좋습니다. ".repeat(20), "[END]"]), {
    status: 200,
  });

globalThis.fetch = (async (url: string | URL) => {
  geminiCalls += 1;
  if (!String(url).includes("generativelanguage")) throw new Error(`unexpected fetch: ${url}`);
  return nextGeminiResponse();
}) as typeof fetch;

await import("./index.ts");
if (!handler) throw new Error("Deno.serve handler not registered");
const call = handler as (req: Request) => Promise<Response>;

function fakeJwt(sub: string) {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "HS256" })}.${b64({ sub })}.sig`;
}

async function post(token: string, opts: { sub?: string; origin?: string } = {}) {
  return call(
    new Request("https://x.supabase.co/functions/v1/saju-stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: opts.origin ?? "https://jjindong.com",
        Authorization: `Bearer ${fakeJwt(opts.sub ?? USER)}`,
      },
      body: JSON.stringify({ token }),
    }),
  );
}

const basePayload = {
  v: 1 as const,
  sub: USER,
  kind: "daily",
  prompt: "명식 해석 프롬프트",
  model: "gemini-3.1-pro-preview",
  maxOutputTokens: 4096,
  temperature: 0.7,
  exp: Date.now() + 60_000,
};

const check = (label: string, pass: boolean, detail = "") =>
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);

// 1) OPTIONS 프리플라이트
const pre = await call(
  new Request("https://x/f", { method: "OPTIONS", headers: { Origin: "https://jjindong.com" } }),
);
check("OPTIONS preflight", pre.status === 200 && pre.headers.get("access-control-allow-origin") === "https://jjindong.com");

// 2) 정상 스트리밍
const good = await post(await signRelayToken(basePayload, SECRET));
const text = await good.text();
check("정상 요청 200 + text/plain", good.status === 200 && (good.headers.get("content-type") ?? "").startsWith("text/plain"), `status=${good.status}`);
check("본문 스트리밍됨", text.startsWith("안녕하세요") && text.length > 100, `len=${text.length}`);
check("[END] 마커 제거됨", !text.includes("[END]"), JSON.stringify(text.slice(-25)));
check("CORS 헤더 포함", good.headers.get("access-control-allow-origin") === "https://jjindong.com");

// 3) 위조 토큰
const forged = await post(await signRelayToken({ ...basePayload, prompt: "탈취 프롬프트" }, "attacker-secret"));
check("다른 시크릿으로 서명한 토큰 거부", forged.status === 401, `status=${forged.status}`);

// 4) 만료 토큰
const expired = await post(await signRelayToken({ ...basePayload, exp: Date.now() - 1 }, SECRET));
check("만료 토큰 거부", expired.status === 401);

// 5) 다른 사용자의 JWT로 사용
const stolen = await post(await signRelayToken(basePayload, SECRET), { sub: "someone-else" });
check("토큰 주인이 아닌 JWT 거부", stolen.status === 401, `status=${stolen.status}`);

// 6) 오리진 허용 목록
env.RELAY_ALLOWED_ORIGINS = "https://jjindong.com";
const badOrigin = await post(await signRelayToken(basePayload, SECRET), { origin: "https://evil.com" });
check("허용 목록 밖 오리진 차단", badOrigin.status === 403, `status=${badOrigin.status}`);
delete env.RELAY_ALLOWED_ORIGINS;

// 7) MAX_TOKENS 이어쓰기
geminiCalls = 0;
let round = 0;
nextGeminiResponse = () => {
  round += 1;
  return round === 1
    ? new Response(fakeGeminiSse(["앞부분입니다. ".repeat(20)], "MAX_TOKENS"), { status: 200 })
    : new Response(fakeGeminiSse(["뒷부분으로 마무리합니다.[END]"], "STOP"), { status: 200 });
};
const cont = await post(await signRelayToken(basePayload, SECRET));
const contText = await cont.text();
check("MAX_TOKENS면 이어쓰기 호출", geminiCalls === 2, `calls=${geminiCalls}`);
check("이어쓴 내용이 합쳐짐", contText.includes("앞부분") && contText.includes("뒷부분으로 마무리합니다."), `tail=${JSON.stringify(contText.slice(-20))}`);

// 8) 쿼터 초과 — 인증 후에는 JSON 에러가 아니라 항상 본문이 나가야 한다(빈 스트림 → UI 에러 방지).
round = 0;
nextGeminiResponse = () =>
  new Response(JSON.stringify({ error: { message: "Quota exceeded, retry in 27.5s" } }), { status: 429 });
const quota = await post(await signRelayToken(basePayload, SECRET));
const quotaText = await quota.text();
check(
  "쿼터 초과여도 200 + 최후 안내문",
  quota.status === 200 && quotaText.includes("다시 풀이하기"),
  `status=${quota.status} len=${quotaText.length}`,
);

// 9) 모델 폴백
round = 0;
geminiCalls = 0;
nextGeminiResponse = () => {
  round += 1;
  return round === 1
    ? new Response(JSON.stringify({ error: { message: "models/x is not found" } }), { status: 404 })
    : new Response(fakeGeminiSse(["폴백 모델 응답입니다. ".repeat(15), "[END]"]), { status: 200 });
};
const fallback = await post(await signRelayToken({ ...basePayload, fallbackModel: "gemini-flash-latest" }, SECRET));
const fallbackText = await fallback.text();
check("1순위 모델 404면 폴백 모델로", fallback.status === 200 && fallbackText.includes("폴백 모델"), `calls=${geminiCalls}`);

// 10) thought 파트는 화면으로 나가면 안 된다 + thinkingLevel 전달 확인
let sentBody: Record<string, unknown> = {};
globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
  sentBody = JSON.parse(String(init?.body));
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(c) {
        const ev = (parts: unknown[], finishReason?: string) =>
          c.enqueue(enc.encode(`data: ${JSON.stringify({ candidates: [{ content: { parts }, ...(finishReason ? { finishReason } : {}) }] })}\r\n\r\n`));
        ev([{ text: "사용자에게 보이면 안 되는 추론 과정입니다. ".repeat(5), thought: true }]);
        ev([{ text: "실제 해석 본문입니다. ".repeat(20) }]);
        ev([{ text: "[END]" }], "STOP");
        c.close();
      },
    }),
    { status: 200 },
  );
}) as typeof fetch;

const thoughtRes = await post(await signRelayToken(basePayload, SECRET));
const thoughtText = await thoughtRes.text();
check("thought 파트가 화면에 안 나감", !thoughtText.includes("추론 과정"), `len=${thoughtText.length}`);
check("본문은 정상 전달", thoughtText.includes("실제 해석 본문입니다."));
check(
  "thinkingLevel=LOW 전송",
  (sentBody.generationConfig as { thinkingConfig?: { thinkingLevel?: string } })?.thinkingConfig?.thinkingLevel === "LOW",
  JSON.stringify((sentBody.generationConfig as Record<string, unknown>)?.thinkingConfig),
);
