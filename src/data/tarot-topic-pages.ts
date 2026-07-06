import type { TarotTopicId } from "@/lib/tarot-deck";

export type TarotTopicPage = {
  slug: string;
  topicId: TarotTopicId;
  title: string;
  description: string;
  keywords: string[];
  heading: string;
  intro: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
};

/** 검색 키워드별 전용 랜딩 페이지 (오늘의 운세, 오늘의 타로, 연애 타로 등) */
export const TAROT_TOPIC_PAGES: TarotTopicPage[] = [
  {
    slug: "today-fortune",
    topicId: "today",
    title: "오늘의 운세 타로 | 무료 AI 타로 — 멜로타로",
    description:
      "오늘의 운세를 AI 타로로 확인하세요. 멜로타로에서 카드를 뽑으면 오늘 하루의 기운·주의점·행동 조언을 AI가 해석해 드립니다. 무료 온라인 오늘의 운세 타로.",
    keywords: ["오늘의 운세", "오늘 운세", "오늘의 운세 타로", "무료 오늘의 운세", "AI 오늘의 운세"],
    heading: "오늘의 운세 타로",
    intro:
      "하루를 시작하기 전, 오늘의 기운과 주의할 점을 가볍게 점검해 보세요. 멜로타로 AI 타로는 78장 타로 카드와 인공지능 해석으로 오늘의 운세 리딩을 제공합니다.",
    sections: [
      {
        heading: "오늘의 운세 타로 이렇게 보세요",
        paragraphs: [
          "아침이나 중요한 일정 전에 한 장 스프레드로 카드를 뽑으면 오늘 하루의 에너지와 마음가짐을 정리하는 데 도움이 됩니다.",
          "궁금한 일이 있다면 질문란에 적어 주세요. 예: 오늘 면접, 중요한 대화, 건강 관리 등.",
        ],
      },
      {
        heading: "무료 AI 오늘의 운세",
        paragraphs: [
          "멜로타로는 로그인 후 무료로 AI 타로 리딩을 이용할 수 있습니다. 결과는 오락·자기성찰 목적이며, 의료·투자 조언을 대체하지 않습니다.",
        ],
      },
    ],
  },
  {
    slug: "today-tarot",
    topicId: "today",
    title: "오늘의 타로 | 무료 온라인 AI 타로 — 멜로타로",
    description:
      "오늘의 타로를 무료로 봐 보세요. 멜로타로 AI 타로에서 카드를 뽑으면 오늘 하루에 맞춘 타로 리딩과 실천 조언을 받을 수 있습니다.",
    keywords: ["오늘의 타로", "오늘 타로", "무료 오늘의 타로", "오늘의 타로 보기", "AI 오늘의 타로"],
    heading: "오늘의 타로",
    intro:
      "오늘의 타로는 하루의 흐름을 카드 한 장 또는 세 장으로 읽어 보는 방식입니다. 멜로타로에서 AI가 뽑힌 카드의 상징과 질문 맥락을 연결해 한국어 리딩을 생성합니다.",
    sections: [
      {
        heading: "오늘의 타로 vs 오늘의 운세",
        paragraphs: [
          "둘 다 하루 단위의 인사이트를 얻는 데 쓰이지만, 타로는 카드 상징과 스프레드에 초점을 둡니다. 멜로타로에서는 '오늘의 운세' 주제로 동일하게 이용할 수 있습니다.",
        ],
      },
      {
        heading: "1장 vs 3장 스프레드",
        paragraphs: [
          "빠른 메시지가 필요하면 한 장, 흐름을 구조적으로 보고 싶으면 세 장(과거·현재·미래) 리딩을 선택하세요.",
        ],
      },
    ],
  },
  {
    slug: "love-tarot",
    topicId: "love",
    title: "연애 타로 | AI 타로 리딩 — 멜로타로",
    description:
      "연애·썸 고민을 AI 타로로 정리해 보세요. 상대 마음, 고백 타이밍, 관계 진전에 대한 타로 리딩을 멜로타로에서 무료로 받을 수 있습니다.",
    keywords: ["연애 타로", "썸 타로", "연애운 타로", "AI 연애 타로", "무료 연애 타로"],
    heading: "연애·썸 타로",
    intro:
      "연애 타로는 상대의 마음을 단정하기보다, 내가 관계에서 어떤 태도를 취하면 좋을지 살펴보는 데 초점을 둡니다. 감정이 복잡할 때 생각을 정리하는 데 자주 사용됩니다.",
    sections: [
      {
        heading: "추천 질문 예시",
        paragraphs: [
          "'지금 연락하는 타이밍은 어떤가요?', '상대와의 오해를 풀려면 무엇이 필요할까요?'처럼 행동과 태도를 묻는 질문이 실용적입니다.",
        ],
      },
    ],
  },
  {
    slug: "weekly-fortune",
    topicId: "weekly",
    title: "이번 주 운세 타로 | AI 타로 — 멜로타로",
    description:
      "이번 주 운세를 AI 타로로 확인하세요. 주간 흐름, 기회, 조심할 때를 카드 리딩으로 정리해 드립니다.",
    keywords: ["이번 주 운세", "주간 운세", "주간 타로", "이번주 운세 타로"],
    heading: "이번 주 운세 타로",
    intro:
      "한 주의 전체적인 흐름을 미리 점검하고 싶을 때 이번 주 운세 타로를 활용해 보세요. 면접, 약속, 중요 일정이 있는 주에 특히 유용합니다.",
    sections: [
      {
        heading: "주간 운세 활용 팁",
        paragraphs: [
          "이번 주 특히 신경 쓰이는 일정을 질문란에 적어 주세요. 결과에서 강조되는 키워드를 메모하고, 주말에 실제와 비교해 보면 해석에 익숙해집니다.",
        ],
      },
    ],
  },
  {
    slug: "career-tarot",
    topicId: "career",
    title: "직장·취업 타로 | AI 타로 리딩 — 멜로타로",
    description:
      "취업, 이직, 직장 고민을 AI 타로로 정리해 보세요. 커리어 방향과 준비할 점에 대한 타로 리딩을 멜로타로에서 받을 수 있습니다.",
    keywords: ["직장 타로", "취업 타로", "이직 타로", "커리어 타로", "AI 직장 타로"],
    heading: "직장·취업 타로",
    intro:
      "커리어 주제는 불안과 기대가 동시에 큰 영역입니다. 타로는 '무엇을 준비하면 좋을지', '지금의 강점은 무엇인지'를 돌아보게 해 줍니다.",
    sections: [
      {
        heading: "주의사항",
        paragraphs: [
          "특정 회사 합격, 승진 확정, 투자 종목 추천은 제공하지 않습니다. 의사결정은 본인의 정보 수집과 전문가 상담을 병행하세요.",
        ],
      },
    ],
  },
  {
    slug: "money-fortune",
    topicId: "money",
    title: "재물 운세 타로 | AI 타로 — 멜로타로",
    description:
      "재물·금전 흐름을 AI 타로로 살펴보세요. 수입·지출 습관, 금전 스트레스의 원인을 정리하는 타로 리딩을 제공합니다.",
    keywords: ["재물 운세", "금전 타로", "재물 타로", "돈 운세 타로", "AI 재물 운세"],
    heading: "재물·금전 타로",
    intro:
      "재물 리딩은 단기적 행운을 넘어 지속 가능한 재정 습관과 마음가짐에 주목합니다. 멜로타로에서 재물 주제를 선택해 카드를 뽑아 보세요.",
    sections: [
      {
        heading: "재물 타로 활용",
        paragraphs: [
          "저축, 지출, 부업, 금전 스트레스 등 구체적인 상황을 질문에 담으면 리딩이 더 실용적으로 느껴질 수 있습니다.",
        ],
      },
    ],
  },
  {
    slug: "free-ai-tarot",
    topicId: "general",
    title: "무료 AI 타로 | 온라인 타로 리딩 — 멜로타로",
    description:
      "무료 AI 타로를 지금 바로 시작하세요. 멜로타로는 78장 타로 카드와 AI 해석으로 연애, 직장, 재물, 오늘의 운세 등 다양한 주제의 온라인 타로 리딩을 제공합니다.",
    keywords: ["무료 AI 타로", "무료 타로", "AI 타로 무료", "온라인 무료 타로", "타로 무료 보기"],
    heading: "무료 AI 타로",
    intro:
      "멜로타로는 웹 브라우저에서 바로 이용하는 무료 AI 타로 서비스입니다. 로그인 후 카드를 뽑으면 AI가 한국어 타로 리딩을 생성합니다.",
    sections: [
      {
        heading: "멜로타로 무료 AI 타로 특징",
        paragraphs: [
          "16가지 리딩 주제, 1장·3장 스프레드, 78장 풀 덱, Google·이메일 로그인을 지원합니다.",
          "타로 가이드 글과 FAQ를 통해 AI 타로 이용법도 함께 확인할 수 있습니다.",
        ],
      },
    ],
  },
];

export function getTarotTopicPage(slug: string) {
  return TAROT_TOPIC_PAGES.find((page) => page.slug === slug) ?? null;
}
