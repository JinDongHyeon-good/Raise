export type AuthErrorTranslator = (key: string) => string;

export function mapAuthErrorMessage(
  error: { message?: string } | null,
  t: AuthErrorTranslator,
  fallbackKey = "errors.fallback",
) {
  const raw = error?.message?.trim() ?? "";
  const msg = raw.toLowerCase();

  if (!raw) return t(fallbackKey);

  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
    return t("errors.invalidCredentials");
  }
  if (msg.includes("email not confirmed")) {
    return t("errors.emailNotConfirmed");
  }
  if (msg.includes("user already registered") || msg.includes("already been registered")) {
    return t("errors.alreadyRegistered");
  }
  if (msg.includes("password should be at least")) {
    return t("errors.passwordTooShort");
  }
  if (msg.includes("signup is disabled")) {
    return t("errors.signupDisabled");
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return t("errors.rateLimit");
  }
  if (msg.includes("email address") && msg.includes("invalid")) {
    return t("errors.invalidEmail");
  }
  if (msg.includes("same as the old password")) {
    return t("errors.samePassword");
  }
  if (msg.includes("session") && msg.includes("expired")) {
    return t("errors.sessionExpired");
  }

  return raw;
}
