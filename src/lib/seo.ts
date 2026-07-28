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
export const SEO_HOME_TITLE = "오늘의 운세·사주팔자·궁합 | 사주네 Sajune";

export const SEO_HOME_DESCRIPTION =
  "사주네에서 생년월일시로 보는 오늘의 운세, 사주팔자, 궁합까지. 정통 명리로 쉽게 풀어보는 무료 사주 서비스입니다.";

const OG_IMAGE_PATH = "/api/og";

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
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      shortcut: "/icon.svg",
      apple: [{ url: "/icon.svg" }],
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
    robots: { index: false, follow: false },
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
    robots: { index: false, follow: false },
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
          name: locale === "ko" ? "가이드" : locale === "ja" ? "ガイド" : "Guides",
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
      alternateName: [SERVICE_NAME_EN, SERVICE_NAME, "사주네", "오늘의 운세", "Sajune Saju"],
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
  heading: "오늘의 운세·사주팔자·궁합 — 사주네",
  body: `사주네는 생년월일시로 보는 오늘의 운세, 사주팔자, 궁합을 정통 명리로 쉽게 풀어주는 무료 사주 서비스입니다. ${SERVICE_TAGLINE}. 어렵게 느껴지던 사주를 누구나 편하게 확인해 보세요.`,
};

export const HOME_SEO_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: "사주네는 어떤 서비스인가요?",
    answer:
      "사주네(Sajune)는 생년월일시로 보는 오늘의 운세, 사주팔자, 궁합을 정통 명리로 쉽게 풀어주는 무료 사주 서비스입니다.",
  },
  {
    question: "사주는 어떻게 보나요?",
    answer:
      "태어난 연·월·일·시를 입력하면 만세력을 기준으로 사주팔자를 세우고, 오행과 십성을 바탕으로 오늘의 운세와 삶의 흐름을 풀어 드립니다.",
  },
  {
    question: "오늘의 운세는 매일 달라지나요?",
    answer:
      "네. 그날의 일진과 사주의 관계에 따라 총운·재물운·애정운·건강운의 흐름을 매일 새롭게 확인할 수 있습니다.",
  },
  {
    question: "궁합 사주는 누가 이용하나요?",
    answer:
      "연애·결혼을 앞둔 분, 서로의 성향과 조화를 알고 싶은 분이 두 사람의 생년월일시로 궁합의 강점과 주의할 점을 확인할 수 있습니다.",
  },
  {
    question: "이용은 무료인가요?",
    answer:
      "오늘의 운세, 사주팔자, 궁합 등 핵심 기능은 무료로 제공됩니다. 결과는 참고용으로 즐겨 주시고, 쿠키·광고 안내는 개인정보처리방침을 참고해 주세요.",
  },
  {
    question: "문의는 어디로 하면 되나요?",
    answer:
      "문의 페이지의 이메일(wlsehdgus23@gmail.com) 또는 전화(010-3230-1521)로 연락해 주세요. 계정·오류·개인정보·제휴·광고 관련 문의를 접수합니다.",
  },
];
