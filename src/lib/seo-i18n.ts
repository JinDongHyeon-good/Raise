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
    homeTitle: "무료 타로·무료 AI 타로 | 오늘의 운세·오늘의 타로 — 멜로타로",
    homeDescription:
      "무료 타로·무료 AI 타로를 지금 바로. 오늘의 타로·오늘의 운세, 연애 타로, 이번 주 운세까지 로그인 후 무료로 카드를 뽑고 AI 타로 리딩을 받아 보세요. 온라인 무료 타로 사이트 멜로타로.",
    ogAlt: "멜로타로 — 무료 타로·무료 AI 타로·오늘의 운세",
    schemaLanguage: "ko-KR",
    featureList: [
      "무료 타로·무료 AI 타로 리딩",
      "오늘의 타로·오늘의 운세",
      "연애·직장·재물·주간 운세 주제 선택",
      "1장·3장 타로 스프레드",
      "78장 타로 카드",
      "온라인 무료 타로",
    ],
    faq: [
      {
        question: "무료 타로·무료 AI 타로로 이용할 수 있나요?",
        answer:
          "네. 멜로타로는 로그인 후 기본 AI 타로 리딩을 무료로 이용할 수 있는 무료 타로·무료 AI 타로 서비스입니다. 오늘의 타로, 오늘의 운세, 연애 타로 등도 무료로 시작할 수 있습니다.",
      },
      {
        question: "오늘의 타로와 오늘의 운세는 어떻게 보나요?",
        answer:
          "멜로타로 홈에서 ‘오늘의 운세’ 주제를 고른 뒤 카드를 뽑으면 AI가 오늘 하루의 기운과 주의점을 타로 리딩으로 해석합니다. 주제별 페이지(오늘의 타로·오늘의 운세·무료 AI 타로)에서도 바로 시작할 수 있습니다.",
      },
      {
        question: "멜로타로 AI 타로는 무엇인가요?",
        answer:
          "질문 주제와 뽑은 타로 카드를 바탕으로 AI가 리딩을 생성하는 무료 온라인 AI 타로 서비스입니다. 연애 타로, 직장·재물, 이번 주 운세 등에도 활용할 수 있습니다.",
      },
      {
        question: "연애 타로·주간 운세도 무료인가요?",
        answer:
          "네. 연애·썸 타로, 이번 주 운세, 재물·직장 타로 등 주제별 페이지와 홈 주제 선택으로 무료 AI 타로 리딩을 받을 수 있습니다.",
      },
    ],
    homeSeoHeading: "무료 타로·무료 AI 타로 — 오늘의 운세·오늘의 타로",
    homeSeoBody:
      "멜로타로는 무료 타로·무료 AI 타로를 제공하는 온라인 타로 사이트입니다. 오늘의 타로, 오늘의 운세, 연애 타로, 이번 주 운세를 로그인 후 무료로 뽑고, 78장 카드와 AI 해석으로 하루의 기운과 실천 힌트를 정리해 보세요.",
    homeSeoSections: [
      {
        heading: "무료 타로·무료 AI 타로",
        body: "카드 뽑기와 AI 타로 리딩의 기본 이용은 무료입니다. 타로 무료 보기, 온라인 무료 타로, AI 타로 무료로 검색하신 분도 멜로타로에서 바로 시작할 수 있습니다.",
      },
      {
        heading: "오늘의 타로·오늘의 운세",
        body: "아침이나 중요한 일정 전에 한 장으로 오늘의 타로를 보면 하루 태도를 빠르게 정할 수 있습니다. 운세 표현이 익숙하다면 오늘의 운세 주제로 동일하게 이용하세요.",
      },
      {
        heading: "연애·주간·재물 타로도",
        body: "연애 타로, 이번 주 운세, 재물·직장 타로는 주제별 페이지에서 검색·공유하기 쉽게 정리되어 있습니다. 질문은 구체적일수록 실용적인 힌트가 나옵니다.",
      },
      {
        heading: "오락·참고 목적",
        body: "모든 리딩은 예언이나 전문 자문이 아닙니다. 의료·법률·투자 결정은 본인 판단과 전문가 상담을 우선해 주세요.",
      },
    ],
    homeSeoTopicsHeading: "인기 검색 주제",
    topicsMetaTitle: "무료 타로·무료 AI 타로 | 오늘의 운세·연애 타로",
    topicsMetaDescription:
      "무료 타로·무료 AI 타로, 오늘의 타로, 오늘의 운세, 연애 타로, 이번 주 운세 등 멜로타로 주제별 페이지입니다. 로그인 후 무료로 시작하세요.",
    guidesMetaTitle: "타로 가이드 | 무료 AI 타로·오늘의 운세·스프레드",
    guidesMetaDescription:
      "무료 AI 타로 이용법, 1장·3장 스프레드, 오늘의 운세 루틴, 연애·직장·재물 타로 질문 예시와 면책 가이드를 모았습니다.",
  },
  en: {
    siteName: SERVICE_NAME_EN,
    homeTitle: "Free Tarot & Free AI Tarot | Today's Fortune — Melotaro",
    homeDescription:
      "Free tarot and free AI tarot online. Read today's tarot, daily fortune, love tarot, and weekly fortune—log in and draw cards for a free AI tarot reading on Melotaro.",
    ogAlt: "Melotaro — free tarot, free AI tarot, daily fortune",
    schemaLanguage: "en",
    featureList: [
      "Free tarot & free AI tarot readings",
      "Today's tarot & daily fortune",
      "Love, career, money, and weekly fortune topics",
      "1-card and 3-card spreads",
      "Full 78-card tarot deck",
      "Free online tarot",
    ],
    faq: [
      {
        question: "Is Melotaro free tarot / free AI tarot?",
        answer:
          "Yes. After logging in you can use basic AI tarot readings for free—including today's tarot, daily fortune, and love tarot.",
      },
      {
        question: "How do I read today's tarot or daily fortune?",
        answer:
          "Choose the daily fortune topic, draw cards, and AI interprets today's energy. You can also start from the Today's Tarot, Today's Fortune, or Free AI Tarot topic pages.",
      },
      {
        question: "What is Melotaro AI tarot?",
        answer:
          "A free online AI tarot service that generates readings from your topic and drawn cards—love, career, money, weekly fortune, and more.",
      },
      {
        question: "Are love tarot and weekly fortune free too?",
        answer:
          "Yes. Use topic pages or the home topic picker for free AI tarot readings on love, weekly fortune, money, and career.",
      },
    ],
    homeSeoHeading: "Free Tarot & Free AI Tarot — Today's Fortune & Today's Tarot",
    homeSeoBody:
      "Melotaro is a free online tarot site with free AI tarot readings. Draw today's tarot, daily fortune, love tarot, or weekly fortune after login—78 cards and AI interpretation for the day's energy and next steps.",
    homeSeoSections: [
      {
        heading: "Free tarot & free AI tarot",
        body: "Basic card draws and AI readings are free. If you searched for free tarot reading, free online tarot, or AI tarot free, you can start here.",
      },
      {
        heading: "Today's tarot & daily fortune",
        body: "A one-card morning draw helps set the day's mindset. Prefer 'fortune' wording? Use the daily fortune topic the same way.",
      },
      {
        heading: "Love, weekly & money too",
        body: "Love tarot, weekly fortune, and career/money pages are organized for search and sharing. Specific questions yield more practical hints.",
      },
      {
        heading: "Entertainment only",
        body: "Readings are not prophecy or professional advice. For medical, legal, or investment decisions, prioritize your judgment and experts.",
      },
    ],
    homeSeoTopicsHeading: "Popular topics",
    topicsMetaTitle: "Free Tarot & Free AI Tarot | Daily Fortune & Love",
    topicsMetaDescription:
      "Free tarot, free AI tarot, today's tarot, daily fortune, love tarot, weekly fortune, and more on Melotaro. Log in and start free.",
    guidesMetaTitle: "Tarot Guides | Free AI Tarot, Daily Fortune & Spreads",
    guidesMetaDescription:
      "How to use free AI tarot, 1-card vs 3-card spreads, daily fortune routines, and love/career/money question examples.",
  },
  ja: {
    siteName: SERVICE_NAME_JA,
    homeTitle: "無料タロット・無料AIタロット | 今日の運勢 — メロタロ",
    homeDescription:
      "無料タロット・無料AIタロットを今すぐ。今日のタロット・今日の運勢、恋愛タロット、今週の運勢まで、ログイン後無料でカードを引いてAIリーディング。オンライン無料タロット メロタロ。",
    ogAlt: "メロタロ — 無料タロット・無料AIタロット・今日の運勢",
    schemaLanguage: "ja",
    featureList: [
      "無料タロット・無料AIタロットリーディング",
      "今日のタロット・今日の運勢",
      "恋愛・仕事・金運・週間運勢テーマ",
      "1枚・3枚スプレッド",
      "78枚フルデッキ",
      "オンライン無料タロット",
    ],
    faq: [
      {
        question: "無料タロット・無料AIタロットで使えますか？",
        answer:
          "はい。メロタロはログイン後の基本AIタロットリーディングを無料で使える無料タロット・無料AIタロットサービスです。今日のタロットや今日の運勢も無料で始められます。",
      },
      {
        question: "今日のタロット・今日の運勢の見方は？",
        answer:
          "メロタロで「今日の運勢」テーマを選びカードを引くと、AIが一日の気配と注意点を解釈します。テーマ別ページ（今日のタロット・今日の運勢・無料AIタロット）からも開始できます。",
      },
      {
        question: "メロタロ AIタロットとは？",
        answer:
          "選んだテーマと引いたカードをもとにAIがリーディングを生成する無料オンラインAIタロットです。恋愛・仕事・金運・今週の運勢にも使えます。",
      },
      {
        question: "恋愛タロットや今週の運勢も無料ですか？",
        answer:
          "はい。テーマ別ページまたはホームのテーマ選択から、恋愛タロット、今週の運勢、金運・仕事も無料AIタロットとして利用できます。",
      },
    ],
    homeSeoHeading: "無料タロット・無料AIタロット — 今日の運勢・今日のタロット",
    homeSeoBody:
      "メロタロは無料タロット・無料AIタロットを提供するオンラインタロットサイトです。今日のタロット、今日の運勢、恋愛タロット、今週の運勢をログイン後無料で引き、78枚デッキとAI解釈で一日の気配と行動のヒントを整理しましょう。",
    homeSeoSections: [
      {
        heading: "無料タロット・無料AIタロット",
        body: "カードを引くことと基本のAIリーディングは無料です。無料タロット診断、オンライン無料タロット、AIタロット無料で検索した方もここで始められます。",
      },
      {
        heading: "今日のタロット・今日の運勢",
        body: "朝や大切な予定の前に1枚で今日のタロットを見ると、一日の心構えを早く決められます。「運勢」という言葉がしっくりくる場合は今日の運勢テーマで同じように利用できます。",
      },
      {
        heading: "恋愛・週間・金運も",
        body: "恋愛タロット、今週の運勢、金運・仕事タロットはテーマ別に整理されています。質問が具体的なほど実用的なヒントが得られます。",
      },
      {
        heading: "娯楽・参考目的",
        body: "リーディングは予言や専門助言ではありません。医療・法律・投資の判断はご自身と専門家を優先してください。",
      },
    ],
    homeSeoTopicsHeading: "人気の検索テーマ",
    topicsMetaTitle: "無料タロット・無料AIタロット | 今日の運勢・恋愛",
    topicsMetaDescription:
      "無料タロット・無料AIタロット、今日のタロット、今日の運勢、恋愛タロット、今週の運勢などメロタロのテーマ別ページ。ログイン後無料で始められます。",
    guidesMetaTitle: "タロットガイド | 無料AIタロット・今日の運勢・スプレッド",
    guidesMetaDescription:
      "無料AIタロットの使い方、1枚・3枚スプレッド、今日の運勢ルーチン、恋愛・仕事・金運の質問例と安心して使うためのガイド。",
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
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return Object.fromEntries(locales.map((locale) => [htmlLang[locale], localizedSeoPath(normalized, locale)]));
}

export function getOpenGraphLocale(locale: AppLocale) {
  return openGraphLocales[locale];
}
