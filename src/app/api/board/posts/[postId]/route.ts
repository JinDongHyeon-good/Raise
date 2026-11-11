import { NextRequest, NextResponse } from "next/server";
import { apiTranslator } from "@/lib/server-i18n";
import {
  hydrateComments,
  hydratePostSummaries,
  isEmptyHtml,
  requireSessionUser,
  sanitizePostHtml,
} from "@/lib/board-server";
import {
  BOARD_COMMENT_SELECT,
  BOARD_POST_SELECT,
  isBoardPostType,
  type BoardCommentRow,
  type BoardPostRow,
} from "@/lib/board-types";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const t = apiTranslator(request);
  const { postId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    const [{ data: post, error: postError }, { data: comments, error: commentError }] = await Promise.all([
      supabase.from("BOARD_POSTS").select(BOARD_POST_SELECT).eq("id", postId).is("deleted_at", null).maybeSingle<BoardPostRow>(),
      supabase
        .from("BOARD_COMMENTS")
        .select(BOARD_COMMENT_SELECT)
        .eq("post_id", postId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
    ]);

    if (postError) return NextResponse.json({ error: postError.message }, { status: 500 });
    if (!post) return NextResponse.json({ error: t("board.postNotFound") }, { status: 404 });
    if (commentError) return NextResponse.json({ error: commentError.message }, { status: 500 });

    const [item] = await hydratePostSummaries(supabase, [post], user?.id, { includeContent: true });
    const commentViews = await hydrateComments(supabase, (comments ?? []) as BoardCommentRow[], user?.id);
    return NextResponse.json(
      { item, comments: commentViews, me: user?.id ?? null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : t("board.postLoadFailed") }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const t = apiTranslator(request);
  const { postId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return NextResponse.json({ error: t("board.loginRequired") }, { status: 401 });
    const body = (await request.json()) as { title?: string; content_html?: string; post_type?: string };
    const title = body.title?.trim() ?? "";
    const contentHtml = sanitizePostHtml(body.content_html ?? "");
    if (body.post_type && !isBoardPostType(body.post_type)) {
      return NextResponse.json({ error: t("board.validBoardRequired") }, { status: 400 });
    }
    if (!title || isEmptyHtml(contentHtml)) {
      return NextResponse.json({ error: t("board.titleBodyRequired") }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("BOARD_POSTS")
      .update({
        title: title.slice(0, 120),
        content_html: contentHtml,
        ...(body.post_type ? { post_type: body.post_type } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("author_auth_id", user.id)
      .is("deleted_at", null)
      .select(BOARD_POST_SELECT)
      .maybeSingle<BoardPostRow>();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: t("board.noEditPermission") }, { status: 403 });

    const [item] = await hydratePostSummaries(supabase, [data], user.id, { includeContent: true });
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : t("board.postUpdateFailed") }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const t = apiTranslator(request);
  const { postId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return NextResponse.json({ error: t("board.loginRequired") }, { status: 401 });
    const { data, error } = await supabase
      .from("BOARD_POSTS")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", postId)
      .eq("author_auth_id", user.id)
      .is("deleted_at", null)
      .select("id");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) return NextResponse.json({ error: t("board.noDeletePermission") }, { status: 403 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : t("board.postDeleteFailed") }, { status: 500 });
  }
}
