import type { MetadataRoute } from "next";

const SITE_URL = "https://jjindong.com";
const siteUrl = new URL(SITE_URL);

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/jindonghyeon", "/resume", "/trading-floor"];
  const now = new Date();

  return routes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
    lastModified: now,
    changeFrequency: route === "/" ? "hourly" : "daily",
    priority: route === "/" ? 1 : 0.7,
  }));
}
