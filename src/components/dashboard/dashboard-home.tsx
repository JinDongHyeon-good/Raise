"use client";

import { useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link as LocaleLink } from "@/navigation";
import { AppShell } from "@/components/site/app-shell";
import { Sun, Sparkles, HeartHandshake, MessagesSquare, ArrowRight } from "lucide-react";

const FEATURES = [
  { id: "today", href: "/dashboard/today" as const, icon: Sun, accent: true, authRequired: true },
  { id: "saju", href: "/dashboard/saju" as const, icon: Sparkles, accent: true, authRequired: true },
  { id: "gunghap", href: "/dashboard/gunghap" as const, icon: HeartHandshake, accent: true, authRequired: true },
  { id: "community", href: "/dashboard/board" as const, icon: MessagesSquare, accent: false, authRequired: false },
] as const;

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
              const cardClass = `group rounded-2xl border p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-18px_rgb(42_33_80_/0.5)] sm:p-6 ${
                feature.accent
                  ? "border-[var(--piclick-line)] bg-white hover:border-[var(--piclick-green)]"
                  : "border-[var(--piclick-line)] bg-slate-50 hover:border-[var(--piclick-green)]/50"
              }`;
              const inner = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[var(--piclick-green-deep)] transition duration-200 group-hover:bg-[var(--piclick-green)] group-hover:text-white">
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <ArrowRight
                      className="mt-1 h-4 w-4 text-[var(--piclick-green)] opacity-0 transition duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden
                    />
                  </div>
                  <h2 className="mt-4 min-h-[1.75rem] text-lg font-semibold text-[var(--piclick-ink)] transition group-hover:text-[var(--piclick-green-deep)]">
                    {t(`items.${feature.id}.title`)}
                  </h2>
                  <p className="mt-2 line-clamp-3 min-h-[3.9375rem] text-sm leading-relaxed text-[var(--piclick-ink-muted)]">
                    {t(`items.${feature.id}.body`)}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-[var(--piclick-green)] transition group-hover:text-[var(--piclick-green-deep)]">
                    {t("open")}
                  </p>
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
