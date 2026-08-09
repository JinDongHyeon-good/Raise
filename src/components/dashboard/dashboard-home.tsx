"use client";

import { useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link as LocaleLink } from "@/navigation";
import { AppShell } from "@/components/site/app-shell";
import { Sun, Sparkles, HeartHandshake, MessagesSquare, ArrowRight } from "lucide-react";

const FEATURES = [
  { id: "today", href: "/dashboard/today" as const, icon: Sun, authRequired: true },
  { id: "saju", href: "/dashboard/saju" as const, icon: Sparkles, authRequired: true },
  { id: "gunghap", href: "/dashboard/gunghap" as const, icon: HeartHandshake, authRequired: true },
  { id: "community", href: "/dashboard/board" as const, icon: MessagesSquare, authRequired: false },
] as const;

/** 카드마다 다른 포인트 컬러를 줘서 네 개가 다 같아 보이지 않게 한다. */
const THEME: Record<(typeof FEATURES)[number]["id"], { badge: string; glow: string; border: string; accentText: string; bar: string }> = {
  today: {
    badge: "bg-gradient-to-br from-[#eec27c] to-[#b3792b] shadow-[0_10px_22px_-10px_rgba(179,121,43,0.65)]",
    glow: "bg-[#e3b563]/25",
    border: "hover:border-[#b3792b]/45",
    accentText: "text-[#a06a26]",
    bar: "from-[#eec27c] to-[#b3792b]",
  },
  saju: {
    badge:
      "bg-gradient-to-br from-[var(--piclick-green)] to-[var(--piclick-green-deep)] shadow-[0_10px_22px_-10px_rgba(42,33,80,0.65)]",
    glow: "bg-[var(--piclick-green)]/20",
    border: "hover:border-[var(--piclick-green)]",
    accentText: "text-[var(--piclick-green-deep)]",
    bar: "from-[var(--piclick-green)] to-[var(--piclick-green-deep)]",
  },
  gunghap: {
    badge: "bg-gradient-to-br from-[#d992b1] to-[#96436a] shadow-[0_10px_22px_-10px_rgba(150,67,106,0.6)]",
    glow: "bg-[#c9799d]/25",
    border: "hover:border-[#96436a]/45",
    accentText: "text-[#96436a]",
    bar: "from-[#d992b1] to-[#96436a]",
  },
  community: {
    badge: "bg-gradient-to-br from-[#93a2e0] to-[#4f5fa0] shadow-[0_10px_22px_-10px_rgba(79,95,160,0.6)]",
    glow: "bg-[#7c8fd4]/25",
    border: "hover:border-[#4f5fa0]/45",
    accentText: "text-[#4f5fa0]",
    bar: "from-[#93a2e0] to-[#4f5fa0]",
  },
};

export function DashboardHome() {
  const t = useTranslations("dashboard");
  const requireAuthRef = useRef<((path: string) => void) | null>(null);
  const handleRequireAuthReady = useCallback((requireAuth: (path: string) => void) => {
    requireAuthRef.current = requireAuth;
  }, []);

  return (
    <AppShell active="dashboard" nextPath="/dashboard" onRequireAuthReady={handleRequireAuthReady}>
      <div className="min-h-full bg-white">
        <div className="piclick-container py-8 sm:py-10">
          <div className="max-w-2xl">
            <h1 className="font-brand-display text-3xl font-bold tracking-tight text-[var(--piclick-green-deep)] sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--piclick-ink-muted)] sm:text-base">
              {t("subtitle")}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              const theme = THEME[feature.id];
              const cardClass = `group relative overflow-hidden rounded-2xl border border-[var(--piclick-line)] bg-white p-5 text-left shadow-[0_10px_28px_-22px_rgb(42_33_80_/0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_-20px_rgb(42_33_80_/0.4)] sm:p-6 ${theme.border}`;
              const inner = (
                <>
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.bar}`} aria-hidden />
                  <div
                    className={`pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-80 ${theme.glow}`}
                    aria-hidden
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <span
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white transition duration-300 group-hover:scale-105 ${theme.badge}`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden />
                    </span>
                    <ArrowRight
                      className={`mt-1.5 h-4 w-4 opacity-0 transition duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 ${theme.accentText}`}
                      aria-hidden
                    />
                  </div>
                  <h2 className="relative mt-4 min-h-[1.75rem] text-lg font-semibold text-[var(--piclick-ink)] transition group-hover:text-[var(--piclick-green-deep)]">
                    {t(`items.${feature.id}.title`)}
                  </h2>
                  <p className="relative mt-2 line-clamp-3 min-h-[3.9375rem] text-sm leading-relaxed text-[var(--piclick-ink-muted)]">
                    {t(`items.${feature.id}.body`)}
                  </p>
                  <p className={`relative mt-4 text-sm font-semibold transition ${theme.accentText}`}>{t("open")}</p>
                </>
              );
              return feature.authRequired ? (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => requireAuthRef.current?.(feature.href)}
                  className={cardClass}
                >
                  {inner}
                </button>
              ) : (
                <LocaleLink key={feature.id} href={feature.href} className={cardClass}>
                  {inner}
                </LocaleLink>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
