import { NextRequest, NextResponse } from "next/server";
import { hydrateComments, hydratePostSummaries, requireSessionUser } from "@/lib/board-server";
import {
  BOARD_COMMENT_SELECT,
  BOARD_POST_SELECT,
  isBoardPostType,
  parseBoardPostType,
  type BoardCommentRow,
  type BoardPostRow,
} from "@/lib/board-types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(_: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    const [{ data: post, error: postError }, { data: comments, error: commentError }] = await Promise.all([
      supabase
        .from("BOARD_POSTS")
        .select(BOARD_POST_SELECT)
        .eq("id", postId)
        .is("deleted_at", null)
        .single<BoardPostRow>(),
      supabase
        .from("BOARD_COMMENTS")
        .select(BOARD_COMMENT_SELECT)
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
    const body = (await request.json()) as { title?: string; content_html?: string; post_type?: string };
    const title = body.title?.trim() ?? "";
    const contentHtml = body.content_html?.trim() ?? "";
    const postType = body.post_type ? parseBoardPostType(body.post_type) : null;
    if (!title || !contentHtml || contentHtml === "<p></p>") {
      return NextResponse.json({ error: "제목과 본문을 입력해 주세요." }, { status: 400 });
    }
    if (body.post_type && !isBoardPostType(body.post_type)) {
      return NextResponse.json({ error: "올바른 게시글 타입을 선택해 주세요." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("BOARD_POSTS")
      .update({
        title: title.slice(0, 120),
        content_html: contentHtml,
        ...(postType ? { post_type: postType } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("author_auth_id", user.id)
      .is("deleted_at", null)
      .select(BOARD_POST_SELECT)
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
