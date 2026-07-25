"use client";

import { useTranslations } from "next-intl";
import { Link as LocaleLink } from "@/navigation";
import { AppShell } from "@/components/site/app-shell";
import { CalendarDays, MessagesSquare, Megaphone, Building2, ArrowRight, CircleHelp } from "lucide-react";

const FEATURES = [
  {
    id: "pickleball",
    href: "/pickleball" as const,
    icon: CircleHelp,
    available: true,
  },
  {
    id: "community",
    href: "/dashboard/board" as const,
    icon: MessagesSquare,
    available: true,
  },
  {
    id: "booking",
    href: null,
    icon: CalendarDays,
    available: false,
  },
  {
    id: "venue",
    href: null,
    icon: Building2,
    available: false,
  },
  {
    id: "ads",
    href: null,
    icon: Megaphone,
    available: false,
  },
] as const;

export function DashboardHome() {
  const t = useTranslations("dashboard");

  return (
    <AppShell active="dashboard" nextPath="/dashboard">
      <div className="piclick-container py-8 sm:py-10">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[var(--piclick-green)]">{t("eyebrow")}</p>
          <h1 className="mt-2 font-brand-display text-3xl font-bold tracking-tight text-[var(--piclick-green-deep)] sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--piclick-ink-muted)] sm:text-base">{t("subtitle")}</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            const title = t(`items.${feature.id}.title`);
            const body = t(`items.${feature.id}.body`);
            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--piclick-beige)] text-[var(--piclick-green-deep)] transition duration-200 group-hover:bg-[var(--piclick-green)] group-hover:text-white">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  {feature.available ? (
                    <ArrowRight
                      className="mt-1 h-4 w-4 text-[var(--piclick-green)] opacity-0 transition duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden
                    />
                  ) : (
                    <span className="rounded-full bg-[var(--piclick-beige)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--piclick-ink-muted)]">
                      {t("soon")}
                    </span>
                  )}
                </div>
                <h2 className="mt-4 text-lg font-semibold text-[var(--piclick-ink)] transition group-hover:text-[var(--piclick-green-deep)]">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--piclick-ink-muted)]">{body}</p>
                {feature.available ? (
                  <p className="mt-4 text-sm font-semibold text-[var(--piclick-green)] transition group-hover:text-[var(--piclick-green-deep)]">
                    {feature.id === "community"
                      ? t("openBoard")
                      : feature.id === "pickleball"
                        ? t("openPickleball")
                        : t("openItem")}
                  </p>
                ) : null}
              </>
            );

            if (feature.href) {
              return (
                <LocaleLink
                  key={feature.id}
                  href={feature.href}
                  className="group rounded-2xl border border-[var(--piclick-line)] bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--piclick-green)] hover:bg-[rgb(47_107_79_/0.07)] hover:shadow-[0_14px_32px_-14px_rgb(47_107_79_/0.45)] sm:p-6"
                >
                  {content}
                </LocaleLink>
              );
            }

            return (
              <div
                key={feature.id}
                className="rounded-2xl border border-dashed border-[var(--piclick-line)] bg-white/70 p-5 opacity-80 sm:p-6"
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
