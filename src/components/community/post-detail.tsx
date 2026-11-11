"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { PostTypeBadge } from "@/components/community/post-type-badge";
import { formatDateTime, formatNumber, timeAgo } from "@/lib/community-format";
import {
  BOARD_POST_TYPE_LABELS,
  buildCommentThreads,
  type BoardCommentView,
  type BoardPostSummary,
} from "@/lib/board-types";

type Detail = { item: BoardPostSummary; comments: BoardCommentView[] };

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

export function PostDetail({ postId }: { postId: string }) {
  const router = useRouter();
  const { me, requireLogin } = useAuth();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const viewSent = useRef(false);
  /** 조회수 등록 응답 (글 로딩보다 먼저 올 수 있어서 따로 보관) */
  const [registeredViews, setRegisteredViews] = useState<number | null>(null);

  const load = async () => {
    const { ok, data } = await jsonFetch<Detail & { error?: string }>(`/api/board/posts/${postId}`, { cache: "no-store" });
    if (!ok) return setError(data.error ?? "글을 불러오지 못했어요.");
    setDetail({ item: data.item, comments: data.comments });
  };

  // 글 + 조회수 등록 (조회수는 서버가 사람당 하루 1회만 올림)
  useEffect(() => {
    let alive = true;
    fetch(`/api/board/posts/${postId}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as Detail & { error?: string };
        if (!alive) return;
        if (!res.ok) return setError(data.error ?? "글을 불러오지 못했어요.");
        setDetail({ item: data.item, comments: data.comments });
      })
      .catch(() => alive && setError("글을 불러오지 못했어요."));

    if (!viewSent.current) {
      viewSent.current = true;
      fetch(`/api/board/posts/${postId}/view`, { method: "POST" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { view_count?: number } | null) => {
          if (alive && typeof data?.view_count === "number") setRegisteredViews(data.view_count);
        })
        .catch(() => undefined);
    }
    return () => {
      alive = false;
    };
  }, [postId]);

  // 로그인 상태가 바뀌면 내 좋아요 여부 다시 받기
  const meId = me?.id ?? null;
  const firstMe = useRef(true);
  useEffect(() => {
    if (firstMe.current) {
      firstMe.current = false;
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meId]);

  const threads = useMemo(() => buildCommentThreads(detail?.comments ?? []), [detail?.comments]);

  if (error) {
    return (
      <main className="rz-container py-16 text-center">
        <p className="text-sm text-[var(--rz-muted)]">{error}</p>
        <Link href="/community" className="mt-4 inline-block text-sm underline">
          목록으로
        </Link>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="rz-container max-w-3xl space-y-3 py-8">
        <div className="h-6 w-2/3 animate-pulse rounded bg-[var(--rz-panel-2)]" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--rz-panel-2)]" />
        <div className="h-48 animate-pulse rounded bg-[var(--rz-panel-2)]" />
      </main>
    );
  }

  const post = { ...detail.item, view_count: Math.max(detail.item.view_count, registeredViews ?? 0) };
  const isMine = meId === post.author_auth_id;

  const patchPost = (patch: Partial<BoardPostSummary>) =>
    setDetail((prev) => (prev ? { ...prev, item: { ...prev.item, ...patch } } : prev));
  const patchComment = (id: string, patch: Partial<BoardCommentView>) =>
    setDetail((prev) =>
      prev ? { ...prev, comments: prev.comments.map((c) => (c.id === id ? { ...c, ...patch } : c)) } : prev,
    );

  const toggleLike = async () => {
    if (!requireLogin()) return;
    const liked = !post.liked_by_me;
    patchPost({ liked_by_me: liked, like_count: post.like_count + (liked ? 1 : -1) });
    const { ok, data } = await jsonFetch<{ like_count?: number; error?: string }>(`/api/board/posts/${postId}/like`, {
      method: liked ? "POST" : "DELETE",
    });
    if (ok && typeof data.like_count === "number") patchPost({ liked_by_me: liked, like_count: data.like_count });
    else patchPost({ liked_by_me: !liked, like_count: post.like_count });
  };

  const deletePost = async () => {
    if (!window.confirm("이 글을 삭제할까요?")) return;
    const { ok, data } = await jsonFetch<{ error?: string }>(`/api/board/posts/${postId}`, { method: "DELETE" });
    if (!ok) return window.alert(data.error ?? "삭제하지 못했어요.");
    router.push(`/community?type=${post.post_type}`);
  };

  const addComment = async (content: string, parentId: string | null) => {
    if (!requireLogin()) return false;
    const trimmed = content.trim();
    if (!trimmed) return false;
    const { ok, data } = await jsonFetch<{ item?: BoardCommentView; error?: string }>(
      `/api/board/posts/${postId}/comments`,
      { method: "POST", body: JSON.stringify({ content: trimmed, parent_id: parentId }) },
    );
    if (!ok || !data.item) {
      window.alert(data.error ?? "댓글을 남기지 못했어요.");
      return false;
    }
    const created = data.item;
    setDetail((prev) =>
      prev
        ? {
            item: { ...prev.item, comment_count: prev.item.comment_count + 1 },
            comments: [...prev.comments, created],
          }
        : prev,
    );
    return true;
  };

  const submitRoot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (await addComment(commentDraft, null)) setCommentDraft("");
    setSubmitting(false);
  };

  const editComment = async (comment: BoardCommentView, content: string) => {
    const { ok, data } = await jsonFetch<{ item?: BoardCommentView; error?: string }>(`/api/board/comments/${comment.id}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
    if (!ok || !data.item) {
      window.alert(data.error ?? "수정하지 못했어요.");
      return false;
    }
    patchComment(comment.id, { content: data.item.content, updated_at: data.item.updated_at });
    return true;
  };

  const deleteComment = async (comment: BoardCommentView) => {
    if (!window.confirm("댓글을 삭제할까요?")) return;
    const { ok, data } = await jsonFetch<{ error?: string }>(`/api/board/comments/${comment.id}`, { method: "DELETE" });
    if (!ok) return window.alert(data.error ?? "삭제하지 못했어요.");
    setDetail((prev) =>
      prev
        ? {
            item: { ...prev.item, comment_count: Math.max(0, prev.item.comment_count - 1) },
            comments: prev.comments.filter((c) => c.id !== comment.id),
          }
        : prev,
    );
  };

  const toggleCommentLike = async (comment: BoardCommentView) => {
    if (!requireLogin()) return;
    const liked = !comment.liked_by_me;
    patchComment(comment.id, { liked_by_me: liked, like_count: comment.like_count + (liked ? 1 : -1) });
    const { ok, data } = await jsonFetch<{ like_count?: number }>(`/api/board/comments/${comment.id}/like`, {
      method: liked ? "POST" : "DELETE",
    });
    if (ok && typeof data.like_count === "number") patchComment(comment.id, { liked_by_me: liked, like_count: data.like_count });
    else patchComment(comment.id, { liked_by_me: !liked, like_count: comment.like_count });
  };

  return (
    <main className="rz-container max-w-3xl py-6">
      <Link href={`/community?type=${post.post_type}`} className="text-xs text-[var(--rz-muted)] hover:text-[var(--rz-text)]">
        ← {BOARD_POST_TYPE_LABELS[post.post_type]}
      </Link>

      <article className="mt-3 rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)]">
        <header className="border-b border-[var(--rz-line)] p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <PostTypeBadge type={post.post_type} />
          </div>
          <h1 className="mt-2 text-lg font-bold leading-snug sm:text-xl">{post.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--rz-muted)]">
            <span className="text-[var(--rz-text)]">{post.author_nickname}</span>
            <span>{formatDateTime(post.created_at)}</span>
            {post.updated_at !== post.created_at ? <span>(수정됨)</span> : null}
            <span className="ml-auto flex gap-3">
              <span>조회 {formatNumber(post.view_count)}</span>
              <span>추천 {formatNumber(post.like_count)}</span>
              <span>댓글 {formatNumber(post.comment_count)}</span>
            </span>
          </div>
        </header>

        <div className="rz-post-body p-4 text-[15px] leading-7 sm:p-5" dangerouslySetInnerHTML={{ __html: post.content_html ?? "" }} />

        <div className="flex flex-col items-center gap-3 border-t border-[var(--rz-line)] p-4">
          <button
            type="button"
            onClick={() => void toggleLike()}
            aria-pressed={post.liked_by_me}
            className={`flex items-center gap-2 rounded-full border px-5 py-2 text-sm transition ${
              post.liked_by_me
                ? "border-[var(--rz-up)] bg-[var(--rz-up)]/10 text-[var(--rz-up)]"
                : "border-[var(--rz-line)] text-[var(--rz-muted)] hover:text-[var(--rz-text)]"
            }`}
          >
            <HeartIcon filled={post.liked_by_me} />
            추천 {formatNumber(post.like_count)}
          </button>
          {isMine ? (
            <div className="flex gap-2 text-xs">
              <Link href={`/community/write?edit=${post.id}`} className="rounded-md border border-[var(--rz-line)] px-3 py-1.5 text-[var(--rz-muted)] hover:text-[var(--rz-text)]">
                수정
              </Link>
              <button type="button" onClick={() => void deletePost()} className="rounded-md border border-[var(--rz-line)] px-3 py-1.5 text-[var(--rz-muted)] hover:text-[var(--rz-up)]">
                삭제
              </button>
            </div>
          ) : null}
        </div>
      </article>

      {/* 댓글 */}
      <section className="mt-6" aria-label="댓글">
        <h2 className="mb-3 text-sm font-semibold">
          댓글 <span className="text-[var(--rz-accent)]">{formatNumber(post.comment_count)}</span>
        </h2>

        <form onSubmit={submitRoot} className="mb-4">
          <textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            onFocus={() => {
              if (!me) requireLogin();
            }}
            placeholder={me ? "댓글을 남겨 주세요" : "로그인하고 댓글을 남겨 주세요"}
            maxLength={1000}
            rows={3}
            className="w-full resize-y rounded-lg border border-[var(--rz-line)] bg-[var(--rz-panel)] px-3 py-2 text-sm outline-none focus:border-[var(--rz-accent)]"
          />
          <div className="mt-1.5 flex items-center justify-between text-xs text-[var(--rz-muted)]">
            <span>{commentDraft.length}/1000</span>
            <button
              type="submit"
              disabled={submitting || !commentDraft.trim()}
              className="rounded-md bg-[var(--rz-accent)] px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              등록
            </button>
          </div>
        </form>

        {threads.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--rz-line)] py-8 text-center text-sm text-[var(--rz-muted)]">
            첫 댓글을 남겨 보세요.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--rz-line)] rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)]">
            {threads.map((thread) => (
              <li key={thread.id} className="p-4">
                <CommentItem
                  comment={thread}
                  isPostAuthor={thread.author_auth_id === post.author_auth_id}
                  isMine={!!meId && thread.author_auth_id === meId}
                  canReply
                  onReply={(content) => addComment(content, thread.id)}
                  onEdit={(content) => editComment(thread, content)}
                  onDelete={() => void deleteComment(thread)}
                  onLike={() => void toggleCommentLike(thread)}
                  requireLogin={requireLogin}
                />
                {thread.replies.length > 0 ? (
                  <ul className="mt-3 space-y-3 border-l-2 border-[var(--rz-line)] pl-4">
                    {thread.replies.map((reply) => (
                      <li key={reply.id}>
                        <CommentItem
                          comment={reply}
                          isPostAuthor={reply.author_auth_id === post.author_auth_id}
                          isMine={!!meId && reply.author_auth_id === meId}
                          canReply={false}
                          onReply={async () => false}
                          onEdit={(content) => editComment(reply, content)}
                          onDelete={() => void deleteComment(reply)}
                          onLike={() => void toggleCommentLike(reply)}
                          requireLogin={requireLogin}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function CommentItem({
  comment,
  isPostAuthor,
  isMine,
  canReply,
  onReply,
  onEdit,
  onDelete,
  onLike,
  requireLogin,
}: {
  comment: BoardCommentView;
  isPostAuthor: boolean;
  isMine: boolean;
  canReply: boolean;
  onReply: (content: string) => Promise<boolean>;
  onEdit: (content: string) => Promise<boolean>;
  onDelete: () => void;
  onLike: () => void;
  requireLogin: () => boolean;
}) {
  const [replying, setReplying] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(comment.content);
  const [busy, setBusy] = useState(false);

  if (comment.deleted) {
    return <p className="text-sm text-[var(--rz-muted)]">삭제된 댓글입니다.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium text-[var(--rz-text)]">{comment.author_nickname}</span>
        {isPostAuthor ? <span className="rounded bg-[var(--rz-accent)]/15 px-1 text-[10px] text-[var(--rz-accent)]">작성자</span> : null}
        <span className="text-[var(--rz-muted)]">{timeAgo(comment.created_at)}</span>
        {comment.updated_at !== comment.created_at ? <span className="text-[var(--rz-muted)]">(수정됨)</span> : null}
      </div>

      {editing ? (
        <div className="mt-2">
          <textarea
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            maxLength={1000}
            rows={2}
            className="w-full rounded-lg border border-[var(--rz-line)] bg-[var(--rz-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--rz-accent)]"
          />
          <div className="mt-1 flex justify-end gap-2 text-xs">
            <button type="button" onClick={() => { setEditing(false); setEditDraft(comment.content); }} className="text-[var(--rz-muted)]">
              취소
            </button>
            <button
              type="button"
              disabled={busy || !editDraft.trim()}
              onClick={async () => {
                setBusy(true);
                if (await onEdit(editDraft.trim())) setEditing(false);
                setBusy(false);
              }}
              className="rounded bg-[var(--rz-accent)] px-3 py-1 text-white disabled:opacity-40"
            >
              저장
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{comment.content}</p>
      )}

      {!editing ? (
        <div className="mt-1.5 flex items-center gap-3 text-xs text-[var(--rz-muted)]">
          <button
            type="button"
            onClick={onLike}
            aria-pressed={comment.liked_by_me}
            className={`flex items-center gap-1 ${comment.liked_by_me ? "text-[var(--rz-up)]" : "hover:text-[var(--rz-text)]"}`}
          >
            <HeartIcon filled={comment.liked_by_me} />
            {comment.like_count > 0 ? formatNumber(comment.like_count) : "좋아요"}
          </button>
          {canReply ? (
            <button
              type="button"
              onClick={() => {
                if (!requireLogin()) return;
                setReplying((v) => !v);
              }}
              className="hover:text-[var(--rz-text)]"
            >
              답글
            </button>
          ) : null}
          {isMine ? (
            <>
              <button type="button" onClick={() => setEditing(true)} className="hover:text-[var(--rz-text)]">
                수정
              </button>
              <button type="button" onClick={onDelete} className="hover:text-[var(--rz-up)]">
                삭제
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {replying ? (
        <form
          className="mt-2 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            if (await onReply(replyDraft)) {
              setReplyDraft("");
              setReplying(false);
            }
            setBusy(false);
          }}
        >
          <input
            autoFocus
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            maxLength={1000}
            placeholder={`${comment.author_nickname}님에게 답글`}
            className="min-w-0 flex-1 rounded-lg border border-[var(--rz-line)] bg-[var(--rz-bg)] px-3 py-1.5 text-sm outline-none focus:border-[var(--rz-accent)]"
          />
          <button type="submit" disabled={busy || !replyDraft.trim()} className="rounded-lg bg-[var(--rz-accent)] px-3 text-sm text-white disabled:opacity-40">
            등록
          </button>
        </form>
      ) : null}
    </div>
  );
}
