"use client";

import { useTranslations } from "next-intl";
import { parseTarotReading, type ReadingSection } from "@/lib/tarot-reading-format";

function ReadingSectionBlock({
  section,
  showDivider,
}: {
  section: ReadingSection;
  showDivider: boolean;
}) {
  return (
    <article className={showDivider ? "border-t border-slate-100 pt-4" : undefined}>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold leading-snug text-slate-900">{section.title}</h4>

        {section.content ? (
          <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {section.content}
          </p>
        ) : null}

        {section.items.length > 0 ? (
          <ul className="mt-3 space-y-2" role="list">
            {section.items.map((item, index) => (
              <li
                key={`${section.id}-item-${index}`}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                <span className="min-w-0 flex-1 break-words">{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

export function TarotReadingView({ text }: { text: string }) {
  const t = useTranslations("tarot");
  const parsed = parseTarotReading(text);

  if (!parsed) {
    return (
      <div className="min-w-0 break-words whitespace-pre-wrap text-sm leading-7 text-slate-700">
        {text.trim()}
      </div>
    );
  }

  const { summary, sections } = parsed;

  return (
    <div className="tarot-reading-result min-w-0 space-y-4">
      {summary ? (
        <div className="border-l-2 border-slate-300 pl-3 sm:pl-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t("readingSummary")}</p>
          <p className="mt-1.5 break-words text-pretty text-sm font-medium leading-7 text-slate-900 sm:text-[15px]">
            {summary}
          </p>
        </div>
      ) : null}

      {sections.length > 0 ? (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <ReadingSectionBlock
              key={section.id}
              section={section}
              showDivider={index > 0 || Boolean(summary)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
