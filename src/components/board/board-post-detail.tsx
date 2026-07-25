"use client";

import { useMemo, useState } from "react";
import {
  buildCommentThreads,
  type BoardCommentView,
  type BoardPostSummary,
} from "@/lib/board-types";
import { BoardPostTypeBadge } from "@/components/board/board-post-type-badge";
import { Spinner } from "@/components/ui/spinner";
import { Heart, MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  post: BoardPostSummary;
  comments: BoardCommentView[];
  myAuthId: string | null;
  commentDraft: string;
  replyToId: string | null;
  onBack: () => void;
  onEditPost: () => void;
  onDeletePost: () => void;
  onToggleLike: () => void;
  onCommentDraftChange: (value: string) => void;
  onReplyTo: (commentId: string | null) => void;
  onCreateComment: () => void;
  onUpdateComment: (commentId: string, content: string) => Promise<void> | void;
  onDeleteComment: (commentId: string) => void;
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

function CommentItem({
  comment,
  depth,
  myAuthId,
  replyToId,
  onReplyTo,
  onUpdateComment,
  onDeleteComment,
}: {
  comment: BoardCommentView;
  depth: 0 | 1;
  myAuthId: string | null;
  replyToId: string | null;
  onReplyTo: (commentId: string | null) => void;
  onUpdateComment: (commentId: string, content: string) => Promise<void> | void;
  onDeleteComment: (commentId: string) => void;
}) {
  const t = useTranslations("board");
  const locale = useLocale() as AppLocale;
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);
  const isMine = myAuthId === comment.author_auth_id;
  const isReplying = replyToId === comment.id;

  const saveEdit = async () => {
    const next = editDraft.trim();
    if (!next) return;
    setIsSaving(true);
    try {
      await onUpdateComment(comment.id, next);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`rounded-xl border border-[var(--piclick-line)] bg-[var(--piclick-beige-soft)]/60 p-3.5 sm:p-4 ${
        depth === 1 ? "ml-4 border-l-2 border-l-[var(--piclick-green)]/30 sm:ml-8" : "bg-white"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--piclick-ink-muted)]">
          <span className="font-medium text-[var(--piclick-ink)]">{comment.author_nickname}</span>
          <span className="mx-1.5 text-[var(--piclick-line)]">·</span>
          {formatDate(comment.created_at, locale)}
        </p>
        <div className="flex items-center gap-2">
          {depth === 0 ? (
            <button
              type="button"
              onClick={() => onReplyTo(isReplying ? null : comment.id)}
              className="text-xs font-medium text-[var(--piclick-green)] transition hover:text-[var(--piclick-green-deep)]"
            >
              {isReplying ? t("cancelReply") : t("reply")}
            </button>
          ) : null}
          {isMine ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditDraft(comment.content);
                  setIsEditing((prev) => !prev);
                }}
                className="text-xs text-[var(--piclick-ink-muted)] hover:text-[var(--piclick-ink)]"
              >
                {t("edit")}
              </button>
              <button
                type="button"
                onClick={() => onDeleteComment(comment.id)}
                className="text-xs text-red-600/80 hover:text-red-700"
              >
                {t("delete")}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editDraft}
            onChange={(event) => setEditDraft(event.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full rounded-lg border border-[var(--piclick-line)] bg-white px-3 py-2 text-sm text-[var(--piclick-ink)] outline-none focus:border-[var(--piclick-green)]/50"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
                onClick={() => setIsEditing(false)}
                className="pk-btn pk-btn-xs pk-btn-ghost font-medium"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void saveEdit()}
              className="pk-btn pk-btn-xs pk-btn-primary"
            >
              {isSaving ? <Spinner size="sm" /> : null}
              {t("save")}
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--piclick-ink)]">{comment.content}</p>
      )}
    </div>
  );
}

export function BoardPostDetail({
  post,
  comments,
  myAuthId,
  commentDraft,
  replyToId,
  onBack,
  onEditPost,
  onDeletePost,
  onToggleLike,
  onCommentDraftChange,
  onReplyTo,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
}: Props) {
  const t = useTranslations("board");
  const locale = useLocale() as AppLocale;
  const threads = useMemo(() => buildCommentThreads(comments), [comments]);
  const replyTarget = replyToId ? comments.find((c) => c.id === replyToId) : null;
  const isMine = myAuthId === post.author_auth_id;

  return (
    <article className="space-y-5">
      <div className="rounded-2xl border border-[var(--piclick-line)] bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={onBack}
              className="mb-3 text-xs font-medium text-[var(--piclick-ink-muted)] transition hover:text-[var(--piclick-green-deep)]"
            >
              ← {t("backToList")}
            </button>
            <div className="mb-2">
              <BoardPostTypeBadge type={post.post_type} />
            </div>
            <h2 className="text-balance text-xl font-semibold tracking-tight text-[var(--piclick-ink)] sm:text-2xl">
              {post.title}
            </h2>
            <p className="mt-2 text-xs text-[var(--piclick-ink-muted)] sm:text-sm">
              <span className="font-medium text-[var(--piclick-ink)]">{post.author_nickname}</span>
              <span className="mx-1.5">·</span>
              {formatDate(post.created_at, locale)}
            </p>
          </div>
          {isMine ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onEditPost}
                className="pk-btn pk-btn-xs pk-btn-neutral font-medium"
              >
                {t("edit")}
              </button>
              <button
                type="button"
                onClick={onDeletePost}
                className="pk-btn pk-btn-xs pk-btn-danger font-medium"
              >
                {t("delete")}
              </button>
            </div>
          ) : null}
        </div>

        <div
          className="board-prose mt-6 border-t border-[var(--piclick-line)] pt-6 text-sm leading-7 text-[var(--piclick-ink)]"
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--piclick-line)] pt-4">
          <button
            type="button"
            onClick={onToggleLike}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              post.liked_by_me
                ? "border-[var(--piclick-green)]/40 bg-[var(--piclick-green)]/10 text-[var(--piclick-green-deep)]"
                : "border-[var(--piclick-line)] bg-white text-[var(--piclick-ink)] hover:border-[var(--piclick-green)]/30"
            }`}
          >
            <Heart
              className={`h-4 w-4 ${post.liked_by_me ? "fill-[var(--piclick-green)] text-[var(--piclick-green)]" : ""}`}
              strokeWidth={1.75}
              aria-hidden
            />
            {post.liked_by_me ? t("unlike") : t("like")} · {post.like_count}
          </button>
          <span className="inline-flex items-center gap-1.5 text-sm text-[var(--piclick-ink-muted)]">
            <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            {t("commentCount", { count: comments.length })}
          </span>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--piclick-line)] bg-white p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-[var(--piclick-ink)]">{t("comments")}</h3>

        <div className="mt-4 space-y-2">
          {replyTarget ? (
            <p className="text-xs text-[var(--piclick-green)]">
              {t("replyingTo", { name: replyTarget.author_nickname })}
              <button type="button" onClick={() => onReplyTo(null)} className="ml-2 underline">
                {t("cancelReply")}
              </button>
            </p>
          ) : null}
          <textarea
            value={commentDraft}
            onChange={(event) => onCommentDraftChange(event.target.value)}
            rows={3}
            maxLength={1000}
            placeholder={replyTarget ? t("replyPlaceholder") : t("commentPlaceholder")}
            className="w-full rounded-xl border border-[var(--piclick-line)] bg-[var(--piclick-beige-soft)]/50 px-3.5 py-3 text-sm text-[var(--piclick-ink)] outline-none placeholder:text-[var(--piclick-ink-muted)] focus:border-[var(--piclick-green)]/40 focus:bg-white"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onCreateComment}
              className="pk-btn pk-btn-md pk-btn-primary"
            >
              {replyTarget ? t("submitReply") : t("submitComment")}
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {threads.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--piclick-ink-muted)]">{t("noComments")}</p>
          ) : (
            threads.map((thread) => (
              <div key={thread.id} className="space-y-2">
                <CommentItem
                  comment={thread}
                  depth={0}
                  myAuthId={myAuthId}
                  replyToId={replyToId}
                  onReplyTo={onReplyTo}
                  onUpdateComment={onUpdateComment}
                  onDeleteComment={onDeleteComment}
                />
                {thread.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    depth={1}
                    myAuthId={myAuthId}
                    replyToId={replyToId}
                    onReplyTo={onReplyTo}
                    onUpdateComment={onUpdateComment}
                    onDeleteComment={onDeleteComment}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </section>
    </article>
  );
}
