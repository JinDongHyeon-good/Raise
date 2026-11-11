/**
 * 로그인 세션을 읽는 API 응답 전용.
 *
 * 세션을 읽는 라우트는 (1) 사용자마다 내용이 다르고 (2) 토큰이 만료 직전이면 새 토큰을
 * Set-Cookie 로 실어 보낸다. 이런 응답이 CDN·프록시에 캐시되면 다른 사용자가 남의 응답이나
 * 남의 로그인 쿠키를 받게 된다 → 세션이 섞인다.
 * 그래서 세션을 쓰는 라우트는 NextResponse.json 대신 이 함수로 응답하고, 항상 캐시 금지로 보낸다.
 */
import { NextResponse } from "next/server";

export const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
} as const;

export function privateJson<T>(body: T, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  // 라우트가 다른 캐시 값을 줬더라도 세션 응답은 항상 캐시 금지
  headers.set("Cache-Control", PRIVATE_HEADERS["Cache-Control"]);
  headers.set("Vary", PRIVATE_HEADERS.Vary);
  return NextResponse.json(body, { ...init, headers });
}

/** 세션 쿠키를 심는 리다이렉트 (로그인 콜백 등) */
export function privateRedirect(url: string | URL, status = 302) {
  const res = NextResponse.redirect(url, status);
  res.headers.set("Cache-Control", PRIVATE_HEADERS["Cache-Control"]);
  res.headers.set("Vary", PRIVATE_HEADERS.Vary);
  return res;
}
