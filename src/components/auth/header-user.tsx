"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Link } from "@/navigation";

export function HeaderUser() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { me, loading, openLogin, signOut, setNickname } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (loading) return <span className="block h-10 w-16" aria-hidden />;

  if (!me) {
    return (
      <button
        type="button"
        onClick={openLogin}
        className="inline-flex h-10 min-w-16 items-center justify-center rounded-lg border border-[var(--rz-line-strong)] bg-transparent px-3.5 text-xs font-medium text-white/85 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
      >
        {t("login")}
      </button>
    );
  }

  const changeNickname = async () => {
    setOpen(false);
    const next = window.prompt(t("nicknamePrompt"), me.nickname)?.trim();
    if (!next || next === me.nickname) return;
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-ui-locale": locale },
      body: JSON.stringify({ nickname: next }),
    });
    const data = (await res.json()) as { nickname?: string; error?: string };
    if (!res.ok || !data.nickname) return window.alert(data.error ?? t("nicknameChangeFailed"));
    setNickname(data.nickname);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={me.nickname}
        title={me.nickname}
        className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--rz-line)] bg-[var(--rz-panel)] text-[var(--rz-text)] transition hover:border-[var(--rz-line-strong)] hover:bg-[var(--rz-panel-2)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M5.5 19.2c1.4-3.1 3.7-4.7 6.5-4.7s5.1 1.6 6.5 4.7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-40 overflow-hidden rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)] text-sm shadow-[var(--rz-shadow)]"
        >
          <Link
            href={`/community?author=${me.id}`}
            onClick={() => setOpen(false)}
            className="block px-3 py-2 hover:bg-[var(--rz-panel-2)]"
            role="menuitem"
          >
            {t("myPosts")}
          </Link>
          <button type="button" onClick={() => void changeNickname()} className="block w-full px-3 py-2 text-left hover:bg-[var(--rz-panel-2)]" role="menuitem">
            {t("changeNickname")}
          </button>
          <button type="button" onClick={signOut} className="block w-full px-3 py-2 text-left text-[var(--rz-muted)] hover:bg-[var(--rz-panel-2)]" role="menuitem">
            {t("logout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
