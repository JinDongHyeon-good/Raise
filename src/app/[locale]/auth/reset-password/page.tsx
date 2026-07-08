"use client";

import { useEffect, useState } from "react";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { mapAuthErrorMessage } from "@/lib/auth-errors";
import { AuthPanelCard } from "@/components/auth/auth-panel";
import { getSupabaseBrowserClientSafe } from "@/lib/supabase-safe";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClientSafe();
    if (!supabase) {
      setError(t("resetPassword.configLoadFailed"));
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
  }, [t]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

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
        throw new Error(t("resetPassword.configLoadFailed"));
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setSuccess(true);
    } catch (err) {
      setError(mapAuthErrorMessage(err instanceof Error ? err : null, t, "errors.resetFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <AuthPanelCard>
        <div className="space-y-4">
          <div className="text-center">
            <h1 className="font-brand-display text-2xl text-slate-900">{t("resetPassword.title")}</h1>
            <p className="mt-2 text-sm text-slate-500">{t("resetPassword.subtitle")}</p>
          </div>

          {!isReady && !error ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {t("resetPassword.checking")}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          {success ? (
            <div className="space-y-3 text-center">
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {t("resetPassword.success")}
              </p>
              <Link
                href="/auth/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
              >
                {t("resetPassword.loginCta")}
              </Link>
            </div>
          ) : isReady ? (
            <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-600">{t("resetPassword.newPassword")}</span>
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
                <span className="text-xs font-medium text-slate-600">{t("resetPassword.newPasswordConfirm")}</span>
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
                {isLoading ? tc("processing") : t("resetPassword.submit")}
              </button>
            </form>
          ) : (
            <Link
              href="/auth/forgot-password"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t("resetPassword.retryForgot")}
            </Link>
          )}
        </div>
      </AuthPanelCard>
    </div>
  );
}
