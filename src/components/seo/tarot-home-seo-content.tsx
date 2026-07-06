import { SERVICE_NAME } from "@/lib/brand";
import { HOME_SEO_FAQ, HOME_SEO_INTRO } from "@/lib/seo";
import Link from "next/link";

/**
 * 검색 엔진·AdSense 심사용 홈 본문. 시각적으로는 접힌 섹션으로 제공합니다.
 */
export function TarotHomeSeoContent() {
  return (
    <section
      className="border-t border-slate-200 bg-slate-50/80"
      aria-labelledby="home-seo-heading"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <h2 id="home-seo-heading" className="font-brand-display text-xl text-slate-900 sm:text-2xl">
          {HOME_SEO_INTRO.heading}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{HOME_SEO_INTRO.body}</p>

        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <Link href="/topics/today-fortune" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-300">
            오늘의 운세
          </Link>
          <Link href="/topics/today-tarot" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-300">
            오늘의 타로
          </Link>
          <Link href="/topics/love-tarot" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-300">
            연애 타로
          </Link>
          <Link href="/topics/free-ai-tarot" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-300">
            무료 AI 타로
          </Link>
          <Link href="/guides" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-300">
            타로 가이드
          </Link>
        </div>

        <h3 className="mt-8 text-lg font-semibold text-slate-900">AI 타로 자주 묻는 질문</h3>
        <dl className="mt-4 space-y-4">
          {HOME_SEO_FAQ.map((item) => (
            <div key={item.question} className="rounded-xl border border-slate-200 bg-white p-4">
              <dt className="text-sm font-semibold text-slate-800">{item.question}</dt>
              <dd className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-xs leading-6 text-slate-500">
          {SERVICE_NAME} AI 타로는 오락·자기성찰 목적이며, 의료·법률·투자 조언을 대체하지 않습니다.
        </p>
      </div>
    </section>
  );
}
