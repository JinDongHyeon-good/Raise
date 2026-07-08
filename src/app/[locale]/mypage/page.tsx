"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { MeloballoonPromoBanner } from "@/components/tarot/meloballoon-promo-banner";
import { UserMenuDropdown } from "@/components/site/user-menu-dropdown";
import { getLocalizedBrandName } from "@/lib/brand";
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
  const brandName = getLocalizedBrandName(locale);
  const t = useTranslations("mypage");
  const tc = useTranslations("common");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [joinedAt, setJoinedAt] = useState<string>("-");
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const hasNicknameChanged = useMemo(() => nicknameDraft.trim() !== nickname.trim(), [nicknameDraft, nickname]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    const load = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (!mounted) return;

      if (sessionError || !sessionData.session?.user) {
        setIsLoggedIn(false);
        setPageError(t("loginRequired"));
        return;
      }

      const user = sessionData.session.user;
      setIsLoggedIn(true);
      setUserAvatarUrl(
        (user.user_metadata?.avatar_url as string | undefined) ??
          (user.user_metadata?.picture as string | undefined) ??
          null,
      );
      setJoinedAt(formatDateTime(user.created_at, locale));

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

    load();
    return () => {
      mounted = false;
    };
  }, [locale, t]);

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    window.location.assign(`${window.location.origin}/auth/signout`);
  };

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

      const { error } = await supabase
        .from("USER_MST")
        .update({ nickname: trimmed })
        .eq("auth_id", sessionData.session.user.id);

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
    <main className="tarot-home-page relative flex min-h-dvh flex-col overflow-x-hidden">
      <div className="tarot-home-glow" aria-hidden />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#1e293b",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 14px rgb(148 163 184 / 0.15)",
          },
        }}
      />

      <div className="tarot-page-inner flex-1">
        <header className="flex min-w-0 items-center justify-between gap-3">
          <Link
            href="/"
            className="font-brand-display flex min-w-0 shrink items-center gap-1.5 text-xl leading-tight tracking-tight text-slate-900 sm:text-2xl md:text-3xl"
          >
            <span
              aria-hidden
              className="bg-gradient-to-br from-violet-500 to-fuchsia-500 bg-clip-text text-transparent"
            >
              ✦
            </span>
            <span className="block truncate">{brandName}</span>
          </Link>

          <div ref={menuRef} className="relative shrink-0">
            {isLoggedIn ? (
              <button
                type="button"
                aria-label={tc("userMenu")}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className={`h-10 w-10 overflow-hidden rounded-full border bg-white shadow-sm transition ${
                  isUserMenuOpen
                    ? "border-violet-200 ring-2 ring-violet-100"
                    : "border-slate-200 hover:border-slate-400"
                }`}
              >
                {userAvatarUrl ? (
                  <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="inline-flex h-full w-full items-center justify-center bg-slate-100 text-xs font-semibold text-slate-700">
                    ME
                  </span>
                )}
              </button>
            ) : (
              <Link
                href="/"
                className="rounded-full border border-slate-300 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                {t("goLogin")}
              </Link>
            )}

            <UserMenuDropdown
              open={isLoggedIn && isUserMenuOpen}
              onLogout={handleLogout}
              onNavigate={() => setIsUserMenuOpen(false)}
            />
          </div>
        </header>

        <section className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-lg shadow-slate-200/50 backdrop-blur-sm sm:p-5 md:p-6">
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-lg font-semibold text-slate-900">{t("title")}</h1>
            <p className="mt-1 text-sm text-slate-400">{t("subtitle")}</p>
          </div>

          {pageError ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{pageError}</p>
          ) : (
            <div className="mt-5 space-y-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">{t("joinedAt")}</p>
                <p className="mt-1 text-sm text-slate-800">{joinedAt}</p>
              </div>

              <div>
                <label htmlFor="nickname-input" className="mb-1 block text-xs font-medium text-slate-500">
                  {t("nicknameLabel")}
                </label>
                <input
                  id="nickname-input"
                  value={nicknameDraft}
                  onChange={(event) => setNicknameDraft(event.target.value)}
                  maxLength={30}
                  placeholder={t("nicknamePlaceholder")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:border-slate-400 focus:ring-1 focus:ring-slate-300/30"
                />
                <div className="mt-3 flex justify-stretch sm:justify-end">
                  <button
                    type="button"
                    onClick={handleSaveNickname}
                    disabled={isSaving || !hasNicknameChanged}
                    className="w-full rounded-xl bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-slate-300/30 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[88px]"
                  >
                    {isSaving ? t("saving") : tc("save")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!pageError && (
            <div className="mt-6 border-t border-slate-200 pt-4">
              <Link href="/" className="inline-flex text-sm font-medium text-slate-500 transition hover:text-slate-800">
                {t("backToTarot")}
              </Link>
            </div>
          )}
        </section>

        <p className="text-pretty pb-2 text-center text-[11px] leading-5 text-slate-400">{t("disclaimer")}</p>
      </div>

      <MeloballoonPromoBanner />
    </main>
  );
}
