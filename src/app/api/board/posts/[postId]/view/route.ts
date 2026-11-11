import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiTranslator } from "@/lib/server-i18n";
import { getSupabaseAdminClient, requireSessionUser } from "@/lib/board-server";

export const runtime = "nodejs";

const VISITOR_COOKIE = "rz_vid";
const UUID_RE = /^[0-9a-f-]{36}$/i;

/**
 * 조회수 등록. 같은 사람(로그인 사용자 id, 비로그인은 방문자 쿠키)은 하루(KST)에 한 번만 오른다.
 * 증가는 DB 함수에서 원자적으로 처리하고 최신 조회수를 돌려준다.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const t = apiTranslator(request);
  const { postId } = await params;
  if (!UUID_RE.test(postId)) return NextResponse.json({ error: t("board.invalidPost") }, { status: 400 });

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: t("board.viewUnavailable") }, { status: 503 });
  }

  const { user } = await requireSessionUser();
  let visitorId = request.cookies.get(VISITOR_COOKIE)?.value ?? "";
  const issueCookie = !UUID_RE.test(visitorId);
  if (issueCookie) visitorId = randomUUID();

  const viewerKey = user ? `u:${user.id}` : `v:${visitorId}`;
  const { data, error } = await admin.rpc("board_register_view", { p_post_id: postId, p_viewer_key: viewerKey });
  if (error) {
    console.error("[board/view]", error.message);
    return NextResponse.json({ error: t("board.viewFailed") }, { status: 500 });
  }

  const response = NextResponse.json({ view_count: Number(data ?? 0) });
  if (issueCookie) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return response;
}
