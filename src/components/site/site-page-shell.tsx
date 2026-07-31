"use client";

import { SiteFooter } from "@/components/site/site-footer";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { Link as LocaleLink } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { getLocalizedBrandName, getLocalizedTagline } from "@/lib/brand";

export function SitePageShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const brandName = getLocalizedBrandName(locale);
  const tagline = getLocalizedTagline(locale);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--piclick-beige-soft)] text-[var(--piclick-ink)]">
      <header className="border-b border-[var(--piclick-line)] bg-[var(--piclick-beige)]/90 backdrop-blur-sm">
        <div className="piclick-container flex h-14 items-center justify-between gap-3 sm:h-16">
          <LocaleLink
            href="/dashboard"
            className="font-brand-display min-w-0 shrink-0 truncate whitespace-nowrap text-[1.35rem] font-bold tracking-tight text-[var(--piclick-green-deep)] hover:text-[var(--piclick-green)] sm:text-2xl"
          >
            {brandName}
          </LocaleLink>
          <nav className="flex min-w-0 items-center gap-3.5 overflow-x-auto whitespace-nowrap text-sm text-[var(--piclick-ink-muted)] sm:gap-6">
            <LocaleLink href="/dashboard/today" className="transition hover:text-[var(--piclick-green-deep)]">
              {t("navToday")}
            </LocaleLink>
            <LocaleLink href="/dashboard/saju" className="transition hover:text-[var(--piclick-green-deep)]">
              {t("navSaju")}
            </LocaleLink>
            <LocaleLink href="/dashboard/gunghap" className="transition hover:text-[var(--piclick-green-deep)]">
              {t("navGunghap")}
            </LocaleLink>
            <LocaleLink href="/dashboard/board" className="transition hover:text-[var(--piclick-green-deep)]">
              {t("community")}
            </LocaleLink>
          </nav>
          <LanguageSwitcher />
        </div>
        {title ? (
          <div className="piclick-container pb-3">
            <p className="text-xs text-[var(--piclick-ink-muted)]">{tagline}</p>
          </div>
        ) : null}
      </header>
      <div className="flex-1">{children}</div>
      <SiteFooter maxWidthClassName="piclick-container" />
    </div>
  );
}
