"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LoginModal } from "@/components/auth/login-modal";
import { getSupabaseBrowserClientSafe } from "@/lib/supabase-safe";

export type Me = { id: string; email: string | null; nickname: string };

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
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const data = (await res.json()) as { user: Me | null };
      setMe(data.user);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
