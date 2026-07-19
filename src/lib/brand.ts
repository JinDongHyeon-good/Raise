import type { AppLocale } from "@/i18n/routing";

export const SERVICE_NAME = "멜로타로";
export const SERVICE_NAME_EN = "Melotaro";
export const SERVICE_NAME_JA = "メロタロ";

export function getLocalizedBrandName(locale: AppLocale): string {
  if (locale === "en") return SERVICE_NAME_EN;
  if (locale === "ja") return SERVICE_NAME_JA;
  return SERVICE_NAME;
}

export const GOOGLE_ADSENSE_CLIENT = "ca-pub-7677744293773918";

/** 네이버 서치어드바이저 사이트 소유 확인 */
export const NAVER_SITE_VERIFICATION = "b1209f6fe4de5f489ce57257ffc18b47212a85fc";

/** Google Search Console 사이트 소유 확인 */
export const GOOGLE_SITE_VERIFICATION = "MOTEsOBFqjbMfveUc0xSQI5UX2G9einmw_7ZEs0j544";

export const SERVICE_TAGLINE = "AI 타로 · 멜로타로";

const SERVICE_TAGLINES: Record<AppLocale, string> = {
  ko: SERVICE_TAGLINE,
  en: "AI Tarot · Melotaro",
  ja: "AIタロット · メロタロ",
};

export function getLocalizedTagline(locale: AppLocale): string {
  return SERVICE_TAGLINES[locale] ?? SERVICE_TAGLINES.ko;
}

export const SERVICE_DESCRIPTION =
  "멜로타로는 무료 AI 타로·무료 타로 서비스입니다. 카드와 질문을 바탕으로 연애, 직장, 재물, 오늘의 운세, 오늘의 타로 등 지금 궁금한 흐름을 AI가 타로 리딩으로 읽어드립니다.";

/** 한국어 검색 유입용 핵심 키워드 (풍선 등 무관 키워드 제외) */
export const SERVICE_KEYWORDS = [
  "무료 타로",
  "무료AI타로",
  "무료 AI 타로",
  "무료 에이아이 타로",
  "AI 타로 무료",
  "타로 무료",
  "타로 무료 보기",
  "무료 타로 보기",
  "무료 타로 리딩",
  "무료 온라인 타로",
  "온라인 무료 타로",
  "무료 타로 사이트",
  "타로 카드 무료",
  "AI타로 무료",
  "AI 타로",
  "AI타로",
  "온라인 AI 타로",
  "AI 타로 리딩",
  "타로 리딩",
  "온라인 타로",
  "타로 카드",
  "타로 보기",
  "운세",
  "무료 운세",
  "오늘의 타로",
  "오늘 타로",
  "무료 오늘의 타로",
  "오늘의 운세",
  "오늘 운세",
  "무료 오늘의 운세",
  "오늘의 운세 타로",
  "연애 타로",
  "무료 연애 타로",
  "연애운",
  "이번 주 운세",
  "주간 운세",
  "재물 운세",
  "직장인운세",
  "이직 타로",
  "멜로타로",
  "Melotaro",
] as const;

export const SERVICE_KEYWORDS_EN = [
  "free tarot",
  "free AI tarot",
  "AI tarot free",
  "free tarot reading",
  "free online tarot",
  "online free tarot",
  "free tarot cards",
  "free tarot site",
  "AI tarot",
  "online AI tarot",
  "AI tarot reading",
  "tarot reading",
  "online tarot",
  "today's tarot",
  "daily tarot",
  "free daily tarot",
  "today's fortune",
  "daily fortune",
  "free daily fortune",
  "love tarot",
  "free love tarot",
  "weekly fortune",
  "career tarot",
  "money fortune",
  "Melotaro",
] as const;

export const SERVICE_KEYWORDS_JA = [
  "無料タロット",
  "無料AIタロット",
  "AIタロット無料",
  "タロット無料",
  "無料タロットリーディング",
  "無料オンラインタロット",
  "オンライン無料タロット",
  "タロット無料診断",
  "無料でタロット",
  "AIタロット",
  "オンラインAIタロット",
  "AIタロットリーディング",
  "タロットリーディング",
  "今日のタロット",
  "無料今日のタロット",
  "今日の運勢",
  "無料今日の運勢",
  "今日の運勢タロット",
  "恋愛タロット",
  "無料恋愛タロット",
  "今週の運勢",
  "金運タロット",
  "仕事タロット",
  "メロタロ",
  "Melotaro",
] as const;

export function getServiceKeywords(locale: AppLocale): readonly string[] {
  if (locale === "en") return SERVICE_KEYWORDS_EN;
  if (locale === "ja") return SERVICE_KEYWORDS_JA;
  return SERVICE_KEYWORDS;
}

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "https://jjindong.com";
  try {
    const withScheme = raw.includes("://") ? raw : `https://${raw}`;
    return withScheme.replace(/\/$/, "");
  } catch {
    return "https://jjindong.com";
  }
}
