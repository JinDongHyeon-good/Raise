import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/board-server";

export async function POST(_: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const { error } = await supabase.from("BOARD_POST_LIKES").insert({
      post_id: postId,
      user_auth_id: user.id,
    });
    if (error && !error.message.includes("duplicate key")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ liked: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "좋아요 처리 실패" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    const { error } = await supabase
      .from("BOARD_POST_LIKES")
      .delete()
      .eq("post_id", postId)
      .eq("user_auth_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ liked: false });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "좋아요 취소 실패" }, { status: 500 });
  }
}
