import type { Metadata } from "next";
import type { TarotGuide } from "@/data/tarot-guides";
import type { TarotTopicPage } from "@/data/tarot-topic-pages";
import type { AppLocale } from "@/i18n/routing";
import { defaultLocale } from "@/i18n/routing";
import {
  GOOGLE_ADSENSE_CLIENT,
  GOOGLE_SITE_VERIFICATION,
  NAVER_SITE_VERIFICATION,
  SERVICE_DESCRIPTION,
  SERVICE_KEYWORDS,
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

/** 구글 검색 제목·스니펫용 (홈·기본) */
export const SEO_HOME_TITLE = "AI 타로 | 멜로타로 — 무료 온라인 AI 타로 리딩";

export const SEO_HOME_DESCRIPTION =
  "멜로타로는 AI 타로 서비스입니다. 연애·직장·재물·오늘의 운세 등 궁금한 주제를 고르고 카드를 뽑으면 AI가 타로 리딩을 해드립니다. 지금 바로 무료로 AI 타로를 시작해 보세요.";

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
    keywords: [...SERVICE_KEYWORDS],
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
    title: copy.homeTitle,
    description: copy.homeDescription,
    alternates: {
      canonical: localizedSeoPath("/", locale),
      languages: buildLanguageAlternates("/"),
    },
    openGraph: buildOpenGraph(copy.homeTitle, copy.homeDescription, "/", locale),
  };
}

export function buildTopicPageMetadata(page: TarotTopicPage, locale: AppLocale = defaultLocale): Metadata {
  const path = `/topics/${page.slug}`;

  return {
    title: page.title,
    description: page.description,
    keywords: [...page.keywords, ...SERVICE_KEYWORDS],
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

  return {
    title: guide.title,
    description: guide.description,
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
  };
}

export function getTopicPageJsonLd(page: TarotTopicPage, locale: AppLocale = defaultLocale): JsonLdObject[] {
  const siteUrl = getSiteUrl();
  const copy = getSeoCopy(locale);
  const pageUrl = `${siteUrl}${localizedSeoPath(`/topics/${page.slug}`, locale)}`;
  const homeUrl = `${siteUrl}${localizedSeoPath("/", locale)}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: page.title,
      description: page.description,
      inLanguage: copy.schemaLanguage,
      isPartOf: { "@id": `${homeUrl}#website` },
      about: {
        "@type": "Thing",
        name: page.heading,
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
          name: page.heading,
          item: pageUrl,
        },
      ],
    },
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
      description: SERVICE_DESCRIPTION,
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
