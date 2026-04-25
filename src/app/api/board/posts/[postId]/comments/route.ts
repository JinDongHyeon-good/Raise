import { NextRequest, NextResponse } from "next/server";
import { hydrateComments, requireSessionUser } from "@/lib/board-server";
import type { BoardCommentRow } from "@/lib/board-types";

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const body = (await request.json()) as { content?: string };
    const content = body.content?.trim() ?? "";
    if (!content) return NextResponse.json({ error: "댓글 내용을 입력해 주세요." }, { status: 400 });

    const { data, error } = await supabase
      .from("BOARD_COMMENTS")
      .insert({
        post_id: postId,
        author_auth_id: user.id,
        content: content.slice(0, 1000),
      })
      .select("id, post_id, author_auth_id, content, created_at, updated_at")
      .single<BoardCommentRow>();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const [item] = await hydrateComments(supabase, [data]);
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "댓글 작성 실패" }, { status: 500 });
  }
}
