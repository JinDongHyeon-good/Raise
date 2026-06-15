"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { mapAuthErrorMessage } from "@/lib/auth-errors";
import { AuthPanelCard } from "@/components/auth/auth-panel";
import { getSupabaseBrowserClientSafe } from "@/lib/supabase-safe";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClientSafe();
    if (!supabase) {
      setError("비밀번호 재설정 설정을 불러올 수 없습니다.");
      return;
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setIsReady(true);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsReady(true);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

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
        throw new Error("비밀번호 재설정 설정을 불러올 수 없습니다.");
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setSuccess(true);
    } catch (err) {
      setError(mapAuthErrorMessage(err instanceof Error ? err : null, "비밀번호 변경에 실패했습니다."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <AuthPanelCard>
        <div className="space-y-4">
          <div className="text-center">
            <h1 className="font-brand-display text-2xl text-slate-900">새 비밀번호 설정</h1>
            <p className="mt-2 text-sm text-slate-500">새 비밀번호를 입력해 주세요.</p>
          </div>

          {!isReady && !error ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              재설정 링크를 확인하는 중입니다...
            </p>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          {success ? (
            <div className="space-y-3 text-center">
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                비밀번호가 변경되었습니다.
              </p>
              <Link
                href="/auth/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
              >
                로그인하기
              </Link>
            </div>
          ) : isReady ? (
            <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-600">새 비밀번호</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                  minLength={8}
                  required
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-600">새 비밀번호 확인</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                  minLength={8}
                  required
                />
              </label>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-slate-800 px-4 py-3.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {isLoading ? "저장 중..." : "비밀번호 변경"}
              </button>
            </form>
          ) : (
            <Link
              href="/auth/forgot-password"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              비밀번호 찾기 다시 시도
            </Link>
          )}
        </div>
      </AuthPanelCard>
    </div>
  );
}
