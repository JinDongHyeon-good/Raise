import type { AppLocale } from "@/i18n/routing";

export const SERVICE_NAME = "진코";
export const SERVICE_NAME_EN = "Jinco";
export const SERVICE_NAME_JA = "Jinco";

export function getLocalizedBrandName(_locale: AppLocale): string {
  return SERVICE_NAME;
}

export const GOOGLE_ADSENSE_CLIENT = "ca-pub-7677744293773918";

/** 네이버 서치어드바이저 사이트 소유 확인 */
export const NAVER_SITE_VERIFICATION = "b1209f6fe4de5f489ce57257ffc18b47212a85fc";

/** Google Search Console 사이트 소유 확인 */
export const GOOGLE_SITE_VERIFICATION = "MOTEsOBFqjbMfveUc0xSQI5UX2G9einmw_7ZEs0j544";

export const SERVICE_TAGLINE = "실시간 코인 차트 · AI 분석 · 코인 커뮤니티";

const SERVICE_TAGLINES: Record<AppLocale, string> = {
  ko: SERVICE_TAGLINE,
  en: "Live crypto charts · AI analysis · Community",
  ja: "リアルタイム暗号資産チャート · AI分析 · コミュニティ",
};

export function getLocalizedTagline(locale: AppLocale): string {
  return SERVICE_TAGLINES[locale] ?? SERVICE_TAGLINES.ko;
}

/** 서비스 한 줄 소개 (메타 description·OG·JSON-LD 공통) */
export const SERVICE_DESCRIPTION =
  "진코는 비트코인·이더리움·리플 등 주요 코인의 실시간 차트를 AI가 분석해 주고, 쏟아지는 코인 유튜브 영상을 AI가 요약해 주며, 투자자끼리 분석과 정보를 나누는 코인 커뮤니티입니다.";

/** 서비스가 주는 가치 — 소개 페이지·JSON-LD featureList·홈 소개 문구에 사용 */
export const SERVICE_VALUES = [
  {
    title: "실시간 차트 + AI 분석",
    body: "주요 코인의 실시간 캔들 차트를 15분봉부터 주봉까지 보고, 이동평균·RSI·MACD·볼린저밴드 같은 지표를 AI가 읽어 추세·지지·저항을 정리해 줍니다.",
  },
  {
    title: "코인 유튜브 영상 AI 요약",
    body: "코인별 최신·인기 유튜브 영상을 한곳에 모으고, 긴 영상의 핵심 주장과 근거를 AI가 요약해 줘서 몇 분 만에 흐름을 파악할 수 있습니다.",
  },
  {
    title: "코인 커뮤니티",
    body: "자유게시판, 코인분석, 뉴스·정보, 질문, 손익인증 게시판에서 투자자끼리 의견과 근거를 나누고, 추천·댓글로 좋은 글을 골라 봅니다.",
  },
] as const;

/** 한국어 검색 유입용 핵심 키워드 */
export const SERVICE_KEYWORDS = [
  "진코",
  "코인 커뮤니티",
  "코인 차트",
  "실시간 코인 차트",
  "비트코인 차트",
  "비트코인 실시간 시세",
  "이더리움 시세",
  "리플 시세",
  "코인 AI 분석",
  "AI 차트 분석",
  "비트코인 AI 분석",
  "코인 유튜브",
  "코인 유튜브 요약",
  "코인 영상 요약",
  "비트코인 전망",
  "코인 전망",
  "코인 분석 게시판",
  "코인 손익인증",
  "코인 뉴스",
] as const;

export const SERVICE_KEYWORDS_EN = [
  "Jinco",
  "crypto community",
  "live crypto chart",
  "AI crypto chart analysis",
  "crypto YouTube summary",
  "bitcoin price",
] as const;

export const SERVICE_KEYWORDS_JA = ["Jinco", "暗号資産コミュニティ", "暗号資産チャート", "AI分析"] as const;

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
