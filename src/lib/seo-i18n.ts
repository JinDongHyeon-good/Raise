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
  homeTitle: "진코 - 코인·나스닥 실시간 차트, 코인·주식 유튜브 AI 요약, 투자 커뮤니티",
  homeDescription:
    "비트코인·이더리움과 나스닥·S&P500 실시간 차트, 코인·미국 주식 전망 유튜브 영상의 AI 요약, 코인·주식 투자자 커뮤니티를 한곳에서. 진코.",
  ogAlt: "진코 — 코인·미국증시 실시간 차트 · 유튜브 AI 요약 · 투자 커뮤니티",
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
      question: "진코는 어떤 서비스인가요?",
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
