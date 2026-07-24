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
    homeTitle: "피클볼 예약·모임·대관 | Piclick 피클릭",
    homeDescription:
      "Piclick에서 피클볼 코트 예약, 모임 커뮤니티, 대관, 클럽·광고까지. 가까운 코트를 찾고 함께 칠 사람을 만나보세요.",
    ogAlt: "Piclick — 피클볼 예약·모임·대관",
    schemaLanguage: "ko-KR",
    featureList: [
      "피클볼 코트 예약",
      "피클볼 모임·커뮤니티",
      "코트·시설 대관",
      "클럽·레슨·광고 노출",
      "초보부터 클럽까지 매칭",
      "실시간 일정·참가 관리",
    ],
    faq: [
      {
        question: "Piclick은 어떤 서비스인가요?",
        answer:
          "Piclick(피클릭)은 피클볼 코트 예약, 모임 커뮤니티, 대관, 클럽·광고를 한곳에서 연결하는 피클볼 플랫폼입니다.",
      },
      {
        question: "코트 예약은 어떻게 하나요?",
        answer:
          "원하는 지역·시간대를 고른 뒤 빈 코트를 확인하고 예약할 수 있습니다. 대관이 필요한 모임·리그도 같은 흐름으로 신청할 수 있어요.",
      },
      {
        question: "모임 커뮤니티는 무엇인가요?",
        answer:
          "레벨·지역·시간에 맞는 피클볼 모임을 만들고 참가할 수 있는 커뮤니티입니다. 초보 오픈 게임부터 클럽 매치까지 연결합니다.",
      },
      {
        question: "광고·클럽 홍보는 가능한가요?",
        answer:
          "네. 클럽, 레슨, 용품, 코트 시설 운영자는 Piclick 광고·노출 영역으로 피클볼 플레이어에게 서비스를 알릴 수 있습니다.",
      },
    ],
    homeSeoHeading: "피클볼 예약·모임·대관 — Piclick",
    homeSeoBody:
      "Piclick은 피클볼을 더 쉽게 치고, 모이고, 대관할 수 있게 돕는 서비스입니다. 코트 예약부터 커뮤니티 모임, 시설 대관, 클럽·광고까지 피클볼에 필요한 흐름을 한곳에서 이어 보세요.",
    homeSeoSections: [
      {
        heading: "피클볼 코트 예약",
        body: "가까운 피클볼 코트의 빈 시간을 확인하고 예약하세요. 실내·야외 코트, 단발 예약부터 정기 슬롯까지 찾기 쉽게 정리합니다.",
      },
      {
        heading: "모임 커뮤니티",
        body: "혼자 가기 부담스러울 때도 레벨·지역에 맞는 오픈 게임과 클럽 모임을 찾아 참가할 수 있습니다.",
      },
      {
        heading: "대관·시설",
        body: "모임·리그·이벤트를 위한 코트·시설 대관을 신청하고, 운영자와 일정을 맞출 수 있습니다.",
      },
      {
        heading: "클럽·광고",
        body: "레슨, 클럽, 용품, 코트 사업자는 Piclick에서 피클볼 플레이어에게 자연스럽게 노출될 수 있습니다.",
      },
    ],
    homeSeoTopicsHeading: "주요 기능",
    topicsMetaTitle: "피클볼 예약·모임 | Piclick",
    topicsMetaDescription:
      "피클볼 코트 예약, 모임 커뮤니티, 대관, 클럽·광고 등 Piclick의 주요 기능을 모아 둔 페이지입니다.",
    guidesMetaTitle: "피클볼 가이드 | Piclick",
    guidesMetaDescription:
      "피클볼 초보 가이드, 코트 예약 팁, 모임 참여 방법, 대관·클럽 이용 안내를 모았습니다.",
  },
  en: {
    siteName: SERVICE_NAME_EN,
    homeTitle: "Pickleball Booking, Meetups & Courts | Piclick",
    homeDescription:
      "Book pickleball courts, join meetups, rent venues, and grow your club on Piclick—reserve, play, and host in one place.",
    ogAlt: "Piclick — pickleball booking, meetups & courts",
    schemaLanguage: "en",
    featureList: [
      "Pickleball court booking",
      "Meetup community",
      "Venue & court rental",
      "Club & lesson discovery",
      "Ads for pickleball businesses",
      "Schedule & RSVP tools",
    ],
    faq: [
      {
        question: "What is Piclick?",
        answer:
          "Piclick is a pickleball platform for court booking, meetups, venue rental, and club or business ads—so you can reserve, play, and host in one place.",
      },
      {
        question: "How do I book a court?",
        answer:
          "Pick a location and time, check open courts, and reserve. Group rentals for meetups and leagues follow the same flow.",
      },
      {
        question: "What is the meetup community?",
        answer:
          "Find or create open games and club sessions by level, area, and schedule—from beginner-friendly play to competitive matches.",
      },
      {
        question: "Can clubs advertise?",
        answer:
          "Yes. Clubs, coaches, gear shops, and venue operators can reach pickleball players through Piclick placements.",
      },
    ],
    homeSeoHeading: "Pickleball booking, meetups & courts — Piclick",
    homeSeoBody:
      "Piclick helps you book courts, join meetups, rent venues, and promote clubs—everything you need to play more pickleball, in one place.",
    homeSeoSections: [
      {
        heading: "Court booking",
        body: "Find nearby indoor and outdoor courts and reserve open slots—single sessions or recurring times.",
      },
      {
        heading: "Meetup community",
        body: "Join open games and club meetups matched to your level, area, and schedule.",
      },
      {
        heading: "Venue rental",
        body: "Request courts and facilities for groups, leagues, and events, then align schedules with operators.",
      },
      {
        heading: "Clubs & ads",
        body: "Lessons, clubs, gear, and venues can reach players naturally on Piclick.",
      },
    ],
    homeSeoTopicsHeading: "Core features",
    topicsMetaTitle: "Pickleball booking & meetups | Piclick",
    topicsMetaDescription:
      "Explore Piclick features: pickleball court booking, meetup community, venue rental, and club ads.",
    guidesMetaTitle: "Pickleball guides | Piclick",
    guidesMetaDescription:
      "Beginner tips, court booking advice, how to join meetups, and venue or club guides on Piclick.",
  },
  ja: {
    siteName: SERVICE_NAME_JA,
    homeTitle: "ピックルボール予約・コミュニティ・コート | Piclick",
    homeDescription:
      "Piclickでピックルボールのコート予約、コミュニティ、レンタル、クラブ・広告まで。近くのコートを見つけて一緒にプレーしましょう。",
    ogAlt: "Piclick — ピックルボール予約・コミュニティ・コート",
    schemaLanguage: "ja",
    featureList: [
      "ピックルボールコート予約",
      "ミートアップコミュニティ",
      "コート・施設レンタル",
      "クラブ・レッスン発見",
      "広告・露出",
      "スケジュール・参加管理",
    ],
    faq: [
      {
        question: "Piclickとは何ですか？",
        answer:
          "Piclickはピックルボールのコート予約、コミュニティ、レンタル、クラブ・広告をつなぐプラットフォームです。",
      },
      {
        question: "コート予約の方法は？",
        answer:
          "エリアと時間を選び、空きコートを確認して予約できます。集まりやリーグ向けのレンタルも同じ流れで申請できます。",
      },
      {
        question: "コミュニティ機能とは？",
        answer:
          "レベル・地域・時間に合うオープンゲームやクラブの集まりを作り、参加できるコミュニティです。",
      },
      {
        question: "広告は出せますか？",
        answer:
          "はい。クラブ、レッスン、用品、コート運営者はPiclickの広告枠でプレイヤーにリーチできます。",
      },
    ],
    homeSeoHeading: "ピックルボール予約・コミュニティ・コート — Piclick",
    homeSeoBody:
      "Piclickはコート予約からコミュニティ、レンタル、クラブ・広告まで、ピックルボールに必要な流れをひとつにつなぎます。",
    homeSeoSections: [
      {
        heading: "コート予約",
        body: "近くのインドア・アウトドアコートの空きを確認して予約。単発から定期枠まで探しやすく整理します。",
      },
      {
        heading: "コミュニティ",
        body: "レベルや地域に合うオープンゲーム・クラブ集まりを見つけて参加できます。",
      },
      {
        heading: "レンタル",
        body: "集まり・リーグ・イベント向けのコート・施設レンタルを申請し、運営者と日程を合わせられます。",
      },
      {
        heading: "クラブ・広告",
        body: "レッスン、クラブ、用品、コートはPiclickでプレイヤーに自然に届きます。",
      },
    ],
    homeSeoTopicsHeading: "主な機能",
    topicsMetaTitle: "ピックルボール予約・コミュニティ | Piclick",
    topicsMetaDescription:
      "ピックルボールのコート予約、コミュニティ、レンタル、クラブ・広告などPiclickの主な機能ページです。",
    guidesMetaTitle: "ピックルボールガイド | Piclick",
    guidesMetaDescription:
      "初心者ガイド、コート予約のコツ、コミュニティ参加方法、レンタル・クラブ案内をまとめました。",
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
