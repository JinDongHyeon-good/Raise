import { getSiteUrl, SERVICE_NAME } from "@/lib/brand";
import { getOgImageUrl } from "@/lib/seo";

/**
 * /saju 페이지 SEO·AEO 단일 소스.
 * 화면에 보이는 FAQ와 JSON-LD(FAQPage)가 반드시 같은 문구를 쓰도록 여기서만 관리한다.
 */

export const SAJU_PATH = "/saju";

export const SAJU_META = {
  title: "사주란? 오늘의 운세·사주팔자·궁합 보는 법 | 사주네",
  description:
    "사주 소개: 사주팔자의 뜻, 오행과 십성, 오늘의 운세와 궁합 보는 법까지 한 번에. 무료 사주·운세는 사주네에서 확인하세요.",
  keywords: [
    "사주",
    "사주란",
    "사주팔자",
    "사주 보는 법",
    "오늘의 운세",
    "무료 사주",
    "무료사주",
    "무료 오늘의운세",
    "AI 사주",
    "운세",
    "궁합",
    "궁합 사주",
    "오행",
    "십성",
    "만세력",
    "토정비결",
    "신년운세",
    "사주네",
    "Sajune",
  ],
} as const;

export type SajuFaqItem = {
  question: string;
  answer: string;
};

/** AEO(답변 엔진) 대응: 질문형 검색에 그대로 인용될 수 있는 정의·수치 중심 답변 */
export const SAJU_FAQ: SajuFaqItem[] = [
  {
    question: "사주란 무엇인가요?",
    answer:
      "사주는 태어난 연·월·일·시를 각각 천간·지지 두 글자로 나타낸 여덟 글자, 즉 사주팔자를 말합니다. 이 여덟 글자에 담긴 오행(목·화·토·금·수)의 조화를 읽어 타고난 기질과 삶의 흐름, 오늘의 운세까지 풀어냅니다.",
  },
  {
    question: "사주팔자는 어떻게 보나요?",
    answer:
      "먼저 태어난 연·월·일·시를 만세력 기준으로 천간·지지로 바꿔 사주팔자를 세웁니다. 그다음 일간(태어난 날의 천간)을 중심으로 오행의 균형과 십성의 관계를 살펴 성향·재물·관계·시기 등을 해석합니다.",
  },
  {
    question: "오행과 십성은 무엇인가요?",
    answer:
      "오행은 목·화·토·금·수 다섯 기운으로, 서로 돕고(상생) 누르는(상극) 관계로 사주의 균형을 봅니다. 십성은 일간을 기준으로 다른 글자와의 관계를 비견·식신·재성·관성·인성 등으로 나눈 것으로 재물·명예·관계 등의 운을 읽는 기준이 됩니다.",
  },
  {
    question: "오늘의 운세는 어떻게 결정되나요?",
    answer:
      "오늘의 운세는 그날의 일진(오늘의 천간·지지)과 내 사주의 관계를 보고 판단합니다. 그날의 기운이 내 사주의 어떤 오행·십성을 돕거나 누르는지에 따라 총운·재물운·애정운·건강운의 흐름이 매일 달라집니다.",
  },
  {
    question: "궁합 사주는 어떻게 보나요?",
    answer:
      "두 사람의 사주팔자를 각각 세운 뒤, 서로의 오행이 상생·상극으로 어떻게 어울리는지, 일간과 십성의 관계가 어떤지를 비교합니다. 이를 통해 연애·결혼 궁합의 잘 맞는 점과 서로 보완하면 좋은 점을 확인할 수 있습니다.",
  },
  {
    question: "사주는 무료인가요? 결과는 믿어도 되나요?",
    answer:
      "사주네의 오늘의 운세, 사주팔자, 궁합 등 핵심 기능은 무료로 제공됩니다. 사주·운세 결과는 자기 이해와 참고를 위한 것으로, 중요한 결정은 스스로 신중히 판단하시길 권합니다.",
  },
];

type JsonLdObject = Record<string, unknown>;

export function getSajuJsonLd(): JsonLdObject[] {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${SAJU_PATH}`;
  const homeUrl = `${siteUrl}/`;
  const ogImage = getOgImageUrl();

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: SAJU_META.title,
      description: SAJU_META.description,
      inLanguage: "ko-KR",
      isPartOf: { "@id": `${homeUrl}#website` },
      primaryImageOfPage: { "@type": "ImageObject", url: ogImage },
      about: {
        "@type": "Thing",
        name: "사주",
        alternateName: ["사주팔자", "Saju", "Four Pillars of Destiny"],
        sameAs: [
          "https://ko.wikipedia.org/wiki/%EC%82%AC%EC%A3%BC",
          "https://en.wikipedia.org/wiki/Four_Pillars_of_Destiny",
        ],
      },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["#what h2", "#what p", "#saju-faq"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${pageUrl}#article`,
      headline: "사주란? 사주팔자·오행·오늘의 운세 보는 법",
      description: SAJU_META.description,
      url: pageUrl,
      image: ogImage,
      inLanguage: "ko-KR",
      author: { "@type": "Organization", name: SERVICE_NAME, url: homeUrl },
      publisher: {
        "@type": "Organization",
        name: SERVICE_NAME,
        url: homeUrl,
        logo: { "@type": "ImageObject", url: ogImage },
      },
      mainEntityOfPage: { "@id": `${pageUrl}#webpage` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SERVICE_NAME, item: homeUrl },
        { "@type": "ListItem", position: 2, name: "사주 소개", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: SAJU_FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];
}
