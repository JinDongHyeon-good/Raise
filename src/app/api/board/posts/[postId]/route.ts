import { NextRequest, NextResponse } from "next/server";
import { hydrateComments, hydratePostSummaries, requireSessionUser } from "@/lib/board-server";
import type { BoardCommentRow, BoardPostRow } from "@/lib/board-types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(_: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    const [{ data: post, error: postError }, { data: comments, error: commentError }] = await Promise.all([
      supabase
        .from("BOARD_POSTS")
        .select("id, author_auth_id, title, content_html, created_at, updated_at")
        .eq("id", postId)
        .is("deleted_at", null)
        .single<BoardPostRow>(),
      supabase
        .from("BOARD_COMMENTS")
        .select("id, post_id, author_auth_id, content, created_at, updated_at")
        .eq("post_id", postId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
    ]);

    if (postError) return NextResponse.json({ error: postError.message }, { status: 404 });
    if (commentError) return NextResponse.json({ error: commentError.message }, { status: 500 });

    const [item] = await hydratePostSummaries(supabase, [post], user?.id);
    const commentViews = await hydrateComments(supabase, (comments ?? []) as BoardCommentRow[]);
    return NextResponse.json({ item, comments: commentViews });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "게시글 상세 조회 실패" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    const body = (await request.json()) as { title?: string; content_html?: string };
    const title = body.title?.trim() ?? "";
    const contentHtml = body.content_html?.trim() ?? "";
    if (!title || !contentHtml) {
      return NextResponse.json({ error: "제목과 본문을 입력해 주세요." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("BOARD_POSTS")
      .update({
        title: title.slice(0, 120),
        content_html: contentHtml,
      })
      .eq("id", postId)
      .eq("author_auth_id", user.id)
      .is("deleted_at", null)
      .select("id, author_auth_id, title, content_html, created_at, updated_at")
      .maybeSingle<BoardPostRow>();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });

    const [item] = await hydratePostSummaries(supabase, [data], user.id);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "게시글 수정 실패" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    const { error } = await supabase
      .from("BOARD_POSTS")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", postId)
      .eq("author_auth_id", user.id)
      .is("deleted_at", null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "게시글 삭제 실패" }, { status: 500 });
  }
}
