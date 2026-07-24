import { Link } from "@/navigation";
import { SERVICE_NAME } from "@/lib/brand";
import { HOME_SEO_FAQ, HOME_SEO_INTRO } from "@/lib/seo";

/** 서비스 안내·FAQ (서비스 소개 페이지) */
export function TarotServiceInfoContent() {
  return (
    <section className="bg-[var(--piclick-beige-soft)]" aria-labelledby="service-info-heading">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <h1
          id="service-info-heading"
          className="font-brand-display text-2xl font-bold text-[var(--piclick-green-deep)] sm:text-3xl"
        >
          {HOME_SEO_INTRO.heading}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--piclick-ink-muted)] sm:text-base">
          {HOME_SEO_INTRO.body}
        </p>

        <section className="mt-8 space-y-3" aria-labelledby="operator-heading">
          <h2 id="operator-heading" className="text-lg font-semibold text-[var(--piclick-ink)]">
            운영 안내
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-[var(--piclick-ink-muted)] sm:text-base">
            {SERVICE_NAME}는 피클볼 코트 예약, 모임 커뮤니티, 대관, 클럽·광고를 연결하는 웹 서비스입니다. 브랜드명
            Piclick은 &quot;Pickleball + Click&quot;으로, 피클볼을 더 쉽게 예약하고 참여한다는 의미로 사용합니다. 서비스
            개선, 개인정보, 광고·제휴 관련 문의는 아래 연락처로 접수합니다.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-7 text-[var(--piclick-ink-muted)] sm:text-base">
            <li>
              이메일:{" "}
              <a href="mailto:wlsehdgus23@gmail.com" className="text-[var(--piclick-green-deep)] underline">
                wlsehdgus23@gmail.com
              </a>
            </li>
            <li>
              전화:{" "}
              <a href="tel:01032301521" className="text-[var(--piclick-green-deep)] underline">
                010-3230-1521
              </a>
            </li>
            <li>
              <Link href="/contact" className="text-[var(--piclick-green-deep)] underline">
                문의 페이지
              </Link>
              ·
              <Link href="/privacy" className="text-[var(--piclick-green-deep)] underline">
                개인정보처리방침
              </Link>
              ·
              <Link href="/terms" className="text-[var(--piclick-green-deep)] underline">
                이용약관
              </Link>
            </li>
          </ul>
        </section>

        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <a
            href="/#features"
            className="rounded-md border border-[var(--piclick-green)]/20 bg-white px-3 py-1.5 text-[var(--piclick-ink)] hover:border-[var(--piclick-green)]/40"
          >
            코트 예약
          </a>
          <a
            href="/#features"
            className="rounded-md border border-[var(--piclick-green)]/20 bg-white px-3 py-1.5 text-[var(--piclick-ink)] hover:border-[var(--piclick-green)]/40"
          >
            모임 커뮤니티
          </a>
          <a
            href="/#features"
            className="rounded-md border border-[var(--piclick-green)]/20 bg-white px-3 py-1.5 text-[var(--piclick-ink)] hover:border-[var(--piclick-green)]/40"
          >
            대관
          </a>
          <a
            href="/#features"
            className="rounded-md border border-[var(--piclick-green)]/20 bg-white px-3 py-1.5 text-[var(--piclick-ink)] hover:border-[var(--piclick-green)]/40"
          >
            클럽 · 광고
          </a>
        </div>

        <section className="mt-10" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-lg font-semibold text-[var(--piclick-ink)]">
            자주 묻는 질문
          </h2>
          <dl className="mt-4 space-y-3">
            {HOME_SEO_FAQ.map((item) => (
              <div
                key={item.question}
                className="rounded-md border border-[var(--piclick-green)]/15 bg-white p-4"
              >
                <dt className="text-sm font-semibold text-[var(--piclick-ink)]">{item.question}</dt>
                <dd className="mt-2 text-sm leading-6 text-[var(--piclick-ink-muted)]">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </section>
  );
}
