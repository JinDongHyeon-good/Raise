import type { AppLocale } from "@/i18n/routing";
import type { CardOrientation, TarotSpreadId, TarotSuit, TarotTopicId } from "@/lib/tarot-deck";
import {
  localizedOrientationLabel,
  localizedServiceName,
  localizedSpreadLabel,
  localizedSuitLabel,
  localizedTopicGuidance,
  localizedTopicLabel,
} from "@/lib/tarot-deck-i18n";
import { localizedCardKeywords } from "@/lib/tarot-keywords-i18n";

export type TarotPromptCard = {
  id: string;
  suit?: TarotSuit;
  nameKo: string;
  nameEn: string;
  position: string;
  orientation: CardOrientation;
  keywords: string;
};

export type TarotPromptBody = {
  topic: TarotTopicId;
  spread: TarotSpreadId;
  question?: string;
  cards: TarotPromptCard[];
};

const PROMPT_COPY: Record<
  AppLocale,
  {
    role: string;
    rules: string[];
    noQuestion: string;
    questionPrefix: string;
    cardsHeader: string;
    outputHeader: string;
    sections: { summary: string; cardSingle: string; cardMulti: string; flow: string; actions: string; mindset: string };
    spreadSingle: string;
    spreadThree: string;
    deckNote: string;
    endNote: string;
    rulesHeader: string;
    continuationRole: string;
    continuationRules: string[];
    missingHeader: string;
    existingHeader: string;
    retryHeader: string;
    retryInstruction: string;
    sectionGuides: Record<number, (body: TarotPromptBody) => string>;
  }
> = {
  ko: {
    role: "너는 15년 경력의 전문 타로 리더다. 반드시 한국어로, 따뜻하고 명확한 톤으로 작성한다.",
    rules: [
      "미신을 조장하거나 절대적 예언(100% 확정)을 하지 말고, 관찰과 가능성 중심으로 쓴다.",
      "투자·의료·법률 등 전문 조언은 금지한다.",
      "- 긴 인사말·자기소개·서비스 홍보 문구로 시작하지 말 것.",
      "- 요약만 하고 끝내지 말 것. 각 섹션을 충분히 풀어서 서술한다.",
      "- 문장을 중간에 끊지 말고, 모든 섹션을 끝까지 완성한다.",
      "- 5개 섹션을 빠짐없이 완성할 것.",
      "- 마지막 줄은 반드시 단독으로 [END_READING] 을 출력한다.",
    ],
    noQuestion: "질문: (구체적 질문 없음 — 카드 흐름 중심으로 읽기)",
    questionPrefix: "질문:",
    cardsHeader: "뽑힌 카드:",
    outputHeader: "[출력 형식 — 아래 5개 섹션을 모두 작성. 각 섹션은 반드시 '1)', '2)' … 번호로 시작]",
    sections: {
      summary: "1) 한 줄 요약",
      cardSingle: "2) 카드 해석: 뽑힌 카드 1장을 최소 5문장으로 깊게 풀어 쓴다.",
      cardMulti: "2) 카드별 해석: 뽑힌 카드 각각을 최소 4문장씩, 위치(과거/현재/미래)와 연결해 풀어 쓴다.",
      flow: "3) 카드들이 만드는 전체 흐름 (6문장 이상, 인과와 감정 흐름 포함)",
      actions: "4) 지금 실천하면 좋은 행동",
      mindset: "5) 마음가짐 한 문장 (격려가 담긴 마무리)",
    },
    spreadSingle: "1장 (핵심 메시지)",
    spreadThree: "3장 (과거-현재-미래)",
    deckNote: "덱: 78장 풀 덱(메이저+마이너)에서 뽑힌 카드이다.",
    endNote: "위 5개 섹션을 모두 쓴 뒤, 마지막 줄에만 [END_READING]을 출력한다.",
    rulesHeader: "[작성 규칙 — 반드시 준수]",
    continuationRole: "너는 전문 타로 리더다. 반드시 한국어로 작성한다.",
    continuationRules: [
      "아래 [기존 응답]은 수정·요약·반복하지 말고, [누락 섹션]만 새로 이어서 작성한다.",
      "누락 섹션 작성이 끝나면 마지막 줄에만 [END_READING]을 출력한다.",
    ],
    missingHeader: "[누락 섹션 번호:",
    existingHeader: "[기존 응답]",
    retryHeader: "[재요청]",
    retryInstruction:
      "응답이 중간에 잘렸다. 기존 응답에 이어 누락된 섹션만 작성하고 마지막에 [END_READING]을 출력한다.",
    sectionGuides: {
      1: () => "1) 한 줄 요약 — 2~3문장",
      2: (body) =>
        body.cards.length === 1
          ? "2) 카드 해석 — 뽑힌 카드 1장을 5문장 이상"
          : "2) 카드별 해석 — 각 카드 4문장 이상, 과거/현재/미래 연결",
      3: () => "3) 카드들이 만드는 전체 흐름 — 6문장 이상",
      4: () => "4) 지금 실천하면 좋은 행동 — '- '로 시작하는 줄 3개",
      5: () => "5) 마음가짐 한 문장 — 격려 마무리",
    },
  },
  en: {
    role: "You are a professional tarot reader with 15 years of experience. Write entirely in English with a warm, clear tone. Do not use Korean or Japanese.",
    rules: [
      "Do not promote superstition or absolute predictions (100% certainty). Focus on observation and possibility.",
      "No professional advice on investment, medicine, or law.",
      "- Do not start with long greetings, self-introductions, or service promotion.",
      "- Do not stop at a brief summary. Fully develop each section.",
      "- Do not cut sentences mid-way. Complete every section.",
      "- Complete all 5 sections without omission.",
      "- The last line must be [END_READING] alone.",
    ],
    noQuestion: "Question: (no specific question — read from the card flow)",
    questionPrefix: "Question:",
    cardsHeader: "Drawn cards:",
    outputHeader: "[Output format — write all 5 sections below. Each section must start with '1)', '2)', etc.]",
    sections: {
      summary: "1) One-line summary",
      cardSingle: "2) Card reading: expand the single drawn card in at least 5 sentences.",
      cardMulti: "2) Card-by-card reading: at least 4 sentences each, linked to Past/Present/Future positions.",
      flow: "3) Overall flow of the cards (6+ sentences, cause and emotional flow)",
      actions: "4) Actions to take now",
      mindset: "5) One mindset sentence (encouraging close)",
    },
    spreadSingle: "1 card (core message)",
    spreadThree: "3 cards (past-present-future)",
    deckNote: "Deck: cards drawn from the full 78-card deck (Major + Minor Arcana).",
    endNote: "After all 5 sections, output [END_READING] on the last line only.",
    rulesHeader: "[Writing rules — must follow]",
    continuationRole: "You are a professional tarot reader. Write entirely in English. Do not use Korean or Japanese.",
    continuationRules: [
      "Do not edit, summarize, or repeat [Existing response]. Only continue with [Missing sections].",
      "When missing sections are done, output [END_READING] on the last line only.",
    ],
    missingHeader: "[Missing section numbers:",
    existingHeader: "[Existing response]",
    retryHeader: "[Retry]",
    retryInstruction:
      "The response was cut off. Continue from the existing response with only missing sections, then output [END_READING] on the last line.",
    sectionGuides: {
      1: () => "1) One-line summary — 2-3 sentences",
      2: (body) =>
        body.cards.length === 1
          ? "2) Card reading — at least 5 sentences for the one card"
          : "2) Card-by-card reading — 4+ sentences each, past/present/future",
      3: () => "3) Overall card flow — 6+ sentences",
      4: () => "4) Actions to take now — 3 lines starting with '- '",
      5: () => "5) One mindset sentence — encouraging close",
    },
  },
  ja: {
    role: "あなたは15年の経験を持つプロのタロットリーダーです。必ず日本語で、温かく明確なトーンで書いてください。韓国語や英語は使わないこと。",
    rules: [
      "迷信を助長したり、絶対的な予言（100%確定）をしないでください。観察と可能性を中心に書くこと。",
      "投資・医療・法律などの専門的助言は禁止。",
      "- 長い挨拶・自己紹介・サービス宣伝で始めないこと。",
      "- 要約だけで終わらせず、各セクションを十分に展開すること。",
      "- 文を途中で切らず、すべてのセクションを最後まで完成すること。",
      "- 5つのセクションを漏れなく完成すること。",
      "- 最後の行は必ず単独で [END_READING] を出力すること。",
    ],
    noQuestion: "質問：（具体的な質問なし — カードの流れ中心で読む）",
    questionPrefix: "質問:",
    cardsHeader: "引いたカード:",
    outputHeader: "[出力形式 — 以下5セクションをすべて記述。各セクションは必ず '1)','2)' … で始める]",
    sections: {
      summary: "1) 一行要約",
      cardSingle: "2) カード解釈：引いたカード1枚を最低5文で深く書く。",
      cardMulti: "2) カード別解釈：各カード最低4文、位置（過去/現在/未来）と結びつける。",
      flow: "3) カード全体の流れ（6文以上、因果と感情の流れを含む）",
      actions: "4) 今実践するとよい行動",
      mindset: "5) 心構えの一文（励ましの締め）",
    },
    spreadSingle: "1枚（核心メッセージ）",
    spreadThree: "3枚（過去-現在-未来）",
    deckNote: "デッキ：78枚フルデッキ（大アルカナ+小アルカナ）から引いたカード。",
    endNote: "5セクションすべてを書いた後、最後の行にのみ [END_READING] を出力する。",
    rulesHeader: "[記述ルール — 必ず守る]",
    continuationRole: "あなたはプロのタロットリーダーです。必ず日本語で書くこと。韓国語や英語は使わない。",
    continuationRules: [
      "以下の[既存の応答]は修正・要約・繰り返しをせず、[不足セクション]のみ新しく続ける。",
      "不足セクションが終わったら、最後の行にのみ [END_READING] を出力する。",
    ],
    missingHeader: "[不足セクション番号:",
    existingHeader: "[既存の応答]",
    retryHeader: "[再リクエスト]",
    retryInstruction:
      "応答が途中で切れた。[既存の応答]に続けて不足セクションのみ書き、最後に [END_READING] を出力すること。",
    sectionGuides: {
      1: () => "1) 一行要約 — 2〜3文",
      2: (body) =>
        body.cards.length === 1
          ? "2) カード解釈 — 1枚を5文以上"
          : "2) カード別解釈 — 各カード4文以上、過去/現在/未来を結ぶ",
      3: () => "3) カード全体の流れ — 6文以上",
      4: () => "4) 今実践するとよい行動 — '- 'で始まる行3つ",
      5: () => "5) 心構えの一文 — 励ましの締め",
    },
  },
};

function cardDisplayName(card: TarotPromptCard, locale: AppLocale) {
  if (locale === "en") return card.nameEn;
  if (locale === "ja") return `${card.nameKo} (${card.nameEn})`;
  return card.nameKo;
}

export function buildLocalizedPrompt(body: TarotPromptBody, locale: AppLocale) {
  const copy = PROMPT_COPY[locale];
  const cardsText = body.cards
    .map((card) => {
      const suitPart = card.suit ? `[${localizedSuitLabel(card.suit, locale)}] ` : "";
      const name = cardDisplayName(card, locale);
      const orientation = localizedOrientationLabel(card.orientation, locale);
      const keywordLabel = locale === "en" ? "Keywords" : locale === "ja" ? "キーワード" : "키워드";
      const keywords = localizedCardKeywords(card.id, card.keywords, locale);
      return `- ${card.position}: ${suitPart}${name} / ${orientation} / ${keywordLabel}: ${keywords}`;
    })
    .join("\n");

  const questionLine = body.question
    ? `${copy.questionPrefix} ${body.question}`
    : copy.noQuestion;
  const cardSectionRule = body.cards.length === 1 ? copy.sections.cardSingle : copy.sections.cardMulti;
  const spreadLabel = body.spread === "three" ? copy.spreadThree : copy.spreadSingle;
  const topicLabel = localizedTopicLabel(body.topic, locale);
  const topicGuide = localizedTopicGuidance(body.topic, locale);

  return [
    copy.role,
    ...copy.rules.slice(0, 2),
    "",
    copy.rulesHeader,
    ...copy.rules.slice(2),
    "",
    `${locale === "en" ? "Service" : locale === "ja" ? "サービス" : "서비스"}: ${localizedServiceName(locale)}`,
    `${locale === "en" ? "Topic" : locale === "ja" ? "テーマ" : "주제"}: ${topicLabel}`,
    `${locale === "en" ? "Topic guidance" : locale === "ja" ? "テーマ解釈ガイド" : "주제 해석 가이드"}: ${topicGuide}`,
    `${locale === "en" ? "Spread" : locale === "ja" ? "スプレッド" : "스프레드"}: ${spreadLabel}`,
    copy.deckNote,
    questionLine,
    "",
    copy.cardsHeader,
    cardsText,
    "",
    copy.outputHeader,
    copy.sections.summary,
    locale === "ko" ? "(이 줄 다음 줄부터 2~3문장으로 핵심만 요약)" : locale === "en" ? "(Next lines: 2-3 sentence summary)" : "（次の行から2〜3文で要約）",
    cardSectionRule,
    copy.sections.flow,
    copy.sections.actions,
    locale === "ko" ? "(- 로 시작하는 줄 3개, 각 1~2문장)" : locale === "en" ? "(3 lines starting with '- ', 1-2 sentences each)" : "（'- 'で始まる行3つ、各1〜2文）",
    copy.sections.mindset,
    "",
    copy.endNote,
  ].join("\n");
}

export function buildLocalizedTruncatedRetryPrompt(
  basePrompt: string,
  accumulated: string,
  locale: AppLocale,
) {
  const copy = PROMPT_COPY[locale];
  return [basePrompt, "", copy.retryHeader, copy.retryInstruction, "", copy.existingHeader, accumulated].join("\n");
}

export function buildLocalizedMissingSectionsPrompt(
  body: TarotPromptBody,
  accumulated: string,
  missing: number[],
  locale: AppLocale,
) {
  const copy = PROMPT_COPY[locale];
  const guides = missing.map((n) => copy.sectionGuides[n]?.(body)).filter(Boolean);

  return [
    copy.continuationRole,
    ...copy.continuationRules,
    "",
    `${copy.missingHeader} ${missing.join(", ")}]`,
    ...guides,
    "",
    copy.existingHeader,
    accumulated,
  ].join("\n");
}

export function localizedSpreadNameForDraw(spread: TarotSpreadId, locale: AppLocale) {
  return localizedSpreadLabel(spread, locale);
}
