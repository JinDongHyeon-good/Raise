"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Link as LocaleLink } from "@/navigation";
import { SitePageShell } from "@/components/site/site-page-shell";
import { getLocalizedBrandName } from "@/lib/brand";
import { PICKLEBALL_FAQ } from "@/lib/pickleball-seo";
import type { AppLocale } from "@/i18n/routing";

const EASE = [0.22, 1, 0.36, 1] as const;

const BASICS = ["paddle", "ball", "court"] as const;
const REASONS = ["easy", "social", "active"] as const;
const AUDIENCE = ["beginner", "friends", "families"] as const;

export function PickleballIntro() {
  const t = useTranslations("pickleball");
  const tc = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const brandName = getLocalizedBrandName(locale);
  const reduceMotion = useReducedMotion();

  return (
    <SitePageShell>
      <div className="piclick-home">
        <section className="relative isolate overflow-hidden border-b border-[var(--piclick-line)]">
          <div className="pickleball-hero-bg absolute inset-0 -z-10" aria-hidden />
          <div className="piclick-container flex min-h-[min(78dvh,680px)] flex-col justify-center py-16 sm:py-24">
            <motion.p
              className="font-brand-display text-[clamp(2.75rem,8vw,5.5rem)] font-extrabold leading-[0.95] tracking-tight text-[var(--piclick-green-deep)]"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              {brandName}
            </motion.p>
            <motion.h1
              className="mt-5 max-w-2xl text-balance text-2xl font-semibold tracking-tight text-[var(--piclick-ink)] sm:text-3xl"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08, ease: EASE }}
            >
              {t("hero.headline")}
            </motion.h1>
            <motion.p
              className="mt-4 max-w-xl text-base leading-relaxed text-[var(--piclick-ink-muted)] sm:text-lg"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.14, ease: EASE }}
            >
              {t("hero.sub")}
            </motion.p>
            <motion.div
              className="mt-9 flex flex-wrap items-center gap-3"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: EASE }}
            >
              <LocaleLink
                href="/dashboard"
                className="pk-btn pk-btn-lg pk-btn-primary"
              >
                {t("hero.ctaPrimary")}
              </LocaleLink>
              <a
                href="#what"
                className="pk-btn pk-btn-lg pk-btn-outline"
              >
                {t("hero.ctaSecondary")}
              </a>
            </motion.div>
          </div>
        </section>

        <section id="what" className="scroll-mt-16 border-b border-[var(--piclick-line)] bg-[var(--piclick-beige)]">
          <div className="piclick-container py-16 sm:py-20">
            <p className="text-sm font-medium text-[var(--piclick-green)]">{t("what.eyebrow")}</p>
            <h2 className="mt-3 max-w-2xl text-balance text-2xl font-semibold tracking-tight text-[var(--piclick-ink)] sm:text-3xl">
              {t("what.heading")}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--piclick-ink-muted)] sm:text-[1.05rem] sm:leading-8">
              {t("what.body")}
            </p>
          </div>
        </section>

        <section className="border-b border-[var(--piclick-line)]">
          <div className="piclick-container py-16 sm:py-20">
            <p className="text-sm font-medium text-[var(--piclick-green)]">{t("why.eyebrow")}</p>
            <h2 className="mt-3 max-w-2xl text-balance text-2xl font-semibold tracking-tight text-[var(--piclick-ink)] sm:text-3xl">
              {t("why.heading")}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--piclick-ink-muted)]">{t("why.sub")}</p>
            <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-3">
              {REASONS.map((id, index) => (
                <motion.div
                  key={id}
                  className="border-t border-[var(--piclick-green)]/20 pt-5"
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: index * 0.05, ease: EASE }}
                >
                  <p className="font-brand-display text-sm font-bold tabular-nums text-[var(--piclick-green)]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-[var(--piclick-ink)]">{t(`why.items.${id}.title`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--piclick-ink-muted)]">{t(`why.items.${id}.body`)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--piclick-line)] bg-[var(--piclick-beige)]">
          <div className="piclick-container py-16 sm:py-20">
            <p className="text-sm font-medium text-[var(--piclick-green)]">{t("basics.eyebrow")}</p>
            <h2 className="mt-3 max-w-2xl text-balance text-2xl font-semibold tracking-tight text-[var(--piclick-ink)] sm:text-3xl">
              {t("basics.heading")}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--piclick-ink-muted)]">{t("basics.sub")}</p>
            <dl className="mt-12 space-y-8">
              {BASICS.map((id) => (
                <div key={id} className="grid gap-2 border-t border-[var(--piclick-green)]/15 pt-6 sm:grid-cols-[10rem_1fr] sm:gap-8">
                  <dt className="text-sm font-semibold text-[var(--piclick-green-deep)]">{t(`basics.items.${id}.title`)}</dt>
                  <dd className="text-sm leading-relaxed text-[var(--piclick-ink-muted)] sm:text-[0.95rem] sm:leading-7">
                    {t(`basics.items.${id}.body`)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-b border-[var(--piclick-line)]">
          <div className="piclick-container py-16 sm:py-20">
            <p className="text-sm font-medium text-[var(--piclick-green)]">{t("play.eyebrow")}</p>
            <h2 className="mt-3 max-w-2xl text-balance text-2xl font-semibold tracking-tight text-[var(--piclick-ink)] sm:text-3xl">
              {t("play.heading")}
            </h2>
            <ol className="mt-10 max-w-2xl space-y-6">
              {(["serve", "rally", "score"] as const).map((id, index) => (
                <li key={id} className="flex gap-4">
                  <span className="font-brand-display mt-0.5 text-sm font-bold tabular-nums text-[var(--piclick-green)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--piclick-ink)]">{t(`play.steps.${id}.title`)}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--piclick-ink-muted)]">{t(`play.steps.${id}.body`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-b border-[var(--piclick-line)] bg-[var(--piclick-beige)]">
          <div className="piclick-container py-16 sm:py-20">
            <p className="text-sm font-medium text-[var(--piclick-green)]">{t("who.eyebrow")}</p>
            <h2 className="mt-3 max-w-2xl text-balance text-2xl font-semibold tracking-tight text-[var(--piclick-ink)] sm:text-3xl">
              {t("who.heading")}
            </h2>
            <ul className="mt-10 max-w-2xl space-y-5">
              {AUDIENCE.map((id) => (
                <li key={id} className="border-t border-[var(--piclick-green)]/15 pt-5">
                  <h3 className="text-base font-semibold text-[var(--piclick-ink)]">{t(`who.items.${id}.title`)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--piclick-ink-muted)]">{t(`who.items.${id}.body`)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="pickleball-faq"
          className="scroll-mt-16 border-b border-[var(--piclick-line)]"
          aria-labelledby="pickleball-faq-heading"
        >
          <div className="piclick-container py-16 sm:py-20">
            <p className="text-sm font-medium text-[var(--piclick-green)]">FAQ</p>
            <h2
              id="pickleball-faq-heading"
              className="mt-3 max-w-2xl text-balance text-2xl font-semibold tracking-tight text-[var(--piclick-ink)] sm:text-3xl"
            >
              {t("faq.heading")}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--piclick-ink-muted)]">{t("faq.sub")}</p>
            <dl className="mt-10 max-w-3xl">
              {PICKLEBALL_FAQ.map((item) => (
                <div key={item.question} className="border-t border-[var(--piclick-green)]/15 py-5">
                  <dt className="text-base font-semibold text-[var(--piclick-ink)]">{item.question}</dt>
                  <dd className="mt-2 text-sm leading-7 text-[var(--piclick-ink-muted)] sm:text-[0.95rem]">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="bg-[var(--piclick-green-deep)]">
          <div className="piclick-container flex flex-col gap-8 py-14 sm:flex-row sm:items-end sm:justify-between sm:py-16">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--piclick-beige)] sm:text-3xl">
                {t("cta.heading")}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--piclick-beige)]/75 sm:text-base">{t("cta.sub")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LocaleLink
                href="/dashboard"
                className="pk-btn pk-btn-lg pk-btn-invert"
              >
                {t("cta.dashboard")}
              </LocaleLink>
              <LocaleLink
                href="/dashboard/board"
                className="pk-btn pk-btn-lg pk-btn-invert-outline"
              >
                {tc("community")}
              </LocaleLink>
            </div>
          </div>
        </section>
      </div>
    </SitePageShell>
  );
}
