import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/brand";

const siteUrl = new URL(getSiteUrl());

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/"];
  const now = new Date();

  return routes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
    lastModified: now,
    changeFrequency: route === "/" ? "hourly" : "daily",
    priority: route === "/" ? 1 : 0.7,
  }));
}
