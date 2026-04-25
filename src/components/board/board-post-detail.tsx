"use client";

import type { BoardCommentView, BoardPostSummary } from "@/lib/board-types";

type Props = {
  post: BoardPostSummary;
  comments: BoardCommentView[];
  myAuthId: string | null;
  onBack: () => void;
  onEditPost: () => void;
  onDeletePost: () => void;
  onToggleLike: () => void;
  commentDraft: string;
  onCommentDraftChange: (value: string) => void;
  onCreateComment: () => void;
  onUpdateComment: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
};

export function BoardPostDetail({
  post,
  comments,
  myAuthId,
  onBack,
  onEditPost,
  onDeletePost,
  onToggleLike,
  commentDraft,
  onCommentDraftChange,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
}: Props) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-100">{post.title}</h3>
          <p className="mt-1 text-xs text-slate-400">
            {post.author_nickname} · {new Date(post.created_at).toLocaleString("ko-KR")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300">
            목록
          </button>
          {myAuthId === post.author_auth_id && (
            <>
              <button type="button" onClick={onEditPost} className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300">
                수정
              </button>
              <button type="button" onClick={onDeletePost} className="rounded border border-rose-700 px-2 py-1 text-xs text-rose-300">
                삭제
              </button>
            </>
          )}
        </div>
      </div>

      <div className="prose prose-invert max-w-none text-sm text-slate-200" dangerouslySetInnerHTML={{ __html: post.content_html }} />

      <div className="flex items-center justify-between border-t border-slate-800 pt-3">
        <button type="button" onClick={onToggleLike} className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-200">
          {post.liked_by_me ? "좋아요 취소" : "좋아요"} · {post.like_count}
        </button>
        <span className="text-xs text-slate-400">댓글 {comments.length}</span>
      </div>

      <div className="space-y-3 border-t border-slate-800 pt-3">
        <p className="text-sm font-semibold text-slate-200">댓글</p>
        <textarea
          value={commentDraft}
          onChange={(event) => onCommentDraftChange(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
          placeholder="댓글을 입력해 주세요."
        />
        <div className="flex justify-end">
          <button type="button" onClick={onCreateComment} className="rounded bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white">
            댓글 등록
          </button>
        </div>
        <div className="space-y-2">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-xs text-slate-400">
                  {comment.author_nickname} · {new Date(comment.created_at).toLocaleString("ko-KR")}
                </p>
                {myAuthId === comment.author_auth_id && (
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => onUpdateComment(comment.id)} className="text-xs text-slate-300">
                      수정
                    </button>
                    <button type="button" onClick={() => onDeleteComment(comment.id)} className="text-xs text-rose-300">
                      삭제
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-100">{comment.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
