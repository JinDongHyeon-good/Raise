import type { Metadata } from "next";
import type { TarotGuide } from "@/data/tarot-guides";
import type { TarotTopicPage } from "@/data/tarot-topic-pages";
import type { AppLocale } from "@/i18n/routing";
import { defaultLocale } from "@/i18n/routing";
import {
  GOOGLE_ADSENSE_CLIENT,
  GOOGLE_SITE_VERIFICATION,
  NAVER_SITE_VERIFICATION,
  getServiceKeywords,
  SERVICE_NAME,
  SERVICE_NAME_EN,
  SERVICE_TAGLINE,
  getSiteUrl,
} from "@/lib/brand";
import {
  buildLanguageAlternates,
  getOpenGraphLocale,
  getSeoCopy,
  localizedSeoPath,
} from "@/lib/seo-i18n";

function getSiteVerification(locale: AppLocale = defaultLocale): Metadata["verification"] {
  const google =
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || GOOGLE_SITE_VERIFICATION;
  const naver =
    process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION?.trim() || NAVER_SITE_VERIFICATION;

  if (!google && !naver) return undefined;

  const verification: NonNullable<Metadata["verification"]> = {};
  if (google) verification.google = google;
  if (locale === "ko" && naver) {
    verification.other = { "naver-site-verification": naver };
  }
  return verification;
}

function buildOpenGraph(
  title: string,
  description: string,
  path: string,
  locale: AppLocale = defaultLocale,
): NonNullable<Metadata["openGraph"]> {
  const copy = getSeoCopy(locale);
  return {
    title,
    description,
    url: localizedSeoPath(path, locale),
    siteName: copy.siteName,
    locale: getOpenGraphLocale(locale),
    type: "website",
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: copy.ogAlt,
      },
    ],
  };
}

/** 구글 검색 제목·스니펫용 (홈·기본) — locale별 값은 getSeoCopy 참고 */
export const SEO_HOME_TITLE = "무료 타로·무료 AI 타로 | 오늘의 운세·오늘의 타로 — 멜로타로";

export const SEO_HOME_DESCRIPTION =
  "무료 타로·무료 AI 타로를 지금 바로. 오늘의 타로·오늘의 운세, 연애 타로, 이번 주 운세까지 로그인 후 무료로 카드를 뽑고 AI 타로 리딩을 받아 보세요.";

const OG_IMAGE_PATH = "/ogImage.png";

export function getOgImageUrl() {
  return new URL(OG_IMAGE_PATH, getSiteUrl()).toString();
}

export function buildRootMetadata(locale: AppLocale = defaultLocale): Metadata {
  const siteUrl = getSiteUrl();
  const copy = getSeoCopy(locale);

  return {
    metadataBase: new URL(siteUrl),
    applicationName: copy.siteName,
    title: {
      default: copy.homeTitle,
      template: `%s | ${copy.siteName}`,
    },
    description: copy.homeDescription,
    keywords: [...getServiceKeywords(locale)],
    alternates: {
      canonical: localizedSeoPath("/", locale),
      languages: buildLanguageAlternates("/"),
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
    verification: getSiteVerification(locale),
    openGraph: buildOpenGraph(copy.homeTitle, copy.homeDescription, "/", locale),
    twitter: {
      card: "summary_large_image",
      title: copy.homeTitle,
      description: copy.homeDescription,
      images: [OG_IMAGE_PATH],
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/favicon.ico",
    },
    category: "lifestyle",
    other: {
      "application-name": SERVICE_NAME_EN,
      "google-adsense-account": GOOGLE_ADSENSE_CLIENT,
    },
  };
}

export function buildHomePageMetadata(locale: AppLocale = defaultLocale): Metadata {
  const copy = getSeoCopy(locale);
  return {
    title: { absolute: copy.homeTitle },
    description: copy.homeDescription,
    keywords: [...getServiceKeywords(locale)],
    alternates: {
      canonical: localizedSeoPath("/", locale),
      languages: buildLanguageAlternates("/"),
    },
    openGraph: buildOpenGraph(copy.homeTitle, copy.homeDescription, "/", locale),
    twitter: {
      card: "summary_large_image",
      title: copy.homeTitle,
      description: copy.homeDescription,
      images: [OG_IMAGE_PATH],
    },
  };
}

export function buildTopicPageMetadata(page: TarotTopicPage, locale: AppLocale = defaultLocale): Metadata {
  const path = `/topics/${page.slug}`;

  return {
    title: { absolute: page.title },
    description: page.description,
    keywords: [...page.keywords, ...getServiceKeywords(locale)],
    alternates: {
      canonical: localizedSeoPath(path, locale),
      languages: buildLanguageAlternates(path),
    },
    robots: { index: true, follow: true },
    openGraph: buildOpenGraph(page.title, page.description, path, locale),
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [OG_IMAGE_PATH],
    },
  };
}

export function buildGuidePageMetadata(guide: TarotGuide, locale: AppLocale = defaultLocale): Metadata {
  const path = `/guides/${guide.slug}`;
  const copy = getSeoCopy(locale);

  return {
    title: guide.title,
    description: guide.description,
    keywords: [...getServiceKeywords(locale), guide.title],
    alternates: {
      canonical: localizedSeoPath(path, locale),
      languages: buildLanguageAlternates(path),
    },
    robots: { index: true, follow: true },
    openGraph: buildOpenGraph(guide.title, guide.description, path, locale),
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
      images: [OG_IMAGE_PATH],
    },
    other: {
      "article:section": copy.guidesMetaTitle,
    },
  };
}

export function getTopicPageJsonLd(page: TarotTopicPage, locale: AppLocale = defaultLocale): JsonLdObject[] {
  const siteUrl = getSiteUrl();
  const copy = getSeoCopy(locale);
  const pageUrl = `${siteUrl}${localizedSeoPath(`/topics/${page.slug}`, locale)}`;
  const homeUrl = `${siteUrl}${localizedSeoPath("/", locale)}`;
  const topicsUrl = `${siteUrl}${localizedSeoPath("/topics", locale)}`;
  const startUrl = `${siteUrl}${localizedSeoPath("/", locale)}?topic=${page.topicId}`;

  const faqEntities = page.sections.slice(0, 3).map((section) => ({
    "@type": "Question",
    name: section.heading,
    acceptedAnswer: {
      "@type": "Answer",
      text: section.paragraphs.join(" "),
    },
  }));

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: page.title,
      headline: page.heading,
      description: page.description,
      keywords: page.keywords.join(", "),
      inLanguage: copy.schemaLanguage,
      isPartOf: { "@id": `${homeUrl}#website` },
      about: {
        "@type": "Thing",
        name: page.heading,
      },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: getOgImageUrl(),
      },
      potentialAction: {
        "@type": "Action",
        name: page.heading,
        target: startUrl,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: copy.siteName,
          item: homeUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: copy.topicsMetaTitle,
          item: topicsUrl,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: page.heading,
          item: pageUrl,
        },
      ],
    },
    ...(faqEntities.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": `${pageUrl}#faq`,
            mainEntity: faqEntities,
          },
        ]
      : []),
  ];
}

export function getGuidePageJsonLd(guide: TarotGuide, locale: AppLocale = defaultLocale): JsonLdObject[] {
  const siteUrl = getSiteUrl();
  const copy = getSeoCopy(locale);
  const pageUrl = `${siteUrl}${localizedSeoPath(`/guides/${guide.slug}`, locale)}`;
  const homeUrl = `${siteUrl}${localizedSeoPath("/", locale)}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${pageUrl}#article`,
      headline: guide.title,
      description: guide.description,
      url: pageUrl,
      inLanguage: copy.schemaLanguage,
      author: {
        "@type": "Organization",
        name: copy.siteName,
        url: homeUrl,
      },
      publisher: {
        "@type": "Organization",
        name: copy.siteName,
        url: homeUrl,
        logo: {
          "@type": "ImageObject",
          url: getOgImageUrl(),
        },
      },
      isPartOf: { "@id": `${homeUrl}#website` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: copy.siteName,
          item: homeUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: locale === "ko" ? "타로 가이드" : locale === "ja" ? "タロットガイド" : "Tarot guides",
          item: `${siteUrl}${localizedSeoPath("/guides", locale)}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: guide.title,
          item: pageUrl,
        },
      ],
    },
  ];
}

type JsonLdObject = Record<string, unknown>;

export function getHomeJsonLd(locale: AppLocale = defaultLocale): JsonLdObject[] {
  const siteUrl = getSiteUrl();
  const ogImage = getOgImageUrl();
  const copy = getSeoCopy(locale);
  const homeUrl = `${siteUrl}${localizedSeoPath("/", locale)}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${homeUrl}#website`,
      url: homeUrl,
      name: copy.siteName,
      alternateName: [SERVICE_NAME_EN, SERVICE_NAME, "Melotaro AI Tarot"],
      description: copy.homeDescription,
      inLanguage: copy.schemaLanguage,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": `${homeUrl}#app`,
      name: copy.siteName,
      alternateName: SERVICE_NAME_EN,
      url: homeUrl,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires JavaScript",
      description: copy.homeDescription,
      inLanguage: copy.schemaLanguage,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: locale === "ko" ? "KRW" : locale === "ja" ? "JPY" : "USD",
      },
      featureList: copy.featureList,
      keywords: getServiceKeywords(locale).join(", "),
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${homeUrl}#organization`,
      name: copy.siteName,
      url: homeUrl,
      logo: {
        "@type": "ImageObject",
        url: ogImage,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${homeUrl}#faq`,
      mainEntity: copy.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];
}

/** 서비스 소개·FAQ 페이지용 문구 (한국어 기본; 홈 하단은 getSeoCopy 사용) */
export const HOME_SEO_INTRO = {
  heading: "무료 타로·무료 AI 타로 — 멜로타로",
  body: `멜로타로는 무료 타로·무료 AI 타로로 오늘의 타로, 오늘의 운세, 연애 타로까지 한곳에서 뽑을 수 있는 온라인 타로 사이트입니다. ${SERVICE_TAGLINE}. 로그인 후 78장 카드와 AI 해석을 무료로 이용해 보세요.`,
};

export const HOME_SEO_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: "멜로타로 AI 타로는 무엇인가요?",
    answer:
      "질문 주제와 뽑은 타로 카드를 바탕으로 AI가 리딩을 작성해 주는 온라인 AI 타로 서비스입니다. 연애, 직장, 재물, 오늘의 운세 등에서 활용할 수 있으며, 결과는 참고용 인사이트로 이해해 주세요.",
  },
  {
    question: "AI 타로는 어떻게 이용하나요?",
    answer:
      "리딩 영역 선택 → 궁금한 점 입력(선택) → 카드 스프레드 선택 후 뽑기 → 로그인 후 AI 타로 리딩 결과 확인 순서로 진행합니다. 가이드 글에서 질문 예시와 스프레드 선택 팁도 확인할 수 있습니다.",
  },
  {
    question: "어떤 주제의 타로를 볼 수 있나요?",
    answer:
      "오늘의 운세, 연애·썸, 커플, 재물, 취업·이직, 사업, 학업, 마음·힐링, 선택·결정 등 다양한 AI 타로 주제를 제공합니다.",
  },
  {
    question: "타로 결과가 사실인가요? 미래를 예측하나요?",
    answer:
      "아니요. 멜로타로 리딩은 오락·자기성찰 목적의 참고 콘텐츠이며 사실 보장이나 확정된 예언이 아닙니다. 의료·법률·투자 등 중요한 결정은 전문가 상담과 본인 판단을 우선하세요.",
  },
  {
    question: "무료로 이용할 수 있나요?",
    answer:
      "로그인 후 기본 AI 타로 리딩을 무료로 이용할 수 있습니다. 서비스 운영을 위해 일부 페이지에 광고가 표시될 수 있으며, 쿠키·광고 관련 내용은 개인정보처리방침을 참고해 주세요.",
  },
  {
    question: "문의는 어디로 하면 되나요?",
    answer:
      "문의 페이지의 이메일(wlsehdgus23@gmail.com) 또는 전화(010-3230-1521)로 연락해 주세요. 계정·오류·개인정보·광고 정책 관련 문의를 접수합니다.",
  },
];
