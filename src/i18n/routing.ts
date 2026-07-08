import { defineRouting } from "next-intl/routing";

export const locales = ["ko", "en", "ja"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "ko";

export const localeLabels: Record<AppLocale, string> = {
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
  localePrefix: "always",
});

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return Boolean(value && locales.includes(value as AppLocale));
}
