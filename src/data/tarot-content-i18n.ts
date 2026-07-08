import type { AppLocale } from "@/i18n/routing";
import type { TarotGuide } from "@/data/tarot-guides";
import { TAROT_GUIDES as TAROT_GUIDES_KO } from "@/data/tarot-guides";
import { TAROT_GUIDES_EN } from "@/data/tarot-guides.en";
import { TAROT_GUIDES_JA } from "@/data/tarot-guides.ja";
import type { TarotTopicPage } from "@/data/tarot-topic-pages";
import { TAROT_TOPIC_PAGES as TAROT_TOPIC_PAGES_KO } from "@/data/tarot-topic-pages";
import { TAROT_TOPIC_PAGES_EN } from "@/data/tarot-topic-pages.en";
import { TAROT_TOPIC_PAGES_JA } from "@/data/tarot-topic-pages.ja";

const TOPIC_PAGES_BY_LOCALE: Record<AppLocale, TarotTopicPage[]> = {
  ko: TAROT_TOPIC_PAGES_KO,
  en: TAROT_TOPIC_PAGES_EN,
  ja: TAROT_TOPIC_PAGES_JA,
};

const GUIDES_BY_LOCALE: Record<AppLocale, TarotGuide[]> = {
  ko: TAROT_GUIDES_KO,
  en: TAROT_GUIDES_EN,
  ja: TAROT_GUIDES_JA,
};

export function getTarotTopicPages(locale: AppLocale = "ko") {
  return TOPIC_PAGES_BY_LOCALE[locale] ?? TOPIC_PAGES_BY_LOCALE.ko;
}

export function getTarotTopicPage(slug: string, locale: AppLocale = "ko") {
  return getTarotTopicPages(locale).find((page) => page.slug === slug) ?? null;
}

export function getTarotGuides(locale: AppLocale = "ko") {
  return GUIDES_BY_LOCALE[locale] ?? GUIDES_BY_LOCALE.ko;
}

export function getTarotGuide(slug: string, locale: AppLocale = "ko") {
  return getTarotGuides(locale).find((guide) => guide.slug === slug) ?? null;
}
