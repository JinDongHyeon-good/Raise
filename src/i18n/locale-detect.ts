import type { NextRequest } from "next/server";
import { defaultLocale, type AppLocale } from "./routing";

/** 한국어 단일 로케일로 통일 */
export function detectLocaleFromRequest(_request: NextRequest): AppLocale {
  return defaultLocale;
}
