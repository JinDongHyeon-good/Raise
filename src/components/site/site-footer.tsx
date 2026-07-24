"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getSeoCopy } from "@/lib/seo-i18n";

export function SiteFooter({ maxWidthClassName = "piclick-container" }: { maxWidthClassName?: string } = {}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("footer");
  const tc = useTranslations("common");
  const siteName = getSeoCopy(locale).siteName;
  const year = new Date().getFullYear();

  const primaryLinks = useMemo(
    () => [
      { href: "/" as const, label: tc("home") },
      { href: "/about" as const, label: tc("about") },
      { href: "/contact" as const, label: tc("contact") },
    ],
    [tc],
  );

  const legalLinks = [
    { href: "/privacy" as const, label: t("privacy") },
    { href: "/terms" as const, label: t("terms") },
  ];

  return (
    <footer className="border-t border-[var(--piclick-line)] bg-[var(--piclick-beige)]">
      <div className={`${maxWidthClassName} flex flex-col gap-8 py-10 sm:py-12`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/"
              className="font-brand-display text-lg font-bold leading-none text-[var(--piclick-green-deep)] transition hover:text-[var(--piclick-green)]"
            >
              {siteName}
            </Link>
            <p className="mt-2 text-xs leading-relaxed text-[var(--piclick-ink-muted)]">{t("tagline")}</p>
          </div>

          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--piclick-ink-muted)]"
            aria-label={t("siteNav")}
          >
            {primaryLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-[var(--piclick-green)]">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--piclick-line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-[var(--piclick-ink-muted)]">
            {t("disclaimer", { year, name: siteName })}
          </p>
          <nav
            className="flex shrink-0 items-center gap-x-4 text-xs text-[var(--piclick-ink-muted)]"
            aria-label={t("legalNav")}
          >
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap transition hover:text-[var(--piclick-green-deep)] hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
