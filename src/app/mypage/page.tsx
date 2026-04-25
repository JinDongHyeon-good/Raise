"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
        (user.user_metadata?.avatar_url as string | undefined) ?? (user.user_metadata?.picture as string | undefined) ?? null,
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
    <main className="relative min-h-dvh bg-slate-950 text-slate-100">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0f172a",
            color: "#e2e8f0",
            border: "1px solid #334155",
          },
        }}
      />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-3 py-6 sm:px-6 sm:py-8">
        <header className="sticky top-0 z-[220] -mx-3 -mt-6 overflow-visible border-b border-slate-800/90 bg-slate-950/95 px-3 py-3 backdrop-blur sm:-mx-6 sm:-mt-8 sm:px-6">
          <div className="relative z-10 flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => (window.location.href = "/")}
              className="flex cursor-pointer items-center gap-2 text-lg font-bold tracking-tight transition hover:text-sky-200 sm:text-2xl"
            >
              <span>JJINDONG</span>
              <img
                src="/doge.png"
                alt="Doge"
                className="h-8 w-8 rounded-full border border-slate-700 object-cover sm:h-10 sm:w-10"
              />
            </button>
            <div ref={menuRef} className="relative shrink-0">
              {isLoggedIn ? (
                <button
                  type="button"
                  aria-label="사용자 메뉴 열기"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-600 bg-slate-900 transition hover:border-sky-400"
                >
                  {userAvatarUrl ? (
                    <img src={userAvatarUrl} alt="Google avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="inline-flex h-full w-full items-center justify-center text-xs font-semibold text-slate-200">USER</span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => (window.location.href = "/")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-slate-900 text-[11px] font-semibold text-slate-100 transition hover:border-sky-400 hover:text-white"
                >
                  Login
                </button>
              )}

              <div
                className={`absolute right-0 top-12 z-[120] w-40 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/95 shadow-xl transition-all duration-300 ease-out ${
                  isLoggedIn && isUserMenuOpen ? "max-h-40 translate-y-0 p-1.5 opacity-100" : "pointer-events-none max-h-0 -translate-y-1 p-0 opacity-0"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    window.location.href = "/mypage";
                  }}
                  className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                >
                  마이페이지
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-rose-300 transition hover:bg-slate-800"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">마이페이지</h2>
          <p className="mt-1 text-sm text-slate-400">회원 정보 및 닉네임을 관리합니다.</p>

          {pageError ? (
            <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{pageError}</p>
          ) : (
            <div className="mt-5 space-y-5">
              <div>
                <p className="mb-1 text-xs text-slate-400">가입일자</p>
                <p className="text-sm text-slate-100">{joinedAt}</p>
              </div>

              <div>
                <label htmlFor="nickname-input" className="mb-1 block text-xs text-slate-400">
                  닉네임
                </label>
                <input
                  id="nickname-input"
                  value={nicknameDraft}
                  onChange={(event) => setNicknameDraft(event.target.value)}
                  maxLength={30}
                  placeholder="닉네임을 입력해 주세요"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveNickname}
                    disabled={isSaving || !hasNicknameChanged}
                    className="rounded-md bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
