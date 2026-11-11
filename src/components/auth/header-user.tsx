"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";

export function HeaderUser() {
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

  if (loading) return <span className="h-8 w-14" aria-hidden />;

  if (!me) {
    return (
      <button
        type="button"
        onClick={openLogin}
        className="rounded-lg border border-[var(--rz-line-strong)] bg-transparent px-3.5 py-2 text-xs font-medium text-white/85 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
      >
        로그인
      </button>
    );
  }

  const changeNickname = async () => {
    setOpen(false);
    const next = window.prompt("새 닉네임 (2~16자)", me.nickname)?.trim();
    if (!next || next === me.nickname) return;
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nickname: next }),
    });
    const data = (await res.json()) as { nickname?: string; error?: string };
    if (!res.ok || !data.nickname) return window.alert(data.error ?? "닉네임을 바꾸지 못했어요.");
    setNickname(data.nickname);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="max-w-[120px] truncate rounded-lg border border-[var(--rz-line)] bg-[var(--rz-panel)] px-2.5 py-2 text-xs text-[var(--rz-text)] transition hover:border-[var(--rz-line-strong)]"
      >
        {me.nickname}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-40 overflow-hidden rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)] text-sm shadow-[var(--rz-shadow)]"
        >
          <a
            href={`/community?author=${me.id}`}
            className="block px-3 py-2 hover:bg-[var(--rz-panel-2)]"
            role="menuitem"
          >
            내가 쓴 글
          </a>
          <button type="button" onClick={() => void changeNickname()} className="block w-full px-3 py-2 text-left hover:bg-[var(--rz-panel-2)]" role="menuitem">
            닉네임 변경
          </button>
          <button type="button" onClick={signOut} className="block w-full px-3 py-2 text-left text-[var(--rz-muted)] hover:bg-[var(--rz-panel-2)]" role="menuitem">
            로그아웃
          </button>
        </div>
      ) : null}
    </div>
  );
}
