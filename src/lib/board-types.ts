export type BoardPostRow = {
  id: string;
  author_auth_id: string;
  title: string;
  content_html: string;
  created_at: string;
  updated_at: string;
};

export type BoardCommentRow = {
  id: string;
  post_id: string;
  author_auth_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type BoardPostSummary = {
  id: string;
  title: string;
  content_html: string;
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
  content: string;
  created_at: string;
  updated_at: string;
};
