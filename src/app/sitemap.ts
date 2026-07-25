import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/brand";
import { localizedSeoPath } from "@/lib/seo-i18n";

const siteUrl = new URL(getSiteUrl());

const STATIC_PATHS = ["/", "/about", "/contact", "/privacy", "/terms", "/pickleball", "/dashboard", "/dashboard/board"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return STATIC_PATHS.map((path) => ({
    url: new URL(localizedSeoPath(path), siteUrl).toString(),
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path === "/about" || path === "/pickleball" ? 0.8 : 0.6,
  }));
}
