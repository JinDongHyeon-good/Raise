import type { AppLocale } from "@/i18n/routing";

export const SERVICE_NAME = "사주네";
export const SERVICE_NAME_EN = "Sajune";
export const SERVICE_NAME_JA = "サジュネ";

const BRAND_NAMES: Record<AppLocale, string> = {
  ko: SERVICE_NAME,
  en: SERVICE_NAME_EN,
  ja: SERVICE_NAME_JA,
};

export function getLocalizedBrandName(locale: AppLocale): string {
  return BRAND_NAMES[locale] ?? SERVICE_NAME;
}

export const GOOGLE_ADSENSE_CLIENT = "ca-pub-7677744293773918";

/** 네이버 서치어드바이저 사이트 소유 확인 */
export const NAVER_SITE_VERIFICATION = "b1209f6fe4de5f489ce57257ffc18b47212a85fc";

/** Google Search Console 사이트 소유 확인 */
export const GOOGLE_SITE_VERIFICATION = "MOTEsOBFqjbMfveUc0xSQI5UX2G9einmw_7ZEs0j544";

export const SERVICE_TAGLINE = "오늘의 운세 · 사주팔자 · 궁합";

const SERVICE_TAGLINES: Record<AppLocale, string> = {
  ko: SERVICE_TAGLINE,
  en: "Daily Fortune · Saju · Compatibility",
  ja: "今日の運勢 · 四柱推命 · 相性",
};

export function getLocalizedTagline(locale: AppLocale): string {
  return SERVICE_TAGLINES[locale] ?? SERVICE_TAGLINES.ko;
}

export const SERVICE_DESCRIPTION =
  "사주네는 생년월일시로 보는 오늘의 운세, 사주팔자, 궁합을 정통 명리로 쉽게 풀어주는 무료 사주 서비스입니다.";

/** 한국어 검색 유입용 핵심 키워드 */
export const SERVICE_KEYWORDS = [
  "사주",
  "사주팔자",
  "오늘의 운세",
  "무료 사주",
  "무료사주",
  "무료 오늘의운세",
  "AI 사주",
  "운세",
  "궁합",
  "궁합 사주",
  "사주풀이",
  "정통 사주",
  "신년운세",
  "토정비결",
  "만세력",
  "일진",
  "띠별 운세",
  "별자리 운세",
  "생년월일 운세",
  "무료 운세",
  "사주네",
  "Sajune",
] as const;

export const SERVICE_KEYWORDS_EN = [
  "saju",
  "korean fortune telling",
  "four pillars of destiny",
  "daily fortune",
  "horoscope",
  "compatibility reading",
  "birth chart",
  "free fortune telling",
  "zodiac fortune",
  "bazi",
  "Sajune",
] as const;

export const SERVICE_KEYWORDS_JA = [
  "四柱推命",
  "占い",
  "今日の運勢",
  "無料占い",
  "運勢",
  "相性",
  "相性占い",
  "生年月日占い",
  "干支",
  "運勢占い",
  "Sajune",
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
