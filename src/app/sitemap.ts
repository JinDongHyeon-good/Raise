import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/brand";
import { TAROT_GUIDES } from "@/data/tarot-guides";

const siteUrl = new URL(getSiteUrl());

const STATIC_PATHS = ["/", "/about", "/contact", "/privacy", "/terms", "/guides"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  const guideEntries: MetadataRoute.Sitemap = TAROT_GUIDES.map((guide) => ({
    url: new URL(`/guides/${guide.slug}`, siteUrl).toString(),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...guideEntries];
}
