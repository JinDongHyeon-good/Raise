"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { getTarotTopicPage } from "@/data/tarot-content-i18n";
import type { AppLocale } from "@/i18n/routing";
import { getSeoCopy } from "@/lib/seo-i18n";

const FEATURED_TOPIC_SLUGS = ["free-ai-tarot", "today-fortune", "today-tarot", "love-tarot"] as const;

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
      { href: "/about" as const, label: tc("about") },
      ...topicLinks,
      { href: "/guides" as const, label: tc("guides") },
      { href: "/contact" as const, label: tc("contact") },
    ];
  }, [locale, tc]);

  const legalLinks = [
    { href: "/privacy" as const, label: t("privacy") },
    { href: "/terms" as const, label: t("terms") },
  ];

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className={`mx-auto flex w-full flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12 ${maxWidthClassName}`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0">
            <Link
              href="/"
              className="font-brand-display inline-flex items-center gap-1.5 text-lg leading-none text-slate-900 transition hover:text-slate-700"
            >
              <span
                aria-hidden
                className="bg-gradient-to-br from-violet-500 to-fuchsia-500 bg-clip-text text-transparent"
              >
                ✦
              </span>
              {siteName}
            </Link>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{t("tagline")}</p>
          </div>

          <nav
            className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm leading-none text-slate-600 sm:justify-end"
            aria-label={t("siteNav")}
          >
            {primaryLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-violet-600">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-slate-400">
            {t("disclaimer", { year, name: siteName })}
          </p>
          <nav
            className="flex shrink-0 items-center gap-x-4 text-xs leading-none text-slate-400"
            aria-label={t("legalNav")}
          >
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap transition hover:text-slate-600 hover:underline"
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
