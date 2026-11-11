"use client";

import { useEffect, useState } from "react";
import { mapAuthErrorMessage } from "@/lib/auth-errors";
import { getAuthCallbackUrl } from "@/lib/auth-urls";
import { ensureUserProfileClient } from "@/lib/ensure-user-profile-client";
import { getSupabaseBrowserClientSafe } from "@/lib/supabase-safe";

type Mode = "login" | "signup";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginModal({
  open,
  onClose,
  onAuthenticated,
}: {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void | Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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

  const google = async () => {
    setError(null);
    if (!supabase) return setError("로그인 설정을 불러오지 못했어요.");
    setBusy(true);
    const next = `${window.location.pathname}${window.location.search}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getAuthCallbackUrl(next) },
    });
    if (oauthError) {
      setError(mapAuthErrorMessage(oauthError));
      setBusy(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmed)) return setError("이메일 형식이 올바르지 않아요.");
    if (password.length < 8) return setError("비밀번호는 8자 이상이어야 해요.");
    if (!supabase) return setError("로그인 설정을 불러오지 못했어요.");

    setBusy(true);
    try {
      if (mode === "login") {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: trimmed, password });
        if (signInError) throw signInError;
        if (data.user) await ensureUserProfileClient(supabase, data.user.id, data.user).catch(() => undefined);
        await onAuthenticated();
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmed,
          password,
          options: { emailRedirectTo: getAuthCallbackUrl(window.location.pathname) },
        });
        if (signUpError) throw signUpError;
        if (data.session && data.user) {
          await ensureUserProfileClient(supabase, data.user.id, data.user).catch(() => undefined);
          await onAuthenticated();
        } else {
          setInfo("인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝나요.");
        }
      }
    } catch (err) {
      setError(mapAuthErrorMessage(err instanceof Error ? err : null));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="raise-app fixed inset-0 z-[300] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "login" ? "로그인" : "회원가입"}
        className="w-full max-w-sm rounded-t-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-[var(--rz-text)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold">{mode === "login" ? "로그인" : "회원가입"}</p>
            <p className="mt-1 text-xs text-[var(--rz-muted)]">AI 요약·분석, 커뮤니티 글·댓글은 로그인 후 이용할 수 있어요.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="text-xl leading-none text-[var(--rz-muted)]">
            ×
          </button>
        </div>

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
          Google로 계속하기
        </button>

        <div className="my-4 flex items-center gap-3 text-[11px] text-[var(--rz-muted)]">
          <span className="h-px flex-1 bg-[var(--rz-line)]" />
          또는 이메일
          <span className="h-px flex-1 bg-[var(--rz-line)]" />
        </div>

        <form onSubmit={submit} className="space-y-2.5">
          <input
            type="email"
            autoComplete="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[var(--rz-line)] bg-[var(--rz-bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--rz-accent)]"
          />
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="비밀번호 (8자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[var(--rz-line)] bg-[var(--rz-bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--rz-accent)]"
          />
          {error ? <p className="text-xs text-[var(--rz-up)]">{error}</p> : null}
          {info ? <p className="text-xs text-emerald-400">{info}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[var(--rz-accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "처리 중…" : mode === "login" ? "이메일로 로그인" : "가입하기"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--rz-muted)]">
          {mode === "login" ? "계정이 없나요? " : "이미 계정이 있나요? "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setInfo(null);
            }}
            className="text-[var(--rz-text)] underline"
          >
            {mode === "login" ? "회원가입" : "로그인"}
          </button>
        </p>
      </div>
    </div>
  );
}
