import type { AppLocale } from "@/i18n/routing";

export const SERVICE_NAME = "Piclick";
export const SERVICE_NAME_EN = "Piclick";
export const SERVICE_NAME_JA = "Piclick";

export function getLocalizedBrandName(_locale: AppLocale): string {
  return SERVICE_NAME;
}

export const GOOGLE_ADSENSE_CLIENT = "ca-pub-7677744293773918";

/** 네이버 서치어드바이저 사이트 소유 확인 */
export const NAVER_SITE_VERIFICATION = "b1209f6fe4de5f489ce57257ffc18b47212a85fc";

/** Google Search Console 사이트 소유 확인 */
export const GOOGLE_SITE_VERIFICATION = "MOTEsOBFqjbMfveUc0xSQI5UX2G9einmw_7ZEs0j544";

export const SERVICE_TAGLINE = "피클볼 예약 · 모임 · 대관";

const SERVICE_TAGLINES: Record<AppLocale, string> = {
  ko: SERVICE_TAGLINE,
  en: "Pickleball · Reserve · Play · Host",
  ja: "ピックルボール予約 · コミュニティ · コート",
};

export function getLocalizedTagline(locale: AppLocale): string {
  return SERVICE_TAGLINES[locale] ?? SERVICE_TAGLINES.ko;
}

export const SERVICE_DESCRIPTION =
  "Piclick은 피클볼 코트 예약, 모임 커뮤니티, 대관, 클럽·광고를 한곳에서 연결하는 피클볼 서비스입니다.";

/** 한국어 검색 유입용 핵심 키워드 */
export const SERVICE_KEYWORDS = [
  "피클볼",
  "피클볼 예약",
  "피클볼 코트 예약",
  "피클볼 대관",
  "피클볼 모임",
  "피클볼 커뮤니티",
  "피클볼 클럽",
  "피클볼 동호회",
  "피클볼 경기장",
  "피클볼 코트",
  "피클볼 레슨",
  "피클볼 초보",
  "피클볼 서울",
  "실내 피클볼",
  "야외 피클볼",
  "스포츠 예약",
  "코트 대관",
  "Piclick",
  "피클릭",
] as const;

export const SERVICE_KEYWORDS_EN = [
  "pickleball",
  "pickleball booking",
  "pickleball court reservation",
  "pickleball court rental",
  "pickleball community",
  "pickleball meetup",
  "pickleball club",
  "pickleball courts near me",
  "book pickleball court",
  "indoor pickleball",
  "outdoor pickleball",
  "sports venue rental",
  "Piclick",
] as const;

export const SERVICE_KEYWORDS_JA = [
  "ピックルボール",
  "ピックルボール予約",
  "ピックルボールコート",
  "ピックルボールレンタル",
  "ピックルボールコミュニティ",
  "ピックルボールクラブ",
  "コート予約",
  "スポーツ予約",
  "Piclick",
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
