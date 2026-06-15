"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MeloballoonPromoBanner } from "@/components/tarot/meloballoon-promo-banner";
import { SERVICE_NAME } from "@/lib/brand";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { isNicknameTakenByOther } from "@/lib/nickname-duplicate";
import { Toaster, toast } from "react-hot-toast";

type UserMstRow = {
  auth_id: string;
  nickname: string;
  created_at?: string;
};

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function MyPage() {
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
        setPageError("로그인이 필요합니다. 메인 페이지에서 로그인해 주세요.");
        return;
      }

      const user = sessionData.session.user;
      setIsLoggedIn(true);
      setUserAvatarUrl(
        (user.user_metadata?.avatar_url as string | undefined) ??
          (user.user_metadata?.picture as string | undefined) ??
          null,
      );
      setJoinedAt(formatDateTime(user.created_at));

      const { data: profile, error: profileError } = await supabase
        .from("USER_MST")
        .select("auth_id, nickname, created_at")
        .eq("auth_id", user.id)
        .maybeSingle<UserMstRow>();

      if (!mounted) return;
      if (profileError) {
        setPageError("프로필 정보를 불러오지 못했습니다.");
        return;
      }

      const nextNickname = profile?.nickname ?? "";
      setNickname(nextNickname);
      setNicknameDraft(nextNickname);
      if (!user.created_at && profile?.created_at) {
        setJoinedAt(formatDateTime(profile.created_at));
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

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
      toast.error("닉네임을 입력해 주세요.", { position: "top-right" });
      return;
    }

    try {
      setIsSaving(true);
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.user) {
        throw new Error("로그인 세션이 만료되었습니다. 다시 로그인해 주세요.");
      }

      const uid = sessionData.session.user.id;
      const taken = await isNicknameTakenByOther(supabase, trimmed, uid);
      if (taken) {
        toast.error("이미 사용 중인 닉네임입니다.", { position: "top-right" });
        return;
      }

      const { error } = await supabase
        .from("USER_MST")
        .update({ nickname: trimmed })
        .eq("auth_id", sessionData.session.user.id);

      if (error) throw error;
      setNickname(trimmed);
      setNicknameDraft(trimmed);
      toast.success("저장되었습니다.", { position: "top-right" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "닉네임 저장 중 오류가 발생했습니다.", {
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
          <a
            href="/"
            className="font-brand-display min-w-0 shrink text-xl leading-tight tracking-tight text-slate-900 sm:text-2xl md:text-3xl"
          >
            <span className="block truncate">{SERVICE_NAME}</span>
          </a>

          <div ref={menuRef} className="relative shrink-0">
            {isLoggedIn ? (
              <button
                type="button"
                aria-label="사용자 메뉴"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm transition hover:border-slate-400"
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
              <a
                href="/"
                className="rounded-full border border-slate-300 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                로그인
              </a>
            )}

            <div
              className={`absolute right-0 top-12 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-lg shadow-slate-200/50 transition-all duration-300 ${
                isLoggedIn && isUserMenuOpen
                  ? "max-h-40 translate-y-0 p-1.5 opacity-100"
                  : "pointer-events-none max-h-0 -translate-y-1 p-0 opacity-0"
              }`}
            >
              <a
                href="/mypage"
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
              >
                마이페이지
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
              >
                로그아웃
              </button>
            </div>
          </div>
        </header>

        <section className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-lg shadow-slate-200/50 backdrop-blur-sm sm:p-5 md:p-6">
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-lg font-semibold text-slate-900">마이페이지</h1>
            <p className="mt-1 text-sm text-slate-400">회원 정보 및 닉네임을 관리합니다.</p>
          </div>

          {pageError ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{pageError}</p>
          ) : (
            <div className="mt-5 space-y-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">가입일</p>
                <p className="mt-1 text-sm text-slate-800">{joinedAt}</p>
              </div>

              <div>
                <label htmlFor="nickname-input" className="mb-1 block text-xs font-medium text-slate-500">
                  닉네임
                </label>
                <input
                  id="nickname-input"
                  value={nicknameDraft}
                  onChange={(event) => setNicknameDraft(event.target.value)}
                  maxLength={30}
                  placeholder="닉네임을 입력해 주세요"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:border-slate-400 focus:ring-1 focus:ring-slate-300/30"
                />
                <div className="mt-3 flex justify-stretch sm:justify-end">
                  <button
                    type="button"
                    onClick={handleSaveNickname}
                    disabled={isSaving || !hasNicknameChanged}
                    className="w-full rounded-xl bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-slate-300/30 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[88px]"
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!pageError && (
            <div className="mt-6 border-t border-slate-200 pt-4">
              <a
                href="/"
                className="inline-flex text-sm font-medium text-slate-500 transition hover:text-slate-800"
              >
                ← 타로 리딩으로 돌아가기
              </a>
            </div>
          )}
        </section>

        <p className="text-pretty pb-2 text-center text-[11px] leading-5 text-slate-400">
          멜로타로 AI 타로는 참고용 인사이트입니다. 중요한 결정은 본인의 판단과 전문가 상담을 함께 고려해 주세요.
        </p>
      </div>

      <MeloballoonPromoBanner />
    </main>
  );
}
