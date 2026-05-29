import { SERVICE_NAME } from "@/lib/brand";
import { HOME_SEO_FAQ, HOME_SEO_INTRO } from "@/lib/seo";

/**
 * 검색 엔진·스크린리더용 HTML. 시각적으로는 숨기고 DOM에는 유지합니다.
 */
export function TarotHomeSeoContent() {
  return (
    <section className="sr-only" aria-label={`${SERVICE_NAME} 서비스 소개`}>
      <h2>{HOME_SEO_INTRO.heading}</h2>
      <p>{HOME_SEO_INTRO.body}</p>

      <h2>AI 타로 자주 묻는 질문</h2>
      <dl>
        {HOME_SEO_FAQ.map((item) => (
          <div key={item.question}>
            <dt>{item.question}</dt>
            <dd>{item.answer}</dd>
          </div>
        ))}
      </dl>

      <p>
        {SERVICE_NAME} AI 타로는 오락·자기성찰 목적이며, 의료·법률·투자 조언을 대체하지 않습니다.
      </p>
    </section>
  );
}
