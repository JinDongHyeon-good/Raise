"use client";

import { useLocale } from "next-intl";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store", headers: { "x-ui-locale": locale } });
      const data = (await res.json()) as { user: Me | null };
      setMe(data.user);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    queueMicrotask(() => void refresh());
    const supabase = getSupabaseBrowserClientSafe();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") void refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const openLogin = useCallback(() => setLoginOpen(true), []);

  const requireLogin = useCallback(() => {
    if (me) return true;
    setLoginOpen(true);
    return false;
  }, [me]);

  const signOut = useCallback(() => {
    const supabase = getSupabaseBrowserClientSafe();
    // /auth/signout 은 언어 라우팅 밖의 라우트 핸들러 — 끝나면 "/" 로 보낸다
    void supabase?.auth.signOut().finally(() => {
      window.location.assign("/auth/signout");
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
