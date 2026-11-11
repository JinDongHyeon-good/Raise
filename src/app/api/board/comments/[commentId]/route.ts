import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { apiTranslator, hideError } from "@/lib/server-i18n";
import { hydrateComments, requireSessionUser } from "@/lib/board-server";
import { BOARD_COMMENT_SELECT, type BoardCommentRow } from "@/lib/board-types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  const t = apiTranslator(request);
  const { commentId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return privateJson({ error: t("board.loginRequired") }, { status: 401 });

    const body = (await request.json()) as { content?: string };
    const content = body.content?.trim() ?? "";
    if (!content) return privateJson({ error: t("board.commentRequired") }, { status: 400 });

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

    if (error) return privateJson({ error: hideError(error, t("common.serverError")) }, { status: 500 });
    if (!data) return privateJson({ error: t("board.noEditPermission") }, { status: 403 });

    const [item] = await hydrateComments(supabase, [data], user.id);
    return privateJson({ item });
  } catch (e) {
    return privateJson({ error: hideError(e, t("board.commentUpdateFailed")) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  const t = apiTranslator(request);
  const { commentId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return privateJson({ error: t("board.loginRequired") }, { status: 401 });

    const { error } = await supabase
      .from("BOARD_COMMENTS")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", commentId)
      .eq("author_auth_id", user.id)
      .is("deleted_at", null);

    if (error) return privateJson({ error: hideError(error, t("common.serverError")) }, { status: 500 });
    return privateJson({ ok: true });
  } catch (e) {
    return privateJson({ error: hideError(e, t("board.commentDeleteFailed")) }, { status: 500 });
  }
}
