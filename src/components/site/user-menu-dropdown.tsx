"use client";

import { Link } from "@/navigation";
import { LayoutDashboard, LogOut, MessagesSquare, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

type UserMenuDropdownProps = {
  open: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
};

export function UserMenuDropdown({ open, onLogout, onNavigate }: UserMenuDropdownProps) {
  const tc = useTranslations("common");

  return (
    <div
      role="menu"
      className={`absolute right-0 top-[calc(100%+10px)] z-50 min-w-[11.5rem] origin-top-right overflow-hidden rounded-2xl border border-[var(--piclick-line)] bg-white p-1.5 shadow-[0_12px_40px_-8px_rgba(26,46,31,0.14)] transition-all duration-200 ease-out ${
        open
          ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
          : "pointer-events-none -translate-y-1.5 scale-[0.97] opacity-0"
      }`}
    >
      <Link
        href="/dashboard"
        role="menuitem"
        onClick={onNavigate}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--piclick-ink)] transition-colors hover:bg-[var(--piclick-beige-soft)]"
      >
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--piclick-beige)] text-[var(--piclick-green-deep)]">
          <LayoutDashboard className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
        {tc("dashboard")}
      </Link>
      <Link
        href="/dashboard/board"
        role="menuitem"
        onClick={onNavigate}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--piclick-ink)] transition-colors hover:bg-[var(--piclick-beige-soft)]"
      >
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--piclick-beige)] text-[var(--piclick-green-deep)]">
          <MessagesSquare className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
        {tc("community")}
      </Link>
      <Link
        href="/mypage"
        role="menuitem"
        onClick={onNavigate}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--piclick-ink)] transition-colors hover:bg-[var(--piclick-beige-soft)]"
      >
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--piclick-beige)] text-[var(--piclick-green-deep)]">
          <UserRound className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
        {tc("mypage")}
      </Link>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onNavigate?.();
          onLogout();
        }}
        className="mt-0.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
          <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
        {tc("logout")}
      </button>
    </div>
  );
}
