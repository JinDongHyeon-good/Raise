import { NextRequest, NextResponse } from "next/server";
import { apiTranslator } from "@/lib/server-i18n";
import { hydrateComments, requireSessionUser } from "@/lib/board-server";
import { BOARD_COMMENT_SELECT, type BoardCommentRow } from "@/lib/board-types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  const t = apiTranslator(request);
  const { commentId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return NextResponse.json({ error: t("board.loginRequired") }, { status: 401 });

    const body = (await request.json()) as { content?: string };
    const content = body.content?.trim() ?? "";
    if (!content) return NextResponse.json({ error: t("board.commentRequired") }, { status: 400 });

    const { data, error } = await supabase
      .from("BOARD_COMMENTS")
      .update({
        content: content.slice(0, 1000),
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .eq("author_auth_id", user.id)
      .is("deleted_at", null)
      .select(BOARD_COMMENT_SELECT)
      .maybeSingle<BoardCommentRow>();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: t("board.noEditPermission") }, { status: 403 });

    const [item] = await hydrateComments(supabase, [data], user.id);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : t("board.commentUpdateFailed") }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  const t = apiTranslator(request);
  const { commentId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return NextResponse.json({ error: t("board.loginRequired") }, { status: 401 });

    const { error } = await supabase
      .from("BOARD_COMMENTS")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", commentId)
      .eq("author_auth_id", user.id)
      .is("deleted_at", null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : t("board.commentDeleteFailed") }, { status: 500 });
  }
}
