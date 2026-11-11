import type { AppLocale, RoutedLocale } from "@/i18n/routing";
import { defaultLocale, isRoutedLocale, localizedPath, openGraphLocales } from "@/i18n/routing";
import { SERVICE_DESCRIPTION, SERVICE_DESCRIPTION_EN, SERVICE_NAME, SERVICE_NAME_EN } from "@/lib/brand";

export type SeoLocaleCopy = {
  siteName: string;
  homeTitle: string;
  homeDescription: string;
  /** 서비스 소개 페이지 제목(h1) */
  introHeading: string;
  ogAlt: string;
  schemaLanguage: string;
  featureList: string[];
  faq: Array<{ question: string; answer: string }>;
};

const KO_COPY: SeoLocaleCopy = {
  siteName: SERVICE_NAME,
  homeTitle: "찐동코인 - 코인·나스닥 실시간 차트, 코인·주식 유튜브 AI 요약, 투자 커뮤니티",
  homeDescription:
    "비트코인·이더리움과 나스닥·S&P500 실시간 차트, 코인·미국 주식 전망 유튜브 영상의 AI 요약, 코인·주식 투자자 커뮤니티를 한곳에서. 찐동코인.",
  introHeading: "찐동코인 — 코인·미국증시 실시간 차트 · 유튜브 AI 요약 · 투자 커뮤니티",
  ogAlt: "찐동코인 — 코인·미국증시 실시간 차트 · 유튜브 AI 요약 · 투자 커뮤니티",
  schemaLanguage: "ko",
  featureList: [
    "코인 실시간 시세와 캔들 차트 (15분봉~주봉)",
    "나스닥·나스닥100·S&P500·다우존스 실시간 차트",
    "코인·주식 유튜브 영상 모아보기 (채널 즐겨찾기)",
    "유튜브 영상 AI 요약 (영상 속 발언만 근거, 시각 표시)",
    "코인·주식 커뮤니티 (코인분석·주식분석·해외주식·국내주식·뉴스·질문·손익인증)",
    "추천·댓글·대댓글",
  ],
  faq: [
    {
      question: "찐동코인은 어떤 서비스인가요?",
      answer: SERVICE_DESCRIPTION,
    },
    {
      question: "주식 차트도 볼 수 있나요?",
      answer: "나스닥 종합·나스닥100·S&P500·다우존스 지수 차트를 15분봉부터 주봉까지 볼 수 있고, 관련 유튜브 전망 영상도 함께 모아 보여 줍니다.",
    },
    {
      question: "코인 유튜브 요약은 어떻게 쓰나요?",
      answer:
        "코인·주식 유튜브 영상 중 하나를 고르면 AI가 영상을 받아쓴 뒤 그 내용만으로 핵심 주장·언급된 가격대·화자의 관점을 한국어로 요약합니다. 각 항목에 영상 시각이 붙어 있어 바로 확인할 수 있고, 로그인 후 하루 5회 이용할 수 있습니다.",
    },
    {
      question: "커뮤니티에는 어떤 게시판이 있나요?",
      answer: "자유게시판, 코인분석, 주식분석, 해외주식, 국내주식, 뉴스·정보, 질문, 손익인증 게시판이 있고 추천순·조회순으로 인기 글을 볼 수 있습니다.",
    },
    {
      question: "시세 데이터는 어디서 오나요?",
      answer: "코인은 Bybit 현물 시장 공개 시세(약 10초마다 갱신), 미국 지수는 Yahoo Finance 데이터를 사용합니다. 지수 시세는 지연될 수 있습니다.",
    },
    {
      question: "AI 분석을 믿고 투자해도 되나요?",
      answer:
        "AI 분석과 영상 요약은 판단을 돕는 참고 정보이며 투자 권유가 아닙니다. 투자 판단과 그 결과의 책임은 이용자 본인에게 있습니다.",
    },
  ],
};

const EN_COPY: SeoLocaleCopy = {
  siteName: SERVICE_NAME_EN,
  homeTitle: "JindongCoin – Live Crypto & Nasdaq Charts, AI YouTube Summaries, Investor Community",
  homeDescription:
    "Live Bitcoin, Ethereum, Nasdaq and S&P 500 charts, AI summaries of crypto and US stock outlook videos on YouTube, and a community for crypto and stock investors — all in one place. JindongCoin.",
  introHeading: "JindongCoin — Live Crypto & US Stock Charts · AI YouTube Summaries · Investor Community",
  ogAlt: "JindongCoin — Live crypto & US stock charts · AI YouTube summaries · Investor community",
  schemaLanguage: "en",
  featureList: [
    "Live crypto prices and candlestick charts (15-minute to weekly)",
    "Live Nasdaq Composite, Nasdaq 100, S&P 500 and Dow Jones charts",
    "Crypto and stock YouTube videos in one place (favorite channels)",
    "AI summaries of YouTube videos (based only on what is said, with timestamps)",
    "Crypto and stock community (crypto analysis, stock analysis, US stocks, Korean stocks, news, Q&A, P&L proof)",
    "Upvotes, comments and replies",
  ],
  faq: [
    {
      question: "What is JindongCoin?",
      answer: SERVICE_DESCRIPTION_EN,
    },
    {
      question: "Can I see stock charts too?",
      answer:
        "Yes. You can view Nasdaq Composite, Nasdaq 100, S&P 500 and Dow Jones index charts from 15-minute to weekly candles, together with related YouTube outlook videos.",
    },
    {
      question: "How do the crypto YouTube summaries work?",
      answer:
        "Pick a crypto or stock video on YouTube and the AI transcribes it, then summarizes the key claims, the price levels mentioned and the speaker's view using only what is in the video. Each point carries a video timestamp so you can check it right away. Signed-in users can use it 5 times a day.",
    },
    {
      question: "What boards does the community have?",
      answer:
        "There are Free Talk, Crypto Analysis, Stock Analysis, US Stocks, Korean Stocks, News & Info, Q&A and P&L Proof boards, and you can sort posts by upvotes or views to find popular ones.",
    },
    {
      question: "Where does the price data come from?",
      answer:
        "Crypto prices come from Bybit's public spot market data (refreshed about every 10 seconds), and US indices from Yahoo Finance. Index prices may be delayed.",
    },
    {
      question: "Can I rely on the AI analysis to invest?",
      answer:
        "AI analysis and video summaries are reference information to help your judgment, not investment advice. You are solely responsible for your investment decisions and their results.",
    },
  ],
};

/** ja는 서빙하지 않음 — 키 호환용으로 ko 문구 */
export const SEO_COPY: Record<AppLocale, SeoLocaleCopy> = { ko: KO_COPY, en: EN_COPY, ja: KO_COPY };

export function getSeoCopy(locale: AppLocale | string) {
  return SEO_COPY[toRoutedLocale(locale)] ?? SEO_COPY.ko;
}

/** 라우팅되는 언어(ko/en)로 좁힌다. 알 수 없는 값은 기본 언어(ko) */
export function toRoutedLocale(locale: string | null | undefined): RoutedLocale {
  return isRoutedLocale(locale) ? locale : defaultLocale;
}

/** 언어별 경로 — ko: "/path", en: "/en/path" */
export function localizedSeoPath(path: string, locale: AppLocale | string = defaultLocale) {
  return localizedPath(path, toRoutedLocale(locale));
}

/** hreflang 대체 주소 (ko·en·x-default=ko) */
export function buildLanguageAlternates(path: string) {
  const ko = localizedPath(path, "ko");
  return { ko, en: localizedPath(path, "en"), "x-default": ko };
}

export function getOpenGraphLocale(locale: AppLocale | string) {
  return openGraphLocales[toRoutedLocale(locale)];
}

/** og:locale:alternate — 현재 언어를 뺀 나머지 */
export function getAlternateOpenGraphLocales(locale: AppLocale | string) {
  const current = toRoutedLocale(locale);
  return (["ko", "en"] as const).filter((l) => l !== current).map((l) => openGraphLocales[l]);
}

/** 영어 페이지는 영어 문구가 들어간 OG 이미지(-en)를 쓴다 */
const EN_OG_IMAGES: Record<string, string> = {
  "/og-bybit.png": "/og-bybit-en.png",
  "/ogImage.png": "/ogImage-en.png",
  "/og-chart.png": "/og-chart-en.png",
  "/og-community.png": "/og-community-en.png",
};

export function localizedOgImage(image: string, locale: AppLocale | string) {
  if (toRoutedLocale(locale) !== "en") return image;
  return EN_OG_IMAGES[image] ?? image;
}
