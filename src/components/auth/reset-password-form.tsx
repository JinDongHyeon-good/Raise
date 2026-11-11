"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { getAuthErrorKey } from "@/lib/auth-errors";
import { getSupabaseBrowserClientSafe } from "@/lib/supabase-safe";
import { Link } from "@/navigation";

const MIN_PASSWORD = 8;
const inputClass =
  "w-full rounded-lg border border-[var(--rz-line)] bg-[var(--rz-bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--rz-accent)]";

/**
 * 비밀번호 재설정 메일 링크 → /auth/callback (코드 교환, 로그인 상태가 됨) → 이 화면에서 새 비밀번호 저장
 */
export function ResetPasswordForm() {
  const t = useTranslations("auth");
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
    if (password.length < MIN_PASSWORD) return setError(t("errors.passwordTooShort", { min: MIN_PASSWORD }));
    if (password !== confirm) return setError(t("passwordMismatch"));
    const supabase = getSupabaseBrowserClientSafe();
    if (!supabase) return setError(t("errors.settingsMissing"));
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      const msg = updateError.message.toLowerCase();
      setError(msg.includes("same") ? t("errors.samePassword") : t(getAuthErrorKey(updateError), { min: MIN_PASSWORD }));
      return;
    }
    setStatus("done");
  };

  return (
    <main className="rz-container flex justify-center py-12">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-6">
        <h1 className="text-lg font-semibold">{t("resetTitle")}</h1>

        {status === "checking" ? <p className="mt-4 text-sm text-[var(--rz-muted)]">{t("checking")}</p> : null}

        {status === "no-session" ? (
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-[var(--rz-muted)]">
              {t("resetLinkExpired")}
            </p>
            <button type="button" onClick={openLogin} className="rounded-lg bg-[var(--rz-accent)] px-4 py-2 text-sm text-[var(--rz-accent-fg)]">
              {t("openLogin")}
            </button>
          </div>
        ) : null}

        {status === "ready" ? (
          <form onSubmit={submit} className="mt-4 space-y-2.5" noValidate>
            <input
              type="password"
              autoComplete="new-password"
              placeholder={t("newPasswordPlaceholder", { min: MIN_PASSWORD })}
              aria-label={t("newPassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder={t("newPasswordConfirm")}
              aria-label={t("newPasswordConfirm")}
              aria-invalid={mismatch}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`${inputClass} ${mismatch ? "border-[var(--rz-up)]" : ""}`}
            />
            {mismatch ? <p className="text-xs text-[var(--rz-up)]">{t("passwordMismatch")}</p> : null}
            {error ? <p className="text-xs text-[var(--rz-up)]">{error}</p> : null}
            <button
              type="submit"
              disabled={busy || mismatch}
              className="w-full rounded-lg bg-[var(--rz-accent)] px-4 py-2.5 text-sm font-medium text-[var(--rz-accent-fg)] disabled:opacity-60"
            >
              {busy ? t("saving") : t("saveNewPassword")}
            </button>
          </form>
        ) : null}

        {status === "done" ? (
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-emerald-400">{t("resetDone")}</p>
            <Link href="/" className="inline-block rounded-lg bg-[var(--rz-accent)] px-4 py-2 text-[var(--rz-accent-fg)]">
              {t("goHome")}
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
