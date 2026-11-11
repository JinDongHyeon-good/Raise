import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/routing";
import { defaultLocale } from "@/i18n/routing";
import {
  GOOGLE_ADSENSE_CLIENT,
  GOOGLE_SITE_VERIFICATION,
  NAVER_SITE_VERIFICATION,
  getServiceKeywords,
  SERVICE_NAME,
  SERVICE_DESCRIPTION,
  SERVICE_NAME_EN,
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
    url: localizedSeoPath(path),
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
export const SEO_HOME_TITLE = "찐동코인 - 코인·나스닥 실시간 차트, 코인·주식 유튜브 AI 요약, 투자 커뮤니티";

export const SEO_HOME_DESCRIPTION = SERVICE_DESCRIPTION;

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
      canonical: localizedSeoPath("/"),
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
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/favicon.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    category: "finance",
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
      canonical: localizedSeoPath("/"),
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

type JsonLdObject = Record<string, unknown>;

export function getHomeJsonLd(locale: AppLocale = defaultLocale): JsonLdObject[] {
  const siteUrl = getSiteUrl();
  const ogImage = getOgImageUrl();
  const copy = getSeoCopy(locale);
  const homeUrl = `${siteUrl}${localizedSeoPath("/")}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${homeUrl}#website`,
      url: homeUrl,
      name: copy.siteName,
      alternateName: [SERVICE_NAME_EN, SERVICE_NAME],
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
      applicationCategory: "FinanceApplication",
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
  ];
}

export function getFaqJsonLd(locale: AppLocale = defaultLocale): JsonLdObject {
  const copy = getSeoCopy(locale);
  const aboutUrl = `${getSiteUrl()}/about`;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${aboutUrl}#faq`,
    mainEntity: copy.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** 서비스 소개 페이지용 문구 */
export const HOME_SEO_INTRO = {
  heading: "찐동코인 — 코인·미국증시 실시간 차트 · 유튜브 AI 요약 · 투자 커뮤니티",
  body: SERVICE_DESCRIPTION,
};

/**
 * 하위 페이지 메타데이터 — title/description만 쓰면 og:·twitter:가 홈 값을 그대로 물려받으므로
 * 페이지마다 공유 미리보기(제목·설명·주소·이미지)를 함께 만든다.
 */
export function buildPageMetadata(options: {
  title: string;
  description: string;
  path: string;
  /** public/ 아래 1200x630 이미지 (기본: 홈 이미지) */
  image?: string;
  imageAlt?: string;
  noindex?: boolean;
}): Metadata {
  const copy = getSeoCopy(defaultLocale);
  const fullTitle = `${options.title} | ${copy.siteName}`;
  const image = options.image ?? OG_IMAGE_PATH;
  const alt = options.imageAlt ?? `${copy.siteName} — ${options.title}`;
  return {
    title: options.title,
    description: options.description,
    alternates: { canonical: options.path },
    ...(options.noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: fullTitle,
      description: options.description,
      url: options.path,
      siteName: copy.siteName,
      locale: getOpenGraphLocale(defaultLocale),
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: options.description,
      images: [image],
    },
  };
}
