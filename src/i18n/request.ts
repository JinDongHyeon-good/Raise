import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * 메시지는 기능별 파일로 나눈다: messages/<locale>/<namespace>.json
 * 새 파일을 만들면 여기 목록에 추가할 것.
 */
export const NAMESPACES = ["common", "home", "chart", "video", "summary", "auth", "community", "seo", "legal", "api", "bybit", "faq"] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => [ns, (await import(`../../messages/${locale}/${ns}.json`)).default] as const),
  );

  return { locale, messages: Object.fromEntries(entries) };
});
