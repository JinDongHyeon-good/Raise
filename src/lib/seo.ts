import type { Metadata } from "next";
import {
  SERVICE_DESCRIPTION,
  SERVICE_KEYWORDS,
  SERVICE_NAME,
  SERVICE_NAME_EN,
  SERVICE_TAGLINE,
  getSiteUrl,
} from "@/lib/brand";

/** 구글 검색 제목·스니펫용 (홈·기본) */
export const SEO_HOME_TITLE = "AI 타로 | 멜로타로 — 무료 온라인 AI 타로 리딩";

export const SEO_HOME_DESCRIPTION =
  "멜로타로는 AI 타로 서비스입니다. 연애·직장·재물·오늘의 운세 등 궁금한 주제를 고르고 카드를 뽑으면 AI가 타로 리딩을 해드립니다. 지금 바로 무료로 AI 타로를 시작해 보세요.";

const OG_IMAGE_PATH = "/ogImage.png";

export function getOgImageUrl() {
  return new URL(OG_IMAGE_PATH, getSiteUrl()).toString();
}

export function buildRootMetadata(): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    applicationName: SERVICE_NAME,
    title: {
      default: SEO_HOME_TITLE,
      template: `%s | ${SERVICE_NAME}`,
    },
    description: SEO_HOME_DESCRIPTION,
    keywords: [...SERVICE_KEYWORDS],
    alternates: {
      canonical: "/",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: SEO_HOME_TITLE,
      description: SEO_HOME_DESCRIPTION,
      url: "/",
      siteName: SERVICE_NAME,
      locale: "ko_KR",
      type: "website",
      images: [
        {
          url: OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: `${SERVICE_NAME} — AI 타로 온라인 리딩`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SEO_HOME_TITLE,
      description: SEO_HOME_DESCRIPTION,
      images: [OG_IMAGE_PATH],
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/favicon.ico",
    },
    category: "lifestyle",
  };
}

export function buildHomePageMetadata(): Metadata {
  return {
    title: SEO_HOME_TITLE,
    description: SEO_HOME_DESCRIPTION,
    alternates: { canonical: "/" },
    openGraph: {
      title: SEO_HOME_TITLE,
      description: SEO_HOME_DESCRIPTION,
      url: "/",
    },
  };
}

type JsonLdObject = Record<string, unknown>;

export function getHomeJsonLd(): JsonLdObject[] {
  const siteUrl = getSiteUrl();
  const ogImage = getOgImageUrl();

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: SERVICE_NAME,
      alternateName: [SERVICE_NAME_EN, "멜로타로 AI 타로", "AI 타로 멜로타로"],
      description: SERVICE_DESCRIPTION,
      inLanguage: "ko-KR",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": `${siteUrl}/#app`,
      name: SERVICE_NAME,
      alternateName: SERVICE_NAME_EN,
      url: siteUrl,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires JavaScript",
      description: SEO_HOME_DESCRIPTION,
      inLanguage: "ko-KR",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "KRW",
      },
      featureList: [
        "AI 타로 리딩",
        "연애·직장·재물·오늘의 운세 주제 선택",
        "1장·3장 타로 스프레드",
        "78장 타로 카드",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: SERVICE_NAME,
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: ogImage,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "멜로타로 AI 타로는 무엇인가요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "멜로타로는 질문 주제와 뽑은 타로 카드를 바탕으로 AI가 리딩 문장을 생성해 주는 온라인 AI 타로 서비스입니다. 연애, 커리어, 재물, 오늘의 운세 등 다양한 영역에서 활용할 수 있습니다.",
          },
        },
        {
          "@type": "Question",
          name: "AI 타로는 어떻게 이용하나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "리딩 영역을 선택한 뒤 궁금한 내용을 적고(선택), 스프레드를 고른 다음 카드를 뽑으면 AI 타로 리딩 결과를 확인할 수 있습니다. Google 로그인 후 이용할 수 있습니다.",
          },
        },
        {
          "@type": "Question",
          name: "오늘의 운세·연애 타로도 볼 수 있나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "네. 오늘의 운세, 이번 주 운세, 연애·썸, 커플, 재물, 취업·이직 등 멜로타로에서 제공하는 주제 중에서 골라 AI 타로 리딩을 받을 수 있습니다.",
          },
        },
        {
          "@type": "Question",
          name: "AI 타로 결과는 의료·투자 조언인가요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "아니요. 멜로타로 AI 타로는 오락·자기성찰 목적의 콘텐츠이며, 의료 진단, 법률·투자 종목 추천을 대체하지 않습니다.",
          },
        },
      ],
    },
  ];
}

/** 서비스 소개·FAQ 페이지용 문구 */
export const HOME_SEO_INTRO = {
  heading: "AI 타로 온라인 — 멜로타로",
  body: `${SERVICE_TAGLINE}. 78장 타로 카드와 AI 해석으로 연애 타로, 오늘의 운세, 직장·재물 운세까지 한곳에서 받아 보세요.`,
};

export const HOME_SEO_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: "멜로타로 AI 타로는 무엇인가요?",
    answer:
      "질문 주제와 뽑은 타로 카드를 바탕으로 AI가 리딩을 작성해 주는 온라인 AI 타로 서비스입니다. 연애, 직장, 재물, 오늘의 운세 등에서 활용할 수 있습니다.",
  },
  {
    question: "AI 타로는 어떻게 이용하나요?",
    answer:
      "리딩 영역 선택 → 궁금한 점 입력(선택) → 카드 스프레드 선택 후 뽑기 → AI 타로 리딩 결과 확인 순서로 진행합니다.",
  },
  {
    question: "어떤 주제의 타로를 볼 수 있나요?",
    answer:
      "오늘의 운세, 연애·썸, 커플, 재물, 취업·이직, 사업, 학업, 마음·힐링, 선택·결정 등 다양한 AI 타로 주제를 제공합니다.",
  },
];
