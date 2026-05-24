export type TarotSuit = "major" | "cups" | "swords" | "pentacles" | "wands";

export type TarotTopicId =
  | "today"
  | "weekly"
  | "love"
  | "couple"
  | "reunite"
  | "family"
  | "social"
  | "career"
  | "business"
  | "money"
  | "study"
  | "wellbeing"
  | "choice"
  | "move"
  | "growth"
  | "general";

export type TarotSpreadId = "single" | "three";
export type CardOrientation = "upright" | "reversed";

export type TarotCardDef = {
  id: string;
  suit: TarotSuit;
  nameKo: string;
  nameEn: string;
  keywords: string;
  imageBase: string;
  imageFile: string;
};

export const TAROT_TOPIC_IDS: TarotTopicId[] = [
  "today",
  "weekly",
  "love",
  "couple",
  "reunite",
  "family",
  "social",
  "career",
  "business",
  "money",
  "study",
  "wellbeing",
  "choice",
  "move",
  "growth",
  "general",
];

export const TAROT_TOPICS: Array<{
  id: TarotTopicId;
  label: string;
  hint: string;
  placeholder: string;
}> = [
  {
    id: "today",
    label: "오늘의 운세",
    hint: "오늘 하루의 기운·주의점",
    placeholder: "오늘 특히 신경 쓰이는 일이 있다면 적어 주세요 (선택)",
  },
  {
    id: "weekly",
    label: "이번 주 운세",
    hint: "주간 흐름·기회·조심할 때",
    placeholder: "예: 이번 주 면접, 약속, 중요한 일정",
  },
  {
    id: "love",
    label: "연애·썸",
    hint: "호감, 고백, 관계 진전",
    placeholder: "예: 상대의 마음, 고백 타이밍, 썸의 방향",
  },
  {
    id: "couple",
    label: "커플·부부",
    hint: "신뢰, 소통, 함께하는 미래",
    placeholder: "예: 다툼 후 화해, 거리감, 결혼·동거 이야기",
  },
  {
    id: "reunite",
    label: "재회·이별",
    hint: "정리, 그리움, 다시 만남",
    placeholder: "예: 연락 여부, 이별 후 마음, 재회 가능성",
  },
  {
    id: "family",
    label: "가족·결혼",
    hint: "가정, 부모·자녀, 결혼 준비",
    placeholder: "예: 가족 갈등, 결혼 시기, 부모님과의 관계",
  },
  {
    id: "social",
    label: "인간관계",
    hint: "친구, 동료, 거리 조절",
    placeholder: "예: 친구와의 오해, 직장 내 관계, 새로운 인맥",
  },
  {
    id: "career",
    label: "취업·이직",
    hint: "면접, 승진, 커리어 방향",
    placeholder: "예: 면접 결과, 이직 시기, 팀 내 역할",
  },
  {
    id: "business",
    label: "사업·창업",
    hint: "시작, 확장, 파트너십",
    placeholder: "예: 창업 타이밍, 사업 아이템, 협업 관계",
  },
  {
    id: "money",
    label: "재물·금전",
    hint: "수입, 지출, 재정 습관",
    placeholder: "예: 지출 조절, 부수입, 큰 지출 결정 (일반 조언만)",
  },
  {
    id: "study",
    label: "학업·시험",
    hint: "공부 흐름, 집중, 시험 운",
    placeholder: "예: 시험 준비, 자격증, 전공·진로 고민",
  },
  {
    id: "wellbeing",
    label: "마음·힐링",
    hint: "스트레스, 회복, 자기돌봄",
    placeholder: "예: 번아웃, 불안한 마음, 쉬어가야 할 때 (의료 조언 아님)",
  },
  {
    id: "choice",
    label: "선택·결정",
    hint: "갈림길, 우선순위, 결단",
    placeholder: "예: A와 B 중 선택, 그만둘지 말지, 지금 결정할지",
  },
  {
    id: "move",
    label: "이사·변화",
    hint: "환경 전환, 적응, 새 출발",
    placeholder: "예: 이사 시기, 해외·타지 생활, 직장·학교 옮김",
  },
  {
    id: "growth",
    label: "성장·목표",
    hint: "자기계발, 습관, 방향 설정",
    placeholder: "예: 새로운 목표, 습관 만들기, 자신감 회복",
  },
  {
    id: "general",
    label: "종합·전체",
    hint: "지금 가장 필요한 메시지",
    placeholder: "지금 가장 궁금한 상황을 자유롭게 적어 주세요",
  },
];

export const TAROT_SPREADS: Array<{ id: TarotSpreadId; label: string; count: number; positions: string[] }> = [
  { id: "single", label: "오늘의 한 장", count: 1, positions: ["핵심 메시지"] },
  { id: "three", label: "세 장 스프레드", count: 3, positions: ["과거", "현재", "미래"] },
];

const MAJOR_RAW: Omit<TarotCardDef, "suit" | "imageBase">[] = [
  { id: "fool", nameKo: "바보", nameEn: "The Fool", keywords: "새 시작, 자유, 순수한 가능성", imageFile: "바보.jpg" },
  { id: "magician", nameKo: "마법사", nameEn: "The Magician", keywords: "의지, 실행, 집중", imageFile: "마법사.jpg" },
  {
    id: "high_priestess",
    nameKo: "여사제",
    nameEn: "The High Priestess",
    keywords: "직관, 내면, 침묵의 지혜",
    imageFile: "여사제.jpg",
  },
  { id: "empress", nameKo: "여황제", nameEn: "The Empress", keywords: "풍요, 돌봄, 창조", imageFile: "여황제.jpg" },
  { id: "emperor", nameKo: "황제", nameEn: "The Emperor", keywords: "구조, 책임, 안정", imageFile: "황제.jpg" },
  { id: "hierophant", nameKo: "교황", nameEn: "The Hierophant", keywords: "전통, 배움, 신뢰", imageFile: "교황.jpg" },
  { id: "lovers", nameKo: "연인", nameEn: "The Lovers", keywords: "선택, 조화, 관계", imageFile: "연인.jpg" },
  { id: "chariot", nameKo: "전차", nameEn: "The Chariot", keywords: "전진, 승리, 통제", imageFile: "전차.jpg" },
  { id: "strength", nameKo: "힘", nameEn: "Strength", keywords: "용기, 인내, 부드러운 힘", imageFile: "힘.jpg" },
  { id: "hermit", nameKo: "은둔자", nameEn: "The Hermit", keywords: "성찰, 고독, 내면 탐색", imageFile: "은둔자.jpg" },
  {
    id: "wheel",
    nameKo: "운명의 수레바퀴",
    nameEn: "Wheel of Fortune",
    keywords: "변화, 운, 전환",
    imageFile: "운명의수레바퀴.jpg",
  },
  { id: "justice", nameKo: "정의", nameEn: "Justice", keywords: "균형, 공정, 결과", imageFile: "정의.jpg" },
  {
    id: "hanged",
    nameKo: "매달린 사람",
    nameEn: "The Hanged Man",
    keywords: "관점 전환, 기다림, 해방",
    imageFile: "행맨.jpg",
  },
  { id: "death", nameKo: "죽음", nameEn: "Death", keywords: "끝과 시작, 변형, 새 단계", imageFile: "죽음.jpg" },
  { id: "temperance", nameKo: "절제", nameEn: "Temperance", keywords: "조율, 치유, 중용", imageFile: "절제.jpg" },
  { id: "devil", nameKo: "악마", nameEn: "The Devil", keywords: "집착, 유혹, 그림자", imageFile: "악마.jpg" },
  { id: "tower", nameKo: "탑", nameEn: "The Tower", keywords: "돌파, 충격, 진실", imageFile: "타워.jpg" },
  { id: "star", nameKo: "별", nameEn: "The Star", keywords: "희망, 회복, 영감", imageFile: "별.jpg" },
  { id: "moon", nameKo: "달", nameEn: "The Moon", keywords: "불안, 무의식, 감정", imageFile: "달.jpg" },
  { id: "sun", nameKo: "태양", nameEn: "The Sun", keywords: "기쁨, 성공, 명료함", imageFile: "태양카드.jpg" },
  { id: "judgement", nameKo: "심판", nameEn: "Judgement", keywords: "각성, 소명, 결단", imageFile: "심판.jpg" },
  { id: "world", nameKo: "세계", nameEn: "The World", keywords: "완성, 통합, 성취", imageFile: "세계카드.jpg" },
];

export const MAJOR_ARCANA: TarotCardDef[] = MAJOR_RAW.map((card) => ({
  ...card,
  suit: "major" as const,
  imageBase: "/메이저아르카나",
}));

type MinorSuitId = "cups" | "swords" | "pentacles" | "wands";

const MINOR_SUIT_META: Record<
  MinorSuitId,
  { imageBase: string; prefix: string; nameKo: string; nameEn: string; element: string }
> = {
  cups: { imageBase: "/컵", prefix: "컵", nameKo: "컵", nameEn: "Cups", element: "물·감정" },
  swords: { imageBase: "/소드", prefix: "소드", nameKo: "소드", nameEn: "Swords", element: "공기·사고" },
  pentacles: {
    imageBase: "/펜타클",
    prefix: "펜타클",
    nameKo: "펜타클",
    nameEn: "Pentacles",
    element: "땅·현실",
  },
  wands: { imageBase: "/완드", prefix: "완드", nameKo: "완드", nameEn: "Wands", element: "불·행동" },
};

const NUMBER_KEYWORDS: Record<number, string> = {
  2: "선택, 균형, 파트너십",
  3: "성장, 소통, 확장",
  4: "안정, 기반, 휴식",
  5: "변화, 갈등, 시험",
  6: "조화, 나눔, 회복",
  7: "도전, 인내, 성찰",
  8: "움직임, 집중, 진전",
  9: "완성 직전, 깊은 감정",
  10: "마무리, 결과, 다음 단계",
};

const COURT_META = [
  { rank: "page", ko: "시종", en: "Page", file: "페이지", keywords: "호기심, 배움, 새 소식" },
  { rank: "knight", ko: "기사", en: "Knight", file: "나이트", keywords: "추진력, 행동, 변화" },
  { rank: "queen", ko: "여왕", en: "Queen", file: "퀸", keywords: "성숙, 돌봄, 내면의 힘" },
  { rank: "king", ko: "왕", en: "King", file: "킹", keywords: "리더십, 책임, 통제" },
] as const;

function buildMinorArcana(): TarotCardDef[] {
  const cards: TarotCardDef[] = [];

  for (const suitId of Object.keys(MINOR_SUIT_META) as MinorSuitId[]) {
    const meta = MINOR_SUIT_META[suitId];

    cards.push({
      id: `${suitId}_ace`,
      suit: suitId,
      nameKo: `${meta.nameKo} 에이스`,
      nameEn: `Ace of ${meta.nameEn}`,
      keywords: `새 시작, ${meta.element}, 가능성`,
      imageBase: meta.imageBase,
      imageFile: `${meta.prefix}에이스.jpg`,
    });

    for (let num = 2; num <= 10; num += 1) {
      const numKey = String(num).padStart(2, "0");
      cards.push({
        id: `${suitId}_${numKey}`,
        suit: suitId,
        nameKo: `${meta.nameKo} ${num}`,
        nameEn: `${num} of ${meta.nameEn}`,
        keywords: NUMBER_KEYWORDS[num] ?? "흐름, 변화",
        imageBase: meta.imageBase,
        imageFile: `${meta.prefix}${num}.jpg`,
      });
    }

    for (const court of COURT_META) {
      cards.push({
        id: `${suitId}_${court.rank}`,
        suit: suitId,
        nameKo: `${meta.nameKo} ${court.ko}`,
        nameEn: `${court.en} of ${meta.nameEn}`,
        keywords: `${court.keywords}, ${meta.element}`,
        imageBase: meta.imageBase,
        imageFile: `${meta.prefix}${court.file}.jpg`,
      });
    }
  }

  return cards;
}

export const MINOR_ARCANA = buildMinorArcana();

export const FULL_TAROT_DECK: TarotCardDef[] = [...MAJOR_ARCANA, ...MINOR_ARCANA];

export type DrawnTarotCard = TarotCardDef & {
  position: string;
  orientation: CardOrientation;
};

export function getTarotImageUrl(card: Pick<TarotCardDef, "imageBase" | "imageFile">) {
  const encodedBase = card.imageBase
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part.normalize("NFC")))
    .join("/");
  const encodedFile = encodeURIComponent(card.imageFile.normalize("NFC"));
  return `/${encodedBase}/${encodedFile}`;
}

export function suitLabel(suit: TarotSuit) {
  switch (suit) {
    case "major":
      return "메이저";
    case "cups":
      return "컵";
    case "swords":
      return "소드";
    case "pentacles":
      return "펜타클";
    case "wands":
      return "완드";
    default:
      return suit;
  }
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function drawTarotHand(spread: TarotSpreadId): DrawnTarotCard[] {
  const config = TAROT_SPREADS.find((item) => item.id === spread) ?? TAROT_SPREADS[0];
  const picked = shuffle(FULL_TAROT_DECK).slice(0, config.count);
  return picked.map((card, index) => ({
    ...card,
    position: config.positions[index] ?? `카드 ${index + 1}`,
    orientation: Math.random() < 0.28 ? "reversed" : "upright",
  }));
}

export function topicLabel(topic: TarotTopicId) {
  return TAROT_TOPICS.find((item) => item.id === topic)?.label ?? "종합 운세";
}

export function topicPlaceholder(topic: TarotTopicId) {
  return TAROT_TOPICS.find((item) => item.id === topic)?.placeholder ?? "";
}

export function topicGuidance(topic: TarotTopicId) {
  switch (topic) {
    case "today":
      return "오늘 하루의 기운, 주의할 점, 잘 쓰면 좋은 기회에 초점을 맞춘다.";
    case "weekly":
      return "이번 주 전반의 흐름, 기회가 열리는 때, 조심하면 좋은 포인트에 초점을 맞춘다.";
    case "love":
      return "연애·썸·호감 관계의 마음, 진전, 표현 타이밍에 초점을 맞춘다.";
    case "couple":
      return "연인·부부 관계의 신뢰, 소통, 갈등 조율, 함께하는 방향에 초점을 맞춘다.";
    case "reunite":
      return "이별·재회·연락 여부, 감정 정리, 관계의 마무리 또는 재연 가능성에 초점을 맞춘다.";
    case "family":
      return "가족·결혼·가정 내 역할, 세대 간 소통, 결혼·동거 준비에 초점을 맞춘다.";
    case "social":
      return "친구·동료·지인 관계, 거리 조절, 오해 해소, 인맥의 질에 초점을 맞춘다.";
    case "career":
      return "취업, 이직, 면접, 승진, 업무 성과와 커리어 타이밍에 초점을 맞춘다.";
    case "business":
      return "창업·사업 시작, 확장, 파트너·고객 관계, 현실적 리스크에 초점을 맞춘다. 투자 종목 추천은 하지 않는다.";
    case "money":
      return "수입·지출·저축 습관, 재정 결정의 균형에 초점을 맞춘다. 투자 종목·도박 조언은 하지 않는다.";
    case "study":
      return "학업, 시험, 자격증, 집중력, 준비 전략과 학습 방향에 초점을 맞춘다.";
    case "wellbeing":
      return "정서적 회복, 스트레스 완화, 자기돌봄, 마음의 균형에 초점을 맞춘다. 의료·진단·약물 조언은 하지 않는다.";
    case "choice":
      return "갈림길에서의 선택, 우선순위, 결단의 타이밍과 각 선택의 에너지에 초점을 맞춘다.";
    case "move":
      return "이사, 환경 변화, 적응 과정, 새로운 자리에서의 시작에 초점을 맞춘다.";
    case "growth":
      return "자기성장, 목표 설정, 습관·루틴, 장기적인 방향에 초점을 맞춘다.";
    case "general":
    default:
      return "질문자가 지금 가장 필요로 하는 통찰과 균형 잡힌 조언에 초점을 맞춘다.";
  }
}
