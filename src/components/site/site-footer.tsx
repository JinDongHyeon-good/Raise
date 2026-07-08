"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { getTarotTopicPage } from "@/data/tarot-content-i18n";
import type { AppLocale } from "@/i18n/routing";
import { getSeoCopy } from "@/lib/seo-i18n";

const FEATURED_TOPIC_SLUGS = ["today-fortune", "today-tarot", "love-tarot"] as const;

export function SiteFooter({ maxWidthClassName = "max-w-5xl" }: { maxWidthClassName?: string }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("footer");
  const tc = useTranslations("common");
  const siteName = getSeoCopy(locale).siteName;
  const year = new Date().getFullYear();

  const primaryLinks = useMemo(() => {
    const topicLinks = FEATURED_TOPIC_SLUGS.map((slug) => {
      const page = getTarotTopicPage(slug, locale);
      return {
        href: `/topics/${slug}` as const,
        label: page?.heading ?? slug,
      };
    });

    return [
      { href: "/" as const, label: tc("home") },
      ...topicLinks,
      { href: "/guides" as const, label: tc("guides") },
      { href: "/contact" as const, label: tc("contact") },
    ];
  }, [locale, tc]);

  const legalLinks = [
    { href: "/privacy" as const, label: t("privacy") },
    { href: "/terms" as const, label: t("terms") },
  ];

  const isCompactFooter = locale === "ja";
  const taglineClass = isCompactFooter ? "text-[10px] leading-snug" : "text-xs leading-relaxed";
  const navLinkClass = isCompactFooter ? "text-xs" : "text-sm";
  const disclaimerClass = isCompactFooter ? "text-[10px] leading-[1.55]" : "text-xs leading-relaxed";
  const legalLinkClass = isCompactFooter ? "text-[10px]" : "text-xs";

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className={`mx-auto flex w-full flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12 ${maxWidthClassName}`}>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Link
              href="/"
              className="font-brand-display inline-flex items-center gap-1.5 text-lg text-slate-900 transition hover:text-slate-700"
            >
              <span
                aria-hidden
                className="bg-gradient-to-br from-violet-500 to-fuchsia-500 bg-clip-text text-transparent"
              >
                ✦
              </span>
              {siteName}
            </Link>
            <p className={`mt-2 text-slate-400 ${taglineClass}`}>{t("tagline")}</p>
          </div>

          <nav
            className={`flex flex-wrap gap-x-4 gap-y-2 sm:gap-x-5 sm:gap-y-2.5 text-slate-600 sm:justify-end ${navLinkClass}`}
            aria-label={t("siteNav")}
          >
            {primaryLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-violet-600">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <p className={`min-w-0 flex-1 text-slate-400 ${disclaimerClass}`}>
            {t("disclaimer", { year, name: siteName })}
          </p>
          <nav
            className={`flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-slate-400 sm:gap-x-4 ${legalLinkClass}`}
            aria-label={t("legalNav")}
          >
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-slate-600 hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
