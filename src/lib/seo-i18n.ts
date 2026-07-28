import type { AppLocale } from "@/i18n/routing";
import { openGraphLocales } from "@/i18n/routing";
import { SERVICE_NAME, SERVICE_NAME_EN, SERVICE_NAME_JA } from "@/lib/brand";

export type SeoLocaleCopy = {
  siteName: string;
  homeTitle: string;
  homeDescription: string;
  ogAlt: string;
  schemaLanguage: string;
  featureList: string[];
  faq: Array<{ question: string; answer: string }>;
  homeSeoHeading: string;
  homeSeoBody: string;
  homeSeoSections: Array<{ heading: string; body: string }>;
  homeSeoTopicsHeading: string;
  topicsMetaTitle: string;
  topicsMetaDescription: string;
  guidesMetaTitle: string;
  guidesMetaDescription: string;
};

export const SEO_COPY: Record<AppLocale, SeoLocaleCopy> = {
  ko: {
    siteName: SERVICE_NAME,
    homeTitle: "오늘의 운세·사주팔자·궁합 | 사주네 Sajune",
    homeDescription:
      "사주네에서 생년월일시로 보는 오늘의 운세, 사주팔자, 궁합까지. 정통 명리로 쉽게 풀어보는 무료 사주 서비스입니다.",
    ogAlt: "사주네 — 오늘의 운세·사주팔자·궁합",
    schemaLanguage: "ko-KR",
    featureList: [
      "오늘의 운세",
      "사주팔자 풀이",
      "궁합 사주",
      "신년운세·토정비결",
      "만세력·일진",
      "생년월일 기반 운세 해석",
    ],
    faq: [
      {
        question: "사주네는 어떤 서비스인가요?",
        answer:
          "사주네(Sajune)는 생년월일시로 보는 오늘의 운세, 사주팔자, 궁합을 정통 명리로 쉽게 풀어주는 무료 사주 서비스입니다.",
      },
      {
        question: "사주는 어떻게 보나요?",
        answer:
          "태어난 연·월·일·시를 입력하면 만세력을 기준으로 사주팔자를 세우고, 오행과 십성을 바탕으로 오늘의 운세와 흐름을 풀어 드립니다.",
      },
      {
        question: "궁합 사주도 볼 수 있나요?",
        answer:
          "네. 두 사람의 생년월일시를 넣으면 서로의 기운이 어떻게 어울리는지, 연애·결혼 궁합의 강점과 주의할 점을 함께 확인할 수 있습니다.",
      },
      {
        question: "이용은 무료인가요?",
        answer:
          "오늘의 운세, 사주팔자, 궁합 등 핵심 기능은 무료로 이용할 수 있습니다. 사주·운세 결과는 참고용으로 즐겨 주세요.",
      },
    ],
    homeSeoHeading: "오늘의 운세·사주팔자·궁합 — 사주네",
    homeSeoBody:
      "사주네는 생년월일시만 있으면 오늘의 운세부터 사주팔자, 궁합까지 정통 명리로 쉽게 풀어 주는 서비스입니다. 어렵게 느껴지던 사주를 누구나 편하게 확인할 수 있도록 정리했습니다.",
    homeSeoSections: [
      {
        heading: "오늘의 운세",
        body: "생년월일로 오늘 하루의 총운, 재물운, 애정운, 건강운 흐름을 확인하세요. 매일 달라지는 일진을 쉽게 읽어 드립니다.",
      },
      {
        heading: "사주팔자 풀이",
        body: "태어난 연·월·일·시로 세운 사주팔자를 오행과 십성 관점에서 풀어, 타고난 기질과 삶의 흐름을 살펴봅니다.",
      },
      {
        heading: "궁합 사주",
        body: "두 사람의 사주를 견주어 연애·결혼 궁합의 조화와 보완점을 확인할 수 있습니다.",
      },
      {
        heading: "신년운세·토정비결",
        body: "한 해의 큰 흐름과 달별 운세를 신년운세·토정비결로 미리 살펴 계획을 세워 보세요.",
      },
    ],
    homeSeoTopicsHeading: "주요 기능",
    topicsMetaTitle: "오늘의 운세·사주팔자 | 사주네",
    topicsMetaDescription:
      "오늘의 운세, 사주팔자, 궁합, 신년운세 등 사주네의 주요 기능을 모아 둔 페이지입니다.",
    guidesMetaTitle: "사주·운세 가이드 | 사주네",
    guidesMetaDescription:
      "사주 보는 법, 오행과 십성 이해, 궁합 보는 법, 신년운세·토정비결 활용법을 쉽게 정리했습니다.",
  },
  en: {
    siteName: SERVICE_NAME_EN,
    homeTitle: "Daily Fortune, Saju & Compatibility | Sajune",
    homeDescription:
      "Read your daily fortune, Saju (Four Pillars of Destiny), and compatibility from your birth date and time on Sajune—traditional Korean fortune telling made simple.",
    ogAlt: "Sajune — daily fortune, Saju & compatibility",
    schemaLanguage: "en",
    featureList: [
      "Daily fortune",
      "Saju (Four Pillars) reading",
      "Compatibility reading",
      "New year fortune",
      "Birth chart & elements",
      "Easy destiny interpretation",
    ],
    faq: [
      {
        question: "What is Sajune?",
        answer:
          "Sajune is a free Korean fortune-telling service that reads your daily fortune, Saju (Four Pillars of Destiny), and compatibility from your birth date and time.",
      },
      {
        question: "How does a Saju reading work?",
        answer:
          "Enter your birth year, month, day, and hour. Sajune builds your Four Pillars chart and interprets it through the Five Elements and Ten Gods to reveal your nature and life flow.",
      },
      {
        question: "Can I check compatibility?",
        answer:
          "Yes. Enter two people's birth details to see how their energies align, including the strengths and cautions of love and marriage compatibility.",
      },
      {
        question: "Is it free?",
        answer:
          "Core features like daily fortune, Saju, and compatibility are free. Please enjoy the results as guidance and reference.",
      },
    ],
    homeSeoHeading: "Daily fortune, Saju & compatibility — Sajune",
    homeSeoBody:
      "With just your birth date and time, Sajune reads your daily fortune, Saju (Four Pillars of Destiny), and compatibility—traditional Korean fortune telling made simple for everyone.",
    homeSeoSections: [
      {
        heading: "Daily fortune",
        body: "See today's overall, wealth, love, and health flow from your birth date—an easy read on your changing daily luck.",
      },
      {
        heading: "Saju reading",
        body: "Your Four Pillars chart, interpreted through the Five Elements and Ten Gods to explore your innate nature and life flow.",
      },
      {
        heading: "Compatibility",
        body: "Compare two charts to see the harmony and balance of love and marriage compatibility.",
      },
      {
        heading: "New year fortune",
        body: "Preview the year's big flow and month-by-month fortune to plan ahead.",
      },
    ],
    homeSeoTopicsHeading: "Core features",
    topicsMetaTitle: "Daily fortune & Saju | Sajune",
    topicsMetaDescription:
      "Explore Sajune features: daily fortune, Saju reading, compatibility, and new year fortune.",
    guidesMetaTitle: "Saju & fortune guides | Sajune",
    guidesMetaDescription:
      "How to read Saju, understand the Five Elements and Ten Gods, check compatibility, and use new year fortune.",
  },
  ja: {
    siteName: SERVICE_NAME_JA,
    homeTitle: "今日の運勢・四柱推命・相性 | サジュネ Sajune",
    homeDescription:
      "サジュネでは生年月日時から今日の運勢、四柱推命、相性まで。伝統的な韓国占いをわかりやすく読み解く無料占いサービスです。",
    ogAlt: "サジュネ — 今日の運勢・四柱推命・相性",
    schemaLanguage: "ja",
    featureList: [
      "今日の運勢",
      "四柱推命の鑑定",
      "相性占い",
      "新年の運勢",
      "命式・五行",
      "わかりやすい運勢解説",
    ],
    faq: [
      {
        question: "サジュネとは何ですか？",
        answer:
          "サジュネは生年月日時から今日の運勢、四柱推命、相性を読み解く無料の韓国占いサービスです。",
      },
      {
        question: "占いはどう使いますか？",
        answer:
          "生まれた年・月・日・時を入力すると命式を作成し、五行と十神をもとに運勢の流れを読み解きます。",
      },
      {
        question: "相性も見られますか？",
        answer:
          "はい。二人の生年月日時を入力すると、恋愛・結婚の相性の強みと注意点を確認できます。",
      },
      {
        question: "無料ですか？",
        answer:
          "今日の運勢、四柱推命、相性などの主要機能は無料でご利用いただけます。結果は参考としてお楽しみください。",
      },
    ],
    homeSeoHeading: "今日の運勢・四柱推命・相性 — サジュネ",
    homeSeoBody:
      "サジュネは生年月日時さえあれば、今日の運勢から四柱推命、相性まで伝統的な韓国占いをわかりやすく読み解きます。",
    homeSeoSections: [
      {
        heading: "今日の運勢",
        body: "生年月日から今日の総合運、金運、恋愛運、健康運の流れを確認できます。",
      },
      {
        heading: "四柱推命",
        body: "生まれた年・月・日・時から作る命式を五行と十神の視点で読み解きます。",
      },
      {
        heading: "相性占い",
        body: "二人の命式を照らし合わせ、恋愛・結婚の相性の調和と補い合いを確認できます。",
      },
      {
        heading: "新年の運勢",
        body: "一年の大きな流れと月ごとの運勢を先取りして計画を立てましょう。",
      },
    ],
    homeSeoTopicsHeading: "主な機能",
    topicsMetaTitle: "今日の運勢・四柱推命 | サジュネ",
    topicsMetaDescription:
      "今日の運勢、四柱推命、相性、新年の運勢などサジュネの主な機能ページです。",
    guidesMetaTitle: "四柱推命・運勢ガイド | サジュネ",
    guidesMetaDescription:
      "四柱推命の見方、五行と十神の理解、相性の見方、新年の運勢の活用法をまとめました。",
  },
};

export function getSeoCopy(locale: AppLocale) {
  return SEO_COPY[locale] ?? SEO_COPY.ko;
}

export function localizedSeoPath(path: string, _locale?: AppLocale) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized;
}

export function buildLanguageAlternates(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return { ko: normalized };
}

export function getOpenGraphLocale(locale: AppLocale) {
  return openGraphLocales[locale];
}
