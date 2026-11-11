"use client";

import { useMemo, useState } from "react";
import { Link } from "@/navigation";
import type { FaqCategory, FaqCategoryId, FaqItem } from "@/lib/faq";

type Labels = {
  searchPlaceholder: string;
  all: string;
  empty: string;
};

/**
 * FAQ 목록 — 검색어·분류로 거르고, 항목은 <details> 로 펼친다.
 * 모든 질문·답변은 처음부터 HTML 에 들어 있고(검색엔진용), 걸러진 항목은 hidden 으로만 숨긴다.
 */
export function FaqBrowser({ categories, items, labels }: { categories: FaqCategory[]; items: FaqItem[]; labels: Labels }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<FaqCategoryId | "all">("all");

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      new Set(
        items
          .filter((item) => (active === "all" || item.category === active) && (!q || `${item.q} ${item.a}`.toLowerCase().includes(q)))
          .map((item) => item.id),
      ),
    [items, active, q],
  );
  const countFor = (id: FaqCategoryId) => items.filter((item) => item.category === id).length;

  return (
    <div className="flex flex-col gap-5">
      <label className="relative block">
        <span className="sr-only">{labels.searchPlaceholder}</span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--rz-muted)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.searchPlaceholder}
          className="w-full rounded-2xl border border-[var(--rz-line-strong)] bg-[var(--rz-panel)] py-3.5 pl-11 pr-4 text-sm text-[var(--rz-text)] outline-none transition placeholder:text-[var(--rz-muted)] focus:border-[var(--rz-accent)]/60 focus:ring-2 focus:ring-[var(--rz-accent)]/20"
        />
      </label>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {[{ id: "all" as const, label: labels.all, icon: "" }, ...categories].map((cat) => {
          const on = active === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActive(cat.id)}
              aria-pressed={on}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                on
                  ? "border-[var(--rz-accent)] bg-[var(--rz-accent)] text-white shadow-[0_6px_16px_rgb(225_29_72_/_0.3)]"
                  : "border-[var(--rz-line-strong)] bg-[var(--rz-panel)] text-[var(--rz-muted)] hover:text-[var(--rz-text)]"
              }`}
            >
              {cat.icon ? <span aria-hidden>{cat.icon}</span> : null}
              {cat.label}
              <span className={`text-[10px] ${on ? "text-white/80" : "text-[var(--rz-muted)]/70"}`}>
                {cat.id === "all" ? items.length : countFor(cat.id)}
              </span>
            </button>
          );
        })}
      </div>

      {categories.map((cat) => {
        const catItems = items.filter((item) => item.category === cat.id);
        const shown = catItems.some((item) => visible.has(item.id));
        return (
          <section key={cat.id} id={`faq-${cat.id}`} hidden={!shown} className="scroll-mt-24">
            <h2 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-[var(--rz-text)]">
              <span
                aria-hidden
                className="grid h-6 w-6 place-items-center rounded-lg bg-[var(--rz-accent-soft)] text-xs text-[var(--rz-accent)]"
              >
                {cat.icon}
              </span>
              {cat.label}
            </h2>
            <div className="divide-y divide-[var(--rz-line)] overflow-hidden rounded-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)]">
              {catItems.map((item) => (
                <details
                  key={item.id}
                  id={`q-${item.id}`}
                  hidden={!visible.has(item.id)}
                  className="group"
                >
                  <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-4 text-sm font-medium text-[var(--rz-text)] transition hover:bg-[var(--rz-panel-2)] sm:px-5 [&::-webkit-details-marker]:hidden">
                    <span className="mt-px shrink-0 font-semibold text-[var(--rz-accent)]">Q</span>
                    <h3 className="min-w-0 flex-1 leading-relaxed">{item.q}</h3>
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rz-muted)] transition-transform duration-200 group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="flex gap-3 px-4 pb-4 sm:px-5">
                    <span className="shrink-0 text-sm font-semibold text-[var(--rz-muted)]">A</span>
                    <div className="min-w-0 text-sm leading-relaxed text-[var(--rz-muted)]">
                      <p>{item.a}</p>
                      {item.link ? (
                        <Link
                          href={item.link.href}
                          className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-[var(--rz-accent)] hover:underline"
                        >
                          {item.link.label} →
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </section>
        );
      })}

      {visible.size === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--rz-line-strong)] px-4 py-10 text-center text-sm text-[var(--rz-muted)]">
          {labels.empty}
        </p>
      ) : null}
    </div>
  );
}
