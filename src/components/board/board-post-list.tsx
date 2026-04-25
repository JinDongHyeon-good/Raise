"use client";

import type { BoardPostSummary } from "@/lib/board-types";

type Props = {
  posts: BoardPostSummary[];
  onSelect: (postId: string) => void;
};

export function BoardPostList({ posts, onSelect }: Props) {
  if (posts.length === 0) {
    return <p className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-400">아직 게시글이 없습니다.</p>;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <button
          key={post.id}
          type="button"
          onClick={() => onSelect(post.id)}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-left transition hover:border-sky-500"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="truncate text-base font-semibold text-slate-100">{post.title}</h3>
            <span className="text-xs text-slate-500">{new Date(post.created_at).toLocaleString("ko-KR")}</span>
          </div>
          <p className="line-clamp-2 text-sm text-slate-300" dangerouslySetInnerHTML={{ __html: post.content_html }} />
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
            <span>작성자 {post.author_nickname}</span>
            <span>댓글 {post.comment_count}</span>
            <span>좋아요 {post.like_count}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
