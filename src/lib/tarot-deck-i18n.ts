import type { AppLocale } from "@/i18n/routing";
import {
  TAROT_SPREADS,
  TAROT_TOPICS,
  type CardOrientation,
  type TarotSpreadId,
  type TarotSuit,
  type TarotTopicId,
} from "@/lib/tarot-deck";

type TopicCopy = { label: string; hint: string; placeholder: string };
type SpreadCopy = { label: string; description: string; positions: string[] };

const TOPIC_COPY: Record<AppLocale, Record<TarotTopicId, TopicCopy>> = {
  ko: Object.fromEntries(
    TAROT_TOPICS.map((t) => [t.id, { label: t.label, hint: t.hint, placeholder: t.placeholder }]),
  ) as Record<TarotTopicId, TopicCopy>,
  en: {
    today: { label: "Today's fortune", hint: "Today's energy and cautions", placeholder: "Anything on your mind today? (optional)" },
    weekly: { label: "This week", hint: "Weekly flow, opportunities, cautions", placeholder: "e.g. interviews, plans, key dates this week" },
    love: { label: "Love & dating", hint: "Crush, confession, relationship progress", placeholder: "e.g. their feelings, timing, where things are heading" },
    couple: { label: "Couples", hint: "Trust, communication, shared future", placeholder: "e.g. after a fight, distance, marriage or living together" },
    reunite: { label: "Breakup & reunion", hint: "Closure, longing, meeting again", placeholder: "e.g. whether to reach out, feelings after a breakup" },
    family: { label: "Family & marriage", hint: "Home, parents, children, wedding prep", placeholder: "e.g. family conflict, wedding timing, parents" },
    social: { label: "Relationships", hint: "Friends, colleagues, boundaries", placeholder: "e.g. misunderstandings, workplace ties, new connections" },
    career: { label: "Career & job change", hint: "Interviews, promotion, direction", placeholder: "e.g. interview results, timing to move, your role" },
    business: { label: "Business & startup", hint: "Launch, growth, partnerships", placeholder: "e.g. startup timing, business idea, collaboration" },
    money: { label: "Money & finance", hint: "Income, spending, habits", placeholder: "e.g. spending control, side income, big purchases (general advice only)" },
    study: { label: "Study & exams", hint: "Focus, flow, exam luck", placeholder: "e.g. exam prep, certifications, major or path" },
    wellbeing: { label: "Mind & healing", hint: "Stress, recovery, self-care", placeholder: "e.g. burnout, anxiety, time to rest (not medical advice)" },
    choice: { label: "Choices & decisions", hint: "Crossroads, priorities, timing", placeholder: "e.g. A vs B, whether to quit, decide now or wait" },
    move: { label: "Moving & change", hint: "New environment, adaptation", placeholder: "e.g. moving timing, life abroad, new school or job" },
    growth: { label: "Growth & goals", hint: "Self-development, habits, direction", placeholder: "e.g. new goals, building habits, confidence" },
    general: { label: "General", hint: "The message you need most now", placeholder: "Describe what you are most curious about now" },
  },
  ja: {
    today: { label: "今日の運勢", hint: "今日一日の気配・注意点", placeholder: "今日特に気になることがあれば書いてください（任意）" },
    weekly: { label: "今週の運勢", hint: "週間の流れ・チャンス・注意", placeholder: "例：今週の面接、約束、重要な予定" },
    love: { label: "恋愛・片思い", hint: "好意、告白、関係の進展", placeholder: "例：相手の気持ち、告白のタイミング、関係の方向" },
    couple: { label: "カップル・夫婦", hint: "信頼、コミュニケーション、未来", placeholder: "例：喧嘩後の仲直り、距離感、結婚・同棲" },
    reunite: { label: "復縁・別れ", hint: "整理、懐かしさ、再会", placeholder: "例：連絡するか、別れ後の気持ち、復縁の可能性" },
    family: { label: "家族・結婚", hint: "家庭、親子、結婚準備", placeholder: "例：家族の対立、結婚時期、親との関係" },
    social: { label: "人間関係", hint: "友人、同僚、距離の取り方", placeholder: "例：友人との誤解、職場の関係、新しいつながり" },
    career: { label: "就職・転職", hint: "面接、昇進、キャリア", placeholder: "例：面接結果、転職時期、チームでの役割" },
    business: { label: "事業・起業", hint: "開始、拡大、パートナーシップ", placeholder: "例：起業タイミング、事業アイデア、協業" },
    money: { label: "金運・お金", hint: "収入、支出、習慣", placeholder: "例：支出の調整、副収入、大きな出費（一般的な助言のみ）" },
    study: { label: "学業・試験", hint: "勉強の流れ、集中、試験運", placeholder: "例：試験準備、資格、専攻・進路" },
    wellbeing: { label: "心・ヒーリング", hint: "ストレス、回復、セルフケア", placeholder: "例：燃え尽き、不安、休むべきとき（医療助言ではありません）" },
    choice: { label: "選択・決断", hint: "岐路、優先順位、決断", placeholder: "例：AとBの選択、辞めるかどうか、今決めるか" },
    move: { label: "引っ越し・変化", hint: "環境の転換、適応", placeholder: "例：引っ越し時期、海外・転勤、学校・職場の変更" },
    growth: { label: "成長・目標", hint: "自己啓発、習慣、方向性", placeholder: "例：新しい目標、習慣づくり、自信の回復" },
    general: { label: "総合", hint: "いま最も必要なメッセージ", placeholder: "いま一番気になる状況を自由に書いてください" },
  },
};

const GUIDANCE: Record<AppLocale, Record<TarotTopicId, string>> = {
  ko: {
    today: "오늘 하루의 기운, 주의할 점, 잘 쓰면 좋은 기회에 초점을 맞춘다.",
    weekly: "이번 주 전반의 흐름, 기회가 열리는 때, 조심하면 좋은 포인트에 초점을 맞춘다.",
    love: "연애·썸·호감 관계의 마음, 진전, 표현 타이밍에 초점을 맞춘다.",
    couple: "연인·부부 관계의 신뢰, 소통, 갈등 조율, 함께하는 방향에 초점을 맞춘다.",
    reunite: "이별·재회·연락 여부, 감정 정리, 관계의 마무리 또는 재연 가능성에 초점을 맞춘다.",
    family: "가족·결혼·가정 내 역할, 세대 간 소통, 결혼·동거 준비에 초점을 맞춘다.",
    social: "친구·동료·지인 관계, 거리 조절, 오해 해소, 인맥의 질에 초점을 맞춘다.",
    career: "취업, 이직, 면접, 승진, 업무 성과와 커리어 타이밍에 초점을 맞춘다.",
    business: "창업·사업 시작, 확장, 파트너·고객 관계, 현실적 리스크에 초점을 맞춘다. 투자 종목 추천은 하지 않는다.",
    money: "수입·지출·저축 습관, 재정 결정의 균형에 초점을 맞춘다. 투자 종목·도박 조언은 하지 않는다.",
    study: "학업, 시험, 자격증, 집중력, 준비 전략과 학습 방향에 초점을 맞춘다.",
    wellbeing: "정서적 회복, 스트레스 완화, 자기돌봄, 마음의 균형에 초점을 맞춘다. 의료·진단·약물 조언은 하지 않는다.",
    choice: "갈림길에서의 선택, 우선순위, 결단의 타이밍과 각 선택의 에너지에 초점을 맞춘다.",
    move: "이사, 환경 변화, 적응 과정, 새로운 자리에서의 시작에 초점을 맞춘다.",
    growth: "자기성장, 목표 설정, 습관·루틴, 장기적인 방향에 초점을 맞춘다.",
    general: "질문자가 지금 가장 필요로 하는 통찰과 균형 잡힌 조언에 초점을 맞춘다.",
  },
  en: {
    today: "Focus on today's energy, cautions, and opportunities to use well.",
    weekly: "Focus on the week's overall flow, openings, and points to watch.",
    love: "Focus on feelings, progress, and timing in dating and crushes.",
    couple: "Focus on trust, communication, conflict balance, and shared direction.",
    reunite: "Focus on breakup, reunion, contact, closure, and reconnection potential.",
    family: "Focus on family roles, generations, marriage, and living together.",
    social: "Focus on friends, colleagues, boundaries, and clearing misunderstandings.",
    career: "Focus on jobs, interviews, promotion, performance, and career timing.",
    business: "Focus on starting or growing a business and partnerships. Do not recommend investments.",
    money: "Focus on income, spending, saving habits, and balanced financial choices. No gambling or stock picks.",
    study: "Focus on study flow, exams, certifications, focus, and learning strategy.",
    wellbeing: "Focus on emotional recovery, stress relief, and self-care. No medical or diagnostic advice.",
    choice: "Focus on crossroads, priorities, timing, and the energy of each option.",
    move: "Focus on moving, environmental change, adaptation, and fresh starts.",
    growth: "Focus on personal growth, goals, habits, routines, and long-term direction.",
    general: "Focus on the insight and balanced guidance the querent needs most now.",
  },
  ja: {
    today: "今日一日の気配、注意点、うまく活かせるチャンスに焦点を当てる。",
    weekly: "今週全体の流れ、チャンスが開く時期、注意したい点に焦点を当てる。",
    love: "恋愛・片思いの気持ち、進展、表現のタイミングに焦点を当てる。",
    couple: "恋人・夫婦の信頼、コミュニケーション、対立の調整、共に進む方向に焦点を当てる。",
    reunite: "別れ・復縁・連絡の是非、感情の整理、関係の区切りや再会の可能性に焦点を当てる。",
    family: "家族・結婚・家庭内の役割、世代間の対話、結婚・同棲の準備に焦点を当てる。",
    social: "友人・同僚・知人関係、距離感、誤解の解消、人脈の質に焦点を当てる。",
    career: "就職、転職、面接、昇進、業務成果とキャリアのタイミングに焦点を当てる。",
    business: "起業・事業開始、拡大、パートナー・顧客関係、現実的リスクに焦点を当てる。投資銘柄の推奨はしない。",
    money: "収入・支出・貯蓄習慣、金銭判断のバランスに焦点を当てる。投資銘柄・ギャンブル助言はしない。",
    study: "学業、試験、資格、集中力、準備戦略と学習の方向に焦点を当てる。",
    wellbeing: "情緒の回復、ストレス緩和、セルフケア、心のバランスに焦点を当てる。医療・診断・薬の助言はしない。",
    choice: "岐路での選択、優先順位、決断のタイミングと各選択のエネルギーに焦点を当てる。",
    move: "引っ越し、環境変化、適応の過程、新しい場所でのスタートに焦点を当てる。",
    growth: "自己成長、目標設定、習慣・ルーティン、長期的な方向に焦点を当てる。",
    general: "相談者がいま最も必要とする洞察とバランスの取れた助言に焦点を当てる。",
  },
};

const SPREAD_COPY: Record<AppLocale, Record<TarotSpreadId, SpreadCopy>> = {
  ko: {
    single: { label: "한 장", description: "지금 가장 필요한 핵심 메시지 한 가지에 집중해 읽습니다.", positions: ["핵심 메시지"] },
    three: { label: "세 장", description: "과거·현재·미래 흐름을 이어서 짧게 살펴봅니다.", positions: ["과거", "현재", "미래"] },
  },
  en: {
    single: { label: "One card", description: "Focus on the single core message you need most right now.", positions: ["Core message"] },
    three: { label: "Three cards", description: "Read past, present, and future in a short flow.", positions: ["Past", "Present", "Future"] },
  },
  ja: {
    single: { label: "1枚", description: "いま最も必要な核心メッセージに集中して読みます。", positions: ["核心メッセージ"] },
    three: { label: "3枚", description: "過去・現在・未来の流れをつないで短く見ます。", positions: ["過去", "現在", "未来"] },
  },
};

const SUIT_LABELS: Record<AppLocale, Record<TarotSuit, string>> = {
  ko: { major: "메이저", cups: "컵", swords: "소드", pentacles: "펜타클", wands: "완드" },
  en: { major: "Major", cups: "Cups", swords: "Swords", pentacles: "Pentacles", wands: "Wands" },
  ja: { major: "大アルカナ", cups: "カップ", swords: "ソード", pentacles: "ペンタクル", wands: "ワンド" },
};

const ORIENTATION_LABELS: Record<AppLocale, Record<CardOrientation, string>> = {
  ko: { upright: "정방향", reversed: "역방향" },
  en: { upright: "Upright", reversed: "Reversed" },
  ja: { upright: "正位置", reversed: "逆位置" },
};

const SERVICE_NAMES: Record<AppLocale, string> = {
  ko: "멜로타로 AI 타로",
  en: "Melotaro AI Tarot",
  ja: "メロタロ AIタロット",
};

export function getLocalizedTopics(locale: AppLocale) {
  return TAROT_TOPICS.map((topic) => ({
    ...topic,
    ...TOPIC_COPY[locale][topic.id],
  }));
}

export function getLocalizedSpreads(locale: AppLocale) {
  return TAROT_SPREADS.map((spread) => {
    const copy = SPREAD_COPY[locale][spread.id];
    return { ...spread, ...copy };
  });
}

export function localizedTopicLabel(topic: TarotTopicId, locale: AppLocale) {
  return TOPIC_COPY[locale][topic]?.label ?? TOPIC_COPY.ko[topic].label;
}

export function localizedTopicPlaceholder(topic: TarotTopicId, locale: AppLocale) {
  return TOPIC_COPY[locale][topic]?.placeholder ?? TOPIC_COPY.ko[topic].placeholder;
}

export function localizedTopicGuidance(topic: TarotTopicId, locale: AppLocale) {
  return GUIDANCE[locale][topic] ?? GUIDANCE.ko[topic];
}

export function localizedSuitLabel(suit: TarotSuit, locale: AppLocale) {
  return SUIT_LABELS[locale][suit] ?? suit;
}

export function localizedOrientationLabel(orientation: CardOrientation, locale: AppLocale) {
  return ORIENTATION_LABELS[locale][orientation];
}

export function localizedSpreadDescription(spread: TarotSpreadId, locale: AppLocale) {
  return SPREAD_COPY[locale][spread].description;
}

export function localizedSpreadPositions(spread: TarotSpreadId, locale: AppLocale) {
  return SPREAD_COPY[locale][spread].positions;
}

export function localizedServiceName(locale: AppLocale) {
  return SERVICE_NAMES[locale];
}

export function localizedSpreadLabel(spread: TarotSpreadId, locale: AppLocale) {
  return SPREAD_COPY[locale][spread].label;
}
