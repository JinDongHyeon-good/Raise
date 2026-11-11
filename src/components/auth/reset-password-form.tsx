"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { mapAuthErrorMessage } from "@/lib/auth-errors";
import { getSupabaseBrowserClientSafe } from "@/lib/supabase-safe";

const MIN_PASSWORD = 8;
const inputClass =
  "w-full rounded-lg border border-[var(--rz-line)] bg-[var(--rz-bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--rz-accent)]";

/**
 * 비밀번호 재설정 메일 링크 → /auth/callback (코드 교환, 로그인 상태가 됨) → 이 화면에서 새 비밀번호 저장
 */
export function ResetPasswordForm() {
  const { openLogin } = useAuth();
  const [status, setStatus] = useState<"checking" | "ready" | "no-session" | "done">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClientSafe();
    if (!supabase) {
      queueMicrotask(() => setStatus("no-session"));
      return;
    }
    void supabase.auth.getSession().then(({ data }) => setStatus(data.session ? "ready" : "no-session"));
  }, []);

  const mismatch = confirm.length > 0 && password !== confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD) return setError(`비밀번호는 ${MIN_PASSWORD}자 이상이어야 해요.`);
    if (password !== confirm) return setError("비밀번호가 서로 달라요.");
    const supabase = getSupabaseBrowserClientSafe();
    if (!supabase) return setError("설정을 불러오지 못했어요.");
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      const msg = updateError.message.toLowerCase();
      setError(msg.includes("same") ? "이전과 다른 비밀번호를 써 주세요." : mapAuthErrorMessage(updateError));
      return;
    }
    setStatus("done");
  };

  return (
    <main className="rz-container flex justify-center py-12">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-6">
        <h1 className="text-lg font-semibold">비밀번호 재설정</h1>

        {status === "checking" ? <p className="mt-4 text-sm text-[var(--rz-muted)]">확인 중…</p> : null}

        {status === "no-session" ? (
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-[var(--rz-muted)]">
              재설정 링크가 만료됐거나 이미 사용됐어요. 로그인 창의 &lsquo;비밀번호 찾기&rsquo;에서 링크를 다시 받아 주세요.
            </p>
            <button type="button" onClick={openLogin} className="rounded-lg bg-[var(--rz-accent)] px-4 py-2 text-sm text-[var(--rz-accent-fg)]">
              로그인 창 열기
            </button>
          </div>
        ) : null}

        {status === "ready" ? (
          <form onSubmit={submit} className="mt-4 space-y-2.5" noValidate>
            <input
              type="password"
              autoComplete="new-password"
              placeholder={`새 비밀번호 (${MIN_PASSWORD}자 이상)`}
              aria-label="새 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="새 비밀번호 확인"
              aria-label="새 비밀번호 확인"
              aria-invalid={mismatch}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`${inputClass} ${mismatch ? "border-[var(--rz-up)]" : ""}`}
            />
            {mismatch ? <p className="text-xs text-[var(--rz-up)]">비밀번호가 서로 달라요.</p> : null}
            {error ? <p className="text-xs text-[var(--rz-up)]">{error}</p> : null}
            <button
              type="submit"
              disabled={busy || mismatch}
              className="w-full rounded-lg bg-[var(--rz-accent)] px-4 py-2.5 text-sm font-medium text-[var(--rz-accent-fg)] disabled:opacity-60"
            >
              {busy ? "저장 중…" : "새 비밀번호 저장"}
            </button>
          </form>
        ) : null}

        {status === "done" ? (
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-emerald-400">비밀번호를 바꿨어요. 새 비밀번호로 로그인된 상태예요.</p>
            <Link href="/" className="inline-block rounded-lg bg-[var(--rz-accent)] px-4 py-2 text-[var(--rz-accent-fg)]">
              홈으로
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
