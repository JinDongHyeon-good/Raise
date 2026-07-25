"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  BOARD_POST_TYPES,
  type BoardCommentView,
  type BoardPostSummary,
  type BoardPostType,
} from "@/lib/board-types";
import { BoardEditor } from "@/components/board/board-editor";
import { BoardPostList } from "@/components/board/board-post-list";
import { BoardPostDetail } from "@/components/board/board-post-detail";

type BoardTabProps = {
  onNeedLogin: () => void;
  authorFilter?: string | null;
  hideWriteButton?: boolean;
  emptyMessage?: string;
};

export function BoardTab({ onNeedLogin, authorFilter = null, hideWriteButton = false, emptyMessage }: BoardTabProps) {
  const t = useTranslations("board");
  const [posts, setPosts] = useState<BoardPostSummary[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState<BoardPostType | "all">("all");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<BoardPostSummary | null>(null);
  const [comments, setComments] = useState<BoardCommentView[]>([]);
  const [title, setTitle] = useState("");
  const [postType, setPostType] = useState<BoardPostType>("free");
  const [contentHtml, setContentHtml] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [myAuthId, setMyAuthId] = useState<string | null>(null);
  const pageSize = 15;

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const loadPosts = useCallback(
    async (targetPage: number, nextTypeFilter: BoardPostType | "all" = typeFilter) => {
      setIsPostsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          limit: String(pageSize),
        });
        if (authorFilter) params.set("author", authorFilter);
        if (nextTypeFilter !== "all") params.set("type", nextTypeFilter);
        const res = await fetch(`/api/board/posts?${params}`, { cache: "no-store" });
        const data = (await res.json()) as { items?: BoardPostSummary[]; total?: number; error?: string };
        if (!res.ok) throw new Error(data.error ?? t("errors.loadPosts"));
        setPosts(data.items ?? []);
        setTotal(data.total ?? 0);
        setPage(targetPage);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("errors.loadPosts"));
      } finally {
        setIsPostsLoading(false);
      }
    },
    [authorFilter, t, typeFilter],
  );

  const loadPostDetail = async (postId: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/board/posts/${postId}`, { cache: "no-store" });
      const data = (await res.json()) as { item?: BoardPostSummary; comments?: BoardCommentView[]; error?: string };
      if (!res.ok || !data.item) throw new Error(data.error ?? t("errors.loadDetail"));
      setSelectedPost(data.item);
      setComments(data.comments ?? []);
      setSelectedPostId(postId);
      setCommentDraft("");
      setReplyToId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.loadDetail"));
    }
  };

  const requireAuthOrOpen = useCallback(async () => {
    if (myAuthId) return myAuthId;
    try {
      const { data } = await getSupabaseBrowserClient().auth.getSession();
      const uid = data.session?.user?.id ?? null;
      setMyAuthId(uid);
      if (!uid) {
        setError(t("errors.loginRequired"));
        onNeedLogin();
        return null;
      }
      return uid;
    } catch {
      setError(t("errors.sessionCheckFailed"));
      onNeedLogin();
      return null;
    }
  }, [myAuthId, onNeedLogin, t]);

  useEffect(() => {
    void loadPosts(1);
  }, [loadPosts]);

  useEffect(() => {
    let cancelled = false;
    const syncSession = async () => {
      const { data } = await getSupabaseBrowserClient().auth.getSession();
      if (cancelled) return;
      setMyAuthId(data.session?.user?.id ?? null);
    };
    void syncSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTypeFilterChange = (next: BoardPostType | "all") => {
    setTypeFilter(next);
    setSelectedPost(null);
    setSelectedPostId(null);
    void loadPosts(1, next);
  };

  const handleCreatePost = async () => {
    const uid = await requireAuthOrOpen();
    if (!uid) return;
    const res = await fetch("/api/board/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content_html: contentHtml, post_type: postType }),
    });
    const data = (await res.json()) as { item?: BoardPostSummary; error?: string };
    if (!res.ok || !data.item) {
      setError(data.error ?? t("errors.createFailed"));
      return;
    }
    setIsWriting(false);
    setTitle("");
    setPostType("free");
    setContentHtml("");
    await loadPosts(1);
    await loadPostDetail(data.item.id);
  };

  const handleUpdatePost = async () => {
    if (!selectedPostId) return;
    const uid = await requireAuthOrOpen();
    if (!uid) return;
    const res = await fetch(`/api/board/posts/${selectedPostId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content_html: contentHtml, post_type: postType }),
    });
    const data = (await res.json()) as { item?: BoardPostSummary; error?: string };
    if (!res.ok || !data.item) {
      setError(data.error ?? t("errors.updateFailed"));
      return;
    }
    setIsEditing(false);
    setSelectedPost(data.item);
    setTitle("");
    setPostType("free");
    setContentHtml("");
    await loadPosts(page);
  };

  const handleDeletePost = async () => {
    if (!selectedPostId || !confirm(t("confirmDeletePost"))) return;
    const uid = await requireAuthOrOpen();
    if (!uid) return;
    const res = await fetch(`/api/board/posts/${selectedPostId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? t("errors.deleteFailed"));
      return;
    }
    setSelectedPostId(null);
    setSelectedPost(null);
    setComments([]);
    await loadPosts(page);
  };

  const handleToggleLike = async () => {
    if (!selectedPost) return;
    const uid = await requireAuthOrOpen();
    if (!uid) return;
    await fetch(`/api/board/posts/${selectedPost.id}/like`, { method: selectedPost.liked_by_me ? "DELETE" : "POST" });
    await loadPostDetail(selectedPost.id);
    await loadPosts(page);
  };

  const handleCreateComment = async () => {
    if (!selectedPostId) return;
    const uid = await requireAuthOrOpen();
    if (!uid) return;
    const res = await fetch(`/api/board/posts/${selectedPostId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentDraft, parent_id: replyToId }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? t("errors.commentFailed"));
      return;
    }
    setCommentDraft("");
    setReplyToId(null);
    await loadPostDetail(selectedPostId);
    await loadPosts(page);
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    const uid = await requireAuthOrOpen();
    if (!uid) return;
    const res = await fetch(`/api/board/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? t("errors.commentUpdateFailed"));
      return;
    }
    if (selectedPostId) await loadPostDetail(selectedPostId);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm(t("confirmDeleteComment"))) return;
    const uid = await requireAuthOrOpen();
    if (!uid) return;
    const res = await fetch(`/api/board/comments/${commentId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? t("errors.commentDeleteFailed"));
      return;
    }
    if (selectedPostId) await loadPostDetail(selectedPostId);
    await loadPosts(page);
  };

  const filterChipClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold transition ${
      active
        ? "bg-[var(--piclick-green)] text-white"
        : "border border-[var(--piclick-line)] bg-white text-[var(--piclick-ink-muted)] hover:border-[var(--piclick-green)]/30 hover:text-[var(--piclick-ink)]"
    }`;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-brand-display text-2xl font-bold tracking-tight text-[var(--piclick-green-deep)] sm:text-3xl">
            {authorFilter ? t("myPostsTitle") : t("title")}
          </h2>
          <p className="mt-1 text-sm text-[var(--piclick-ink-muted)]">
            {authorFilter ? t("myPostsSubtitle") : t("subtitle")}
          </p>
        </div>
        {!hideWriteButton && !isWriting && !isEditing && !authorFilter ? (
          <button
            type="button"
            onClick={async () => {
              setError(null);
              setTitle("");
              setPostType("free");
              setContentHtml("");
              setIsWriting(true);
              const uid = await requireAuthOrOpen();
              if (!uid) {
                setIsWriting(false);
              }
            }}
            className="inline-flex h-10 items-center rounded-lg bg-[var(--piclick-green)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--piclick-green-deep)]"
          >
            {t("write")}
          </button>
        ) : null}
      </div>

      {!isWriting && !isEditing && !selectedPost ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("filterLabel")}>
          <button type="button" role="tab" aria-selected={typeFilter === "all"} onClick={() => handleTypeFilterChange("all")} className={filterChipClass(typeFilter === "all")}>
            {t("filterAll")}
          </button>
          {BOARD_POST_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={typeFilter === type}
              onClick={() => handleTypeFilterChange(type)}
              className={filterChipClass(typeFilter === type)}
            >
              {t(`types.${type}`)}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>
      ) : null}

      {(isWriting || isEditing) && (
        <div className="space-y-3 rounded-2xl border border-[var(--piclick-line)] bg-white p-4 sm:p-5">
          <div>
            <label htmlFor="board-post-type" className="mb-1.5 block text-xs font-medium text-[var(--piclick-ink-muted)]">
              {t("typeLabel")}
            </label>
            <select
              id="board-post-type"
              value={postType}
              onChange={(event) => setPostType(event.target.value as BoardPostType)}
              className="w-full rounded-xl border border-[var(--piclick-line)] bg-[var(--piclick-beige-soft)]/40 px-3.5 py-3 text-sm font-medium text-[var(--piclick-ink)] outline-none focus:border-[var(--piclick-green)]/40 focus:bg-white sm:max-w-xs"
            >
              {BOARD_POST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`types.${type}`)}
                </option>
              ))}
            </select>
          </div>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("titlePlaceholder")}
            maxLength={120}
            className="w-full rounded-xl border border-[var(--piclick-line)] bg-[var(--piclick-beige-soft)]/40 px-3.5 py-3 text-sm font-medium text-[var(--piclick-ink)] outline-none placeholder:text-[var(--piclick-ink-muted)] focus:border-[var(--piclick-green)]/40 focus:bg-white"
          />
          <BoardEditor value={contentHtml} onChange={setContentHtml} onNeedLogin={onNeedLogin} />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsWriting(false);
                setIsEditing(false);
              }}
              className="rounded-lg border border-[var(--piclick-line)] px-4 py-2 text-sm text-[var(--piclick-ink-muted)] hover:bg-[var(--piclick-beige-soft)]"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={() => void (isEditing ? handleUpdatePost() : handleCreatePost())}
              className="rounded-lg bg-[var(--piclick-green)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--piclick-green-deep)]"
            >
              {isEditing ? t("saveEdit") : t("publish")}
            </button>
          </div>
        </div>
      )}

      {selectedPost && !isWriting && !isEditing ? (
        <BoardPostDetail
          post={selectedPost}
          comments={comments}
          myAuthId={myAuthId}
          commentDraft={commentDraft}
          replyToId={replyToId}
          onBack={() => {
            setSelectedPost(null);
            setSelectedPostId(null);
            setReplyToId(null);
          }}
          onEditPost={() => {
            setIsEditing(true);
            setTitle(selectedPost.title);
            setPostType(selectedPost.post_type);
            setContentHtml(selectedPost.content_html);
          }}
          onDeletePost={() => void handleDeletePost()}
          onToggleLike={() => void handleToggleLike()}
          onCommentDraftChange={setCommentDraft}
          onReplyTo={setReplyToId}
          onCreateComment={() => void handleCreateComment()}
          onUpdateComment={(commentId, content) => handleUpdateComment(commentId, content)}
          onDeleteComment={(commentId) => void handleDeleteComment(commentId)}
        />
      ) : !isWriting && !isEditing ? (
        <>
          {isPostsLoading && posts.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--piclick-ink-muted)]">{t("loading")}</p>
          ) : (
            <BoardPostList
              posts={posts}
              onSelect={(id) => void loadPostDetail(id)}
              emptyMessage={typeFilter === "all" ? emptyMessage : t("emptyFiltered")}
            />
          )}
          {totalPages > 1 ? (
            <div className="flex items-center justify-between text-sm text-[var(--piclick-ink-muted)]">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => void loadPosts(page - 1)}
                className="rounded-lg border border-[var(--piclick-line)] px-3 py-1.5 disabled:opacity-40"
              >
                {t("prev")}
              </button>
              <span className="tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => void loadPosts(page + 1)}
                className="rounded-lg border border-[var(--piclick-line)] px-3 py-1.5 disabled:opacity-40"
              >
                {t("next")}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
