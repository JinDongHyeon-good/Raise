import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { apiTranslator, hideError } from "@/lib/server-i18n";
import { requireSessionUser } from "@/lib/board-server";

async function currentCount(supabase: Awaited<ReturnType<typeof requireSessionUser>>["supabase"], commentId: string) {
  const { data } = await supabase
    .from("BOARD_COMMENTS")
    .select("like_count")
    .eq("id", commentId)
    .maybeSingle<{ like_count: number }>();
  return Number(data?.like_count ?? 0);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  const t = apiTranslator(request);
  const { commentId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return privateJson({ error: t("board.loginRequired") }, { status: 401 });
    const { error } = await supabase.from("BOARD_COMMENT_LIKES").insert({ comment_id: commentId, user_auth_id: user.id });
    if (error && error.code !== "23505") return privateJson({ error: hideError(error, t("common.serverError")) }, { status: 500 });
    return privateJson({ liked: true, like_count: await currentCount(supabase, commentId) });
  } catch (e) {
    return privateJson({ error: hideError(e, t("board.likeFailed")) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  const t = apiTranslator(request);
  const { commentId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return privateJson({ error: t("board.loginRequired") }, { status: 401 });
    const { error } = await supabase
      .from("BOARD_COMMENT_LIKES")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_auth_id", user.id);
    if (error) return privateJson({ error: hideError(error, t("common.serverError")) }, { status: 500 });
    return privateJson({ liked: false, like_count: await currentCount(supabase, commentId) });
  } catch (e) {
    return privateJson({ error: hideError(e, t("board.unlikeFailed")) }, { status: 500 });
  }
}
