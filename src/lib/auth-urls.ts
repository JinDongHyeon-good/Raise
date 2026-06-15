import { getPublicSiteOrigin } from "@/lib/site-origin";

function getSafeNextPath(next?: string) {
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

/** 이메일 인증·OAuth 완료 후 돌아올 콜백 URL (로컬/운영 모두 origin 기준) */
export function getAuthCallbackUrl(next = "/") {
  const url = new URL("/auth/callback", getPublicSiteOrigin());
  url.searchParams.set("next", getSafeNextPath(next));
  return url.toString();
}

/** 비밀번호 재설정 메일 링크 목적지 */
export function getPasswordResetUrl() {
  return new URL("/auth/reset-password", getPublicSiteOrigin()).toString();
}
