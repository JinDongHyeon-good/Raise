import { getPublicSiteOrigin } from "@/lib/site-origin";

function getSafeNextPath(raw: string | null | undefined) {
  if (!raw) return "/";
  // "/" 로 시작하는 같은 사이트 경로만. "//", "/\\", 제어문자는 다른 사이트로 해석될 수 있어 거절
  if (!raw.startsWith("/") || raw.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(raw)) return "/";
  try {
    const base = "https://same-origin.invalid";
    const url = new URL(raw, base);
    if (url.origin !== base) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
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
