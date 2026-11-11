import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/board-server";

async function currentCount(supabase: Awaited<ReturnType<typeof requireSessionUser>>["supabase"], postId: string) {
  const { data } = await supabase.from("BOARD_POSTS").select("like_count").eq("id", postId).maybeSingle<{ like_count: number }>();
  return Number(data?.like_count ?? 0);
}

export async function POST(_: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const { error } = await supabase.from("BOARD_POST_LIKES").insert({ post_id: postId, user_auth_id: user.id });
    if (error && error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ liked: true, like_count: await currentCount(supabase, postId) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "좋아요 처리 실패" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    const { error } = await supabase.from("BOARD_POST_LIKES").delete().eq("post_id", postId).eq("user_auth_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ liked: false, like_count: await currentCount(supabase, postId) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "좋아요 취소 실패" }, { status: 500 });
  }
}
