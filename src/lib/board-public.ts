import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hydrateComments, hydratePostSummaries } from "@/lib/board-server";
import {
  BOARD_COMMENT_SELECT,
  BOARD_POST_LIST_SELECT,
  BOARD_POST_SELECT,
  type BoardCommentRow,
  type BoardCommentView,
  type BoardPostRow,
  type BoardSort,
  type BoardPostSummary,
  type BoardPostType,
} from "@/lib/board-types";

/**
 * 서버 렌더링용 공개 조회 (세션·쿠키 없이 공개 키로 읽는다).
 * 첫 화면 HTML에 글 목록·본문이 들어가야 검색엔진·AdSense 심사가 내용을 본다.
 * 내 좋아요 여부 같은 개인 정보는 브라우저가 다시 받아 채운다.
 */
function publicClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

type HydrateClient = Parameters<typeof hydratePostSummaries>[0];

export async function fetchPublicPostList(opts: {
  locale: "ko" | "en";
  page: number;
  limit: number;
  sort: BoardSort;
  type: BoardPostType | null;
  q: string;
}): Promise<{ items: BoardPostSummary[]; total: number } | null> {
  const supabase = publicClient();
  if (!supabase) return null;
  try {
    const from = (opts.page - 1) * opts.limit;
    let query = supabase
      .from("BOARD_POSTS")
      .select(BOARD_POST_LIST_SELECT, { count: "exact" })
      .is("deleted_at", null)
      .eq("locale", opts.locale);
    if (opts.type) query = query.eq("post_type", opts.type);
    if (opts.q) query = query.ilike("title", `%${opts.q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`);
    if (opts.sort === "popular") query = query.order("like_count", { ascending: false });
    if (opts.sort === "views") query = query.order("view_count", { ascending: false });
    const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, from + opts.limit - 1);
    if (error) return null;
    const items = await hydratePostSummaries(supabase as unknown as HydrateClient, (data ?? []) as BoardPostRow[]);
    return { items, total: count ?? 0 };
  } catch {
    return null;
  }
}

export async function fetchPublicPost(
  postId: string,
): Promise<{ item: BoardPostSummary; comments: BoardCommentView[]; locale: "ko" | "en" } | null> {
  const supabase = publicClient();
  if (!supabase) return null;
  try {
    const [{ data: post }, { data: comments }] = await Promise.all([
      supabase
        .from("BOARD_POSTS")
        .select(`${BOARD_POST_SELECT}, locale`)
        .eq("id", postId)
        .is("deleted_at", null)
        .maybeSingle<BoardPostRow & { locale: string }>(),
      supabase
        .from("BOARD_COMMENTS")
        .select(BOARD_COMMENT_SELECT)
        .eq("post_id", postId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
    ]);
    if (!post) return null;
    const client = supabase as unknown as HydrateClient;
    const [item] = await hydratePostSummaries(client, [post], undefined, { includeContent: true });
    const commentViews = await hydrateComments(client, (comments ?? []) as BoardCommentRow[]);
    return { item, comments: commentViews, locale: post.locale === "en" ? "en" : "ko" };
  } catch {
    return null;
  }
}
