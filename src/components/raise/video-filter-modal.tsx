"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { FavoriteChannel } from "@/hooks/use-favorite-channels";
import type { SearchKeyword } from "@/hooks/use-search-keywords";
import {
  DEFAULT_FILTERS,
  LENGTH_OPTIONS,
  ORDER_OPTIONS,
  UPLOADED_OPTIONS,
  sameFilters,
  type VideoFilters,
} from "@/lib/video-filters";

/** 한 번에 고를 수 있는 개수 (키워드마다 검색 1번, 채널마다 영상 목록 1번을 부르므로 제한) */
export const MAX_SELECTED_KEYWORDS = 5;
export const MAX_SELECTED_CHANNELS = 10;

export type VideoSelection = { filters: VideoFilters; keywords: string[]; channels: string[] };

type Props = {
  open: boolean;
  value: VideoSelection;
  savedDefault: VideoFilters;
  loggedIn: boolean;
  keywords: SearchKeyword[];
  channels: FavoriteChannel[];
  /** 기본값 저장. 비로그인이면 로그인 창을 띄우고 "login" */
  onSaveDefault: (filters: VideoFilters) => Promise<"saved" | "login" | "failed">;
  /** 비로그인 사용자가 채널·키워드를 쓰려 할 때 */
  onRequireLogin: () => void;
  onManageKeywords: () => void;
  onManageChannels: () => void;
  onApply: (selection: VideoSelection) => void;
  onClose: () => void;
};

function OptionGroup<T extends string>({
  title,
  options,
  label,
  value,
  onChange,
}: {
  title: string;
  options: Array<{ value: T }>;
  /** 옵션 값 → 화면 라벨 (현재 언어) */
  label: (value: T) => string;
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
            {label(o.value)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

/** 체크박스 한 줄 (복수 선택) */
function CheckRow({
  checked,
  disabled,
  onChange,
  children,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition hover:bg-[var(--rz-panel-2)] ${
        disabled && !checked ? "cursor-not-allowed opacity-40" : ""
      }`}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled && !checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--rz-accent)]/40 ${
          checked ? "border-[var(--rz-accent)] bg-[var(--rz-accent)] text-white" : "border-[var(--rz-line-strong)] text-transparent"
        }`}
      >
        <CheckIcon />
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
    </label>
  );
}

function SectionHeader({ title, count, onAdd, addLabel }: { title: string; count: string; onAdd: () => void; addLabel: string }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <p className="text-xs font-medium text-[var(--rz-muted)]">
        {title} <span className="tabular-nums">{count}</span>
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-[var(--rz-line-strong)] px-2 py-1 text-[11px] text-[var(--rz-muted)] transition hover:border-[var(--rz-accent)]/50 hover:text-[var(--rz-text)]"
      >
        <span aria-hidden className="text-[13px] font-semibold leading-none">
          +
        </span>
        {addLabel}
      </button>
    </div>
  );
}

export function VideoFilterModal({
  open,
  value,
  savedDefault,
  loggedIn,
  keywords,
  channels,
  onSaveDefault,
  onRequireLogin,
  onManageKeywords,
  onManageChannels,
  onApply,
  onClose,
}: Props) {
  const t = useTranslations("video");
  const [draft, setDraft] = useState<VideoSelection>(value);
  const [saving, setSaving] = useState(false);

  // 열 때마다 현재 적용된 값에서 시작 (렌더 중 조정)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      // 위에 키워드·채널 관리 창이 열려 있으면 그 창만 닫히게 둔다
      if (e.key === "Escape" && document.querySelectorAll('[role="dialog"][aria-modal="true"]').length <= 1) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  // 목록에서 지워진 항목은 선택에서도 뺀다
  const keywordSet = new Set(keywords.map((k) => k.keyword));
  const channelSet = new Set(channels.map((c) => c.id));
  const selKeywords = draft.keywords.filter((k) => keywordSet.has(k));
  const selChannels = draft.channels.filter((c) => channelSet.has(c));

  const isSavedDefault = sameFilters(draft.filters, savedDefault);
  const setFilters = (patch: Partial<VideoFilters>) => setDraft((d) => ({ ...d, filters: { ...d.filters, ...patch } }));
  const toggle = (kind: "keywords" | "channels", id: string, on: boolean) =>
    setDraft((d) => ({ ...d, [kind]: on ? [...d[kind].filter((x) => x !== id), id] : d[kind].filter((x) => x !== id) }));
  const isPristine = sameFilters(draft.filters, DEFAULT_FILTERS) && selKeywords.length === 0 && selChannels.length === 0;

  return (
    <div
      className="raise-app fixed inset-0 z-[300] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("filters.dialogLabel")}
        className="flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] pb-[max(1rem,env(safe-area-inset-bottom))] text-[var(--rz-text)] shadow-[var(--rz-shadow)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <p className="text-base font-semibold">{t("filters.title")}</p>
          <button type="button" onClick={onClose} aria-label={t("filters.close")} className="text-xl leading-none text-[var(--rz-muted)]">
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 pb-2">
          {/* 채널 (복수 선택) */}
          <section>
            {loggedIn ? (
              <>
                <SectionHeader
                  title={t("filters.channelsTitle")}
                  count={`${selChannels.length}/${Math.min(MAX_SELECTED_CHANNELS, channels.length) || 0}`}
                  onAdd={onManageChannels}
                  addLabel={t("filters.addChannel")}
                />
                {channels.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[var(--rz-line-strong)] px-3 py-3 text-xs text-[var(--rz-muted)]">
                    {t("filters.noChannels")}
                  </p>
                ) : (
                  <div className="max-h-44 overflow-y-auto overscroll-contain rounded-lg border border-[var(--rz-line)] p-1">
                    {channels.map((c) => (
                      <CheckRow
                        key={c.id}
                        checked={selChannels.includes(c.id)}
                        disabled={selChannels.length >= MAX_SELECTED_CHANNELS}
                        onChange={(on) => toggle("channels", c.id, on)}
                      >
                        {c.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.thumbnail} alt="" width={22} height={22} className="h-[22px] w-[22px] shrink-0 rounded-full" />
                        ) : (
                          <span className="h-[22px] w-[22px] shrink-0 rounded-full bg-[var(--rz-panel-2)]" />
                        )}
                        <span className="truncate">{c.title}</span>
                      </CheckRow>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </section>

          {/* 키워드 (복수 선택) */}
          <section>
            {loggedIn ? (
              <>
                <SectionHeader
                  title={t("filters.keywordsTitle")}
                  count={`${selKeywords.length}/${Math.min(MAX_SELECTED_KEYWORDS, keywords.length) || 0}`}
                  onAdd={onManageKeywords}
                  addLabel={t("filters.addKeyword")}
                />
                {keywords.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[var(--rz-line-strong)] px-3 py-3 text-xs text-[var(--rz-muted)]">
                    {t("filters.noKeywords")}
                  </p>
                ) : (
                  <div className="max-h-44 overflow-y-auto overscroll-contain rounded-lg border border-[var(--rz-line)] p-1">
                    {keywords.map((k) => (
                      <CheckRow
                        key={k.id}
                        checked={selKeywords.includes(k.keyword)}
                        disabled={selKeywords.length >= MAX_SELECTED_KEYWORDS}
                        onChange={(on) => toggle("keywords", k.keyword, on)}
                      >
                        <span className="truncate"># {k.keyword}</span>
                      </CheckRow>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={onRequireLogin}
                className="w-full rounded-lg border border-dashed border-[var(--rz-line-strong)] px-3 py-3 text-left text-xs text-[var(--rz-muted)] transition hover:text-[var(--rz-text)]"
              >
                {t("filters.loginForPersonal")}
              </button>
            )}
          </section>

          {loggedIn && (selChannels.length || selKeywords.length) ? (
            <p className="text-[11px] leading-5 text-[var(--rz-muted)]">{t("filters.selectionHelp")}</p>
          ) : null}

          <OptionGroup
            title={t("filters.orderTitle")}
            options={ORDER_OPTIONS}
            label={(v) => t(`filters.order.${v}`)}
            value={draft.filters.order}
            onChange={(order) => setFilters({ order })}
          />
          <OptionGroup
            title={t("filters.uploadedTitle")}
            options={UPLOADED_OPTIONS}
            label={(v) => t(`filters.uploaded.${v}`)}
            value={draft.filters.uploaded}
            onChange={(uploaded) => setFilters({ uploaded })}
          />
          <OptionGroup
            title={t("filters.lengthTitle")}
            options={LENGTH_OPTIONS}
            label={(v) => t(`filters.length.${v}`)}
            value={draft.filters.length}
            onChange={(length) => setFilters({ length })}
          />

          <p className="text-[11px] leading-5 text-[var(--rz-muted)]">{t("filters.help")}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--rz-line)] px-5 pt-3">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPristine}
              onClick={() => setDraft({ filters: DEFAULT_FILTERS, keywords: [], channels: [] })}
              aria-label={t("filters.resetAll")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--rz-line)] px-3 py-2 text-sm text-[var(--rz-muted)] transition hover:text-[var(--rz-text)] disabled:opacity-40"
            >
              <ResetIcon />
              {t("filters.reset")}
            </button>
            <button
              type="button"
              disabled={loggedIn && (isSavedDefault || saving)}
              onClick={async () => {
                setSaving(true);
                const result = await onSaveDefault(draft.filters);
                setSaving(false);
                // 비로그인: 이 창을 닫아 로그인 창이 보이게
                if (result === "login") onClose();
              }}
              className="rounded-lg border border-[var(--rz-line)] px-3 py-2 text-sm text-[var(--rz-muted)] transition hover:text-[var(--rz-text)] disabled:opacity-40"
            >
              {!loggedIn ? t("filters.saveDefaultLogin") : isSavedDefault ? t("filters.sameAsDefault") : t("filters.saveDefault")}
            </button>
          </div>
          <button
            type="button"
            onClick={() => onApply({ filters: draft.filters, keywords: selKeywords, channels: selChannels })}
            className="rounded-lg bg-[var(--rz-accent)] px-5 py-2 text-sm font-medium text-[var(--rz-accent-fg)] transition hover:brightness-110"
          >
            {t("filters.apply")}
          </button>
        </div>
      </div>
    </div>
  );
}
