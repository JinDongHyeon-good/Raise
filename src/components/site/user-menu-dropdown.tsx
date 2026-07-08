"use client";

import { Link } from "@/navigation";
import { LogOut, UserRound } from "lucide-react";
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
      className={`absolute right-0 top-[calc(100%+10px)] z-50 min-w-[11.5rem] origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.16)] transition-all duration-200 ease-out ${
        open
          ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
          : "pointer-events-none -translate-y-1.5 scale-[0.97] opacity-0"
      }`}
    >
      <Link
        href="/mypage"
        role="menuitem"
        onClick={onNavigate}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
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
