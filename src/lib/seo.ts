import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/routing";
import { defaultLocale } from "@/i18n/routing";
import {
  GOOGLE_ADSENSE_CLIENT,
  GOOGLE_SITE_VERIFICATION,
  NAVER_SITE_VERIFICATION,
  getServiceKeywords,
  SERVICE_NAME,
  SERVICE_NAME_EN,
  getLocalizedServiceDescription,
  getSiteUrl,
} from "@/lib/brand";
import {
  buildLanguageAlternates,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
  getSeoCopy,
  localizedOgImage,
  localizedSeoPath,
  toRoutedLocale,
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
  options: { image?: string; imageAlt?: string; type?: "website" | "article" } = {},
): NonNullable<Metadata["openGraph"]> {
  const copy = getSeoCopy(locale);
  return {
    title,
    description,
    url: localizedSeoPath(path, locale),
    siteName: copy.siteName,
    locale: getOpenGraphLocale(locale),
    alternateLocale: getAlternateOpenGraphLocales(locale),
    type: options.type ?? "website",
    images: [
      {
        url: localizedOgImage(options.image ?? OG_IMAGE_PATH, locale),
        width: 1200,
        height: 630,
        alt: options.imageAlt ?? copy.ogAlt,
      },
    ],
  };
}

const OG_IMAGE_PATH = "/ogImage.png";

export function getOgImageUrl(locale: AppLocale = defaultLocale) {
  return new URL(localizedOgImage(OG_IMAGE_PATH, locale), getSiteUrl()).toString();
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
      images: [localizedOgImage(OG_IMAGE_PATH, locale)],
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
      canonical: localizedSeoPath("/", locale),
      languages: buildLanguageAlternates("/"),
    },
    openGraph: buildOpenGraph(copy.homeTitle, copy.homeDescription, "/", locale),
    twitter: {
      card: "summary_large_image",
      title: copy.homeTitle,
      description: copy.homeDescription,
      images: [localizedOgImage(OG_IMAGE_PATH, locale)],
    },
  };
}

type JsonLdObject = Record<string, unknown>;

export function getHomeJsonLd(locale: AppLocale = defaultLocale): JsonLdObject[] {
  const siteUrl = getSiteUrl();
  const ogImage = getOgImageUrl(locale);
  const copy = getSeoCopy(locale);
  const homeUrl = `${siteUrl}${localizedSeoPath("/", locale)}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${homeUrl}#website`,
      url: homeUrl,
      name: copy.siteName,
      alternateName: [SERVICE_NAME_EN, SERVICE_NAME].filter((name) => name !== copy.siteName),
      description: copy.homeDescription,
      inLanguage: copy.schemaLanguage,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": `${homeUrl}#app`,
      name: copy.siteName,
      alternateName: copy.siteName === SERVICE_NAME ? SERVICE_NAME_EN : SERVICE_NAME,
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
  const aboutUrl = `${getSiteUrl()}${localizedSeoPath("/about", locale)}`;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${aboutUrl}#faq`,
    inLanguage: copy.schemaLanguage,
    mainEntity: copy.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** 서비스 소개 페이지용 문구 */
export function getHomeSeoIntro(locale: AppLocale = defaultLocale) {
  return {
    heading: getSeoCopy(locale).introHeading,
    body: getLocalizedServiceDescription(locale),
  };
}

/**
 * 하위 페이지 메타데이터 — title/description만 쓰면 og:·twitter:가 홈 값을 그대로 물려받으므로
 * 페이지마다 공유 미리보기(제목·설명·주소·이미지)를 함께 만든다.
 * canonical은 언어별 주소(ko: /path, en: /en/path), hreflang은 ko·en·x-default(ko).
 */
export function buildPageMetadata(options: {
  locale: AppLocale | string;
  title: string;
  description: string;
  /** 언어 접두 없는 경로 (예: "/chart") */
  path: string;
  /** public/ 아래 1200x630 이미지 (기본: 홈 이미지). 영어 페이지는 -en 버전으로 바뀐다 */
  image?: string;
  imageAlt?: string;
  /** og:title·twitter:title (기본: "<title> | <서비스명>") */
  socialTitle?: string;
  /** og:description·twitter:description (기본: description) */
  socialDescription?: string;
  type?: "website" | "article";
  keywords?: readonly string[];
  noindex?: boolean;
}): Metadata {
  const locale = toRoutedLocale(options.locale);
  const copy = getSeoCopy(locale);
  const socialTitle = options.socialTitle ?? `${options.title} | ${copy.siteName}`;
  const image = localizedOgImage(options.image ?? OG_IMAGE_PATH, locale);
  const alt = options.imageAlt ?? `${copy.siteName} — ${options.title}`;
  const socialDescription = options.socialDescription ?? options.description;
  return {
    title: options.title,
    description: options.description,
    ...(options.keywords ? { keywords: [...options.keywords] } : {}),
    alternates: {
      canonical: localizedSeoPath(options.path, locale),
      languages: buildLanguageAlternates(options.path),
    },
    ...(options.noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: buildOpenGraph(socialTitle, socialDescription, options.path, locale, {
      image,
      imageAlt: alt,
      type: options.type,
    }),
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: socialDescription,
      images: [image],
    },
  };
}
