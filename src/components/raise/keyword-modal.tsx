"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { MAX_KEYWORD_LENGTH, MAX_KEYWORDS, type KeywordResult, type SearchKeyword } from "@/hooks/use-search-keywords";

type Props = {
  open: boolean;
  keywords: SearchKeyword[];
  onAdd: (keyword: string) => Promise<KeywordResult>;
  onRemove: (id: number) => Promise<KeywordResult>;
  onClose: () => void;
};

/** 검색 키워드 추가·삭제 (로그인 사용자, 계정에 저장) — 추가한 키워드는 검색창 아래 버튼으로 생긴다 */
export function KeywordModal({ open, keywords, onAdd, onRemove, onClose }: Props) {
  const t = useTranslations("video");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 열 때마다 입력칸 비우기 (렌더 중 조정)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setInput("");
      setNote(null);
    }
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const focus = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(focus);
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = input.replace(/\s+/g, " ").trim();
    if (!keyword) {
      setNote({ kind: "error", text: t("keywords.empty") });
      return;
    }
    if (keywords.some((k) => k.keyword.toLowerCase() === keyword.toLowerCase())) {
      setNote({ kind: "error", text: t("keywords.duplicate") });
      return;
    }
    if (keywords.length >= MAX_KEYWORDS) {
      setNote({ kind: "error", text: t("keywords.full", { max: MAX_KEYWORDS }) });
      return;
    }
    setBusy(true);
    const result = await onAdd(keyword);
    setBusy(false);
    if (result.ok) {
      setNote({ kind: "ok", text: t("keywords.added", { keyword }) });
      setInput("");
    } else {
      setNote({ kind: "error", text: result.error || t("keywords.failed") });
    }
  };

  const remove = async (id: number) => {
    setRemovingId(id);
    const result = await onRemove(id);
    setRemovingId(null);
    setNote(result.ok ? null : { kind: "error", text: result.error || t("keywords.failed") });
  };

  return (
    <div
      className="raise-app fixed inset-0 z-[300] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("keywords.title")}
        className="w-full max-w-md rounded-t-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-[var(--rz-text)] shadow-[var(--rz-shadow)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <p className="text-base font-semibold">{t("keywords.title")}</p>
          <button type="button" onClick={onClose} aria-label={t("filters.close")} className="text-xl leading-none text-[var(--rz-muted)]">
            ×
          </button>
        </div>
        <p className="mb-4 text-xs leading-5 text-[var(--rz-muted)]">{t("keywords.help")}</p>

        <form onSubmit={(e) => void submit(e)} className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setNote(null);
            }}
            maxLength={MAX_KEYWORD_LENGTH}
            placeholder={t("keywords.placeholder")}
            className="min-w-0 flex-1 rounded-lg border border-[var(--rz-line-strong)] bg-[var(--rz-bg)] px-3 py-2.5 text-sm outline-none transition placeholder:text-[var(--rz-muted)] focus:border-[var(--rz-accent)]/60"
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-lg bg-[var(--rz-accent)] px-4 py-2.5 text-sm font-medium text-[var(--rz-accent-fg)] transition hover:brightness-110 disabled:opacity-60"
          >
            {t("keywords.add")}
          </button>
        </form>
        {note ? (
          <p className={`mt-2 text-xs ${note.kind === "ok" ? "text-emerald-400" : "text-[var(--rz-up)]"}`}>{note.text}</p>
        ) : null}

        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-[var(--rz-muted)]">
            {t("keywords.listTitle")}{" "}
            <span className="tabular-nums">
              {keywords.length}/{MAX_KEYWORDS}
            </span>
          </p>
          {keywords.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--rz-line-strong)] px-3 py-5 text-center text-xs text-[var(--rz-muted)]">
              {t("keywords.none")}
            </p>
          ) : (
            <ul className="max-h-60 divide-y divide-[var(--rz-line)] overflow-y-auto rounded-lg border border-[var(--rz-line)]">
              {keywords.map((k) => (
                <li key={k.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="min-w-0 truncate text-sm">{k.keyword}</span>
                  <button
                    type="button"
                    onClick={() => void remove(k.id)}
                    disabled={removingId === k.id}
                    aria-label={t("keywords.remove", { keyword: k.keyword })}
                    className="shrink-0 rounded-md border border-[var(--rz-line)] px-2.5 py-1 text-xs text-[var(--rz-muted)] transition hover:border-[var(--rz-up)]/50 hover:text-[var(--rz-up)] disabled:opacity-50"
                  >
                    {t("keywords.delete")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--rz-line)] px-5 py-2 text-sm text-[var(--rz-muted)] transition hover:text-[var(--rz-text)]"
          >
            {t("keywords.done")}
          </button>
        </div>
      </div>
    </div>
  );
}
