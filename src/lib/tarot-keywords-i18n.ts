import type { AppLocale } from "@/i18n/routing";

type KeywordPair = { en: string; ja: string };

const MAJOR_KEYWORDS: Record<string, KeywordPair> = {
  fool: { en: "new beginnings, freedom, pure possibility", ja: "新しい始まり、自由、純粋な可能性" },
  magician: { en: "will, action, focus", ja: "意志、実行、集中" },
  high_priestess: { en: "intuition, inner world, silent wisdom", ja: "直感、内面、静かな知恵" },
  empress: { en: "abundance, nurturing, creation", ja: "豊かさ、ケア、創造" },
  emperor: { en: "structure, responsibility, stability", ja: "構造、責任、安定" },
  hierophant: { en: "tradition, learning, trust", ja: "伝統、学び、信頼" },
  lovers: { en: "choice, harmony, relationship", ja: "選択、調和、関係" },
  chariot: { en: "forward motion, victory, control", ja: "前進、勝利、統制" },
  strength: { en: "courage, patience, gentle strength", ja: "勇気、忍耐、柔らかな力" },
  hermit: { en: "reflection, solitude, inner search", ja: "内省、孤独、内面探索" },
  wheel: { en: "change, fortune, transition", ja: "変化、運、転換" },
  justice: { en: "balance, fairness, outcome", ja: "均衡、公正、結果" },
  hanged: { en: "perspective shift, waiting, release", ja: "視点の転換、待つこと、解放" },
  death: { en: "endings and beginnings, transformation, new phase", ja: "終わりと始まり、変容、新段階" },
  temperance: { en: "balance, healing, moderation", ja: "調和、癒し、中庸" },
  devil: { en: "attachment, temptation, shadow", ja: "執着、誘惑、影" },
  tower: { en: "breakthrough, shock, truth", ja: "突破、衝撃、真実" },
  star: { en: "hope, recovery, inspiration", ja: "希望、回復、インスピレーション" },
  moon: { en: "anxiety, unconscious, emotion", ja: "不安、無意識、感情" },
  sun: { en: "joy, success, clarity", ja: "喜び、成功、明晰さ" },
  judgement: { en: "awakening, calling, resolution", ja: "覚醒、使命、決断" },
  world: { en: "completion, integration, achievement", ja: "完成、統合、達成" },
};

const NUMBER_KEYWORDS: Record<number, KeywordPair> = {
  2: { en: "choice, balance, partnership", ja: "選択、均衡、パートナーシップ" },
  3: { en: "growth, communication, expansion", ja: "成長、コミュニケーション、拡張" },
  4: { en: "stability, foundation, rest", ja: "安定、基盤、休息" },
  5: { en: "change, conflict, test", ja: "変化、葛藤、試練" },
  6: { en: "harmony, sharing, recovery", ja: "調和、分かち合い、回復" },
  7: { en: "challenge, patience, reflection", ja: "挑戦、忍耐、内省" },
  8: { en: "movement, focus, progress", ja: "動き、集中、前進" },
  9: { en: "near completion, deep emotion", ja: "完成直前、深い感情" },
  10: { en: "closure, result, next step", ja: "仕上げ、結果、次の段階" },
};

const COURT_KEYWORDS: Record<string, KeywordPair> = {
  page: { en: "curiosity, learning, news", ja: "好奇心、学び、新しい知らせ" },
  knight: { en: "drive, action, change", ja: "推進力、行動、変化" },
  queen: { en: "maturity, care, inner strength", ja: "成熟、ケア、内なる力" },
  king: { en: "leadership, responsibility, control", ja: "リーダーシップ、責任、統制" },
};

const SUIT_ELEMENT: Record<string, KeywordPair> = {
  cups: { en: "water · emotion", ja: "水・感情" },
  swords: { en: "air · mind", ja: "空気・思考" },
  pentacles: { en: "earth · reality", ja: "土・現実" },
  wands: { en: "fire · action", ja: "火・行動" },
};

const ACE_KEYWORDS: KeywordPair = {
  en: "new beginning, {element}, possibility",
  ja: "新しい始まり、{element}、可能性",
};

const DEFAULT_MINOR: KeywordPair = { en: "flow, change", ja: "流れ、変化" };

const MINOR_SUITS = ["cups", "swords", "pentacles", "wands"] as const;
const COURT_RANKS = ["page", "knight", "queen", "king"] as const;

function pick(pair: KeywordPair, locale: AppLocale) {
  if (locale === "en") return pair.en;
  if (locale === "ja") return pair.ja;
  return null;
}

function resolveMinorKeywords(cardId: string, locale: AppLocale): string | null {
  const suit = MINOR_SUITS.find((s) => cardId.startsWith(`${s}_`));
  if (!suit) return null;

  const element = SUIT_ELEMENT[suit];
  const suffix = cardId.slice(suit.length + 1);

  if (suffix === "ace") {
    const template = pick(ACE_KEYWORDS, locale);
    const elementLabel = element ? pick(element, locale) : "";
    return template?.replace("{element}", elementLabel ?? "") ?? null;
  }

  const court = COURT_RANKS.find((rank) => suffix === rank);
  if (court) {
    const courtKw = COURT_KEYWORDS[court];
    const elementLabel = element ? pick(element, locale) : "";
    const courtText = courtKw ? pick(courtKw, locale) : "";
    if (courtText && elementLabel) return `${courtText}, ${elementLabel}`;
    return courtText;
  }

  const num = Number.parseInt(suffix, 10);
  if (!Number.isNaN(num)) {
    const numberKw = NUMBER_KEYWORDS[num] ?? DEFAULT_MINOR;
    return pick(numberKw, locale);
  }

  return null;
}

/** 타로 카드 키워드를 locale에 맞게 반환 (ko는 덱 원문 keywords 사용) */
export function localizedCardKeywords(
  cardId: string,
  keywordsKo: string,
  locale: AppLocale,
): string {
  if (locale === "ko") return keywordsKo;

  const major = MAJOR_KEYWORDS[cardId];
  if (major) {
    const text = pick(major, locale);
    if (text) return text;
  }

  const minor = resolveMinorKeywords(cardId, locale);
  if (minor) return minor;

  return keywordsKo;
}
