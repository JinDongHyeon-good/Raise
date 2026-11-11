import type { AppLocale } from "@/i18n/routing";
import { openGraphLocales } from "@/i18n/routing";
import { SERVICE_DESCRIPTION, SERVICE_NAME } from "@/lib/brand";

export type SeoLocaleCopy = {
  siteName: string;
  homeTitle: string;
  homeDescription: string;
  ogAlt: string;
  schemaLanguage: string;
  featureList: string[];
  faq: Array<{ question: string; answer: string }>;
};

/** 실제 서빙은 ko만 — en/ja는 키 호환용으로 ko 문구를 그대로 쓴다 */
const KO_COPY: SeoLocaleCopy = {
  siteName: SERVICE_NAME,
  homeTitle: "진코 - 실시간 코인 차트 AI 분석 · 코인 유튜브 요약 · 코인 커뮤니티",
  homeDescription:
    "비트코인·이더리움·리플 실시간 차트를 AI가 분석하고, 코인 유튜브 영상을 AI가 요약해 드립니다. 코인분석·뉴스·손익인증 게시판에서 투자자들과 의견을 나눠 보세요. 진코.",
  ogAlt: "진코 — 실시간 코인 차트 AI 분석 · 코인 유튜브 요약 · 코인 커뮤니티",
  schemaLanguage: "ko",
  featureList: [
    "실시간 코인 시세와 캔들 차트 (15분봉~주봉)",
    "AI 차트 분석 (추세·지지·저항·보조지표 해석)",
    "코인 유튜브 영상 모아보기",
    "코인 유튜브 영상 AI 요약",
    "코인 커뮤니티 (자유·코인분석·뉴스·질문·손익인증)",
    "추천·댓글·대댓글",
  ],
  faq: [
    {
      question: "진코는 어떤 서비스인가요?",
      answer: SERVICE_DESCRIPTION,
    },
    {
      question: "AI 차트 분석은 무엇을 알려 주나요?",
      answer:
        "선택한 코인과 봉 주기의 최근 캔들과 이동평균·RSI·MACD·볼린저밴드·거래량을 AI가 함께 읽고 현재 추세, 주요 지지·저항 구간, 주의할 점을 정리해 줍니다.",
    },
    {
      question: "코인 유튜브 요약은 어떻게 쓰나요?",
      answer:
        "코인별로 모아 둔 유튜브 영상 중 하나를 고르면 영상의 핵심 주장, 근거, 언급된 가격대를 AI가 짧게 요약해 줍니다. 영상은 진코 안에서 바로 재생할 수도 있습니다.",
    },
    {
      question: "커뮤니티에는 어떤 게시판이 있나요?",
      answer: "자유게시판, 코인분석, 뉴스·정보, 질문, 손익인증 게시판이 있고 추천순·조회순으로 인기 글을 볼 수 있습니다.",
    },
    {
      question: "시세 데이터는 어디서 오나요?",
      answer: "Bybit 현물 시장의 공개 시세를 사용하며 약 10초마다 갱신됩니다.",
    },
    {
      question: "AI 분석을 믿고 투자해도 되나요?",
      answer:
        "AI 분석과 영상 요약은 판단을 돕는 참고 정보이며 투자 권유가 아닙니다. 투자 판단과 그 결과의 책임은 이용자 본인에게 있습니다.",
    },
  ],
};

export const SEO_COPY: Record<AppLocale, SeoLocaleCopy> = { ko: KO_COPY, en: KO_COPY, ja: KO_COPY };

export function getSeoCopy(locale: AppLocale) {
  return SEO_COPY[locale] ?? SEO_COPY.ko;
}

export function localizedSeoPath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export function buildLanguageAlternates(path: string) {
  return { ko: localizedSeoPath(path) };
}

export function getOpenGraphLocale(locale: AppLocale) {
  return openGraphLocales[locale];
}
