/**
 * Gemini 모델명은 여기 한 곳에서만 관리한다.
 * Vertex AI(서비스 계정)로 2026-11-11 실제 generateContent 호출해서 확인한 모델만 둔다.
 * 확인됨: gemini-3.1-pro-preview, gemini-3-flash-preview, gemini-2.5-flash (global)
 * 404: gemini-2.5-pro
 */
export const GEMINI_PRO_MODEL = process.env.GEMINI_VERTEX_MODEL?.trim() || "gemini-3.1-pro-preview";
export const GEMINI_FLASH_MODEL = process.env.GEMINI_VERTEX_FALLBACK_MODEL?.trim() || "gemini-3-flash-preview";

/** 첫 시도는 pro, 재시도부터는 flash */
export function modelForAttempt(attempt: number) {
  return attempt >= 2 ? GEMINI_FLASH_MODEL : GEMINI_PRO_MODEL;
}

export function getGeminiModelChain() {
  return Array.from(new Set([GEMINI_PRO_MODEL, GEMINI_FLASH_MODEL]));
}
