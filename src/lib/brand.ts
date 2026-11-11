import type { AppLocale } from "@/i18n/routing";

export const SERVICE_NAME = "진동코인";
export const SERVICE_NAME_EN = "JindongCoin";
export const SERVICE_NAME_JA = "JindongCoin";

export function getLocalizedBrandName(_locale: AppLocale): string {
  return SERVICE_NAME;
}

export const GOOGLE_ADSENSE_CLIENT = "ca-pub-7677744293773918";

/** 네이버 서치어드바이저 사이트 소유 확인 */
export const NAVER_SITE_VERIFICATION = "b1209f6fe4de5f489ce57257ffc18b47212a85fc";

/** Google Search Console 사이트 소유 확인 */
export const GOOGLE_SITE_VERIFICATION = "MOTEsOBFqjbMfveUc0xSQI5UX2G9einmw_7ZEs0j544";

export const SERVICE_TAGLINE = "코인·미국증시 실시간 차트 · AI 영상 요약 · 투자 커뮤니티";

const SERVICE_TAGLINES: Record<AppLocale, string> = {
  ko: SERVICE_TAGLINE,
  en: "Live crypto & US market charts · AI video summaries · Community",
  ja: "暗号資産・米国株チャート · AI動画要約 · コミュニティ",
};

export function getLocalizedTagline(locale: AppLocale): string {
  return SERVICE_TAGLINES[locale] ?? SERVICE_TAGLINES.ko;
}

/** 서비스 한 줄 소개 (메타 description·OG·JSON-LD 공통) */
export const SERVICE_DESCRIPTION =
  "진동코인은 비트코인·이더리움 같은 주요 코인과 나스닥·S&P500 등 미국 증시 지수의 실시간 차트를 보여 주고, 코인·주식 유튜브 전망 영상을 AI가 영상 속 발언만 근거로 요약해 주며, 코인과 주식 투자자가 분석과 정보를 나누는 커뮤니티입니다.";

/** 서비스가 주는 가치 — 소개 페이지·JSON-LD featureList·홈 소개 문구에 사용 */
export const SERVICE_VALUES = [
  {
    title: "코인·미국증시 실시간 차트",
    body: "비트코인·이더리움·리플·솔라나와 나스닥·나스닥100·S&P500·다우존스의 캔들 차트를 15분봉부터 주봉까지 한 화면에서 봅니다.",
  },
  {
    title: "코인·주식 유튜브 AI 요약",
    body: "코인·주식 전망 유튜브 영상을 모아 보고, 긴 영상의 핵심 주장·언급된 가격대·화자의 관점을 AI가 영상 속 발언만 근거로 요약합니다. 모든 항목에 영상 시각이 붙어 바로 확인할 수 있습니다.",
  },
  {
    title: "코인·주식 커뮤니티",
    body: "코인분석, 주식분석, 해외주식, 국내주식, 뉴스·정보, 질문, 손익인증 게시판에서 투자자끼리 의견과 근거를 나눕니다.",
  },
] as const;

/** 한국어 검색 유입용 핵심 키워드 */
export const SERVICE_KEYWORDS = [
  "진동코인",
  "진코",
  "코인 커뮤니티",
  "주식 커뮤니티",
  "코인 차트",
  "실시간 코인 차트",
  "비트코인 실시간 시세",
  "비트코인 전망",
  "나스닥 차트",
  "나스닥 실시간",
  "나스닥 전망",
  "S&P500 전망",
  "미국 증시 전망",
  "미국 주식 전망",
  "주식 전망 유튜브",
  "코인 유튜브",
  "유튜브 영상 요약",
  "AI 영상 요약",
  "코인 AI 분석",
  "주식 AI 분석",
  "해외주식 게시판",
  "주식 손익인증",
] as const;

export const SERVICE_KEYWORDS_EN = [
  "JindongCoin",
  "Jinco",
  "crypto community",
  "stock community",
  "nasdaq chart",
  "live crypto chart",
  "AI crypto chart analysis",
  "crypto YouTube summary",
  "bitcoin price",
] as const;

export const SERVICE_KEYWORDS_JA = ["JindongCoin", "Jinco", "暗号資産コミュニティ", "暗号資産チャート", "AI分析"] as const;

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
