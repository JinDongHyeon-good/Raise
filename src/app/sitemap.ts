import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/brand";
import { buildLanguageAlternates, localizedSeoPath } from "@/lib/seo-i18n";

const siteUrl = new URL(getSiteUrl());

// 색인 대상 공개 페이지만 (로그인 필요한 /dashboard 계열은 제외)
const STATIC_PATHS = ["/", "/saju", "/about", "/contact", "/privacy", "/terms"] as const;

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
      changeFrequency: (path === "/" ? "daily" : "weekly") as "daily" | "weekly",
      priority: path === "/" ? 1 : path === "/saju" ? 0.8 : 0.6,
      alternates: { languages: alternates },
    }));
  });
}
