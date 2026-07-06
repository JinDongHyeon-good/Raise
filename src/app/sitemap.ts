import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/brand";
import { TAROT_GUIDES } from "@/data/tarot-guides";
import { TAROT_TOPIC_PAGES } from "@/data/tarot-topic-pages";

const siteUrl = new URL(getSiteUrl());

const STATIC_PATHS = ["/", "/about", "/contact", "/privacy", "/terms", "/guides", "/topics"] as const;

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

  const topicEntries: MetadataRoute.Sitemap = TAROT_TOPIC_PAGES.map((page) => ({
    url: new URL(`/topics/${page.slug}`, siteUrl).toString(),
    lastModified: now,
    changeFrequency: "weekly",
    priority: page.slug === "today-fortune" || page.slug === "today-tarot" ? 0.9 : 0.8,
  }));

  return [...staticEntries, ...topicEntries, ...guideEntries];
}
