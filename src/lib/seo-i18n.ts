import type { AppLocale } from "@/i18n/routing";
import { htmlLang, locales, openGraphLocales } from "@/i18n/routing";
import { SERVICE_NAME, SERVICE_NAME_EN, SERVICE_NAME_JA } from "@/lib/brand";

export type SeoLocaleCopy = {
  siteName: string;
  homeTitle: string;
  homeDescription: string;
  ogAlt: string;
  schemaLanguage: string;
  featureList: string[];
  faq: Array<{ question: string; answer: string }>;
};

export const SEO_COPY: Record<AppLocale, SeoLocaleCopy> = {
  ko: {
    siteName: SERVICE_NAME,
    homeTitle: "AI 타로 | 멜로타로 — 무료 온라인 AI 타로 리딩",
    homeDescription:
      "멜로타로는 AI 타로 서비스입니다. 연애·직장·재물·오늘의 운세 등 궁금한 주제를 고르고 카드를 뽑으면 AI가 타로 리딩을 해드립니다. 지금 바로 무료로 AI 타로를 시작해 보세요.",
    ogAlt: "멜로타로 — AI 타로 온라인 리딩",
    schemaLanguage: "ko-KR",
    featureList: [
      "AI 타로 리딩",
      "연애·직장·재물·오늘의 운세 주제 선택",
      "1장·3장 타로 스프레드",
      "78장 타로 카드",
    ],
    faq: [
      {
        question: "멜로타로 AI 타로는 무엇인가요?",
        answer:
          "멜로타로는 질문 주제와 뽑은 타로 카드를 바탕으로 AI가 리딩 문장을 생성해 주는 온라인 AI 타로 서비스입니다.",
      },
      {
        question: "AI 타로는 어떻게 이용하나요?",
        answer:
          "리딩 영역을 선택한 뒤 궁금한 내용을 적고(선택), 스프레드를 고른 다음 카드를 뽑으면 AI 타로 리딩 결과를 확인할 수 있습니다.",
      },
    ],
  },
  en: {
    siteName: SERVICE_NAME_EN,
    homeTitle: "AI Tarot | Melotaro — Free Online AI Tarot Reading",
    homeDescription:
      "Melotaro is an AI tarot service. Choose topics like love, career, money, or daily fortune, draw cards, and receive an AI reading. Start free now.",
    ogAlt: "Melotaro — AI tarot online reading",
    schemaLanguage: "en",
    featureList: [
      "AI tarot readings",
      "Love, career, money, and daily fortune topics",
      "1-card and 3-card spreads",
      "Full 78-card tarot deck",
    ],
    faq: [
      {
        question: "What is Melotaro AI tarot?",
        answer:
          "Melotaro generates tarot readings with AI based on your chosen topic and drawn cards.",
      },
      {
        question: "How do I use AI tarot?",
        answer:
          "Pick a reading area, optionally write your question, choose a spread, draw cards, and view your AI reading.",
      },
    ],
  },
  ja: {
    siteName: SERVICE_NAME_JA,
    homeTitle: "AIタロット | メロタロ — 無料オンラインAIタロットリーディング",
    homeDescription:
      "メロタロはAIタロットサービスです。恋愛・仕事・金運・今日の運勢など、気になるテーマを選んでカードを引くとAIがリーディングをお届けします。",
    ogAlt: "メロタロ — AIタロットオンラインリーディング",
    schemaLanguage: "ja",
    featureList: [
      "AIタロットリーディング",
      "恋愛・仕事・金運・今日の運勢などのテーマ",
      "1枚・3枚スプレッド",
      "78枚フルデッキ",
    ],
    faq: [
      {
        question: "メロタロ AIタロットとは？",
        answer: "選んだテーマと引いたカードをもとに、AIがタロットリーディングを生成するオンラインサービスです。",
      },
      {
        question: "AIタロットの使い方は？",
        answer: "リーディング分野を選び、質問を書いて（任意）、スプレッドを選んでカードを引くと結果を確認できます。",
      },
    ],
  },
};

export function getSeoCopy(locale: AppLocale) {
  return SEO_COPY[locale] ?? SEO_COPY.ko;
}

export function localizedSeoPath(path: string, locale: AppLocale) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}

export function buildLanguageAlternates(path: string) {
  return Object.fromEntries(locales.map((locale) => [htmlLang[locale], localizedSeoPath(path, locale)]));
}

export function getOpenGraphLocale(locale: AppLocale) {
  return openGraphLocales[locale];
}
