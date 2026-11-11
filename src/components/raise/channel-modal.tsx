"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { FavoriteChannel } from "@/hooks/use-favorite-channels";

type Candidate = FavoriteChannel & { subscriberCount: number | null; handle: string | null };

type Props = {
  open: boolean;
  channels: FavoriteChannel[];
  busyId: string | null;
  error: string | null;
  isFavorite: (channelId: string) => boolean;
  onToggle: (channelId: string) => Promise<void>;
  onClose: () => void;
};

function formatSubs(n: number | null, locale: string) {
  if (n === null) return null;
  return new Intl.NumberFormat(locale === "ko" ? "ko-KR" : "en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function Avatar({ src }: { src: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-8 w-8 shrink-0 rounded-full bg-[var(--rz-panel-2)]" />
  ) : (
    <span className="h-8 w-8 shrink-0 rounded-full bg-[var(--rz-panel-2)]" />
  );
}

/** 채널 추가·삭제 (로그인 사용자) — 추가한 채널은 검색창 아래 버튼으로 생기고, 누르면 그 채널 영상만 보인다 */
export function ChannelModal({ open, channels, busyId, error, isFavorite, onToggle, onClose }: Props) {
  const t = useTranslations("video");
  const locale = useLocale();
  const [input, setInput] = useState("");
  const [results, setResults] = useState<Candidate[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 열 때마다 초기화 (렌더 중 조정)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setInput("");
      setResults(null);
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

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) {
      setNote(t("channels.empty"));
      return;
    }
    setSearching(true);
    setNote(null);
    try {
      const res = await fetch(`/api/youtube/channels/lookup?q=${encodeURIComponent(q)}`, { headers: { "x-ui-locale": locale } });
      const data = (await res.json().catch(() => ({}))) as { items?: Candidate[]; error?: string };
      if (!res.ok) {
        setResults(null);
        setNote(data.error ?? t("channels.failed"));
        return;
      }
      setResults(data.items ?? []);
      if (!data.items?.length) setNote(t("channels.notFound"));
    } catch {
      setNote(t("channels.failed"));
    } finally {
      setSearching(false);
    }
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
        aria-label={t("channels.title")}
        className="flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-2xl border border-[var(--rz-line)] bg-[var(--rz-panel)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-[var(--rz-text)] shadow-[var(--rz-shadow)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <p className="text-base font-semibold">{t("channels.title")}</p>
          <button type="button" onClick={onClose} aria-label={t("filters.close")} className="text-xl leading-none text-[var(--rz-muted)]">
            ×
          </button>
        </div>
        <p className="mb-4 text-xs leading-5 text-[var(--rz-muted)]">{t("channels.help")}</p>

        <form onSubmit={(e) => void search(e)} className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setNote(null);
            }}
            maxLength={200}
            placeholder={t("channels.placeholder")}
            className="min-w-0 flex-1 rounded-lg border border-[var(--rz-line-strong)] bg-[var(--rz-bg)] px-3 py-2.5 text-sm outline-none transition placeholder:text-[var(--rz-muted)] focus:border-[var(--rz-accent)]/60"
          />
          <button
            type="submit"
            disabled={searching}
            className="shrink-0 rounded-lg bg-[var(--rz-accent)] px-4 py-2.5 text-sm font-medium text-[var(--rz-accent-fg)] transition hover:brightness-110 disabled:opacity-60"
          >
            {searching ? t("channels.searching") : t("channels.search")}
          </button>
        </form>
        {note || error ? <p className="mt-2 text-xs text-[var(--rz-up)]">{note ?? error}</p> : null}

        <div className="mt-3 min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain">
          {results?.length ? (
            <ul className="divide-y divide-[var(--rz-line)] rounded-lg border border-[var(--rz-line)]">
              {results.map((c) => {
                const added = isFavorite(c.id);
                const subs = formatSubs(c.subscriberCount, locale);
                return (
                  <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                    <Avatar src={c.thumbnail} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{c.title}</p>
                      <p className="truncate text-[11px] text-[var(--rz-muted)]">
                        {[c.handle, subs ? t("channels.subscribers", { count: subs }) : null].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={added || busyId === c.id}
                      onClick={() => void onToggle(c.id)}
                      className="shrink-0 rounded-md bg-[var(--rz-accent)] px-3 py-1.5 text-xs font-medium text-[var(--rz-accent-fg)] transition hover:brightness-110 disabled:bg-[var(--rz-panel-2)] disabled:text-[var(--rz-muted)]"
                    >
                      {added ? t("channels.added") : t("channels.add")}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <div>
            <p className="mb-2 text-xs font-medium text-[var(--rz-muted)]">
              {t("channels.listTitle")} <span className="tabular-nums">{channels.length}</span>
            </p>
            {channels.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[var(--rz-line-strong)] px-3 py-5 text-center text-xs text-[var(--rz-muted)]">
                {t("channels.none")}
              </p>
            ) : (
              <ul className="divide-y divide-[var(--rz-line)] rounded-lg border border-[var(--rz-line)]">
                {channels.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-3 py-2">
                    <Avatar src={c.thumbnail} />
                    <span className="min-w-0 flex-1 truncate text-sm">{c.title}</span>
                    <button
                      type="button"
                      onClick={() => void onToggle(c.id)}
                      disabled={busyId === c.id}
                      aria-label={t("unfavoriteChannel", { channel: c.title })}
                      className="shrink-0 rounded-md border border-[var(--rz-line)] px-2.5 py-1 text-xs text-[var(--rz-muted)] transition hover:border-[var(--rz-up)]/50 hover:text-[var(--rz-up)] disabled:opacity-50"
                    >
                      {t("keywords.delete")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
