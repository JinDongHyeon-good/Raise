export const BOARD_POST_TYPES = ["free", "analysis", "news", "question", "profit"] as const;

export type BoardPostType = (typeof BOARD_POST_TYPES)[number];

export const BOARD_POST_TYPE_LABELS: Record<BoardPostType, string> = {
  free: "자유게시판",
  analysis: "코인분석",
  news: "뉴스·정보",
  question: "질문",
  profit: "손익인증",
};

export const BOARD_SORTS = ["latest", "popular", "views"] as const;
export type BoardSort = (typeof BOARD_SORTS)[number];
export const BOARD_SORT_LABELS: Record<BoardSort, string> = {
  latest: "최신순",
  popular: "추천순",
  views: "조회순",
};

export function isBoardPostType(value: string | null | undefined): value is BoardPostType {
  return !!value && (BOARD_POST_TYPES as readonly string[]).includes(value);
}

export function parseBoardPostType(value: string | null | undefined, fallback: BoardPostType = "free"): BoardPostType {
  return isBoardPostType(value) ? value : fallback;
}

export function parseBoardSort(value: string | null | undefined): BoardSort {
  return (BOARD_SORTS as readonly string[]).includes(value ?? "") ? (value as BoardSort) : "latest";
}

export type BoardPostRow = {
  id: string;
  author_auth_id: string;
  title: string;
  content_html: string;
  post_type: BoardPostType;
  created_at: string;
  updated_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
};

export type BoardCommentRow = {
  id: string;
  post_id: string;
  author_auth_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  like_count: number;
};

export type BoardPostSummary = Omit<BoardPostRow, "content_html"> & {
  content_html?: string;
  author_nickname: string;
  liked_by_me: boolean;
  has_image: boolean;
};

export type BoardCommentView = BoardCommentRow & {
  author_nickname: string;
  liked_by_me: boolean;
  /** 답글이 달린 채로 삭제된 댓글의 자리표시 */
  deleted?: boolean;
};

export type BoardCommentThread = BoardCommentView & {
  replies: BoardCommentView[];
};

export const BOARD_COMMENT_SELECT =
  "id, post_id, author_auth_id, parent_id, content, created_at, updated_at, like_count" as const;

/** 목록용 (본문 제외) */
export const BOARD_POST_LIST_SELECT =
  "id, author_auth_id, title, post_type, created_at, updated_at, view_count, like_count, comment_count, content_html" as const;

export const BOARD_POST_SELECT =
  "id, author_auth_id, title, content_html, post_type, created_at, updated_at, view_count, like_count, comment_count" as const;

/** 부모가 삭제된 답글도 잃지 않도록 자리표시 부모를 만들어 묶는다 */
export function buildCommentThreads(comments: BoardCommentView[]): BoardCommentThread[] {
  const roots = comments.filter((comment) => !comment.parent_id);
  const rootIds = new Set(roots.map((root) => root.id));
  const replies = comments.filter((comment) => comment.parent_id);

  const orphanParents = new Map<string, BoardCommentView>();
  for (const reply of replies) {
    const parentId = reply.parent_id!;
    if (!rootIds.has(parentId) && !orphanParents.has(parentId)) {
      orphanParents.set(parentId, {
        id: parentId,
        post_id: reply.post_id,
        author_auth_id: "",
        author_nickname: "",
        parent_id: null,
        content: "삭제된 댓글입니다.",
        created_at: reply.created_at,
        updated_at: reply.created_at,
        like_count: 0,
        liked_by_me: false,
        deleted: true,
      });
    }
  }

  return [...roots, ...orphanParents.values()]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((root) => ({
      ...root,
      replies: replies.filter((reply) => reply.parent_id === root.id),
    }));
}
