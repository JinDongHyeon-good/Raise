/**
 * Gemini 모델 설정 단일 소스.
 *
 * 주의: 구버전 모델(gemini-2.0-*, gemini-2.5-*, gemini-3-* 등)은 Google에서 순차적으로
 * 은퇴(404 NOT_FOUND)되고 있다. 모델명을 코드 여기저기 하드코딩하지 말고 이 파일만 고칠 것.
 * 사용 가능한 모델 확인:
 *   curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
 */

/** 현재 유효한 최신 모델 */
export const LATEST_GEMINI_MODEL = "gemini-3.1-pro-preview";

/**
 * Pro thinking 지연/타임아웃 시 쓸 기본 폴백.
 * Flash도 thinking이 있지만 대체로 TTFB가 더 짧다.
 */
export const DEFAULT_GEMINI_FALLBACK_MODEL = "gemini-3.5-flash";

/** AI 호출 실패 시 최대 시도 횟수 (최초 1회 + 재시도 2회) */
export const MAX_MODEL_ATTEMPTS = 3;

function clean(value?: string) {
  const trimmed = value?.trim().replace(/^['"]|['"]$/g, "");
  return trimmed || undefined;
}

/**
 * 시도 순서대로 사용할 모델 목록.
 * 환경변수로 덮어쓸 수 있고, 중복은 제거한다.
 * 폴백 env가 없으면 DEFAULT_GEMINI_FALLBACK_MODEL을 붙인다(primary와 같으면 생략).
 */
export function getGeminiModelChain(options?: { modelEnv?: string; fallbackEnv?: string }): string[] {
  const primary = clean(options?.modelEnv) ?? clean(process.env.GEMINI_MODEL) ?? LATEST_GEMINI_MODEL;
  const fallback =
    clean(options?.fallbackEnv) ?? clean(process.env.GEMINI_FALLBACK_MODEL) ?? DEFAULT_GEMINI_FALLBACK_MODEL;

  const chain = [primary, ...(fallback && fallback !== primary ? [fallback] : [])];
  return Array.from(new Set(chain));
}

/** attempt(1-base)에 사용할 모델. 체인을 다 쓰면 마지막 모델로 계속 재시도한다. */
export function modelForAttempt(chain: string[], attempt: number): string {
  if (chain.length === 0) return LATEST_GEMINI_MODEL;
  return chain[Math.min(attempt - 1, chain.length - 1)];
}
