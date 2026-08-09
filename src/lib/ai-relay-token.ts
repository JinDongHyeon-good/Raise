/**
 * AI 릴레이 토큰.
 *
 * Amplify Hosting은 SSR/API 응답을 30초에서 강제로 끊고(조정 불가) Next.js 스트리밍도 지원하지 않는다.
 * 그래서 오래 걸리는 Gemini 호출만 Supabase Edge Function으로 넘기는데, 그 함수가 임의의 프롬프트를
 * 실행하는 공짜 Gemini 게이트웨이가 되면 안 된다.
 *
 * 해결: Next.js 서버가 프롬프트를 만들고 HMAC으로 서명한 짧은 수명의 토큰을 발급한다.
 * Edge Function은 같은 시크릿으로 서명을 검증한 뒤에만 프롬프트를 실행한다.
 * 클라이언트는 토큰을 전달만 할 뿐 내용을 바꿀 수 없다.
 *
 * 주의: 이 파일의 검증 로직은 supabase/functions/saju-stream/index.ts에도 같은 형태로 들어 있다.
 * (Edge Function은 대시보드에 그대로 붙여넣을 수 있도록 의존성 없는 단일 파일로 유지한다.)
 * 토큰 형식을 바꾸면 양쪽을 같이 고칠 것.
 */

const encoder = new TextEncoder();

export type RelayTokenPayload = {
  /** 토큰 형식 버전 */
  v: 1;
  /** Supabase user id. Edge Function이 호출자 JWT의 sub와 대조한다. */
  sub: string;
  kind: string;
  prompt: string;
  /** 1순위 모델 */
  model: string;
  /** 1순위 모델이 열리지 않을 때 쓸 모델 */
  fallbackModel?: string;
  maxOutputTokens: number;
  temperature: number;
  /** 만료 시각(epoch ms) */
  exp: number;
};

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  // ArrayBuffer를 명시적으로 넘겨야 crypto.subtle이 요구하는 BufferSource로 좁혀진다.
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function importHmacKey(secret: string) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function signRelayToken(payload: RelayTokenPayload, secret: string): Promise<string> {
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const key = await importHmacKey(secret);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(body)));
  return `${body}.${base64UrlEncode(signature)}`;
}

export async function verifyRelayToken(token: string, secret: string): Promise<RelayTokenPayload | null> {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const key = await importHmacKey(secret);
  let valid = false;
  try {
    valid = await crypto.subtle.verify("HMAC", key, base64UrlDecode(signature), encoder.encode(body));
  } catch {
    return null;
  }
  if (!valid) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as RelayTokenPayload;
    if (payload.v !== 1 || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (typeof payload.prompt !== "string" || !payload.prompt) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * 릴레이 설정. 둘 중 하나라도 없으면 Next.js 안에서 직접 Gemini를 호출하는
 * 기존 경로로 자동 폴백한다(로컬 개발 · Edge Function 배포 전).
 */
export function getRelayConfig(): { url: string; secret: string } | null {
  const url = process.env.NEXT_PUBLIC_SAJU_RELAY_URL?.trim();
  const secret = process.env.AI_RELAY_SECRET?.trim();
  if (!url || !secret) return null;
  return { url, secret };
}
