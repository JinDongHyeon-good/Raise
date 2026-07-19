"use client";

import { useLocale } from "next-intl";
import { Link } from "@/navigation";
import { getTarotTopicPage } from "@/data/tarot-content-i18n";
import type { AppLocale } from "@/i18n/routing";
import { getSeoCopy } from "@/lib/seo-i18n";

const FEATURED_SEO_TOPICS = [
  "free-ai-tarot",
  "today-fortune",
  "today-tarot",
  "love-tarot",
  "weekly-fortune",
  "career-tarot",
  "money-fortune",
] as const;

/**
 * 홈 하단 크롤러·검색용 본문 (한·영·일).
 * 오늘의 타로·오늘의 운세 등 검색어를 제목·본문·내부링크에 노출합니다.
 */
export function HomeSeoContent() {
  const locale = useLocale() as AppLocale;
  const copy = getSeoCopy(locale);

  return (
    <section className="border-t border-slate-200 bg-slate-50/70" aria-labelledby="home-seo-heading">
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h2 id="home-seo-heading" className="font-brand-display text-2xl text-slate-900 sm:text-3xl">
          {copy.homeSeoHeading}
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{copy.homeSeoBody}</p>

        <h3 className="mt-8 text-lg font-semibold text-slate-900">{copy.homeSeoTopicsHeading}</h3>
        <nav className="mt-3 flex flex-wrap gap-2 text-sm" aria-label={copy.homeSeoTopicsHeading}>
          {FEATURED_SEO_TOPICS.map((slug) => {
            const page = getTarotTopicPage(slug, locale);
            if (!page) return null;
            return (
              <Link
                key={slug}
                href={`/topics/${slug}`}
                className="rounded-lg border border-violet-200/80 bg-white px-3 py-2 font-medium text-slate-800 hover:border-violet-300 hover:bg-violet-50/50"
              >
                {page.heading}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700 sm:text-base">
          {copy.homeSeoSections.map((section) => (
            <section key={section.heading}>
              <h3 className="text-lg font-semibold text-slate-900">{section.heading}</h3>
              <p className="mt-2">{section.body}</p>
            </section>
          ))}
        </div>

        <h3 className="mt-10 text-lg font-semibold text-slate-900">
          {locale === "ko" ? "자주 묻는 질문" : locale === "ja" ? "よくある質問" : "FAQ"}
        </h3>
        <dl className="mt-4 space-y-3">
          {copy.faq.map((item) => (
            <div key={item.question} className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="text-sm font-semibold text-slate-800">{item.question}</dt>
              <dd className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</dd>
            </div>
          ))}
        </dl>

        <nav className="mt-8 flex flex-wrap gap-2 text-sm" aria-label="site">
          <Link
            href="/topics"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
          >
            {copy.topicsMetaTitle}
          </Link>
          <Link
            href="/guides"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
          >
            {copy.guidesMetaTitle}
          </Link>
          <Link
            href="/about"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
          >
            {locale === "ko" ? "서비스 소개" : locale === "ja" ? "サービス紹介" : "About"}
          </Link>
        </nav>
      </div>
    </section>
  );
}
