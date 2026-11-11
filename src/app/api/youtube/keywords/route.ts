import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { apiTranslator } from "@/lib/server-i18n";
import { requireSessionUser } from "@/lib/board-server";

export const runtime = "nodejs";

/** supabase/sql/search_keywords.sql 과 맞출 것 */
const MAX_KEYWORDS = 20;
const MAX_LENGTH = 40;

type KeywordRow = { id: number; keyword: string };

function normalize(raw: unknown) {
  return typeof raw === "string" ? raw.replace(/\s+/g, " ").trim().slice(0, MAX_LENGTH) : "";
}

/** 내 검색 키워드 목록 (추가한 순서) */
export async function GET(request: NextRequest) {
  const t = apiTranslator(request);
  const { supabase, user } = await requireSessionUser();
  if (!user) return privateJson({ error: t("searchKeywords.loginRequired"), code: "login_required" }, { status: 401 });
  const { data, error } = await supabase
    .from("SEARCH_KEYWORDS")
    .select("id, keyword")
    .eq("user_auth_id", user.id)
    .order("created_at", { ascending: true })
    .limit(MAX_KEYWORDS);
  if (error) {
    console.error("[search-keywords] list", error.message);
    return privateJson({ error: t("searchKeywords.failed") }, { status: 500 });
  }
  return privateJson({ items: (data ?? []) as KeywordRow[] }, { headers: { "Cache-Control": "no-store" } });
}

/** 키워드 추가 { keyword } */
export async function POST(request: NextRequest) {
  const t = apiTranslator(request);
  const { supabase, user } = await requireSessionUser();
  if (!user) return privateJson({ error: t("searchKeywords.loginRequired"), code: "login_required" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { keyword?: unknown };
  const keyword = normalize(body.keyword);
  if (!keyword) return privateJson({ error: t("searchKeywords.empty"), code: "empty" }, { status: 400 });

  const { data, error } = await supabase
    .from("SEARCH_KEYWORDS")
    .insert({ user_auth_id: user.id, keyword })
    .select("id, keyword")
    .single<KeywordRow>();
  if (error) {
    if (error.code === "23505") return privateJson({ error: t("searchKeywords.duplicate"), code: "duplicate" }, { status: 409 });
    if (error.message.includes("limit reached")) {
      return privateJson({ error: t("searchKeywords.full", { max: MAX_KEYWORDS }), code: "full" }, { status: 409 });
    }
    console.error("[search-keywords] insert", error.message);
    return privateJson({ error: t("searchKeywords.failed") }, { status: 500 });
  }
  return privateJson({ item: data }, { status: 201 });
}

/** 키워드 삭제 ?id= */
export async function DELETE(request: NextRequest) {
  const t = apiTranslator(request);
  const { supabase, user } = await requireSessionUser();
  if (!user) return privateJson({ error: t("searchKeywords.loginRequired"), code: "login_required" }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) return privateJson({ error: t("searchKeywords.failed") }, { status: 400 });
  const { error } = await supabase.from("SEARCH_KEYWORDS").delete().eq("user_auth_id", user.id).eq("id", id);
  if (error) {
    console.error("[search-keywords] delete", error.message);
    return privateJson({ error: t("searchKeywords.failed") }, { status: 500 });
  }
  return privateJson({ ok: true });
}
