import type { AppLocale } from "@/i18n/routing";

export const SERVICE_NAME = "찐투";
export const SERVICE_NAME_EN = "jjintu";
export const SERVICE_NAME_JA = "jjintu";

export function getLocalizedBrandName(locale: AppLocale): string {
  return locale === "en" ? SERVICE_NAME_EN : SERVICE_NAME;
}

export const GOOGLE_ADSENSE_CLIENT = "ca-pub-7677744293773918";

/** 네이버 서치어드바이저 사이트 소유 확인 */
export const NAVER_SITE_VERIFICATION = "b1209f6fe4de5f489ce57257ffc18b47212a85fc";

/** Google Search Console 사이트 소유 확인 */
export const GOOGLE_SITE_VERIFICATION = "MOTEsOBFqjbMfveUc0xSQI5UX2G9einmw_7ZEs0j544";

export const SERVICE_TAGLINE = "코인·주식 분석 영상 모아보기 · AI 요약 · 채널·키워드별 모아보기";

const SERVICE_TAGLINES: Record<AppLocale, string> = {
  ko: SERVICE_TAGLINE,
  en: "Crypto & stock analysis videos in one place · AI summaries · By channel & keyword",
  ja: "暗号資産・米国株チャート · AI動画要約 · コミュニティ",
};

export function getLocalizedTagline(locale: AppLocale): string {
  return SERVICE_TAGLINES[locale] ?? SERVICE_TAGLINES.ko;
}

/** 서비스 한 줄 소개 (메타 description·OG·JSON-LD 공통) */
export const SERVICE_DESCRIPTION =
  "찐투는 여러 유튜버의 코인·주식 분석 영상을 한곳에 모아 보여 주고, 긴 영상은 AI가 핵심 주장·언급된 가격대·관점만 빠르게 요약해 줍니다. 즐겨 보는 채널과 관심 키워드(비트코인, 나스닥, 엔비디아 등)를 골라 그 영상만 모아 보고 비교할 수 있고, 코인·미국 증시 실시간 차트와 투자 커뮤니티도 함께 제공합니다.";

/** 서비스가 주는 가치 — 소개 페이지·JSON-LD featureList·홈 소개 문구에 사용 */
export const SERVICE_VALUES = [
  {
    title: "코인·주식 분석 영상을 한곳에 모아보기",
    body: "비트코인·알트코인, 나스닥·미국 주식, 국내 주식 전망을 다루는 여러 유튜버의 분석 영상을 시장별로 모아 최신순·인기순으로 보여 줍니다. 채널을 하나하나 찾아다니지 않아도 오늘 나온 분석을 한 화면에서 훑어볼 수 있습니다.",
  },
  {
    title: "긴 분석 영상, AI가 빠르게 요약",
    body: "30분~1시간짜리 영상도 AI가 영상 속 발언만 근거로 핵심 주장·언급된 가격대·화자의 관점을 정리합니다. 요약의 모든 문장에 영상 시각이 붙어 있어, 누르면 그 장면으로 바로 이동해 확인할 수 있습니다.",
  },
  {
    title: "내 채널·키워드로 골라 보고 비교하기",
    body: "자주 보는 채널과 관심 키워드(예: 비트코인, 이더리움, 나스닥, 엔비디아)를 추가해 두면 그 채널의 최신 영상과 키워드 영상만 모아 볼 수 있습니다. 같은 주제를 여러 채널이 어떻게 보는지 요약으로 빠르게 비교해 보세요.",
  },
  {
    title: "코인·미국 증시 실시간 차트",
    body: "비트코인·이더리움·리플·솔라나와 나스닥·나스닥100·S&P500·다우존스의 캔들 차트를 15분봉부터 주봉까지 영상과 함께 확인합니다.",
  },
  {
    title: "코인·주식 커뮤니티",
    body: "코인분석, 주식분석, 해외주식, 국내주식, 뉴스·정보, 질문, 손익인증 게시판에서 투자자끼리 의견과 근거를 나눕니다.",
  },
] as const;

/** 영어 서비스 한 줄 소개 (/en 메타 description·OG·JSON-LD) */
export const SERVICE_DESCRIPTION_EN =
  "jjintu brings crypto and stock analysis videos from many YouTubers into one place, and AI quickly summarizes long videos into the key claims, price levels and the speaker's view. Pick the channels and keywords you follow (Bitcoin, Nasdaq, Nvidia and more) to see and compare only those videos, alongside live crypto and US market charts and an investor community.";

export const SERVICE_VALUES_EN = [
  {
    title: "Crypto & stock analysis videos in one place",
    body: "Outlook videos on Bitcoin and altcoins, the Nasdaq and US stocks, and Korean stocks from many YouTubers, gathered by market and sorted by newest or most popular. No more hopping between channels to see today's takes.",
  },
  {
    title: "Fast AI summaries of long videos",
    body: "Even 30–60 minute videos are summarized into the key claims, price levels and the speaker's view, based only on what is said. Every point carries a timestamp that jumps straight to that moment in the video.",
  },
  {
    title: "Your channels and keywords, side by side",
    body: "Add the channels you follow and keywords you care about (Bitcoin, Ethereum, Nasdaq, Nvidia…) to see only their latest videos — and compare how different channels read the same topic through their summaries.",
  },
  {
    title: "Live crypto & US stock charts",
    body: "Candlestick charts for Bitcoin, Ethereum, XRP and Solana alongside the Nasdaq Composite, Nasdaq 100, S&P 500 and Dow Jones, from 15-minute to weekly candles, right next to the videos.",
  },
  {
    title: "Crypto & stock community",
    body: "Investors share opinions and reasoning on the Crypto Analysis, Stock Analysis, US Stocks, Korean Stocks, News & Info, Q&A and P&L Proof boards.",
  },
] as const;

export function getLocalizedServiceDescription(locale: AppLocale): string {
  return locale === "en" ? SERVICE_DESCRIPTION_EN : SERVICE_DESCRIPTION;
}

export function getServiceValues(locale: AppLocale): ReadonlyArray<{ title: string; body: string }> {
  return locale === "en" ? SERVICE_VALUES_EN : SERVICE_VALUES;
}

/** 한국어 검색 유입용 핵심 키워드 */
export const SERVICE_KEYWORDS = [
  "찐투",
  "jjintu",
  "코인 유튜브 모아보기",
  "주식 유튜브 모아보기",
  "코인 분석 영상",
  "주식 분석 영상",
  "유튜브 요약",
  "유튜브 영상 AI 요약",
  "코인 유튜브 요약",
  "주식 유튜브 요약",
  "비트코인 전망 유튜브",
  "나스닥 전망 유튜브",
  "유튜브 채널 모아보기",
  "유튜브 키워드 모아보기",
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
  "바이비트",
  "바이비트 가입",
  "바이비트 레퍼럴",
  "바이비트 추천인",
  "Bybit referral",
  "Bybit invite",
] as const;

export const SERVICE_KEYWORDS_EN = [
  "jjintu",
  "찐투",
  "crypto YouTube videos in one place",
  "crypto analysis videos",
  "stock analysis videos",
  "YouTube summarizer",
  "AI YouTube summary",
  "bitcoin outlook YouTube",
  "nasdaq outlook YouTube",
  "YouTube channel feed",
  "crypto community",
  "stock community",
  "nasdaq chart",
  "live crypto chart",
  "AI crypto chart analysis",
  "crypto YouTube summary",
  "bitcoin price",
  "bitcoin live chart",
  "ethereum chart",
  "nasdaq live chart",
  "nasdaq 100 chart",
  "S&P 500 chart",
  "Dow Jones chart",
  "stock market outlook",
  "crypto YouTube",
  "YouTube video summary",
  "AI video summary",
  "investor community",
  "Bybit",
  "Bybit referral",
  "Bybit invite code",
] as const;

export const SERVICE_KEYWORDS_JA = ["jjintu", "찐투", "暗号資産コミュニティ", "暗号資産チャート", "AI分析"] as const;

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
