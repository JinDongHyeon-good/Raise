"use client";

import { Fragment, type ReactNode } from "react";

/** **굵게** 만 인라인 처리 */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[var(--piclick-green-deep)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/**
 * AI 리딩 마크다운(제목/문단/목록)을 안전하게 렌더링.
 */
export function SajuMarkdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`ul-${key++}`} className="my-3 list-disc space-y-1.5 pl-5 text-[var(--piclick-ink-muted)]">
        {listItems.map((item, i) => (
          <li key={i} className="leading-7">
            {renderInline(item)}
          </li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList();
      continue;
    }
    const h3 = line.match(/^#{2,3}\s+(.*)$/);
    const h2 = line.match(/^#\s+(.*)$/);
    const li = line.match(/^[-*]\s+(.*)$/);

    if (li) {
      listItems.push(li[1]);
      continue;
    }
    flushList();

    if (h2) {
      blocks.push(
        <h3
          key={`h-${key++}`}
          className="mt-7 border-t border-[var(--piclick-line)] pt-5 text-lg font-bold text-[var(--piclick-green-deep)] first:mt-0 first:border-0 first:pt-0 sm:text-xl"
        >
          {renderInline(h2[1])}
        </h3>,
      );
    } else if (h3) {
      blocks.push(
        <h4
          key={`h-${key++}`}
          className="mt-6 flex items-center gap-2 text-base font-bold text-[var(--piclick-green-deep)] first:mt-0 sm:text-[1.05rem]"
        >
          <span className="inline-block h-3 w-1 rounded-full bg-[var(--piclick-gold)]" aria-hidden />
          {renderInline(h3[1])}
        </h4>,
      );
    } else {
      blocks.push(
        <p key={`p-${key++}`} className="my-3 leading-7 text-[var(--piclick-ink-muted)]">
          {renderInline(line)}
        </p>,
      );
    }
  }
  flushList();

  return <div className="text-sm sm:text-[0.95rem]">{blocks}</div>;
}
