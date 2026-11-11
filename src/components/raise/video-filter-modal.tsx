"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_FILTERS,
  LENGTH_OPTIONS,
  ORDER_OPTIONS,
  UPLOADED_OPTIONS,
  sameFilters,
  saveDefaultVideoFilters,
  type VideoFilters,
} from "@/lib/video-filters";

type Props = {
  open: boolean;
  value: VideoFilters;
  savedDefault: VideoFilters;
  onApply: (filters: VideoFilters) => void;
  onClose: () => void;
};

function OptionGroup<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-[var(--rz-muted)]">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-lg border px-3 py-2 text-sm transition ${
              value === o.value
                ? "border-[var(--rz-accent)]/50 bg-[var(--rz-accent-soft)] text-[var(--rz-text)]"
                : "border-[var(--rz-line)] text-[var(--rz-muted)] hover:border-[var(--rz-line-strong)] hover:text-[var(--rz-text)]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function VideoFilterModal({ open, value, savedDefault, onApply, onClose }: Props) {
  const [draft, setDraft] = useState<VideoFilters>(value);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  // 열 때마다 현재 적용된 값에서 시작 (렌더 중 조정)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(value);
      setSavedNote(null);
    }
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isSavedDefault = sameFilters(draft, savedDefault);

  return (
    <div
      className="raise-app fixed inset-0 z-[300] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="영상 필터"
        className="w-full max-w-md rounded-t-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-[var(--rz-text)] shadow-[var(--rz-shadow)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <p className="text-base font-semibold">필터</p>
          <button type="button" onClick={onClose} aria-label="닫기" className="text-xl leading-none text-[var(--rz-muted)]">
            ×
          </button>
        </div>

        <div className="space-y-5">
          <OptionGroup title="정렬" options={ORDER_OPTIONS} value={draft.order} onChange={(order) => setDraft((d) => ({ ...d, order }))} />
          <OptionGroup
            title="업로드 날짜"
            options={UPLOADED_OPTIONS}
            value={draft.uploaded}
            onChange={(uploaded) => setDraft((d) => ({ ...d, uploaded }))}
          />
          <OptionGroup title="영상 길이" options={LENGTH_OPTIONS} value={draft.length} onChange={(length) => setDraft((d) => ({ ...d, length }))} />
        </div>

        <p className="mt-5 text-[11px] leading-5 text-[var(--rz-muted)]">
          불러온 영상 안에서 걸러 보여 줘요. 기본값으로 저장하면 이 브라우저에서 다음에도 이 설정으로 열려요.
        </p>
        {savedNote ? <p className="mt-1 text-xs text-emerald-400">{savedNote}</p> : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDraft(DEFAULT_FILTERS)}
              className="rounded-lg px-3 py-2 text-sm text-[var(--rz-muted)] hover:text-[var(--rz-text)]"
            >
              초기화
            </button>
            <button
              type="button"
              disabled={isSavedDefault}
              onClick={() => {
                saveDefaultVideoFilters(sameFilters(draft, DEFAULT_FILTERS) ? null : draft);
                setSavedNote("기본값으로 저장했어요.");
              }}
              className="rounded-lg border border-[var(--rz-line)] px-3 py-2 text-sm text-[var(--rz-muted)] transition hover:text-[var(--rz-text)] disabled:opacity-40"
            >
              {isSavedDefault ? "기본값과 같음" : "기본값으로 저장"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="rounded-lg bg-[var(--rz-accent)] px-5 py-2 text-sm font-medium text-[var(--rz-accent-fg)] transition hover:brightness-110"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
