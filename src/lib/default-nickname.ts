/** 구글 등 OAuth `user_metadata`·이메일에서 기본 표시 닉네임을 만듭니다. */
export function getDefaultNicknameFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
} | null) {
  if (!user) return "트레이더";
  const userMeta = user.user_metadata ?? {};
  const displayName =
    (typeof userMeta.display_name === "string" && userMeta.display_name.trim()) ||
    (typeof userMeta.full_name === "string" && userMeta.full_name.trim()) ||
    (typeof userMeta.name === "string" && userMeta.name.trim()) ||
    (typeof userMeta.user_name === "string" && userMeta.user_name.trim()) ||
    (typeof userMeta.nickname === "string" && userMeta.nickname.trim()) ||
    (typeof userMeta.preferred_username === "string" && userMeta.preferred_username.trim()) ||
    "";
  if (displayName) return displayName;
  if (user.email) return user.email.split("@")[0] || "트레이더";
  return "트레이더";
}
