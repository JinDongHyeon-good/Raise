import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/brand";
import { localizedSeoPath } from "@/lib/seo-i18n";

const siteUrl = new URL(getSiteUrl());

const STATIC_PATHS = ["/", "/about", "/contact", "/privacy", "/terms"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
      url: new URL(localizedSeoPath(path, locale), siteUrl).toString(),
      lastModified: now,
      changeFrequency: path === "/" ? "daily" : "weekly",
      priority: path === "/" ? 1 : path === "/about" ? 0.8 : 0.6,
      alternates: {
        languages: Object.fromEntries(
          locales.map((alt) => [alt, new URL(localizedSeoPath(path, alt), siteUrl).toString()]),
        ),
      },
    }));

    entries.push(...staticEntries);
  }

  return entries;
}
