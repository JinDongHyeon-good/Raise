"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

function getSafeNextPath(raw: string | null) {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("로그인 처리 중…");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const supabase = getSupabaseBrowserClient();
      const safeNext = getSafeNextPath(searchParams.get("next"));

      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.getSession();
          if (error) throw error;
        }

        if (cancelled) return;
        setMessage("이동 중…");
        router.replace(safeNext);
      } catch (e) {
        console.error("[auth/callback]", e);
        if (!cancelled) setMessage("로그인 처리에 실패했습니다. 메인으로 이동합니다.");
        window.setTimeout(() => {
          if (!cancelled) router.replace("/");
        }, 1200);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 text-slate-200">
      <p className="text-sm">{message}</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 text-slate-200">
          <p className="text-sm">로그인 처리 중…</p>
        </main>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
