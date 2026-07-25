import { NextRequest, NextResponse } from "next/server";
import { hydratePostSummaries, requireSessionUser } from "@/lib/board-server";
import {
  BOARD_POST_SELECT,
  isBoardPostType,
  parseBoardPostType,
  type BoardPostRow,
} from "@/lib/board-types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(30, Math.max(1, Number(searchParams.get("limit") ?? 15)));
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const author = searchParams.get("author")?.trim() || null;
  const typeParam = searchParams.get("type")?.trim() || null;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const { supabase, user } = await requireSessionUser();
    let query = supabase
      .from("BOARD_POSTS")
      .select(BOARD_POST_SELECT, { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (author) {
      query = query.eq("author_auth_id", author);
    }
    if (typeParam && isBoardPostType(typeParam)) {
      query = query.eq("post_type", typeParam);
    }

    const { data, error, count } = await query;

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

    const body = (await request.json()) as { title?: string; content_html?: string; post_type?: string };
    const title = body.title?.trim() ?? "";
    const contentHtml = body.content_html?.trim() ?? "";
    const postType = parseBoardPostType(body.post_type);
    if (!title || !contentHtml || contentHtml === "<p></p>") {
      return NextResponse.json({ error: "제목과 본문을 입력해 주세요." }, { status: 400 });
    }
    if (body.post_type && !isBoardPostType(body.post_type)) {
      return NextResponse.json({ error: "올바른 게시글 타입을 선택해 주세요." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("BOARD_POSTS")
      .insert({
        author_auth_id: user.id,
        title: title.slice(0, 120),
        content_html: contentHtml,
        post_type: postType,
      })
      .select(BOARD_POST_SELECT)
      .single<BoardPostRow>();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const [post] = await hydratePostSummaries(supabase, [data], user.id);
    return NextResponse.json({ item: post }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "게시글 작성 실패" }, { status: 500 });
  }
}
