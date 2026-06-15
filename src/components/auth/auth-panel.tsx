"use client";

import { useState } from "react";
import Link from "next/link";
import { SERVICE_NAME } from "@/lib/brand";
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
}: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
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
        throw new Error("로그인 설정을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.");
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: getAuthCallbackUrl(nextPath) },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(mapAuthErrorMessage(err instanceof Error ? err : null, "Google 로그인 요청에 실패했습니다."));
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClientSafe();
      if (!supabase) {
        throw new Error("로그인 설정을 불러올 수 없습니다.");
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signInError) throw signInError;
      if (!data.session) {
        throw new Error("로그인 세션을 만들지 못했습니다.");
      }

      await onAuthenticated?.();
    } catch (err) {
      setError(mapAuthErrorMessage(err instanceof Error ? err : null, "로그인에 실패했습니다."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClientSafe();
      if (!supabase) {
        throw new Error("회원가입 설정을 불러올 수 없습니다.");
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
        setInfo("가입이 완료되었습니다.");
        await onAuthenticated?.();
        return;
      }

      setInfo("인증 메일을 보냈습니다. 메일함에서 링크를 눌러 가입을 완료해 주세요.");
      setPassword("");
      setPasswordConfirm("");
    } catch (err) {
      setError(mapAuthErrorMessage(err instanceof Error ? err : null, "회원가입에 실패했습니다."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();

    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClientSafe();
      if (!supabase) {
        throw new Error("비밀번호 찾기 설정을 불러올 수 없습니다.");
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: getPasswordResetUrl(),
      });
      if (resetError) throw resetError;

      setInfo("비밀번호 재설정 메일을 보냈습니다. 메일함을 확인해 주세요.");
    } catch (err) {
      setError(mapAuthErrorMessage(err instanceof Error ? err : null, "비밀번호 찾기에 실패했습니다."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    resetMessages();
    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("인증 메일을 다시 받으려면 이메일을 입력해 주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClientSafe();
      if (!supabase) {
        throw new Error("인증 메일 설정을 불러올 수 없습니다.");
      }

      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: trimmedEmail,
        options: { emailRedirectTo: getAuthCallbackUrl(nextPath) },
      });
      if (resendError) throw resendError;

      setInfo("인증 메일을 다시 보냈습니다.");
    } catch (err) {
      setError(mapAuthErrorMessage(err instanceof Error ? err : null, "인증 메일 재전송에 실패했습니다."));
    } finally {
      setIsLoading(false);
    }
  };

  const modeTitle =
    mode === "login" ? "로그인" : mode === "signup" ? "이메일 가입" : "비밀번호 찾기";

  return (
    <div className="relative w-full max-w-sm">
      {showCloseButton && onClose ? (
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute right-0 top-0 z-10 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
        >
          ✕
        </button>
      ) : null}

      {showHeader ? (
        <div className="pb-4 text-center">
          <p className="font-brand-display text-[2rem] leading-none tracking-tight text-slate-900 sm:text-[2.25rem]">
            {SERVICE_NAME}
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

        {mode === "login" ? (
          <form className="space-y-3" onSubmit={(event) => void handleEmailLogin(event)}>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600">이메일</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600">비밀번호</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                placeholder="8자 이상"
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
                비밀번호 찾기
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-slate-800 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {isLoading ? "처리 중..." : "이메일로 로그인"}
            </button>
          </form>
        ) : null}

        {mode === "signup" ? (
          <form className="space-y-3" onSubmit={(event) => void handleEmailSignup(event)}>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600">이메일</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600">비밀번호</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                placeholder="8자 이상"
                minLength={8}
                required
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600">비밀번호 확인</span>
              <input
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                placeholder="비밀번호 다시 입력"
                minLength={8}
                required
              />
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-slate-800 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {isLoading ? "처리 중..." : "이메일로 가입하기"}
            </button>
            {info ? (
              <button
                type="button"
                onClick={() => void handleResendVerification()}
                disabled={isLoading}
                className="w-full text-xs font-medium text-slate-600 hover:underline disabled:opacity-60"
              >
                인증 메일 다시 받기
              </button>
            ) : null}
          </form>
        ) : null}

        {mode === "forgot" ? (
          <form className="space-y-3" onSubmit={(event) => void handleForgotPassword(event)}>
            <p className="text-xs leading-5 text-slate-500">
              가입한 이메일로 비밀번호 재설정 링크를 보내드립니다.
            </p>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-600">이메일</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                placeholder="you@example.com"
                required
              />
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-slate-800 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {isLoading ? "처리 중..." : "재설정 메일 보내기"}
            </button>
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="w-full text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              로그인으로 돌아가기
            </button>
          </form>
        ) : null}

        {mode !== "forgot" ? (
          <>
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">또는</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-70"
            >
              <GoogleIcon />
              {isLoading ? "이동 중..." : "Google 계정으로 계속하기"}
            </button>
          </>
        ) : null}

        {mode === "login" ? (
          <p className="text-center text-xs text-slate-500">
            계정이 없으신가요?{" "}
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="font-semibold text-slate-700 hover:underline"
            >
              이메일 가입
            </button>
          </p>
        ) : null}

        {mode === "signup" ? (
          <p className="text-center text-xs text-slate-500">
            이미 계정이 있으신가요?{" "}
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="font-semibold text-slate-700 hover:underline"
            >
              로그인
            </button>
          </p>
        ) : null}

        <p className="text-center text-[11px] leading-5 text-slate-400">
          인증·비밀번호 재설정 링크는 {getPublicSiteOrigin()} 도메인으로 발송됩니다.
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
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs">
      <Link href="/auth/login" className="text-slate-700 hover:underline">
        로그인
      </Link>
      <Link href="/auth/signup" className="text-slate-700 hover:underline">
        가입
      </Link>
      <Link href="/auth/forgot-password" className="text-slate-700 hover:underline">
        비밀번호 찾기
      </Link>
      <Link href="/" className="text-slate-500 hover:underline">
        홈으로
      </Link>
    </div>
  );
}
