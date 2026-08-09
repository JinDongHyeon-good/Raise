/**
 * 사주(명리) 기본 상수 — 천간·지지·오행·십성.
 * 모든 인덱스는 표준 순서를 따른다.
 *   천간: 갑(0) 을 병 정 무 기 경 신 임 계(9)
 *   지지: 자(0) 축 인 묘 진 사 오 미 신 유 술 해(11)
 */
import type { AppLocale } from "@/i18n/routing";

export type Element = "목" | "화" | "토" | "금" | "수";
export type YinYang = "양" | "음";

export type Stem = {
  index: number;
  ko: string;
  hanja: string;
  element: Element;
  yinYang: YinYang;
};

export type Branch = {
  index: number;
  ko: string;
  hanja: string;
  element: Element;
  yinYang: YinYang;
  zodiac: string; // 띠
  /** 지지 대표(본기) 천간 인덱스 — 십성 산출용 */
  mainStemIndex: number;
};

export const HEAVENLY_STEMS: Stem[] = [
  { index: 0, ko: "갑", hanja: "甲", element: "목", yinYang: "양" },
  { index: 1, ko: "을", hanja: "乙", element: "목", yinYang: "음" },
  { index: 2, ko: "병", hanja: "丙", element: "화", yinYang: "양" },
  { index: 3, ko: "정", hanja: "丁", element: "화", yinYang: "음" },
  { index: 4, ko: "무", hanja: "戊", element: "토", yinYang: "양" },
  { index: 5, ko: "기", hanja: "己", element: "토", yinYang: "음" },
  { index: 6, ko: "경", hanja: "庚", element: "금", yinYang: "양" },
  { index: 7, ko: "신", hanja: "辛", element: "금", yinYang: "음" },
  { index: 8, ko: "임", hanja: "壬", element: "수", yinYang: "양" },
  { index: 9, ko: "계", hanja: "癸", element: "수", yinYang: "음" },
];

export const EARTHLY_BRANCHES: Branch[] = [
  { index: 0, ko: "자", hanja: "子", element: "수", yinYang: "양", zodiac: "쥐", mainStemIndex: 9 },
  { index: 1, ko: "축", hanja: "丑", element: "토", yinYang: "음", zodiac: "소", mainStemIndex: 5 },
  { index: 2, ko: "인", hanja: "寅", element: "목", yinYang: "양", zodiac: "호랑이", mainStemIndex: 0 },
  { index: 3, ko: "묘", hanja: "卯", element: "목", yinYang: "음", zodiac: "토끼", mainStemIndex: 1 },
  { index: 4, ko: "진", hanja: "辰", element: "토", yinYang: "양", zodiac: "용", mainStemIndex: 4 },
  { index: 5, ko: "사", hanja: "巳", element: "화", yinYang: "음", zodiac: "뱀", mainStemIndex: 2 },
  { index: 6, ko: "오", hanja: "午", element: "화", yinYang: "양", zodiac: "말", mainStemIndex: 3 },
  { index: 7, ko: "미", hanja: "未", element: "토", yinYang: "음", zodiac: "양", mainStemIndex: 5 },
  { index: 8, ko: "신", hanja: "申", element: "금", yinYang: "양", zodiac: "원숭이", mainStemIndex: 6 },
  { index: 9, ko: "유", hanja: "酉", element: "금", yinYang: "음", zodiac: "닭", mainStemIndex: 7 },
  { index: 10, ko: "술", hanja: "戌", element: "토", yinYang: "양", zodiac: "개", mainStemIndex: 4 },
  { index: 11, ko: "해", hanja: "亥", element: "수", yinYang: "음", zodiac: "돼지", mainStemIndex: 8 },
];

export const ELEMENTS: Element[] = ["목", "화", "토", "금", "수"];

export const ELEMENT_COLORS: Record<Element, string> = {
  목: "#3f8a62",
  화: "#c0483f",
  토: "#c79a3e",
  금: "#8a8f9c",
  수: "#4a5a8f",
};

/** 상생: A가 B를 생한다 (A → 생성 → generatesTo[A]) */
export const GENERATES: Record<Element, Element> = {
  목: "화",
  화: "토",
  토: "금",
  금: "수",
  수: "목",
};

/** 상극: A가 B를 극한다 (A → 극 → controls[A]) */
export const CONTROLS: Record<Element, Element> = {
  목: "토",
  토: "수",
  수: "화",
  화: "금",
  금: "목",
};

export type TenGod =
  | "비견"
  | "겁재"
  | "식신"
  | "상관"
  | "편재"
  | "정재"
  | "편관"
  | "정관"
  | "편인"
  | "정인";

/**
 * 일간(dayMaster) 기준으로 대상 오행·음양의 십성을 구한다.
 */
export function tenGod(
  dayElement: Element,
  dayYinYang: YinYang,
  targetElement: Element,
  targetYinYang: YinYang,
): TenGod {
  const sameYinYang = dayYinYang === targetYinYang;

  if (targetElement === dayElement) {
    return sameYinYang ? "비견" : "겁재";
  }
  if (GENERATES[dayElement] === targetElement) {
    return sameYinYang ? "식신" : "상관";
  }
  if (CONTROLS[dayElement] === targetElement) {
    return sameYinYang ? "편재" : "정재";
  }
  if (CONTROLS[targetElement] === dayElement) {
    return sameYinYang ? "편관" : "정관";
  }
  // targetElement가 dayElement를 생함 (인성)
  return sameYinYang ? "편인" : "정인";
}

export function stemGanji(index: number) {
  return HEAVENLY_STEMS[((index % 10) + 10) % 10];
}

export function branchGanji(index: number) {
  return EARTHLY_BRANCHES[((index % 12) + 12) % 12];
}

/**
 * 오행/십성/음양은 한글로 저장돼 있어서(예: "목", "비견"), 로케일별 AI 프롬프트에 쓸 표기가 따로 필요하다.
 * ja는 한자 사주(四柱推命) 용어를 그대로, en은 통용되는 영문 BaZi 용어를 쓴다.
 */
export const ELEMENT_LABELS: Record<AppLocale, Record<Element, string>> = {
  ko: { 목: "목", 화: "화", 토: "토", 금: "금", 수: "수" },
  ja: { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" },
  en: { 목: "Wood", 화: "Fire", 토: "Earth", 금: "Metal", 수: "Water" },
};

export function getElementLabel(element: Element, locale: AppLocale): string {
  return ELEMENT_LABELS[locale][element];
}

export const TEN_GOD_LABELS: Record<AppLocale, Record<TenGod, string>> = {
  ko: {
    비견: "비견",
    겁재: "겁재",
    식신: "식신",
    상관: "상관",
    편재: "편재",
    정재: "정재",
    편관: "편관",
    정관: "정관",
    편인: "편인",
    정인: "정인",
  },
  ja: {
    비견: "比肩",
    겁재: "劫財",
    식신: "食神",
    상관: "傷官",
    편재: "偏財",
    정재: "正財",
    편관: "偏官",
    정관: "正官",
    편인: "偏印",
    정인: "正印",
  },
  en: {
    비견: "Friend",
    겁재: "Rob Wealth",
    식신: "Eating God",
    상관: "Hurting Officer",
    편재: "Indirect Wealth",
    정재: "Direct Wealth",
    편관: "Seven Killings",
    정관: "Direct Officer",
    편인: "Indirect Seal",
    정인: "Direct Seal",
  },
};

export function getTenGodLabel(god: TenGod, locale: AppLocale): string {
  return TEN_GOD_LABELS[locale][god];
}

export const YIN_YANG_LABELS: Record<AppLocale, Record<YinYang, string>> = {
  ko: { 양: "양", 음: "음" },
  ja: { 양: "陽", 음: "陰" },
  en: { 양: "Yang", 음: "Yin" },
};

export function getYinYangLabel(yinYang: YinYang, locale: AppLocale): string {
  return YIN_YANG_LABELS[locale][yinYang];
}

const ZODIAC_LABELS: Record<AppLocale, Record<string, string>> = {
  ko: { 쥐: "쥐", 소: "소", 호랑이: "호랑이", 토끼: "토끼", 용: "용", 뱀: "뱀", 말: "말", 양: "양", 원숭이: "원숭이", 닭: "닭", 개: "개", 돼지: "돼지" },
  ja: {
    쥐: "子（ねずみ）",
    소: "丑（うし）",
    호랑이: "寅（とら）",
    토끼: "卯（うさぎ）",
    용: "辰（たつ）",
    뱀: "巳（へび）",
    말: "午（うま）",
    양: "未（ひつじ）",
    원숭이: "申（さる）",
    닭: "酉（とり）",
    개: "戌（いぬ）",
    돼지: "亥（いのしし）",
  },
  en: { 쥐: "Rat", 소: "Ox", 호랑이: "Tiger", 토끼: "Rabbit", 용: "Dragon", 뱀: "Snake", 말: "Horse", 양: "Goat", 원숭이: "Monkey", 닭: "Rooster", 개: "Dog", 돼지: "Pig" },
};

export function getZodiacLabel(zodiac: string, locale: AppLocale): string {
  return ZODIAC_LABELS[locale][zodiac] ?? zodiac;
}
