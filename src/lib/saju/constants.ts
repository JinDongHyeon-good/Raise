/**
 * 사주(명리) 기본 상수 — 천간·지지·오행·십성.
 * 모든 인덱스는 표준 순서를 따른다.
 *   천간: 갑(0) 을 병 정 무 기 경 신 임 계(9)
 *   지지: 자(0) 축 인 묘 진 사 오 미 신 유 술 해(11)
 */

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
