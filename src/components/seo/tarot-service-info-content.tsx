import Link from "next/link";
import { SERVICE_NAME } from "@/lib/brand";
import { HOME_SEO_FAQ, HOME_SEO_INTRO } from "@/lib/seo";

/** 서비스 안내·FAQ (서비스 소개 페이지) */
export function TarotServiceInfoContent() {
  return (
    <section className="bg-white" aria-labelledby="tarot-service-info-heading">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <h1 id="tarot-service-info-heading" className="font-brand-display text-2xl text-slate-900 sm:text-3xl">
          {HOME_SEO_INTRO.heading}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{HOME_SEO_INTRO.body}</p>

        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <Link
            href="/topics/today-fortune"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-300"
          >
            오늘의 운세
          </Link>
          <Link
            href="/topics/today-tarot"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-300"
          >
            오늘의 타로
          </Link>
          <Link
            href="/topics/love-tarot"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-300"
          >
            연애 타로
          </Link>
          <Link
            href="/topics/free-ai-tarot"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-300"
          >
            무료 AI 타로
          </Link>
          <Link
            href="/guides"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:border-slate-300"
          >
            타로 가이드
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">이용 방법</h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm leading-6 text-slate-600">
              <li>리딩 영역(연애, 직장, 오늘의 운세 등)을 선택합니다.</li>
              <li>궁금한 내용을 입력합니다(선택).</li>
              <li>한 장 또는 세 장 스프레드로 카드를 뽑습니다.</li>
              <li>로그인 후 AI 타로 리딩 결과를 확인합니다.</li>
            </ol>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">더 알아보기</h2>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-600">
              <li>
                <Link href="/guides" className="text-slate-700 underline-offset-2 hover:underline">
                  타로 가이드 글 모음
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-700 underline-offset-2 hover:underline">
                  문의하기
                </Link>
              </li>
              <li>
                <Link href="/" className="text-slate-700 underline-offset-2 hover:underline">
                  AI 타로 시작하기
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <section className="mt-8 space-y-3" aria-labelledby="tarot-features-heading">
          <h2 id="tarot-features-heading" className="text-lg font-semibold text-slate-900">
            주요 기능
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 sm:text-base">
            <li>16가지 리딩 주제(연애, 직장, 재물, 오늘의 운세 등)</li>
            <li>78장 풀 덱 기반 1장·3장 스프레드</li>
            <li>AI가 생성하는 한국어 타로 리딩 결과</li>
            <li>이메일·Google 계정 로그인 지원</li>
          </ul>
        </section>

        <h2 className="mt-8 text-lg font-semibold text-slate-900">자주 묻는 질문</h2>
        <dl className="mt-4 space-y-4">
          {HOME_SEO_FAQ.map((item) => (
            <div key={item.question} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <dt className="text-sm font-semibold text-slate-800">{item.question}</dt>
              <dd className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-xs leading-6 text-slate-500">
          {SERVICE_NAME} AI 타로는 오락·자기성찰 목적의 콘텐츠이며, 의료·법률·투자 조언을 대체하지 않습니다.
        </p>
      </div>
    </section>
  );
}
