/**
 * API 응답 메시지 다국어 — 화면이 아닌 서버(API 라우트)에서 쓰는 문구
 * 문구는 messages/<locale>/api.json 에 있다.
 * 언어 판단: x-ui-locale 헤더 > NEXT_LOCALE 쿠키 > Referer 경로(/en) > Accept-Language > ko
 */
import type { NextRequest } from "next/server";
import koApi from "../../messages/ko/api.json";
import enApi from "../../messages/en/api.json";
import { LOCALE_COOKIE, isRoutedLocale, type RoutedLocale } from "@/i18n/routing";

type Dict = Record<string, unknown>;
const DICTS: Record<RoutedLocale, Dict> = { ko: koApi as Dict, en: enApi as Dict };

export function getApiLocale(request: Request | NextRequest): RoutedLocale {
  const header = request.headers.get("x-ui-locale");
  if (isRoutedLocale(header)) return header;
  const cookie = "cookies" in request ? (request as NextRequest).cookies.get(LOCALE_COOKIE)?.value : undefined;
  if (isRoutedLocale(cookie)) return cookie;
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const path = new URL(referer).pathname;
      if (path === "/en" || path.startsWith("/en/")) return "en";
    } catch {
      // 무시
    }
  }
  const accept = (request.headers.get("accept-language") ?? "").toLowerCase();
  if (accept && !accept.startsWith("ko") && !accept.includes("ko")) return "en";
  return "ko";
}

function lookup(dict: Dict, key: string): string | undefined {
  const value = key.split(".").reduce<unknown>((acc, part) => (acc && typeof acc === "object" ? (acc as Dict)[part] : undefined), dict);
  return typeof value === "string" ? value : undefined;
}

/** apiT(locale, "board.loginRequired", { limit: 5 }) — {limit} 자리 바꿈. 없으면 ko → 키 그대로 */
export function apiT(locale: RoutedLocale, key: string, vars?: Record<string, string | number>) {
  const raw = lookup(DICTS[locale], key) ?? lookup(DICTS.ko, key) ?? key;
  return vars ? raw.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`)) : raw;
}

/** 라우트에서 바로 쓰기: const t = apiTranslator(request); t("board.loginRequired") */
export function apiTranslator(request: Request | NextRequest) {
  const locale = getApiLocale(request);
  const t = (key: string, vars?: Record<string, string | number>) => apiT(locale, key, vars);
  return Object.assign(t, { locale });
}
