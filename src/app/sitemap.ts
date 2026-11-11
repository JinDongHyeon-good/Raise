import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/brand";

const siteUrl = new URL(getSiteUrl());

const STATIC_PATHS = ["/", "/about", "/contact", "/privacy", "/terms", "/community"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return STATIC_PATHS.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "monthly",
    priority: path === "/" ? 1 : 0.5,
  }));
}
