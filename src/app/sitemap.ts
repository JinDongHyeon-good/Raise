import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { getTarotGuides, getTarotTopicPages } from "@/data/tarot-content-i18n";
import { getSiteUrl } from "@/lib/brand";
import { localizedSeoPath } from "@/lib/seo-i18n";

const siteUrl = new URL(getSiteUrl());

const STATIC_PATHS = ["/", "/about", "/contact", "/privacy", "/terms", "/guides", "/topics"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
      url: new URL(localizedSeoPath(path, locale), siteUrl).toString(),
      lastModified: now,
      changeFrequency: path === "/" ? "daily" : "weekly",
      priority: path === "/" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          locales.map((alt) => [alt, new URL(localizedSeoPath(path, alt), siteUrl).toString()]),
        ),
      },
    }));

    const guideEntries: MetadataRoute.Sitemap = getTarotGuides(locale).map((guide) => ({
      url: new URL(localizedSeoPath(`/guides/${guide.slug}`, locale), siteUrl).toString(),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    const topicEntries: MetadataRoute.Sitemap = getTarotTopicPages(locale).map((page) => ({
      url: new URL(localizedSeoPath(`/topics/${page.slug}`, locale), siteUrl).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: page.slug === "today-fortune" || page.slug === "today-tarot" ? 0.9 : 0.8,
    }));

    entries.push(...staticEntries, ...topicEntries, ...guideEntries);
  }

  return entries;
}
