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
export const SEO_HOME_TITLE = "피클볼 예약·모임·대관 | Piclick 피클릭";

export const SEO_HOME_DESCRIPTION =
  "Piclick에서 피클볼 코트 예약, 모임 커뮤니티, 대관, 클럽·광고까지. 가까운 코트를 찾고 함께 칠 사람을 만나보세요.";

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
      icon: [
        { url: "/favicon.ico", sizes: "32x32" },
        { url: "/favicon.png", sizes: "1024x1024", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    category: "sports",
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
      alternateName: [SERVICE_NAME_EN, SERVICE_NAME, "피클릭", "Piclick Pickleball"],
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
      applicationCategory: "SportsApplication",
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
  heading: "피클볼 예약·모임·대관 — Piclick",
  body: `Piclick은 피클볼 코트 예약, 모임 커뮤니티, 대관, 클럽·광고를 한곳에서 연결하는 서비스입니다. ${SERVICE_TAGLINE}. 가까운 코트를 찾고, 함께 칠 사람을 만나고, 시설을 대관해 보세요.`,
};

export const HOME_SEO_FAQ: Array<{ question: string; answer: string }> = [
  {
    question: "Piclick은 어떤 서비스인가요?",
    answer:
      "Piclick(피클릭)은 피클볼 코트 예약, 모임 커뮤니티, 대관, 클럽·광고를 연결하는 피클볼 플랫폼입니다.",
  },
  {
    question: "코트 예약은 어떻게 하나요?",
    answer:
      "지역과 시간을 고른 뒤 빈 코트를 확인하고 예약합니다. 모임·리그를 위한 대관도 같은 흐름으로 신청할 수 있습니다.",
  },
  {
    question: "모임 커뮤니티는 무엇인가요?",
    answer:
      "레벨·지역·시간에 맞는 오픈 게임과 클럽 모임을 만들고 참가할 수 있는 커뮤니티입니다.",
  },
  {
    question: "대관은 누가 이용하나요?",
    answer:
      "정기 모임, 리그, 이벤트 등 코트가 필요한 개인·클럽·운영자가 시설 대관을 신청하고 일정을 맞출 수 있습니다.",
  },
  {
    question: "광고·클럽 홍보는 가능한가요?",
    answer:
      "네. 클럽, 레슨, 용품, 코트 시설 운영자는 Piclick 광고·노출로 피클볼 플레이어에게 서비스를 알릴 수 있습니다. 쿠키·광고 안내는 개인정보처리방침을 참고해 주세요.",
  },
  {
    question: "문의는 어디로 하면 되나요?",
    answer:
      "문의 페이지의 이메일(wlsehdgus23@gmail.com) 또는 전화(010-3230-1521)로 연락해 주세요. 계정·오류·개인정보·제휴·광고 관련 문의를 접수합니다.",
  },
];
