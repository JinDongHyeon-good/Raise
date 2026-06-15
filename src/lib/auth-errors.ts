export function mapAuthErrorMessage(error: { message?: string } | null, fallback = "요청 처리 중 오류가 발생했습니다.") {
  const raw = error?.message?.trim() ?? "";
  const msg = raw.toLowerCase();

  if (!raw) return fallback;

  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (msg.includes("email not confirmed")) {
    return "이메일 인증이 완료되지 않았습니다. 메일함의 인증 링크를 확인해 주세요.";
  }
  if (msg.includes("user already registered") || msg.includes("already been registered")) {
    return "이미 가입된 이메일입니다. 로그인하거나 비밀번호 찾기를 이용해 주세요.";
  }
  if (msg.includes("password should be at least")) {
    return "비밀번호는 8자 이상이어야 합니다.";
  }
  if (msg.includes("signup is disabled")) {
    return "현재 이메일 가입이 비활성화되어 있습니다.";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (msg.includes("email address") && msg.includes("invalid")) {
    return "올바른 이메일 주소를 입력해 주세요.";
  }
  if (msg.includes("same as the old password")) {
    return "새 비밀번호는 기존 비밀번호와 달라야 합니다.";
  }
  if (msg.includes("session") && msg.includes("expired")) {
    return "비밀번호 재설정 링크가 만료되었습니다. 비밀번호 찾기를 다시 시도해 주세요.";
  }

  return raw;
}
