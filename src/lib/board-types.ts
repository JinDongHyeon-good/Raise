export const BOARD_POST_TYPES = ["free", "meetup", "review", "tip", "question"] as const;

export type BoardPostType = (typeof BOARD_POST_TYPES)[number];

export function isBoardPostType(value: string | null | undefined): value is BoardPostType {
  return !!value && (BOARD_POST_TYPES as readonly string[]).includes(value);
}

export function parseBoardPostType(value: string | null | undefined, fallback: BoardPostType = "free"): BoardPostType {
  return isBoardPostType(value) ? value : fallback;
}

export type BoardPostRow = {
  id: string;
  author_auth_id: string;
  title: string;
  content_html: string;
  post_type: BoardPostType;
  created_at: string;
  updated_at: string;
};

export type BoardCommentRow = {
  id: string;
  post_id: string;
  author_auth_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
};

export type BoardPostSummary = {
  id: string;
  title: string;
  content_html: string;
  post_type: BoardPostType;
  author_auth_id: string;
  author_nickname: string;
  created_at: string;
  updated_at: string;
  comment_count: number;
  like_count: number;
  liked_by_me: boolean;
};

export type BoardCommentView = {
  id: string;
  post_id: string;
  author_auth_id: string;
  author_nickname: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
};

export type BoardCommentThread = BoardCommentView & {
  replies: BoardCommentView[];
};

export const BOARD_COMMENT_SELECT =
  "id, post_id, author_auth_id, parent_id, content, created_at, updated_at" as const;

export const BOARD_POST_SELECT =
  "id, author_auth_id, title, content_html, post_type, created_at, updated_at" as const;

export function buildCommentThreads(comments: BoardCommentView[]): BoardCommentThread[] {
  const roots = comments.filter((comment) => !comment.parent_id);
  const replies = comments.filter((comment) => comment.parent_id);

  return roots.map((root) => ({
    ...root,
    replies: replies.filter((reply) => reply.parent_id === root.id),
  }));
}
