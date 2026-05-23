export type ReadingSection = {
  id: string;
  number: string;
  title: string;
  content: string;
  items: string[];
};

export type ParsedTarotReading = {
  summary: string;
  sections: ReadingSection[];
};

export type TarotReadingQuality = "complete" | "usable" | "incomplete";

export type TarotReadingAssessment = {
  quality: TarotReadingQuality;
  parsed: ParsedTarotReading | null;
  missingSectionNumbers: number[];
  presentSectionNumbers: number[];
  hasEndMarker: boolean;
};

const END_MARKER = /\[END_READING\]/g;

const SECTION_HEADER = /^\s*(\d+)[.)]\s*(.+?)\s*$/;

const BULLET_LINE =
  /^(?:[-•·*–—]\s+|\d+[.)]\s+|[①②③④⑤⑥⑦⑧⑨⑩⑪⑫]\s*)(.+)$/;

function stripEndMarker(text: string) {
  return text.replace(END_MARKER, "").trim();
}

function isSummarySection(number: string, title: string) {
  return number === "1" || /요약/.test(title);
}

function splitSectionContent(content: string): { body: string; items: string[] } {
  const lines = content.split(/\n/);
  const items: string[] = [];
  const bodyLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (items.length === 0) bodyLines.push("");
      continue;
    }

    const bullet = trimmed.match(BULLET_LINE);
    if (bullet) {
      items.push(bullet[1].trim());
      continue;
    }

    if (items.length > 0) {
      items[items.length - 1] = `${items[items.length - 1]} ${trimmed}`;
    } else {
      bodyLines.push(trimmed);
    }
  }

  return {
    body: bodyLines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
    items,
  };
}

function parseSectionChunk(chunk: string): ReadingSection | null {
  const trimmed = chunk.trim();
  if (!trimmed) return null;

  const lines = trimmed.split(/\n/);
  const header = lines[0]?.trim() ?? "";
  const headerMatch = header.match(SECTION_HEADER);
  if (!headerMatch) return null;

  const [, number, title] = headerMatch;
  const rest = lines.slice(1).join("\n").trim();
  const { body, items } = splitSectionContent(rest);

  return {
    id: number,
    number,
    title: title.trim(),
    content: body,
    items,
  };
}

/** AI 리딩 본문을 한 줄 요약 + 섹션 트리 구조로 파싱 */
export function parseTarotReading(text: string): ParsedTarotReading | null {
  const cleaned = stripEndMarker(text);
  if (!cleaned) return null;

  const chunks = cleaned.split(/\n(?=\d+[.)]\s)/).map((part) => part.trim()).filter(Boolean);
  if (chunks.length === 0) return null;

  let summary = "";
  const sections: ReadingSection[] = [];

  for (const chunk of chunks) {
    const section = parseSectionChunk(chunk);
    if (!section) continue;

    if (isSummarySection(section.number, section.title)) {
      const summaryText = [section.content, ...section.items].filter(Boolean).join("\n\n");
      summary = summaryText || section.title;
      continue;
    }

    sections.push(section);
  }

  if (!summary && sections.length === 0) return null;

  return { summary, sections };
}

function hasSectionMarker(text: string, sectionNumber: number) {
  return new RegExp(`(?:^|\\n)${sectionNumber}[.)]\\s`, "m").test(text);
}

function collectPresentSections(text: string, parsed: ParsedTarotReading | null) {
  const present = new Set<number>();

  for (let i = 1; i <= 5; i += 1) {
    if (hasSectionMarker(text, i)) present.add(i);
  }

  if (parsed?.summary.trim()) present.add(1);
  for (const section of parsed?.sections ?? []) {
    const n = Number(section.number);
    if (n >= 2 && n <= 5) present.add(n);
  }

  return [...present].sort((a, b) => a - b);
}

/** 리딩 본문이 UI에 충분히 표시 가능한지 구조적으로 검사 */
export function assessTarotReading(text: string): TarotReadingAssessment {
  const trimmed = text.trim();
  const hasEndMarker = /\[END_READING\]/.test(trimmed);
  const parsed = parseTarotReading(trimmed);
  const presentSectionNumbers = collectPresentSections(trimmed, parsed);
  const missingSectionNumbers = [1, 2, 3, 4, 5].filter((n) => !presentSectionNumbers.includes(n));
  const bodyLength = stripEndMarker(trimmed).length;
  const detailSectionCount = parsed?.sections.length ?? 0;

  const hasSummary = Boolean(parsed?.summary.trim()) || presentSectionNumbers.includes(1);
  const hasClosing =
    presentSectionNumbers.includes(5) ||
    /마음가짐/.test(trimmed.slice(Math.max(0, trimmed.length - 400)));

  if (
    missingSectionNumbers.length === 0 &&
    hasSummary &&
    detailSectionCount >= 4 &&
    (hasEndMarker || bodyLength >= 700)
  ) {
    return {
      quality: "complete",
      parsed,
      missingSectionNumbers,
      presentSectionNumbers,
      hasEndMarker,
    };
  }

  if (
    hasSummary &&
    presentSectionNumbers.length >= 4 &&
    detailSectionCount >= 3 &&
    bodyLength >= 500
  ) {
    return {
      quality: "usable",
      parsed,
      missingSectionNumbers,
      presentSectionNumbers,
      hasEndMarker,
    };
  }

  if (hasSummary && presentSectionNumbers.length >= 3 && bodyLength >= 350) {
    return {
      quality: "usable",
      parsed,
      missingSectionNumbers,
      presentSectionNumbers,
      hasEndMarker,
    };
  }

  if ((parsed?.summary || detailSectionCount >= 1) && bodyLength >= 250 && hasClosing) {
    return {
      quality: "usable",
      parsed,
      missingSectionNumbers,
      presentSectionNumbers,
      hasEndMarker,
    };
  }

  return {
    quality: "incomplete",
    parsed,
    missingSectionNumbers,
    presentSectionNumbers,
    hasEndMarker,
  };
}
