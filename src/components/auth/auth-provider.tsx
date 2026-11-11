"use client";

import { useLocale } from "next-intl";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { LoginModal } from "@/components/auth/login-modal";
import { getSupabaseBrowserClientSafe } from "@/lib/supabase-safe";

export type Me = {
  id: string;
  email: string | null;
  nickname: string;
  /** 오늘 AI 사용량 (확인 불가 시 null) */
  aiUsage?: { used: number; limit: number } | null;
};

type AuthContextValue = {
  me: Me | null;
  loading: boolean;
  /** 로그인 모달 열기 */
  openLogin: () => void;
  /** 로그인 필요하면 모달 열고 false */
  requireLogin: () => boolean;
  refresh: () => Promise<void>;
  signOut: () => void;
  setNickname: (nickname: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  // 로그인 상태 확인은 여러 번 겹쳐 나갈 수 있다(첫 로드·로그인·로그아웃·탭 복귀).
  // 늦게 도착한 옛 응답이 새 상태를 덮으면 이전 계정이 보일 수 있으므로, 가장 마지막 요청의 결과만 반영한다.
  const requestSeq = useRef(0);
  const refresh = useCallback(async () => {
    const seq = ++requestSeq.current;
    let next: Me | null = null;
    try {
      const res = await fetch("/api/me", { cache: "no-store", credentials: "same-origin", headers: { "x-ui-locale": locale } });
      const data = (await res.json().catch(() => ({}))) as { user?: Me | null };
      next = res.ok ? (data.user ?? null) : null;
    } catch {
      next = null;
    }
    if (seq !== requestSeq.current) return;
    setMe(next);
    setLoading(false);
  }, [locale]);

  useEffect(() => {
    queueMicrotask(() => void refresh());
    const supabase = getSupabaseBrowserClientSafe();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void refresh();
    });
    // 다른 탭에서 로그인·로그아웃·계정 전환을 했을 수 있으니 이 탭으로 돌아오면 다시 확인
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const openLogin = useCallback(() => setLoginOpen(true), []);

  const requireLogin = useCallback(() => {
    if (me) return true;
    setLoginOpen(true);
    return false;
  }, [me]);

  const signOut = useCallback(() => {
    const supabase = getSupabaseBrowserClientSafe();
    // 서버 쿠키도 지우도록 /auth/signout 에 POST (GET 으로는 로그아웃되지 않음) — 끝나면 "/" 로
    void (supabase?.auth.signOut() ?? Promise.resolve())
      .then(() => fetch("/auth/signout", { method: "POST", credentials: "same-origin" }))
      .catch(() => undefined)
      .finally(() => {
        // 전체 새로고침: 이전 계정이 메모리에 남긴 화면 상태를 모두 비운다 (세션이 섞이지 않게)
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/");
      });
  }, []);

  const setNickname = useCallback((nickname: string) => {
    setMe((prev) => (prev ? { ...prev, nickname } : prev));
  }, []);

  const value = useMemo(
    () => ({ me, loading, openLogin, requireLogin, refresh, signOut, setNickname }),
    [me, loading, openLogin, requireLogin, refresh, signOut, setNickname],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onAuthenticated={async () => {
          await refresh();
          setLoginOpen(false);
        }}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 쓸 수 있어요.");
  return ctx;
}
