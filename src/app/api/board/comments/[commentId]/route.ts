import { NextRequest, NextResponse } from "next/server";
import { hydrateComments, requireSessionUser } from "@/lib/board-server";
import type { BoardCommentRow } from "@/lib/board-types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  const { commentId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const body = (await request.json()) as { content?: string };
    const content = body.content?.trim() ?? "";
    if (!content) return NextResponse.json({ error: "댓글 내용을 입력해 주세요." }, { status: 400 });

    const { data, error } = await supabase
      .from("BOARD_COMMENTS")
      .update({ content: content.slice(0, 1000) })
      .eq("id", commentId)
      .eq("author_auth_id", user.id)
      .is("deleted_at", null)
      .select("id, post_id, author_auth_id, content, created_at, updated_at")
      .maybeSingle<BoardCommentRow>();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });

    const [item] = await hydrateComments(supabase, [data]);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "댓글 수정 실패" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  const { commentId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const { error } = await supabase
      .from("BOARD_COMMENTS")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", commentId)
      .eq("author_auth_id", user.id)
      .is("deleted_at", null);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "댓글 삭제 실패" }, { status: 500 });
  }
}
