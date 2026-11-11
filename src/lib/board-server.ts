import sanitizeHtml from "sanitize-html";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase-server";
import type { BoardCommentRow, BoardCommentView, BoardPostRow, BoardPostSummary } from "@/lib/board-types";
import { parseBoardPostType } from "@/lib/board-types";

type RouteClient = Awaited<ReturnType<typeof createSupabaseRouteHandlerClient>>;

export async function requireSessionUser() {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export { getSupabaseAdminClient } from "@/lib/supabase-admin";

/** 게시글 본문 HTML 화이트리스트 (에디터가 만드는 태그만 허용) */
export function sanitizePostHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "a", "img",
      "h2", "h3", "ul", "ol", "li", "blockquote", "code", "pre", "hr",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["https"] },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer nofollow" }),
    },
  }).trim();
}

export function isEmptyHtml(html: string) {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/&nbsp;/g, " ").trim();
  return text.length === 0 && !/<img\s/i.test(html);
}

export async function fetchNicknameMap(supabase: RouteClient, userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map<string, string>();

  const { data } = await supabase.from("USER_MST").select("auth_id, nickname").in("auth_id", uniqueIds);
  const map = new Map<string, string>();
  (data ?? []).forEach((row: { auth_id: string; nickname: string }) => {
    map.set(row.auth_id, row.nickname || "방문자");
  });
  return map;
}

export async function hydratePostSummaries(
  supabase: RouteClient,
  posts: BoardPostRow[],
  viewerAuthId?: string,
  options: { includeContent?: boolean } = {},
): Promise<BoardPostSummary[]> {
  if (posts.length === 0) return [];
  const postIds = posts.map((p) => p.id);

  const [nicknameMap, myLikesRes] = await Promise.all([
    fetchNicknameMap(
      supabase,
      posts.map((p) => p.author_auth_id),
    ),
    viewerAuthId
      ? supabase.from("BOARD_POST_LIKES").select("post_id").in("post_id", postIds).eq("user_auth_id", viewerAuthId)
      : Promise.resolve({ data: [] as Array<{ post_id: string }> }),
  ]);

  const likedSet = new Set((myLikesRes.data ?? []).map((item: { post_id: string }) => item.post_id));

  return posts.map(({ content_html, ...post }) => ({
    ...post,
    ...(options.includeContent ? { content_html } : {}),
    post_type: parseBoardPostType(post.post_type),
    view_count: Number(post.view_count ?? 0),
    like_count: Number(post.like_count ?? 0),
    comment_count: Number(post.comment_count ?? 0),
    has_image: /<img\s/i.test(content_html ?? ""),
    author_nickname: nicknameMap.get(post.author_auth_id) ?? "방문자",
    liked_by_me: likedSet.has(post.id),
  }));
}

export async function hydrateComments(
  supabase: RouteClient,
  comments: BoardCommentRow[],
  viewerAuthId?: string,
): Promise<BoardCommentView[]> {
  if (comments.length === 0) return [];
  const commentIds = comments.map((c) => c.id);
  const [nicknameMap, myLikesRes] = await Promise.all([
    fetchNicknameMap(
      supabase,
      comments.map((comment) => comment.author_auth_id),
    ),
    viewerAuthId
      ? supabase
          .from("BOARD_COMMENT_LIKES")
          .select("comment_id")
          .in("comment_id", commentIds)
          .eq("user_auth_id", viewerAuthId)
      : Promise.resolve({ data: [] as Array<{ comment_id: string }> }),
  ]);
  const likedSet = new Set((myLikesRes.data ?? []).map((item: { comment_id: string }) => item.comment_id));

  return comments.map((comment) => ({
    ...comment,
    parent_id: comment.parent_id ?? null,
    like_count: Number(comment.like_count ?? 0),
    author_nickname: nicknameMap.get(comment.author_auth_id) ?? "방문자",
    liked_by_me: likedSet.has(comment.id),
  }));
}
