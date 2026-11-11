/**
 * Supabase Auth 에러 → 메시지 키 (messages/<locale>/auth.json 의 "errors" 아래)
 * 화면에서는 `t(getAuthErrorKey(error), { min: 8 })` 로 쓴다 (passwordTooShort 가 {min} 을 쓴다).
 */
export type AuthErrorKey =
  | "errors.generic"
  | "errors.invalidCredentials"
  | "errors.emailNotConfirmed"
  | "errors.alreadyRegistered"
  | "errors.passwordTooShort"
  | "errors.signupDisabled"
  | "errors.rateLimited"
  | "errors.invalidEmail";

export function getAuthErrorKey(error: { message?: string } | null, fallback: AuthErrorKey = "errors.generic"): AuthErrorKey {
  const raw = error?.message?.trim() ?? "";
  const msg = raw.toLowerCase();
  if (!raw) return fallback;
  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) return "errors.invalidCredentials";
  if (msg.includes("email not confirmed")) return "errors.emailNotConfirmed";
  if (msg.includes("already registered") || msg.includes("already been registered")) return "errors.alreadyRegistered";
  if (msg.includes("password should be at least")) return "errors.passwordTooShort";
  if (msg.includes("signup is disabled")) return "errors.signupDisabled";
  if (msg.includes("rate limit") || msg.includes("too many requests")) return "errors.rateLimited";
  if (msg.includes("email address") && msg.includes("invalid")) return "errors.invalidEmail";
  return fallback;
}
