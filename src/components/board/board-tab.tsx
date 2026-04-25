"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { BoardCommentView, BoardPostSummary } from "@/lib/board-types";
import { BoardEditor } from "@/components/board/board-editor";
import { BoardPostList } from "@/components/board/board-post-list";
import { BoardPostDetail } from "@/components/board/board-post-detail";

type BoardTabProps = {
  onNeedLogin: () => void;
};

export function BoardTab({ onNeedLogin }: BoardTabProps) {
  const [posts, setPosts] = useState<BoardPostSummary[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<BoardPostSummary | null>(null);
  const [comments, setComments] = useState<BoardCommentView[]>([]);
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [isWriting, setIsWriting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [myAuthId, setMyAuthId] = useState<string | null>(null);
  const pageSize = 15;

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const loadPosts = useCallback(async (targetPage: number) => {
    setIsPostsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/board/posts?page=${targetPage}&limit=${pageSize}`, { cache: "no-store" });
      const data = (await res.json()) as { items?: BoardPostSummary[]; total?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "게시글을 불러오지 못했습니다.");
      setPosts(data.items ?? []);
      setTotal(data.total ?? 0);
      setPage(targetPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "게시글 로딩 실패");
    } finally {
      setIsPostsLoading(false);
    }
  }, []);

  const loadPostDetail = async (postId: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/board/posts/${postId}`, { cache: "no-store" });
      const data = (await res.json()) as { item?: BoardPostSummary; comments?: BoardCommentView[]; error?: string };
      if (!res.ok || !data.item) throw new Error(data.error ?? "게시글 상세 조회 실패");
      setSelectedPost(data.item);
      setComments(data.comments ?? []);
      setSelectedPostId(postId);
      setCommentDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "게시글 조회 실패");
    }
  };

  const requireAuthOrOpen = useCallback(async () => {
    // 이미 상태에 로그인 uid가 있으면 즉시 통과
    if (myAuthId) return myAuthId;
    try {
      const { data } = await getSupabaseBrowserClient().auth.getSession();
      const uid = data.session?.user?.id ?? null;
      setMyAuthId(uid);
      if (!uid) {
        setError("로그인이 필요합니다.");
        onNeedLogin();
        return null;
      }
      return uid;
    } catch {
      setError("로그인 상태를 확인하지 못했습니다. 다시 시도해 주세요.");
      onNeedLogin();
      return null;
    }
  }, [myAuthId, onNeedLogin]);

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

  const handleCreatePost = async () => {
    const uid = await requireAuthOrOpen();
    if (!uid) return;
    const res = await fetch("/api/board/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content_html: contentHtml }),
    });
    const data = (await res.json()) as { item?: BoardPostSummary; error?: string };
    if (!res.ok || !data.item) {
      setError(data.error ?? "작성 실패");
      return;
    }
    setIsWriting(false);
    setTitle("");
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
      body: JSON.stringify({ title, content_html: contentHtml }),
    });
    const data = (await res.json()) as { item?: BoardPostSummary; error?: string };
    if (!res.ok || !data.item) {
      setError(data.error ?? "수정 실패");
      return;
    }
    setIsEditing(false);
    setSelectedPost(data.item);
    setTitle("");
    setContentHtml("");
    await loadPosts(page);
  };

  const handleDeletePost = async () => {
    if (!selectedPostId || !confirm("게시글을 삭제할까요?")) return;
    const uid = await requireAuthOrOpen();
    if (!uid) return;
    const res = await fetch(`/api/board/posts/${selectedPostId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "삭제 실패");
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
      body: JSON.stringify({ content: commentDraft }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "댓글 작성 실패");
      return;
    }
    setCommentDraft("");
    await loadPostDetail(selectedPostId);
    await loadPosts(page);
  };

  const handleUpdateComment = async (commentId: string) => {
    const content = prompt("댓글 수정", comments.find((c) => c.id === commentId)?.content ?? "");
    if (content === null) return;
    const uid = await requireAuthOrOpen();
    if (!uid) return;
    const res = await fetch(`/api/board/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "댓글 수정 실패");
      return;
    }
    if (selectedPostId) await loadPostDetail(selectedPostId);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("댓글을 삭제할까요?")) return;
    const uid = await requireAuthOrOpen();
    if (!uid) return;
    const res = await fetch(`/api/board/comments/${commentId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "댓글 삭제 실패");
      return;
    }
    if (selectedPostId) await loadPostDetail(selectedPostId);
    await loadPosts(page);
  };

  return (
    <section className="relative z-10 isolate space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-4 pointer-events-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100">게시판</h2>
        {!isWriting && !isEditing && (
          <button
            type="button"
            onClick={async () => {
              setError(null);
              setTitle("");
              setContentHtml("");
              setIsWriting(true);
              const uid = await requireAuthOrOpen();
              if (!uid) {
                setIsWriting(false);
                return;
              }
            }}
            className="relative z-20 pointer-events-auto rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white"
          >
            글쓰기
          </button>
        )}
      </div>

      {error && <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}

      {(isWriting || isEditing) && (
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="제목"
            maxLength={120}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
          />
          <BoardEditor value={contentHtml} onChange={setContentHtml} onNeedLogin={onNeedLogin} />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsWriting(false);
                setIsEditing(false);
              }}
              className="rounded border border-slate-700 px-3 py-1.5 text-sm text-slate-300"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void (isEditing ? handleUpdatePost() : handleCreatePost())}
              className="rounded bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white"
            >
              {isEditing ? "수정 저장" : "등록"}
            </button>
          </div>
        </div>
      )}

      {selectedPost && !isWriting && !isEditing ? (
        <BoardPostDetail
          post={selectedPost}
          comments={comments}
          myAuthId={myAuthId}
          onBack={() => {
            setSelectedPost(null);
            setSelectedPostId(null);
          }}
          onEditPost={() => {
            setIsEditing(true);
            setTitle(selectedPost.title);
            setContentHtml(selectedPost.content_html);
          }}
          onDeletePost={() => void handleDeletePost()}
          onToggleLike={() => void handleToggleLike()}
          commentDraft={commentDraft}
          onCommentDraftChange={setCommentDraft}
          onCreateComment={() => void handleCreateComment()}
          onUpdateComment={(commentId) => void handleUpdateComment(commentId)}
          onDeleteComment={(commentId) => void handleDeleteComment(commentId)}
        />
      ) : (
        <>
          {isPostsLoading && posts.length === 0 ? (
            <p className="text-sm text-slate-400">게시글을 불러오는 중...</p>
          ) : (
            <BoardPostList posts={posts} onSelect={(id) => void loadPostDetail(id)} />
          )}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <button type="button" disabled={page <= 1} onClick={() => void loadPosts(page - 1)} className="rounded border border-slate-700 px-2 py-1 disabled:opacity-40">
              이전
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => void loadPosts(page + 1)}
              className="rounded border border-slate-700 px-2 py-1 disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </>
      )}
    </section>
  );
}
