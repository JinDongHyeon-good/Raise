import { NextRequest, NextResponse } from "next/server";
import { hydratePostSummaries, requireSessionUser } from "@/lib/board-server";
import type { BoardPostRow } from "@/lib/board-types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(30, Math.max(1, Number(searchParams.get("limit") ?? 15)));
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const { supabase, user } = await requireSessionUser();
    const { data, error, count } = await supabase
      .from("BOARD_POSTS")
      .select("id, author_auth_id, title, content_html, created_at, updated_at", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const items = await hydratePostSummaries(supabase, (data ?? []) as BoardPostRow[], user?.id);
    return NextResponse.json({ items, page, limit, total: count ?? 0 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "게시글 조회 실패" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
      .insert({
        author_auth_id: user.id,
        title: title.slice(0, 120),
        content_html: contentHtml,
      })
      .select("id, author_auth_id, title, content_html, created_at, updated_at")
      .single<BoardPostRow>();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const [post] = await hydratePostSummaries(supabase, [data], user.id);
    return NextResponse.json({ item: post }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "게시글 작성 실패" }, { status: 500 });
  }
}
