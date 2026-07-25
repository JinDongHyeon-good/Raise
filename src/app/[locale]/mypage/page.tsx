"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AppShell } from "@/components/site/app-shell";
import { BoardTab } from "@/components/board/board-tab";
import { Spinner } from "@/components/ui/spinner";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { isNicknameTakenByOther } from "@/lib/nickname-duplicate";
import { Toaster, toast } from "react-hot-toast";
import type { AppLocale } from "@/i18n/routing";

type UserMstRow = {
  auth_id: string;
  nickname: string;
  created_at?: string;
};

function localeToIntl(locale: AppLocale) {
  if (locale === "ko") return "ko-KR";
  if (locale === "ja") return "ja-JP";
  return "en-US";
}

function formatDateTime(value: string | undefined, locale: AppLocale) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(localeToIntl(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function MyPage() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("mypage");
  const tc = useTranslations("common");
  const tb = useTranslations("board");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authId, setAuthId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [joinedAt, setJoinedAt] = useState<string>("-");
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  const hasNicknameChanged = useMemo(() => nicknameDraft.trim() !== nickname.trim(), [nicknameDraft, nickname]);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    const load = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (!mounted) return;

      if (sessionError || !sessionData.session?.user) {
        setIsLoggedIn(false);
        setAuthId(null);
        setPageError(t("loginRequired"));
        return;
      }

      const user = sessionData.session.user;
      setIsLoggedIn(true);
      setAuthId(user.id);
      setJoinedAt(formatDateTime(user.created_at, locale));
      setPageError(null);

      const { data: profile, error: profileError } = await supabase
        .from("USER_MST")
        .select("auth_id, nickname, created_at")
        .eq("auth_id", user.id)
        .maybeSingle<UserMstRow>();

      if (!mounted) return;
      if (profileError) {
        setPageError(t("profileLoadError"));
        return;
      }

      const nextNickname = profile?.nickname ?? "";
      setNickname(nextNickname);
      setNicknameDraft(nextNickname);
      if (!user.created_at && profile?.created_at) {
        setJoinedAt(formatDateTime(profile.created_at, locale));
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [locale, t]);

  const handleSaveNickname = async () => {
    const trimmed = nicknameDraft.trim();
    if (!trimmed) {
      toast.error(t("nicknameRequired"), { position: "top-right" });
      return;
    }

    try {
      setIsSaving(true);
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.user) {
        throw new Error(t("sessionExpired"));
      }

      const uid = sessionData.session.user.id;
      const taken = await isNicknameTakenByOther(supabase, trimmed, uid);
      if (taken) {
        toast.error(t("nicknameTaken"), { position: "top-right" });
        return;
      }

      const { error } = await supabase.from("USER_MST").update({ nickname: trimmed }).eq("auth_id", uid);
      if (error) throw error;
      setNickname(trimmed);
      setNicknameDraft(trimmed);
      toast.success(t("saved"), { position: "top-right" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveError"), {
        position: "top-right",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell
      active="mypage"
      nextPath="/mypage"
      loginOpen={loginOpen}
      onLoginOpenChange={setLoginOpen}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#1a2e1f",
            border: "1px solid rgb(47 107 79 / 0.14)",
            boxShadow: "0 4px 14px rgb(47 107 79 / 0.08)",
          },
        }}
      />

      <div className="piclick-container space-y-8 py-8 sm:py-10">
        <section className="rounded-2xl border border-[var(--piclick-line)] bg-white p-4 sm:p-6">
          <div className="border-b border-[var(--piclick-line)] pb-4">
            <p className="text-sm font-medium text-[var(--piclick-green)]">{tc("dashboard")}</p>
            <h1 className="mt-1 font-brand-display text-2xl font-bold tracking-tight text-[var(--piclick-green-deep)] sm:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-[var(--piclick-ink-muted)]">{t("subtitle")}</p>
          </div>

          {pageError ? (
            <div className="mt-5 space-y-3">
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{pageError}</p>
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="pk-btn pk-btn-md pk-btn-primary"
              >
                {t("goLogin")}
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--piclick-line)] bg-[var(--piclick-beige-soft)] px-4 py-3">
                  <p className="text-xs font-medium text-[var(--piclick-ink-muted)]">{t("joinedAt")}</p>
                  <p className="mt-1 text-sm text-[var(--piclick-ink)]">{joinedAt}</p>
                </div>
                <div className="rounded-xl border border-[var(--piclick-line)] bg-[var(--piclick-beige-soft)] px-4 py-3">
                  <p className="text-xs font-medium text-[var(--piclick-ink-muted)]">{t("nicknameLabel")}</p>
                  <p className="mt-1 truncate text-sm text-[var(--piclick-ink)]">{nickname || "-"}</p>
                </div>
              </div>

              <div>
                <label htmlFor="nickname-input" className="mb-1 block text-xs font-medium text-[var(--piclick-ink-muted)]">
                  {t("nicknameLabel")}
                </label>
                <input
                  id="nickname-input"
                  value={nicknameDraft}
                  onChange={(event) => setNicknameDraft(event.target.value)}
                  maxLength={30}
                  placeholder={t("nicknamePlaceholder")}
                  className="w-full rounded-xl border border-[var(--piclick-line)] bg-[var(--piclick-beige-soft)]/40 px-4 py-3 text-sm text-[var(--piclick-ink)] outline-none placeholder:text-[var(--piclick-ink-muted)] focus:border-[var(--piclick-green)]/40 focus:bg-white"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <Link href="/dashboard" className="font-medium text-[var(--piclick-ink-muted)] hover:text-[var(--piclick-green-deep)]">
                      {t("backToDashboard")}
                    </Link>
                    <Link
                      href="/dashboard/board"
                      className="font-medium text-[var(--piclick-green)] hover:text-[var(--piclick-green-deep)]"
                    >
                      {t("goCommunity")}
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSaveNickname()}
                    disabled={isSaving || !hasNicknameChanged}
                    className="pk-btn pk-btn-md pk-btn-primary"
                  >
                    {isSaving ? <Spinner size="sm" label={t("saving")} /> : null}
                    {tc("save")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {isLoggedIn && authId ? (
          <BoardTab
            authorFilter={authId}
            hideWriteButton
            emptyMessage={tb("myPostsEmpty")}
            onNeedLogin={() => setLoginOpen(true)}
          />
        ) : null}

        <p className="pb-2 text-center text-[11px] leading-5 text-[var(--piclick-ink-muted)]">{t("disclaimer")}</p>
      </div>
    </AppShell>
  );
}
