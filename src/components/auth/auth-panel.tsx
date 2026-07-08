"use client";

import { useState } from "react";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { getLocalizedBrandName } from "@/lib/brand";
import { mapAuthErrorMessage } from "@/lib/auth-errors";
import { getAuthCallbackUrl, getPasswordResetUrl } from "@/lib/auth-urls";
import { getPublicSiteOrigin } from "@/lib/site-origin";
import { getSupabaseBrowserClientSafe } from "@/lib/supabase-safe";

export type AuthMode = "login" | "signup" | "forgot";

type AuthPanelProps = {
  initialMode?: AuthMode;
  nextPath?: string;
  onAuthenticated?: () => void | Promise<void>;
  onClose?: () => void;
  showCloseButton?: boolean;
  showHeader?: boolean;
  /** 모바일(sm 미만)에서 Google 로그인 숨김 — 로그인 모달용 */
  hideGoogleOnMobile?: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function AuthPanel({
  initialMode = "login",
  nextPath = "/",
  onAuthenticated,
  onClose,
  showCloseButton = false,
  showHeader = true,
  hideGoogleOnMobile = false,
}: AuthPanelProps) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const brandName = getLocalizedBrandName(locale);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setShowEmailForm(false);
    resetMessages();
    setPassword("");
    setPasswordConfirm("");
  };

  const handleGoogleSignIn = async () => {
    resetMessages();
    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowserClientSafe();
      if (!supabase) {
        throw new Error(t("errors.configLoadFailed"));
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: getAuthCallbackUrl(nextPath) },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(mapAuthErrorMessage(err instanceof Error ? err : null, t, "errors.googleFailed"));
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError(t("errors.invalidEmail"));
      return;
    }
    if (password.length < 8) {
      setError(t("errors.passwordTooShort"));
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClientSafe();
      if (!supabase) {
        throw new Error(t("errors.configLoadFailed"));
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signInError) throw signInError;
      if (!data.session) {
        throw new Error(t("errors.sessionCreateFailed"));
      }

      await onAuthenticated?.();
    } catch (err) {
      setError(mapAuthErrorMessage(err instanceof Error ? err : null, t, "errors.loginFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError(t("errors.invalidEmail"));
      return;
    }
    if (password.length < 8) {
      setError(t("errors.passwordTooShort"));
      return;
    }
    if (password !== passwordConfirm) {
      setError(t("errors.passwordMismatch"));
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClientSafe();
      if (!supabase) {
        throw new Error(t("errors.signupConfigFailed"));
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(nextPath),
        },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        setInfo(t("info.signupComplete"));
        await onAuthenticated?.();
        return;
      }

      setInfo(t("info.verificationSent"));
      setPassword("");
      setPasswordConfirm("");
    } catch (err) {
      setError(mapAuthErrorMessage(err instanceof Error ? err : null, t, "errors.signupFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError(t("errors.invalidEmail"));
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClientSafe();
      if (!supabase) {
        throw new Error(t("errors.forgotConfigFailed"));
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: getPasswordResetUrl(),
      });
      if (resetError) throw resetError;

      setInfo(t("info.resetSent"));
    } catch (err) {
      setError(mapAuthErrorMessage(err instanceof Error ? err : null, t, "errors.forgotFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    resetMessages();
    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError(t("errors.resendNeedsEmail"));
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClientSafe();
      if (!supabase) {
        throw new Error(t("errors.resendConfigFailed"));
      }

      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: trimmedEmail,
        options: { emailRedirectTo: getAuthCallbackUrl(nextPath) },
      });
      if (resendError) throw resendError;

      setInfo(t("info.verificationResent"));
    } catch (err) {
      setError(mapAuthErrorMessage(err instanceof Error ? err : null, t, "errors.resendFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const modeTitle =
    mode === "login" ? t("login") : mode === "signup" ? t("emailSignup") : t("forgotPassword");

  const showGoogleOption = mode !== "forgot";
  const googleOptionClassName =
    mode === "signup" || (hideGoogleOnMobile && mode === "login") ? "max-sm:hidden" : "";

  return (
    <div className="relative w-full max-w-sm">
      {showCloseButton && onClose ? (
        <button
          type="button"
          aria-label={tc("close")}
          onClick={onClose}
          className="absolute right-0 top-0 z-10 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
        >
          ✕
        </button>
      ) : null}

      {showHeader ? (
        <div className="pb-4 text-center">
          <p className="font-brand-display text-[2rem] leading-none tracking-tight text-slate-900 sm:text-[2.25rem]">
            {brandName}
          </p>
          <p className="mt-2 text-sm text-slate-500">{modeTitle}</p>
        </div>
      ) : null}

      <div className="space-y-4">
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        {info ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{info}</p>
        ) : null}

        {mode === "login" && !showEmailForm ? (
          <button
            type="button"
            onClick={() => setShowEmailForm(true)}
            disabled={isLoading}
            className="w-full rounded-xl bg-slate-800 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {t("emailLogin")}
          </button>
        ) : null}

        {mode === "login" && showEmailForm ? (
          <form className="space-y-3" onSubmit={(event) => void handleEmailLogin(event)}>
            <button
              type="button"
              onClick={() => {
                setShowEmailForm(false);
                resetMessages();
                setPassword("");
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              {t("otherLogin")}
            </button>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600">{t("email")}</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                placeholder={t("emailPlaceholder")}
                required
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600">{t("password")}</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                placeholder={t("passwordPlaceholder")}
                minLength={8}
                required
              />
            </label>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
              >
                {t("forgotPassword")}
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-slate-800 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {isLoading ? tc("processing") : t("emailLogin")}
            </button>
          </form>
        ) : null}

        {mode === "signup" && !showEmailForm ? (
          <button
            type="button"
            onClick={() => setShowEmailForm(true)}
            disabled={isLoading}
            className="w-full rounded-xl bg-slate-800 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {t("signupAction")}
          </button>
        ) : null}

        {mode === "signup" && showEmailForm ? (
          <form className="space-y-3" onSubmit={(event) => void handleEmailSignup(event)}>
            <button
              type="button"
              onClick={() => {
                setShowEmailForm(false);
                resetMessages();
                setPassword("");
                setPasswordConfirm("");
              }}
              className="hidden text-xs font-medium text-slate-500 hover:text-slate-800 sm:inline"
            >
              {t("otherSignup")}
            </button>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600">{t("email")}</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                placeholder={t("emailPlaceholder")}
                required
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600">{t("password")}</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                placeholder={t("passwordPlaceholder")}
                minLength={8}
                required
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600">{t("passwordConfirm")}</span>
              <input
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                placeholder={t("passwordConfirmPlaceholder")}
                minLength={8}
                required
              />
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-slate-800 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {isLoading ? tc("processing") : t("signupAction")}
            </button>
            {info ? (
              <button
                type="button"
                onClick={() => void handleResendVerification()}
                disabled={isLoading}
                className="w-full text-xs font-medium text-slate-600 hover:underline disabled:opacity-60"
              >
                {t("resendVerification")}
              </button>
            ) : null}
          </form>
        ) : null}

        {mode === "forgot" ? (
          <form className="space-y-3" onSubmit={(event) => void handleForgotPassword(event)}>
            <p className="text-xs leading-5 text-slate-500">{t("forgotHint")}</p>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600">{t("email")}</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                placeholder={t("emailPlaceholder")}
                required
              />
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-slate-800 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {isLoading ? tc("processing") : t("resetEmail")}
            </button>
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="w-full text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              {t("backToLogin")}
            </button>
          </form>
        ) : null}

        {showGoogleOption ? (
          <div className={googleOptionClassName}>
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">{tc("or")}</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={isLoading}
              className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-70"
            >
              <GoogleIcon />
              {isLoading ? t("moving") : t("googleContinue")}
            </button>
          </div>
        ) : null}

        {mode === "login" ? (
          <p className="text-center text-xs text-slate-500">
            {t("noAccount")}{" "}
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="font-semibold text-slate-700 hover:underline"
            >
              {t("emailSignup")}
            </button>
          </p>
        ) : null}

        {mode === "signup" ? (
          <p className="text-center text-xs text-slate-500">
            {t("hasAccount")}{" "}
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="font-semibold text-slate-700 hover:underline"
            >
              {t("login")}
            </button>
          </p>
        ) : null}

        <p className="text-center text-[11px] leading-5 text-slate-400">
          {t("redirectNote", { origin: getPublicSiteOrigin() })}
        </p>
      </div>
    </div>
  );
}

export function AuthPanelCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-50 to-transparent" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function AuthPageLinks() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");

  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs">
      <Link href="/auth/login" className="text-slate-700 hover:underline">
        {t("authLinksLogin")}
      </Link>
      <Link href="/auth/signup" className="text-slate-700 hover:underline">
        {t("authLinksSignup")}
      </Link>
      <Link href="/auth/forgot-password" className="text-slate-700 hover:underline">
        {t("authLinksForgot")}
      </Link>
      <Link href="/" className="text-slate-500 hover:underline">
        {tc("homeLink")}
      </Link>
    </div>
  );
}
