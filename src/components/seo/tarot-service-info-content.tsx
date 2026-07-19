import { Link } from "@/navigation";
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

        <section className="mt-8 space-y-3" aria-labelledby="operator-heading">
          <h2 id="operator-heading" className="text-lg font-semibold text-slate-900">
            운영 안내
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            {SERVICE_NAME}는 AI 타로 리딩과 타로 가이드·주제별 콘텐츠를 제공하는 개인 운영 웹 서비스입니다. 브랜드명
            멜로타로는 &quot;멜로디처럼 부드럽게 마음을 정리하는 타로&quot;라는 의미로 사용합니다. 서비스 개선, 개인정보,
            광고·쿠키 관련 문의는 아래 연락처로 접수합니다.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-7 text-slate-600 sm:text-base">
            <li>
              이메일:{" "}
              <a href="mailto:wlsehdgus23@gmail.com" className="text-slate-700 underline">
                wlsehdgus23@gmail.com
              </a>
            </li>
            <li>
              전화:{" "}
              <a href="tel:01032301521" className="text-slate-700 underline">
                010-3230-1521
              </a>
            </li>
            <li>
              <Link href="/contact" className="text-slate-700 underline">
                문의 페이지
              </Link>
              ·
              <Link href="/privacy" className="text-slate-700 underline">
                개인정보처리방침
              </Link>
              ·
              <Link href="/terms" className="text-slate-700 underline">
                이용약관
              </Link>
            </li>
          </ul>
        </section>

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
                <Link href="/topics" className="text-slate-700 underline-offset-2 hover:underline">
                  주제별 타로·운세 페이지
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
            <li>타로 이용법·스프레드·주제별 가이드 콘텐츠</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3" aria-labelledby="disclaimer-heading">
          <h2 id="disclaimer-heading" className="text-lg font-semibold text-slate-900">
            서비스 이용 시 유의 사항
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            {SERVICE_NAME}의 리딩과 가이드는 오락·자기성찰을 위한 참고 자료입니다. 미래를 확정적으로 예언하지 않으며,
            의료·법률·투자·심리치료 등 전문 영역을 대체하지 않습니다. 중요한 결정은 충분한 정보 수집과 필요 시 전문가
            상담을 함께 고려해 주세요.
          </p>
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
