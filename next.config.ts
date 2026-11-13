import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * 보안 헤더
 * - 다른 사이트가 이 사이트를 iframe 으로 감싸지 못하게 (클릭재킹)
 * - HTTPS 고정, MIME 추측 금지, 리퍼러 최소화, 카메라·마이크 등 차단
 * - CSP 는 우선 "Report-Only" (위반을 막지 않고 콘솔에만 알림): AdSense 가 쓰는 주소가 바뀔 수 있어
 *   1~2주 문제없으면 키 이름을 Content-Security-Policy 로 바꿔 적용한다.
 *   Next.js·AdSense 가 인라인 스크립트를 써서 'unsafe-inline' 이 필요 — 글 본문 XSS 는 서버 정화로 막는다.
 */
const supabaseOrigin = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.adtrafficquality.google https://fundingchoicesmessages.google.com https://www.googletagservices.com https://partner.googleadservices.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseOrigin.replace("https://", "wss://")} https://*.googlesyndication.com https://*.google.com https://*.adtrafficquality.google https://*.doubleclick.net`,
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://*.googlesyndication.com https://*.doubleclick.net https://www.google.com https://*.adtrafficquality.google",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // autoplay·encrypted-media·fullscreen·picture-in-picture 는 막지 않는다 (YouTube 재생에 필요)
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
