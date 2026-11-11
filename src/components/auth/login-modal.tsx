"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { localizedPath, type RoutedLocale } from "@/i18n/routing";
import { getAuthErrorKey } from "@/lib/auth-errors";
import { getAuthCallbackUrl } from "@/lib/auth-urls";
import { ensureUserProfileClient } from "@/lib/ensure-user-profile-client";
import { getSupabaseBrowserClientSafe } from "@/lib/supabase-safe";

type Mode = "login" | "signup" | "reset" | "findId";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

const TITLE_KEYS = {
  login: "login",
  signup: "signup",
  reset: "findPassword",
  findId: "findId",
} as const satisfies Record<Mode, string>;

const SUBMIT_KEYS = {
  login: "submitLogin",
  signup: "submitSignup",
  reset: "submitReset",
  findId: "findId",
} as const satisfies Record<Mode, string>;

const inputClass =
  "w-full rounded-lg border border-[var(--rz-line)] bg-[var(--rz-bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--rz-accent)]";
const primaryClass =
  "w-full rounded-lg bg-[var(--rz-accent)] px-4 py-2.5 text-sm font-medium text-[var(--rz-accent-fg)] disabled:opacity-60";

export function LoginModal({
  open,
  onClose,
  onAuthenticated,
}: {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void | Promise<void>;
}) {
  const t = useTranslations("auth");
  const locale = useLocale() as RoutedLocale;
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  /** 이메일 인증 메일을 다시 보낼 수 있는 상태 (가입 직후·미인증 로그인) */
  const [canResend, setCanResend] = useState(false);
  const [foundId, setFoundId] = useState<{ email: string; provider: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const supabase = getSupabaseBrowserClientSafe();
  const trimmedEmail = email.trim().toLowerCase();
  const authError = (err: { message?: string } | null) => t(getAuthErrorKey(err), { min: MIN_PASSWORD });
  const confirmMismatch = mode === "signup" && passwordConfirm.length > 0 && password !== passwordConfirm;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setInfo(null);
    setCanResend(false);
    setFoundId(null);
    setPassword("");
    setPasswordConfirm("");
  };

  const google = async () => {
    setError(null);
    if (!supabase) return setError(t("errors.configMissing"));
    setBusy(true);
    const next = `${window.location.pathname}${window.location.search}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getAuthCallbackUrl(next) },
    });
    if (oauthError) {
      setError(authError(oauthError));
      setBusy(false);
    }
  };

  const resendConfirmation = async () => {
    if (!supabase || !EMAIL_PATTERN.test(trimmedEmail)) return;
    setBusy(true);
    setError(null);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: trimmedEmail,
      options: { emailRedirectTo: getAuthCallbackUrl(window.location.pathname) },
    });
    setBusy(false);
    if (resendError) setError(authError(resendError));
    else setInfo(t("info.resent"));
  };

  const submitLogin = async () => {
    if (!supabase) return setError(t("errors.configMissing"));
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
    if (signInError) {
      if (signInError.message.toLowerCase().includes("email not confirmed")) setCanResend(true);
      throw signInError;
    }
    if (data.user) await ensureUserProfileClient(supabase, data.user.id, data.user).catch(() => undefined);
    await onAuthenticated();
  };

  const submitSignup = async () => {
    if (!supabase) return setError(t("errors.configMissing"));
    if (password !== passwordConfirm) return setError(t("errors.passwordMismatchRetry"));
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { emailRedirectTo: getAuthCallbackUrl(window.location.pathname) },
    });
    if (signUpError) throw signUpError;
    // 이미 가입된 이메일이면 Supabase는 에러 대신 identities가 빈 사용자를 돌려준다
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setError(t("errors.alreadyRegisteredSignup"));
      return;
    }
    if (data.session && data.user) {
      await ensureUserProfileClient(supabase, data.user.id, data.user).catch(() => undefined);
      await onAuthenticated();
      return;
    }
    setCanResend(true);
    setInfo(t("info.verificationSent", { email: trimmedEmail }));
  };

  const submitReset = async () => {
    if (!supabase) return setError(t("errors.configMissing"));
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: getAuthCallbackUrl(localizedPath("/auth/reset-password", locale)),
    });
    // 가입 여부를 알려 주지 않도록 성공·실패 모두 같은 안내 (요청 한도 초과만 따로)
    if (resetError && resetError.message.toLowerCase().includes("rate limit")) throw resetError;
    setInfo(t("info.resetSent"));
  };

  const submitFindId = async () => {
    const res = await fetch("/api/auth/find-id", {
      method: "POST",
      headers: { "content-type": "application/json", "x-ui-locale": locale },
      body: JSON.stringify({ nickname: nickname.trim() }),
    });
    const data = (await res.json().catch(() => ({}))) as { found?: boolean; email?: string; provider?: string; error?: string };
    if (!res.ok) return setError(data.error ?? t("errors.findIdFailed"));
    if (!data.found || !data.email) return setError(t("errors.nicknameNotFound"));
    setFoundId({ email: data.email, provider: data.provider ?? "email" });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setFoundId(null);
    if (mode === "findId") {
      if (nickname.trim().length < 2) return setError(t("errors.nicknameTooShort"));
    } else {
      if (!EMAIL_PATTERN.test(trimmedEmail)) return setError(t("errors.invalidEmail"));
      if ((mode === "login" || mode === "signup") && password.length < MIN_PASSWORD) {
        return setError(t("errors.passwordTooShort", { min: MIN_PASSWORD }));
      }
    }
    setBusy(true);
    try {
      if (mode === "login") await submitLogin();
      if (mode === "signup") await submitSignup();
      if (mode === "reset") await submitReset();
      if (mode === "findId") await submitFindId();
    } catch (err) {
      setError(authError(err instanceof Error ? err : null));
    } finally {
      setBusy(false);
    }
  };

  const submitLabel = busy ? t("processing") : t(SUBMIT_KEYS[mode]);

  return (
    <div
      className="raise-app fixed inset-0 z-[300] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t(TITLE_KEYS[mode])}
        className="max-h-[92dvh] w-full max-w-sm overflow-y-auto rounded-t-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-[var(--rz-text)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold">{t(TITLE_KEYS[mode])}</p>
            <p className="mt-1 text-xs text-[var(--rz-muted)]">
              {mode === "reset" ? t("subtitleReset") : mode === "findId" ? t("subtitleFindId") : t("subtitleLogin")}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={t("close")} className="text-xl leading-none text-[var(--rz-muted)]">
            ×
          </button>
        </div>

        {mode === "login" || mode === "signup" ? (
          <>
            <button
              type="button"
              onClick={() => void google()}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 disabled:opacity-60"
            >
              <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
              </svg>
              {t("continueWithGoogle")}
            </button>

            <div className="my-4 flex items-center gap-3 text-[11px] text-[var(--rz-muted)]">
              <span className="h-px flex-1 bg-[var(--rz-line)]" />
              {t("orEmail")}
              <span className="h-px flex-1 bg-[var(--rz-line)]" />
            </div>
          </>
        ) : null}

        <form onSubmit={submit} className="space-y-2.5" noValidate>
          {mode === "findId" ? (
            <input
              type="text"
              autoComplete="nickname"
              placeholder={t("nickname")}
              aria-label={t("nickname")}
              value={nickname}
              maxLength={16}
              onChange={(e) => setNickname(e.target.value)}
              className={inputClass}
            />
          ) : (
            <input
              type="email"
              autoComplete="email"
              placeholder={t("email")}
              aria-label={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          )}

          {mode === "login" || mode === "signup" ? (
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={t("passwordPlaceholder", { min: MIN_PASSWORD })}
              aria-label={t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          ) : null}

          {mode === "signup" ? (
            <>
              <input
                type="password"
                autoComplete="new-password"
                placeholder={t("passwordConfirm")}
                aria-label={t("passwordConfirm")}
                aria-invalid={confirmMismatch}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className={`${inputClass} ${confirmMismatch ? "border-[var(--rz-up)]" : ""}`}
              />
              {confirmMismatch ? <p className="text-xs text-[var(--rz-up)]">{t("passwordMismatch")}</p> : null}
              {!confirmMismatch && passwordConfirm.length >= MIN_PASSWORD && password === passwordConfirm ? (
                <p className="text-xs text-emerald-400">{t("passwordMatch")}</p>
              ) : null}
            </>
          ) : null}

          {error ? <p className="text-xs leading-5 text-[var(--rz-up)]">{error}</p> : null}
          {info ? <p className="text-xs leading-5 text-emerald-400">{info}</p> : null}

          {foundId ? (
            <div className="rounded-lg border border-[var(--rz-line)] bg-[var(--rz-bg)] p-3 text-sm">
              <p className="text-xs text-[var(--rz-muted)]">{t("foundIdLabel")}</p>
              <p className="mt-0.5 font-mono">{foundId.email}</p>
              {foundId.provider === "google" ? (
                <p className="mt-1 text-xs text-[var(--rz-muted)]">{t("foundIdGoogle")}</p>
              ) : null}
            </div>
          ) : null}

          {canResend ? (
            <button
              type="button"
              onClick={() => void resendConfirmation()}
              disabled={busy}
              className="w-full rounded-lg border border-[var(--rz-line)] px-4 py-2 text-xs text-[var(--rz-muted)] hover:text-[var(--rz-text)] disabled:opacity-60"
            >
              {t("resendVerification")}
            </button>
          ) : null}

          <button type="submit" disabled={busy || confirmMismatch} className={primaryClass}>
            {submitLabel}
          </button>
        </form>

        <div className="mt-4 space-y-2 text-center text-xs text-[var(--rz-muted)]">
          {mode === "login" ? (
            <>
              <p>
                <button type="button" onClick={() => switchMode("findId")} className="hover:text-[var(--rz-text)]">
                  {t("findId")}
                </button>
                <span className="mx-2 text-[var(--rz-line-strong)]">|</span>
                <button type="button" onClick={() => switchMode("reset")} className="hover:text-[var(--rz-text)]">
                  {t("findPassword")}
                </button>
              </p>
              <p>
                {t("noAccount")}{" "}
                <button type="button" onClick={() => switchMode("signup")} className="text-[var(--rz-text)] underline">
                  {t("signup")}
                </button>
              </p>
            </>
          ) : mode === "signup" ? (
            <p>
              {t("haveAccount")}{" "}
              <button type="button" onClick={() => switchMode("login")} className="text-[var(--rz-text)] underline">
                {t("login")}
              </button>
            </p>
          ) : (
            <p>
              {mode === "findId" ? (
                <button type="button" onClick={() => switchMode("reset")} className="mr-3 hover:text-[var(--rz-text)]">
                  {t("findPassword")}
                </button>
              ) : (
                <button type="button" onClick={() => switchMode("findId")} className="mr-3 hover:text-[var(--rz-text)]">
                  {t("findId")}
                </button>
              )}
              <button type="button" onClick={() => switchMode("login")} className="text-[var(--rz-text)] underline">
                {t("backToLogin")}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
