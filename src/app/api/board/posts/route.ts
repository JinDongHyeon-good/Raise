import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { apiTranslator, hideError } from "@/lib/server-i18n";
import { hydratePostSummaries, isEmptyHtml, requireSessionUser, sanitizePostHtml } from "@/lib/board-server";
import {
  BOARD_POST_LIST_SELECT,
  BOARD_POST_SELECT,
  isBoardPostType,
  parseBoardSort,
  type BoardPostRow,
} from "@/lib/board-types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const t = apiTranslator(request);
  const { searchParams } = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const author = searchParams.get("author")?.trim() || null;
  const typeParam = searchParams.get("type")?.trim() || null;
  const sort = parseBoardSort(searchParams.get("sort"));
  const q = searchParams.get("q")?.trim().slice(0, 50) || "";
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const { supabase, user } = await requireSessionUser();
    let query = supabase.from("BOARD_POSTS").select(BOARD_POST_LIST_SELECT, { count: "exact" }).is("deleted_at", null);

    if (author) query = query.eq("author_auth_id", author);
    if (typeParam && isBoardPostType(typeParam)) query = query.eq("post_type", typeParam);
    if (q) query = query.ilike("title", `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`);

    if (sort === "popular") query = query.order("like_count", { ascending: false });
    if (sort === "views") query = query.order("view_count", { ascending: false });
    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) return privateJson({ error: hideError(error, t("common.serverError")) }, { status: 500 });

    const items = await hydratePostSummaries(supabase, (data ?? []) as BoardPostRow[], user?.id);
    return privateJson({ items, page, limit, total: count ?? 0 });
  } catch (e) {
    return privateJson({ error: hideError(e, t("board.postsLoadFailed")) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const t = apiTranslator(request);
  try {
    const { supabase, user } = await requireSessionUser();
    if (!user) return privateJson({ error: t("board.loginRequired") }, { status: 401 });

    const body = (await request.json()) as { title?: string; content_html?: string; post_type?: string };
    const title = body.title?.trim() ?? "";
    const contentHtml = sanitizePostHtml(body.content_html ?? "");
    if (!isBoardPostType(body.post_type)) {
      return privateJson({ error: t("board.boardRequired") }, { status: 400 });
    }
    if (!title || isEmptyHtml(contentHtml)) {
      return privateJson({ error: t("board.titleBodyRequired") }, { status: 400 });
    }
    if (contentHtml.length > 100_000) {
      return privateJson({ error: t("board.bodyTooLong") }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("BOARD_POSTS")
      .insert({
        author_auth_id: user.id,
        title: title.slice(0, 120),
        content_html: contentHtml,
        post_type: body.post_type,
      })
      .select(BOARD_POST_SELECT)
      .single<BoardPostRow>();

    if (error) return privateJson({ error: hideError(error, t("common.serverError")) }, { status: 500 });
    const [post] = await hydratePostSummaries(supabase, [data], user.id, { includeContent: true });
    return privateJson({ item: post }, { status: 201 });
  } catch (e) {
    return privateJson({ error: hideError(e, t("board.postCreateFailed")) }, { status: 500 });
  }
}
