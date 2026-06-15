import type { SupabaseClient } from "@supabase/supabase-js";
import { getDefaultNicknameFromUser } from "@/lib/default-nickname";
import { resolveUniqueNicknameCandidate } from "@/lib/nickname-duplicate";

type AuthUserLike = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

export async function ensureUserProfileOnAuth(
  supabase: SupabaseClient,
  userId: string,
  user: AuthUserLike,
): Promise<{ isNewUser: boolean }> {
  const { data: existing, error: profileSelectError } = await supabase
    .from("USER_MST")
    .select("auth_id")
    .eq("auth_id", userId)
    .maybeSingle();

  if (profileSelectError) {
    throw profileSelectError;
  }

  if (existing?.auth_id) {
    return { isNewUser: false };
  }

  const baseNick = getDefaultNicknameFromUser(user);
  const nickname = await resolveUniqueNicknameCandidate(supabase, baseNick, userId);
  const { error: insertError } = await supabase.from("USER_MST").insert({
    auth_id: userId,
    nickname,
    use_count: 0,
  });

  if (insertError) {
    throw insertError;
  }

  return { isNewUser: true };
}
