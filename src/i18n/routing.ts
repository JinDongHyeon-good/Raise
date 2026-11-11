import { defineRouting } from "next-intl/routing";

/** URL 로케일 — 한국어는 접두 없이(/), 영어는 /en */
export const locales = ["ko", "en"] as const;
export type RoutedLocale = (typeof locales)[number];

/** 콘텐츠 키 호환용 (ja는 서빙하지 않음) */
export type AppLocale = "ko" | "en" | "ja";

export const defaultLocale: RoutedLocale = "ko";

export const localeLabels: Record<RoutedLocale, string> = {
  ko: "한국어",
  en: "English",
};

export const openGraphLocales: Record<AppLocale, string> = {
  ko: "ko_KR",
  en: "en_US",
  ja: "ja_JP",
};

export const htmlLang: Record<AppLocale, string> = {
  ko: "ko",
  en: "en",
  ja: "ja",
};

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: "as-needed",
  // 첫 방문 언어 결정은 middleware에서 국가·브라우저 언어로 직접 한다
  localeDetection: false,
  // 캐시되는 페이지 응답에 Set-Cookie 를 싣지 않도록 라이브러리 쿠키는 끈다 (언어 전환 시 브라우저가 직접 저장)
  localeCookie: false,
});

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "ko" || value === "en" || value === "ja";
}

export function isRoutedLocale(value: string | null | undefined): value is RoutedLocale {
  return value === "ko" || value === "en";
}

/** 경로 앞에 언어 접두를 붙인다 (ko는 접두 없음) */
export function localizedPath(path: string, locale: RoutedLocale) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) return normalized;
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}
