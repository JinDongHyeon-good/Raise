import { NextRequest, NextResponse } from "next/server";
import { SlidingRateLimiter } from "@/lib/sliding-rate-limit";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/** 닉네임으로 가입 이메일 찾기 — 이메일을 모으는 데 쓰이지 않도록 IP당 10분에 5번, 항상 가린 형태로만 */
const limiter = new SlidingRateLimiter(5, 10 * 60_000);

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const head = local.slice(0, Math.min(2, Math.max(1, local.length - 1)));
  return `${head}${"*".repeat(Math.max(3, local.length - head.length))}@${domain}`;
}

function escapeIlike(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (!limiter.check(ip).allowed) {
    return NextResponse.json({ error: "잠시 후 다시 시도해 주세요." }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as { nickname?: string };
  const nickname = body.nickname?.trim() ?? "";
  if (nickname.length < 2 || nickname.length > 16) {
    return NextResponse.json({ error: "닉네임을 2~16자로 입력해 주세요." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "지금은 아이디 찾기를 할 수 없어요." }, { status: 503 });

  const { data: profile } = await admin
    .from("USER_MST")
    .select("auth_id")
    .ilike("nickname", escapeIlike(nickname))
    .limit(1)
    .maybeSingle<{ auth_id: string }>();
  if (!profile) return NextResponse.json({ found: false });

  const { data, error } = await admin.auth.admin.getUserById(profile.auth_id);
  if (error || !data.user?.email) return NextResponse.json({ found: false });

  const provider = (data.user.app_metadata?.provider as string | undefined) ?? "email";
  return NextResponse.json({ found: true, email: maskEmail(data.user.email), provider });
}
