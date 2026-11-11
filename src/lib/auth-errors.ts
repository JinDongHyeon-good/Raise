/** Supabase Auth 에러 → 한국어 메시지 */
export function mapAuthErrorMessage(error: { message?: string } | null, fallback = "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.") {
  const raw = error?.message?.trim() ?? "";
  const msg = raw.toLowerCase();
  if (!raw) return fallback;
  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) return "이메일 또는 비밀번호가 올바르지 않아요.";
  if (msg.includes("email not confirmed")) return "이메일 인증이 아직 안 됐어요. 메일함을 확인해 주세요.";
  if (msg.includes("already registered") || msg.includes("already been registered")) return "이미 가입된 이메일이에요. 로그인해 주세요.";
  if (msg.includes("password should be at least")) return "비밀번호는 8자 이상이어야 해요.";
  if (msg.includes("signup is disabled")) return "현재 회원가입이 막혀 있어요.";
  if (msg.includes("rate limit") || msg.includes("too many requests")) return "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.";
  if (msg.includes("email address") && msg.includes("invalid")) return "이메일 형식이 올바르지 않아요.";
  return fallback;
}
