"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Link as LocaleLink } from "@/navigation";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { SiteFooter } from "@/components/site/site-footer";
import { HomeSeoContent } from "@/components/seo/home-seo-content";
import type { AppLocale } from "@/i18n/routing";
import { getLocalizedBrandName, getLocalizedTagline } from "@/lib/brand";

const FEATURE_IDS = ["booking", "community", "venue", "ads"] as const;
const EASE = [0.22, 1, 0.36, 1] as const;

export default function PiclickHome() {
  const t = useTranslations("piclick");
  const tc = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const brandName = getLocalizedBrandName(locale);
  const tagline = getLocalizedTagline(locale);
  const reduceMotion = useReducedMotion();

  return (
    <div className="piclick-home flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-[var(--piclick-line)] bg-[var(--piclick-beige)]/90 backdrop-blur-md">
        <div className="piclick-container flex h-14 items-center justify-between sm:h-16">
          <LocaleLink
            href="/"
            className="font-brand-display text-[1.35rem] font-bold tracking-tight text-[var(--piclick-green-deep)] sm:text-2xl"
          >
            {brandName}
          </LocaleLink>
          <nav className="flex items-center gap-4 text-sm text-[var(--piclick-ink-muted)] sm:gap-5">
            <LanguageSwitcher />
            <a href="#features" className="hidden transition hover:text-[var(--piclick-green-deep)] sm:inline">
              {t("nav.features")}
            </a>
            <LocaleLink href="/about" className="hidden transition hover:text-[var(--piclick-green-deep)] sm:inline">
              {tc("about")}
            </LocaleLink>
            <LocaleLink href="/contact" className="transition hover:text-[var(--piclick-green-deep)]">
              {tc("contact")}
            </LocaleLink>
            <LocaleLink
              href="/auth/login"
              className="inline-flex h-9 items-center rounded bg-[var(--piclick-green)] px-3.5 text-sm font-medium text-white transition hover:bg-[var(--piclick-green-deep)]"
            >
              {tc("login")}
            </LocaleLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="piclick-hero relative isolate overflow-hidden">
          <div className="piclick-hero-bg absolute inset-0 -z-10" aria-hidden />

          <div className="piclick-container flex min-h-[min(88dvh,760px)] flex-col justify-center py-20 sm:py-28">
            <div className="max-w-3xl">
              <motion.p
                className="font-brand-display text-[clamp(3.25rem,10vw,6.5rem)] font-extrabold leading-[0.95] tracking-tight text-[var(--piclick-green-deep)]"
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: EASE }}
              >
                {brandName}
              </motion.p>

              <motion.p
                className="mt-4 text-sm font-medium tracking-[0.04em] text-[var(--piclick-green)] sm:text-base"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.06, ease: EASE }}
              >
                {tagline}
              </motion.p>

              <motion.h1
                className="mt-8 max-w-2xl text-balance text-[1.65rem] font-semibold leading-snug tracking-tight text-[var(--piclick-ink)] sm:text-3xl sm:leading-snug"
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
              >
                {t("hero.headline")}
              </motion.h1>

              <motion.p
                className="mt-5 max-w-xl text-base leading-relaxed text-[var(--piclick-ink-muted)] sm:text-lg"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.18, ease: EASE }}
              >
                {t("hero.sub")}
              </motion.p>

              <motion.div
                className="mt-10 flex flex-wrap items-center gap-3"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.24, ease: EASE }}
              >
                <a
                  href="#features"
                  className="inline-flex h-11 items-center justify-center rounded bg-[var(--piclick-green)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--piclick-green-deep)]"
                >
                  {t("hero.ctaPrimary")}
                </a>
                <LocaleLink
                  href="/auth/signup"
                  className="inline-flex h-11 items-center justify-center rounded border border-[var(--piclick-green)]/25 bg-transparent px-6 text-sm font-semibold text-[var(--piclick-green-deep)] transition hover:border-[var(--piclick-green)] hover:bg-[var(--piclick-beige)]"
                >
                  {t("hero.ctaSecondary")}
                </LocaleLink>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-16 border-t border-[var(--piclick-line)] bg-[var(--piclick-beige)]">
          <div className="piclick-container py-16 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-[var(--piclick-green)]">{t("features.eyebrow")}</p>
              <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-[var(--piclick-ink)] sm:text-3xl">
                {t("features.heading")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--piclick-ink-muted)]">{t("features.sub")}</p>
            </div>

            <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:gap-x-16">
              {FEATURE_IDS.map((id, index) => (
                <motion.article
                  key={id}
                  className="border-t border-[var(--piclick-green)]/20 pt-5"
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: index * 0.05, ease: EASE }}
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-brand-display text-sm font-bold tabular-nums text-[var(--piclick-green)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-lg font-semibold text-[var(--piclick-ink)] sm:text-xl">
                      {t(`features.${id}.title`)}
                    </h3>
                  </div>
                  <p className="mt-3 pl-8 text-sm leading-relaxed text-[var(--piclick-ink-muted)] sm:text-[0.95rem] sm:leading-7">
                    {t(`features.${id}.body`)}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--piclick-line)] bg-[var(--piclick-green-deep)]">
          <div className="piclick-container flex flex-col gap-8 py-14 sm:flex-row sm:items-end sm:justify-between sm:py-16">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--piclick-beige)] sm:text-3xl">
                {t("cta.heading")}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--piclick-beige)]/75 sm:text-base">
                {t("cta.sub")}
              </p>
            </div>
            <LocaleLink
              href="/auth/signup"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded bg-[var(--piclick-beige)] px-6 text-sm font-semibold text-[var(--piclick-green-deep)] transition hover:bg-white"
            >
              {t("cta.button")}
            </LocaleLink>
          </div>
        </section>

        <HomeSeoContent />
      </main>

      <SiteFooter maxWidthClassName="piclick-container" />
    </div>
  );
}
