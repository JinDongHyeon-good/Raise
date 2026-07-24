"use client";

import { useLocale } from "next-intl";
import { Link } from "@/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getSeoCopy } from "@/lib/seo-i18n";

/**
 * 홈 하단 크롤러·검색용 본문 (한·영·일).
 */
export function HomeSeoContent() {
  const locale = useLocale() as AppLocale;
  const copy = getSeoCopy(locale);

  return (
    <section
      className="border-t border-[var(--piclick-line)] bg-[var(--piclick-beige-soft)]"
      aria-labelledby="home-seo-heading"
    >
      <div className="piclick-container py-14 sm:py-16">
        <div className="max-w-3xl">
        <h2
          id="home-seo-heading"
          className="font-brand-display text-2xl font-bold tracking-tight text-[var(--piclick-green-deep)] sm:text-3xl"
        >
          {copy.homeSeoHeading}
        </h2>
        <p className="mt-4 text-sm leading-7 text-[var(--piclick-ink-muted)] sm:text-base">{copy.homeSeoBody}</p>

        <h3 className="mt-10 text-base font-semibold text-[var(--piclick-ink)]">{copy.homeSeoTopicsHeading}</h3>
        <ul className="mt-4 space-y-4 border-t border-[var(--piclick-line)] pt-4">
          {copy.homeSeoSections.map((section) => (
            <li key={section.heading} className="border-b border-[var(--piclick-line)] pb-4 last:border-b-0 last:pb-0">
              <h4 className="text-sm font-semibold text-[var(--piclick-ink)] sm:text-base">{section.heading}</h4>
              <p className="mt-1.5 text-sm leading-7 text-[var(--piclick-ink-muted)]">{section.body}</p>
            </li>
          ))}
        </ul>

        <h3 className="mt-10 text-base font-semibold text-[var(--piclick-ink)]">
          {locale === "ko" ? "자주 묻는 질문" : locale === "ja" ? "よくある質問" : "FAQ"}
        </h3>
        <dl className="mt-4 space-y-0 border-t border-[var(--piclick-line)]">
          {copy.faq.map((item) => (
            <div key={item.question} className="border-b border-[var(--piclick-line)] py-4">
              <dt className="text-sm font-semibold text-[var(--piclick-ink)]">{item.question}</dt>
              <dd className="mt-2 text-sm leading-6 text-[var(--piclick-ink-muted)]">{item.answer}</dd>
            </div>
          ))}
        </dl>

        <nav className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--piclick-green)]" aria-label="site">
          <Link href="/about" className="underline-offset-2 hover:underline">
            {locale === "ko" ? "서비스 소개" : locale === "ja" ? "サービス紹介" : "About"}
          </Link>
          <Link href="/contact" className="underline-offset-2 hover:underline">
            {locale === "ko" ? "문의" : locale === "ja" ? "お問い合わせ" : "Contact"}
          </Link>
          <Link href="/privacy" className="underline-offset-2 hover:underline">
            {locale === "ko" ? "개인정보처리방침" : locale === "ja" ? "プライバシー" : "Privacy"}
          </Link>
        </nav>
        </div>
      </div>
    </section>
  );
}
