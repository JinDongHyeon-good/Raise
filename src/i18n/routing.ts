import { defineRouting } from "next-intl/routing";

/** URL에 노출되는 로케일. 기본(ko)은 접두사 없이, en/ja는 /en · /ja 접두사로 서빙한다. */
export const locales = ["ko", "en", "ja"] as const;
export type RoutedLocale = (typeof locales)[number];

export type AppLocale = RoutedLocale;

export const defaultLocale: RoutedLocale = "ko";

export const localeLabels: Record<RoutedLocale, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
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

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  // ko는 기존 URL(/saju 등) 그대로, en/ja만 접두사를 붙여 기존 색인을 보존한다.
  localePrefix: "as-needed",
  localeDetection: false,
});

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "ko" || value === "en" || value === "ja";
}
