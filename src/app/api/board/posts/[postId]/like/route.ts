import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { apiTranslator, hideError } from "@/lib/server-i18n";
import { requireSessionUser } from "@/lib/board-server";

async function currentCount(supabase: Awaited<ReturnType<typeof requireSessionUser>>["supabase"], postId: string) {
  const { data } = await supabase.from("BOARD_POSTS").select("like_count").eq("id", postId).maybeSingle<{ like_count: number }>();
  return Number(data?.like_count ?? 0);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const t = apiTranslator(request);
  const { postId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return privateJson({ error: t("board.loginRequired") }, { status: 401 });

    const { error } = await supabase.from("BOARD_POST_LIKES").insert({ post_id: postId, user_auth_id: user.id });
    if (error && error.code !== "23505") return privateJson({ error: hideError(error, t("common.serverError")) }, { status: 500 });
    return privateJson({ liked: true, like_count: await currentCount(supabase, postId) });
  } catch (e) {
    return privateJson({ error: hideError(e, t("board.likeFailed")) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const t = apiTranslator(request);
  const { postId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return privateJson({ error: t("board.loginRequired") }, { status: 401 });
    const { error } = await supabase.from("BOARD_POST_LIKES").delete().eq("post_id", postId).eq("user_auth_id", user.id);
    if (error) return privateJson({ error: hideError(error, t("common.serverError")) }, { status: 500 });
    return privateJson({ liked: false, like_count: await currentCount(supabase, postId) });
  } catch (e) {
    return privateJson({ error: hideError(e, t("board.unlikeFailed")) }, { status: 500 });
  }
}
