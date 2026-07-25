import { defineRouting } from "next-intl/routing";

/** URL에 노출되는 로케일 — 한국어만 */
export const locales = ["ko"] as const;
export type RoutedLocale = (typeof locales)[number];

/** 메시지/콘텐츠 키 호환용 (실제 서빙은 ko만) */
export type AppLocale = "ko" | "en" | "ja";

export const defaultLocale: RoutedLocale = "ko";

export const localeLabels: Record<RoutedLocale, string> = {
  ko: "한국어",
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
  localePrefix: "never",
});

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "ko" || value === "en" || value === "ja";
}
