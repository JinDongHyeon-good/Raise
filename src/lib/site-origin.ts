/**
 * OAuth redirect 등 공개 URL이 필요할 때 사용합니다.
 * 운영 빌드에 로컬 origin이 박히는 문제를 막기 위해 NEXT_PUBLIC_SITE_URL을 우선합니다.
 */
export function getPublicSiteOrigin() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      const withScheme = raw.includes("://") ? raw : `https://${raw}`;
      return new URL(withScheme.replace(/\/$/, "")).origin;
    } catch {
      // fall through
    }
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://jjindong.com";
}
