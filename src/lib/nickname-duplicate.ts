import type { SupabaseClient } from "@supabase/supabase-js";

function escapeIlikeExact(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

export async function isNicknameTakenByOther(supabase: SupabaseClient, nickname: string, excludeAuthId: string) {
  const trimmed = nickname.trim();
  if (!trimmed) return false;
  const pattern = escapeIlikeExact(trimmed);
  const { data, error } = await supabase
    .from("USER_MST")
    .select("auth_id")
    .neq("auth_id", excludeAuthId)
    .ilike("nickname", pattern)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[nickname-duplicate]", error);
    return true;
  }
  return Boolean(data?.auth_id);
}

export async function resolveUniqueNicknameCandidate(supabase: SupabaseClient, baseRaw: string, excludeAuthId: string) {
  const base = baseRaw.trim() || "트레이더";
  for (let i = 0; i < 40; i += 1) {
    const candidate =
      i === 0 ? base.slice(0, 30) : `${base.slice(0, Math.max(1, 29 - String(i).length))}${i}`.slice(0, 30);
    const taken = await isNicknameTakenByOther(supabase, candidate, excludeAuthId);
    if (!taken) return candidate;
  }
  return `u_${excludeAuthId.replaceAll("-", "").slice(0, 12)}`.slice(0, 30);
}
