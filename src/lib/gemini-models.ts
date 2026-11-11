/**
 * Gemini 모델명은 여기 한 곳에서만 관리한다.
 * Vertex AI(서비스 계정)로 2026-11-11 실제 generateContent 호출해서 확인한 모델만 둔다.
 *   OK : gemini-3.6-flash, gemini-3.5-flash, gemini-3.5-flash-lite, gemini-3.1-flash-lite,
 *        gemini-3.1-pro-preview, gemini-3-flash-preview, gemini-2.5-flash, gemini-2.5-flash-lite
 *   404: gemini-3.6-flash-preview, gemini-3.6-flash-lite, gemini-3.1-flash-lite-preview, gemini-2.5-pro
 */

/** 텍스트 작업 기본 (요약·검증·차트 분석) — 저렴한 모델 */
export const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL?.trim() || "gemini-3.6-flash";

/**
 * 영상 받아쓰기 전용. 3.6-flash는 같은 5분 구간 테스트에서 한 번은 없는 말을 지어냈고(할루시네이션)
 * 다른 한 번은 29.8초가 걸려 Amplify 30초 제한에 걸린다. 3-flash-preview는 정확하고 약 12초.
 */
export const GEMINI_TRANSCRIBE_MODEL = process.env.GEMINI_TRANSCRIBE_MODEL?.trim() || "gemini-3-flash-preview";

/** 하위 호환 (차트 분석 라우트 등) */
export const GEMINI_PRO_MODEL = GEMINI_TEXT_MODEL;
export const GEMINI_FLASH_MODEL = process.env.GEMINI_FALLBACK_MODEL?.trim() || "gemini-3.5-flash";

/** 첫 시도는 기본, 재시도부터는 대체 모델 */
export function modelForAttempt(attempt: number) {
  return attempt >= 2 ? GEMINI_FLASH_MODEL : GEMINI_PRO_MODEL;
}

export function getGeminiModelChain() {
  return Array.from(new Set([GEMINI_PRO_MODEL, GEMINI_FLASH_MODEL]));
}
