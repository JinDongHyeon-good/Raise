import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/brand";
import { localizedSeoPath } from "@/lib/seo-i18n";

const siteUrl = new URL(getSiteUrl());

// 색인 대상 공개 페이지만 (로그인 필요한 /dashboard 계열은 제외)
const STATIC_PATHS = ["/", "/saju", "/about", "/contact", "/privacy", "/terms"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return STATIC_PATHS.map((path) => ({
    url: new URL(localizedSeoPath(path), siteUrl).toString(),
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path === "/about" || path === "/saju" ? 0.8 : 0.6,
  }));
}
