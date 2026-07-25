"use client";

import type { BoardPostSummary } from "@/lib/board-types";
import { BoardPostTypeBadge } from "@/components/board/board-post-type-badge";
import { Heart, MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  posts: BoardPostSummary[];
  onSelect: (postId: string) => void;
  emptyMessage?: string;
};

function localeToIntl(locale: AppLocale) {
  if (locale === "ko") return "ko-KR";
  if (locale === "ja") return "ja-JP";
  return "en-US";
}

function formatDate(value: string, locale: AppLocale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(localeToIntl(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function BoardPostList({ posts, onSelect, emptyMessage }: Props) {
  const t = useTranslations("board");
  const locale = useLocale() as AppLocale;

  if (posts.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--piclick-line)] bg-white/60 px-6 py-14 text-center text-sm text-[var(--piclick-ink-muted)]">
        {emptyMessage ?? t("empty")}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--piclick-line)] overflow-hidden rounded-2xl border border-[var(--piclick-line)] bg-white">
      {posts.map((post) => {
        const preview = stripHtml(post.content_html);
        return (
          <li key={post.id}>
            <button
              type="button"
              onClick={() => onSelect(post.id)}
              className="group flex w-full flex-col gap-2 px-4 py-4 text-left transition hover:bg-[var(--piclick-beige-soft)] sm:px-5 sm:py-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5">
                    <BoardPostTypeBadge type={post.post_type} />
                  </div>
                  <h3 className="truncate text-base font-semibold tracking-tight text-[var(--piclick-ink)] group-hover:text-[var(--piclick-green-deep)]">
                    {post.title}
                  </h3>
                </div>
                <time className="shrink-0 pt-0.5 text-[11px] text-[var(--piclick-ink-muted)] sm:text-xs">
                  {formatDate(post.created_at, locale)}
                </time>
              </div>
              {preview ? (
                <p className="line-clamp-2 text-sm leading-relaxed text-[var(--piclick-ink-muted)]">{preview}</p>
              ) : null}
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--piclick-ink-muted)]">
                <span className="font-medium text-[var(--piclick-ink)]/80">{post.author_nickname}</span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                  {post.comment_count}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Heart
                    className={`h-3.5 w-3.5 ${post.liked_by_me ? "fill-[var(--piclick-green)] text-[var(--piclick-green)]" : ""}`}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  {post.like_count}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
