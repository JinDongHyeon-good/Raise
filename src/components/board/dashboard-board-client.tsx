"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/site/app-shell";
import { BoardTab } from "@/components/board/board-tab";

export function DashboardBoardClient() {
  const t = useTranslations("board");
  const openLoginRef = useRef<((mode?: "login" | "signup") => void) | null>(null);

  return (
    <AppShell
      active="board"
      nextPath="/dashboard/board"
      onNeedLoginReady={(openLogin) => {
        openLoginRef.current = openLogin;
      }}
    >
      <div className="piclick-container py-8 sm:py-10">
        <p className="mb-6 text-sm text-[var(--piclick-ink-muted)]">{t("pageIntro")}</p>
        <BoardTab onNeedLogin={() => openLoginRef.current?.("login")} />
      </div>
    </AppShell>
  );
}
