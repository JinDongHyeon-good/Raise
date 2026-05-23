"use client";

import { parseTarotReading, type ReadingSection } from "@/lib/tarot-reading-format";

function ReadingTreeSection({
  section,
  isLast,
}: {
  section: ReadingSection;
  isLast: boolean;
}) {
  return (
    <div className="relative flex gap-3">
      {!isLast ? (
        <span
          className="absolute left-[10px] top-7 bottom-0 w-px bg-gradient-to-b from-rose-200 to-rose-100"
          aria-hidden
        />
      ) : null}

      <div
        className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-white text-[10px] font-bold text-rose-600 shadow-sm"
        aria-hidden
      >
        {section.number}
      </div>

      <div className="min-w-0 flex-1 pb-5">
        <h4 className="text-sm font-semibold tracking-tight text-rose-900">{section.title}</h4>

        {section.content ? (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{section.content}</p>
        ) : null}

        {section.items.length > 0 ? (
          <ul className="mt-3 space-y-2" role="list">
            {section.items.map((item, index) => (
              <li key={`${section.id}-item-${index}`} className="relative pl-4">
                <span
                  className="absolute left-0 top-[0.55rem] h-1.5 w-1.5 rounded-full bg-rose-300"
                  aria-hidden
                />
                <span className="block text-sm leading-relaxed text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export function TarotReadingView({ text }: { text: string }) {
  const parsed = parseTarotReading(text);

  if (!parsed) {
    return (
      <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{text.trim()}</div>
    );
  }

  const { summary, sections } = parsed;

  return (
    <div className="space-y-5">
      {summary ? (
        <div className="rounded-xl border border-rose-200/90 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-4 shadow-sm shadow-rose-100/40">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-500">한 줄 요약</p>
          <p className="mt-2 text-pretty text-sm font-medium leading-relaxed text-rose-950 sm:text-base">
            {summary}
          </p>
        </div>
      ) : null}

      {sections.length > 0 ? (
        <div className="rounded-xl border border-rose-100 bg-white/80 p-3 shadow-sm sm:p-4">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-rose-400">상세 리딩</p>
          <div>
            {sections.map((section, index) => (
              <ReadingTreeSection
                key={section.id}
                section={section}
                isLast={index === sections.length - 1}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
