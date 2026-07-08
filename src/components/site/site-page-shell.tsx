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
    <div className="flex min-h-dvh flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <LocaleLink
            href="/"
            className="font-brand-display flex items-center gap-1.5 text-xl tracking-tight text-slate-900 hover:text-slate-700"
          >
            <span
              aria-hidden
              className="bg-gradient-to-br from-violet-500 to-fuchsia-500 bg-clip-text text-transparent"
            >
              ✦
            </span>
            {brandName}
          </LocaleLink>
          <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-slate-600 sm:text-sm">
            <LanguageSwitcher />
            <LocaleLink href="/guides" className="hover:text-slate-900 hover:underline">
              {t("guides")}
            </LocaleLink>
            <LocaleLink href="/contact" className="hover:text-slate-900 hover:underline">
              {t("contact")}
            </LocaleLink>
          </nav>
        </div>
        {title ? (
          <div className="mx-auto w-full max-w-5xl px-4 pb-4 sm:px-6">
            <p className="text-xs text-slate-500">{tagline}</p>
          </div>
        ) : null}
      </header>
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
