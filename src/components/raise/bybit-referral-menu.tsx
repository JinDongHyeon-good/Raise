"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/navigation";

export function BybitReferralMenu({
  variant = "desktop",
  onNavigate,
}: {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const t = useTranslations("bybit");
  const pathname = usePathname() || "/";
  const active = pathname.startsWith("/bybit");

  if (variant === "mobile") {
    return (
      <Link
        href="/bybit"
        onClick={onNavigate}
        className={`rounded-xl border-b border-transparent px-4 py-3.5 text-[15px] transition ${
          active
            ? "border-[#F7A600]/35 bg-[var(--rz-panel)] font-medium text-[#F7A600]"
            : "text-white/70 hover:bg-[var(--rz-panel)] hover:text-[#F7A600]"
        }`}
      >
        {t("menu")}
      </Link>
    );
  }

  return (
    <Link
      href="/bybit"
      className={`relative flex items-center px-3.5 text-sm transition-colors ${
        active ? "font-medium text-[#F7A600]" : "text-white/70 hover:text-[#F7A600]"
      }`}
    >
      {t("menu")}
      {active ? (
        <span aria-hidden className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-[#F7A600]" />
      ) : null}
    </Link>
  );
}
