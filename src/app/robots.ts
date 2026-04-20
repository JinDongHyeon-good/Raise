import type { MetadataRoute } from "next";

const SITE_URL = "https://jjindong.com";
const siteUrl = new URL(SITE_URL);

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.origin,
  };
}
