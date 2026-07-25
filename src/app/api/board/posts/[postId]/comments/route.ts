import { NextRequest, NextResponse } from "next/server";
import { hydrateComments, requireSessionUser } from "@/lib/board-server";
import { BOARD_COMMENT_SELECT, type BoardCommentRow } from "@/lib/board-types";

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const body = (await request.json()) as { content?: string; parent_id?: string | null };
    const content = body.content?.trim() ?? "";
    const parentId = body.parent_id?.trim() || null;
    if (!content) return NextResponse.json({ error: "댓글 내용을 입력해 주세요." }, { status: 400 });

    if (parentId) {
      const { data: parent, error: parentError } = await supabase
        .from("BOARD_COMMENTS")
        .select("id, post_id, parent_id")
        .eq("id", parentId)
        .is("deleted_at", null)
        .maybeSingle<{ id: string; post_id: string; parent_id: string | null }>();

      if (parentError) return NextResponse.json({ error: parentError.message }, { status: 500 });
      if (!parent || parent.post_id !== postId) {
        return NextResponse.json({ error: "답글 대상 댓글을 찾을 수 없습니다." }, { status: 400 });
      }
      if (parent.parent_id) {
        return NextResponse.json({ error: "대댓글에는 다시 답글을 달 수 없습니다." }, { status: 400 });
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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const [item] = await hydrateComments(supabase, [data]);
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "댓글 작성 실패" }, { status: 500 });
  }
}
