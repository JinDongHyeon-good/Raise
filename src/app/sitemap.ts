import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/brand";
import { buildLanguageAlternates, localizedSeoPath } from "@/lib/seo-i18n";

const siteUrl = new URL(getSiteUrl());

// 색인 대상 공개 페이지. 오늘의 운세·사주팔자·궁합 세 툴 페이지는 로그인 없이도
// 폼·설명이 그대로 보이는 공개 콘텐츠라 robots.ts에서 개별 allow로 열어 두고 여기도 포함한다.
const STATIC_PATHS = [
  "/",
  "/saju",
  "/dashboard/today",
  "/dashboard/saju",
  "/dashboard/gunghap",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
] as const;

const HIGH_PRIORITY_PATHS = new Set<string>(["/saju", "/dashboard/today", "/dashboard/saju", "/dashboard/gunghap"]);

function abs(path: string) {
  return new URL(path, siteUrl).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return STATIC_PATHS.flatMap((path) => {
    // hreflang 대체 링크는 모든 로케일 항목에 동일하게 붙인다
    const alternates = Object.fromEntries(
      Object.entries(buildLanguageAlternates(path)).map(([lang, p]) => [lang, abs(p)]),
    );

    return locales.map((locale) => ({
      url: abs(localizedSeoPath(path, locale)),
      lastModified: now,
      changeFrequency: (path === "/" || path === "/dashboard/today" ? "daily" : "weekly") as
        | "daily"
        | "weekly",
      priority: path === "/" ? 1 : HIGH_PRIORITY_PATHS.has(path) ? 0.8 : 0.6,
      alternates: { languages: alternates },
    }));
  });
}
