import { getSiteUrl, SERVICE_NAME } from "@/lib/brand";
import { getOgImageUrl } from "@/lib/seo";

/**
 * /pickleball 페이지 SEO·AEO 단일 소스.
 * 화면에 보이는 FAQ와 JSON-LD(FAQPage)가 반드시 같은 문구를 쓰도록 여기서만 관리한다.
 */

export const PICKLEBALL_PATH = "/pickleball";

export const PICKLEBALL_META = {
  title: "피클볼이란? 규칙·장비·코트 예약과 대관까지 | Piclick",
  description:
    "피클볼 소개: 규칙, 점수, 패들·볼·코트 크기, 테니스와의 차이까지 한 번에. 피클볼 코트 예약과 시설 대관은 Piclick에서 시작하세요.",
  keywords: [
    "피클볼",
    "피클볼이란",
    "피클볼 규칙",
    "피클볼 점수",
    "피클볼 코트",
    "피클볼 코트 크기",
    "피클볼 패들",
    "피클볼 예약",
    "피클볼 코트 예약",
    "피클볼 대관",
    "피클볼 모임",
    "피클볼 초보",
    "피클볼 배우기",
    "피클릭",
    "Piclick",
  ],
} as const;

export type PickleballFaqItem = {
  question: string;
  answer: string;
};

/** AEO(답변 엔진) 대응: 질문형 검색에 그대로 인용될 수 있는 정의·수치 중심 답변 */
export const PICKLEBALL_FAQ: PickleballFaqItem[] = [
  {
    question: "피클볼이란 무엇인가요?",
    answer:
      "피클볼은 배드민턴 크기의 코트에서 단단한 패들과 구멍 뚫린 플라스틱 볼로 랠리를 주고받는 네트 스포츠입니다. 테니스·배드민턴·탁구의 요소를 섞은 종목으로, 규칙이 단순하고 볼 속도가 느려 처음 치는 날에도 랠리를 만들 수 있습니다.",
  },
  {
    question: "피클볼 규칙과 점수는 어떻게 되나요?",
    answer:
      "서브는 언더핸드로 대각선 코트에 넣고, 보통 복식으로 진행합니다. 네트 앞 논발리존(키친)에서는 볼이 바운드된 뒤에만 칠 수 있습니다. 점수는 일반적으로 11점제이며 2점 차가 나야 끝납니다.",
  },
  {
    question: "피클볼 코트 크기는 어느 정도인가요?",
    answer:
      "피클볼 코트는 가로 6.1m, 세로 13.4m(20×44피트)로 배드민턴 복식 코트와 같은 크기입니다. 테니스 코트 한 면에 피클볼 코트를 2~4면 만들 수 있어 실내 체육관이나 테니스장에서도 쉽게 즐길 수 있습니다.",
  },
  {
    question: "피클볼과 테니스는 무엇이 다른가요?",
    answer:
      "피클볼은 테니스보다 코트가 작고 볼이 느리며 라켓 대신 스트링 없는 패들을 씁니다. 그만큼 배우기 쉽고 몸에 부담이 적어 남녀노소가 함께 치기 좋습니다. 서브도 오버핸드가 아닌 언더핸드로 넣습니다.",
  },
  {
    question: "피클볼 코트 예약은 어떻게 하나요?",
    answer:
      "Piclick(피클릭)에서 지역과 시간대를 고르고 빈 코트를 확인해 예약할 수 있습니다. 실내·야외 코트, 단발 예약부터 정기 슬롯까지 지원하며, 코트 예약 기능은 순차적으로 열리고 있습니다.",
  },
  {
    question: "피클볼 대관은 누가, 어떻게 이용하나요?",
    answer:
      "정기 모임, 리그, 이벤트처럼 코트가 통째로 필요한 개인·클럽·운영자가 Piclick에서 시설 대관을 신청하고 운영자와 일정을 맞출 수 있습니다. 모임 커뮤니티와 연결해 참가자 모집까지 한 흐름으로 이어집니다.",
  },
  {
    question: "피클볼을 처음 시작하려면 무엇이 필요한가요?",
    answer:
      "패들 하나와 운동화면 충분합니다. 볼과 코트는 모임·시설에서 보통 준비되어 있습니다. Piclick 커뮤니티에서 초보 환영 오픈 게임을 찾아 참가하면 규칙을 익히며 바로 시작할 수 있습니다.",
  },
];

type JsonLdObject = Record<string, unknown>;

export function getPickleballJsonLd(): JsonLdObject[] {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${PICKLEBALL_PATH}`;
  const homeUrl = `${siteUrl}/`;
  const ogImage = getOgImageUrl();

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: PICKLEBALL_META.title,
      description: PICKLEBALL_META.description,
      inLanguage: "ko-KR",
      isPartOf: { "@id": `${homeUrl}#website` },
      primaryImageOfPage: { "@type": "ImageObject", url: ogImage },
      about: {
        "@type": "Thing",
        name: "피클볼",
        alternateName: "Pickleball",
        sameAs: [
          "https://ko.wikipedia.org/wiki/%ED%94%BC%ED%81%B4%EB%B3%BC",
          "https://en.wikipedia.org/wiki/Pickleball",
        ],
      },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["#what h2", "#what p", "#pickleball-faq"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${pageUrl}#article`,
      headline: "피클볼이란? 규칙·장비·시작 방법",
      description: PICKLEBALL_META.description,
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
        { "@type": "ListItem", position: 2, name: "피클볼 소개", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: PICKLEBALL_FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];
}
