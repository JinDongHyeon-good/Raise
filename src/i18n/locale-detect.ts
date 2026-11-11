import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, isRoutedLocale, type RoutedLocale } from "./routing";

/**
 * 검색엔진·링크 미리보기 봇 — 이들은 언어 자동 이동을 하지 않는다 (각 언어 주소를 hreflang으로 따로 수집)
 * 네이버(Yeti)·다음(Daum/Daumoa)·카카오톡 미리보기처럼 이름에 "bot"이 없는 국내 크롤러도 포함해야 한다.
 */
const BOT_UA =
  /bot|crawl|spider|slurp|yeti|naver|daum|kakaotalk-scrap|kakao|facebookexternalhit|embedly|preview|lighthouse|headless|google-inspectiontool|mediapartners|adsbot|bingpreview|duckduck|yandex|baidu|petalsearch|applebot|seznam|sogou|360spider/i;

/** 검색엔진·미리보기 봇은 언어를 바꾸지 않는다 (hreflang으로 각 언어 주소를 따로 알려 줌) */
export function isBot(request: NextRequest) {
  return BOT_UA.test(request.headers.get("user-agent") ?? "");
}

/** 방문자 국가 (Amplify/CloudFront·Vercel·Cloudflare 헤더). 모르면 null */
function countryOf(request: NextRequest) {
  return (
    request.headers.get("cloudfront-viewer-country") ??
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    null
  )?.toUpperCase() ?? null;
}

/**
 * 첫 방문 언어: 직접 고른 언어(쿠키) > 국가(한국이면 ko, 그 외 en) > 브라우저 언어 > ko
 */
export function detectLocaleFromRequest(request: NextRequest): RoutedLocale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isRoutedLocale(saved)) return saved;

  const country = countryOf(request);
  if (country) return country === "KR" ? "ko" : "en";

  const accept = (request.headers.get("accept-language") ?? "").toLowerCase();
  if (!accept) return "ko";
  const first = accept.split(",")[0]?.trim() ?? "";
  if (first.startsWith("ko")) return "ko";
  if (accept.includes("ko")) return "ko";
  return "en";
}
