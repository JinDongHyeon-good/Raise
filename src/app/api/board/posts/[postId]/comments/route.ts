import { NextRequest, NextResponse } from "next/server";
import { apiTranslator, hideError } from "@/lib/server-i18n";
import { hydrateComments, requireSessionUser } from "@/lib/board-server";
import { BOARD_COMMENT_SELECT, type BoardCommentRow } from "@/lib/board-types";

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const t = apiTranslator(request);
  const { postId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return NextResponse.json({ error: t("board.loginRequired") }, { status: 401 });

    const body = (await request.json()) as { content?: string; parent_id?: string | null };
    const content = body.content?.trim() ?? "";
    const parentId = body.parent_id?.trim() || null;
    if (!content) return NextResponse.json({ error: t("board.commentRequired") }, { status: 400 });

    const { data: post } = await supabase
      .from("BOARD_POSTS")
      .select("id")
      .eq("id", postId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!post) return NextResponse.json({ error: t("board.postNotFound") }, { status: 404 });

    if (parentId) {
      const { data: parent, error: parentError } = await supabase
        .from("BOARD_COMMENTS")
        .select("id, post_id, parent_id")
        .eq("id", parentId)
        .is("deleted_at", null)
        .maybeSingle<{ id: string; post_id: string; parent_id: string | null }>();

      if (parentError) return NextResponse.json({ error: parentError.message }, { status: 500 });
      if (!parent || parent.post_id !== postId) {
        return NextResponse.json({ error: t("board.parentCommentNotFound") }, { status: 400 });
      }
      if (parent.parent_id) {
        return NextResponse.json({ error: t("board.nestedReplyNotAllowed") }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from("BOARD_COMMENTS")
      .insert({
        post_id: postId,
        author_auth_id: user.id,
        parent_id: parentId,
        content: content.slice(0, 1000),
      })
      .select(BOARD_COMMENT_SELECT)
      .single<BoardCommentRow>();

    if (error) return NextResponse.json({ error: hideError(error, t("common.serverError")) }, { status: 500 });
    const [item] = await hydrateComments(supabase, [data], user.id);
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: hideError(e, t("board.commentCreateFailed")) }, { status: 500 });
  }
}
