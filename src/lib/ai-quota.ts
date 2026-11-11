/**
 * AI 기능 사용 제한·악용 방지 (영상 요약, 차트 분석 공통)
 *
 * guardAiRequest 한 번으로 다음을 확인한다:
 *   - 다른 사이트에서 보낸 요청 거절 (Origin 확인)
 *   - 로그인 + 이메일 인증된 계정만 (Google 로그인은 인증된 것으로 침)
 *   - DB 함수 ai_consume (supabase/sql/ai_abuse_guard.sql) 로 하루(KST) 한도를 한 번에 확인·기록
 *       사용자당 AI_DAILY_LIMIT, IP당 AI_IP_DAILY_LIMIT, 서비스 전체 AI_GLOBAL_DAILY_LIMIT, 차단 목록
 *     같은 날 같은 대상(같은 영상 등)은 다시 세지 않는다.
 * 확인할 수 없으면 허용하지 않는다 (fail closed).
 */
import { createHash } from "node:crypto";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { apiTranslator } from "@/lib/server-i18n";

export const AI_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 5;
const AI_IP_DAILY_LIMIT = Number(process.env.AI_IP_DAILY_LIMIT) || 10;
const AI_GLOBAL_DAILY_LIMIT = Number(process.env.AI_GLOBAL_DAILY_LIMIT) || 2000;

export type AiFeature = "video-summary" | "chart-analysis";

type ConsumeReason = "ok" | "repeat" | "blocked" | "user_limit" | "ip_limit" | "global_limit";
export type AiQuotaResult = { allowed: boolean; used: number; limit: number; repeat: boolean; reason: ConsumeReason };

export class AiQuotaUnavailableError extends Error {}

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
}

/** IP 원문 대신 저장하는 해시 (서버 비밀값을 섞어 되돌릴 수 없게) */
function ipHash(ip: string) {
  if (!ip) return null;
  const salt = process.env.AI_IP_SALT || process.env.VIDEO_SUMMARY_WORKER_SECRET || "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // 같은 사이트의 일부 요청은 Origin이 없다 — 아래 로그인 확인으로 막힌다
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  try {
    const o = new URL(origin).host.toLowerCase().replace(/^www\./, "");
    return o === host.toLowerCase().replace(/^www\./, "");
  } catch {
    return false;
  }
}

function isVerified(user: User) {
  return Boolean(user.email_confirmed_at || user.confirmed_at || user.app_metadata?.provider === "google");
}

export async function consumeAiQuota(
  userId: string,
  feature: AiFeature,
  itemKey: string,
  hashedIp: string | null = null,
): Promise<AiQuotaResult> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new AiQuotaUnavailableError("SUPABASE_SECRET_KEY가 없습니다.");
  const { data, error } = await admin.rpc("ai_consume", {
    p_user: userId,
    p_feature: feature,
    p_item: itemKey.slice(0, 200),
    p_limit: AI_DAILY_LIMIT,
    p_ip_hash: hashedIp,
    p_ip_limit: AI_IP_DAILY_LIMIT,
    p_global_limit: AI_GLOBAL_DAILY_LIMIT,
  });
  if (error) {
    console.error("[ai-quota]", error.message);
    throw new AiQuotaUnavailableError(error.message);
  }
  return data as AiQuotaResult;
}

/** 막힌 이유별 안내 문구 키 (messages/<locale>/api.json 의 aiQuota.*) */
const DENY_MESSAGES: Record<Exclude<ConsumeReason, "ok" | "repeat">, string> = {
  user_limit: "aiQuota.userLimit",
  ip_limit: "aiQuota.ipLimit",
  global_limit: "aiQuota.globalLimit",
  blocked: "aiQuota.blocked",
};

/**
 * AI 요청 공통 관문. 통과하면 { ok: true, quota }, 막히면 { ok: false, response } (그대로 반환하면 됨)
 */
export async function guardAiRequest(
  request: NextRequest,
  user: User | null,
  feature: AiFeature,
  itemKey: string,
): Promise<{ ok: true; quota: AiQuotaResult } | { ok: false; response: NextResponse }> {
  const t = apiTranslator(request);
  if (!isSameOrigin(request)) {
    return { ok: false, response: NextResponse.json({ error: t("aiQuota.crossSite") }, { status: 403 }) };
  }
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: t("aiQuota.loginRequired"), code: "login_required" }, { status: 401 }),
    };
  }
  if (!isVerified(user)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: t("aiQuota.emailUnverified"), code: "email_unverified" },
        { status: 403 },
      ),
    };
  }
  try {
    const quota = await consumeAiQuota(user.id, feature, itemKey, ipHash(clientIp(request)));
    if (!quota.allowed) {
      const reason = (quota.reason in DENY_MESSAGES ? quota.reason : "user_limit") as keyof typeof DENY_MESSAGES;
      if (reason !== "user_limit") console.warn(`[ai-guard] denied ${reason}`, { user: user.id, feature });
      return {
        ok: false,
        response: NextResponse.json(
          { error: t(DENY_MESSAGES[reason], { limit: AI_DAILY_LIMIT }), code: reason === "user_limit" ? "ai_quota_exceeded" : `ai_${reason}`, quota },
          { status: reason === "blocked" ? 403 : 429 },
        ),
      };
    }
    return { ok: true, quota };
  } catch (error) {
    if (error instanceof AiQuotaUnavailableError) {
      return {
        ok: false,
        response: NextResponse.json({ error: t("aiQuota.unavailable") }, { status: 503 }),
      };
    }
    throw error;
  }
}

function kstToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

/** 오늘 사용한 횟수 (표시용). 확인 못 하면 null */
export async function getAiUsage(userId: string): Promise<{ used: number; limit: number } | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;
  const { count, error } = await admin
    .from("AI_USAGE")
    .select("item_key", { count: "exact", head: true })
    .eq("user_auth_id", userId)
    .eq("used_on", kstToday());
  if (error) return null;
  return { used: count ?? 0, limit: AI_DAILY_LIMIT };
}
