import { createSupabaseRouteHandlerClient } from "@/lib/supabase-server";
import type { BoardCommentRow, BoardCommentView, BoardPostRow, BoardPostSummary } from "@/lib/board-types";

export async function requireSessionUser() {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function fetchNicknameMap(supabase: Awaited<ReturnType<typeof createSupabaseRouteHandlerClient>>, userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map<string, string>();

  const { data } = await supabase.from("USER_MST").select("auth_id, nickname").in("auth_id", uniqueIds);
  const map = new Map<string, string>();
  (data ?? []).forEach((row: { auth_id: string; nickname: string }) => {
    map.set(row.auth_id, row.nickname || "트레이더");
  });
  return map;
}

export async function hydratePostSummaries(
  supabase: Awaited<ReturnType<typeof createSupabaseRouteHandlerClient>>,
  posts: BoardPostRow[],
  viewerAuthId?: string,
) {
  if (posts.length === 0) return [] as BoardPostSummary[];
  const postIds = posts.map((p) => p.id);
  const authorIds = posts.map((p) => p.author_auth_id);

  const [nicknameMap, commentsRes, likesRes, myLikesRes] = await Promise.all([
    fetchNicknameMap(supabase, authorIds),
    supabase.from("BOARD_COMMENTS").select("post_id").in("post_id", postIds).is("deleted_at", null),
    supabase.from("BOARD_POST_LIKES").select("post_id").in("post_id", postIds),
    viewerAuthId
      ? supabase.from("BOARD_POST_LIKES").select("post_id").in("post_id", postIds).eq("user_auth_id", viewerAuthId)
      : Promise.resolve({ data: [] as Array<{ post_id: string }> }),
  ]);

  const commentCount = new Map<string, number>();
  (commentsRes.data ?? []).forEach((item: { post_id: string }) => {
    commentCount.set(item.post_id, (commentCount.get(item.post_id) ?? 0) + 1);
  });

  const likeCount = new Map<string, number>();
  (likesRes.data ?? []).forEach((item: { post_id: string }) => {
    likeCount.set(item.post_id, (likeCount.get(item.post_id) ?? 0) + 1);
  });

  const likedSet = new Set((myLikesRes.data ?? []).map((item: { post_id: string }) => item.post_id));

  return posts.map((post) => ({
    ...post,
    author_nickname: nicknameMap.get(post.author_auth_id) ?? "트레이더",
    comment_count: commentCount.get(post.id) ?? 0,
    like_count: likeCount.get(post.id) ?? 0,
    liked_by_me: likedSet.has(post.id),
  }));
}

export async function hydrateComments(
  supabase: Awaited<ReturnType<typeof createSupabaseRouteHandlerClient>>,
  comments: BoardCommentRow[],
) {
  const nicknameMap = await fetchNicknameMap(
    supabase,
    comments.map((comment) => comment.author_auth_id),
  );
  return comments.map<BoardCommentView>((comment) => ({
    ...comment,
    author_nickname: nicknameMap.get(comment.author_auth_id) ?? "트레이더",
  }));
}
