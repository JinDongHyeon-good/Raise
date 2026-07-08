import type { NextRequest } from "next/server";
import { type AppLocale, defaultLocale, isAppLocale } from "./routing";

const COUNTRY_TO_LOCALE: Record<string, AppLocale> = {
  KR: "ko",
  JP: "ja",
};

export function detectLocaleFromRequest(request: NextRequest): AppLocale {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (isAppLocale(cookieLocale)) {
    return cookieLocale;
  }

  const country =
    request.headers.get("x-vercel-ip-country")?.toUpperCase() ||
    request.headers.get("cf-ipcountry")?.toUpperCase() ||
    "";

  if (country && COUNTRY_TO_LOCALE[country]) {
    return COUNTRY_TO_LOCALE[country];
  }

  if (country && country !== "KR" && country !== "JP") {
    return "en";
  }

  const acceptLanguage = request.headers.get("accept-language")?.toLowerCase() ?? "";
  if (acceptLanguage.includes("ja")) return "ja";
  if (acceptLanguage.includes("ko")) return "ko";
  if (acceptLanguage.includes("en")) return "en";

  return defaultLocale;
}
