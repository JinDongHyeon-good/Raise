"use client";

import { LanguageSwitcher } from "@/components/site/language-switcher";
import { SiteFooter } from "@/components/site/site-footer";
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
        <div className="piclick-container flex h-14 items-center justify-between sm:h-16">
          <LocaleLink
            href="/"
            className="font-brand-display text-[1.35rem] font-bold tracking-tight text-[var(--piclick-green-deep)] hover:text-[var(--piclick-green)] sm:text-2xl"
          >
            {brandName}
          </LocaleLink>
          <nav className="flex items-center gap-4 text-sm text-[var(--piclick-ink-muted)]">
            <LanguageSwitcher />
            <LocaleLink href="/contact" className="transition hover:text-[var(--piclick-green-deep)]">
              {t("contact")}
            </LocaleLink>
          </nav>
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
