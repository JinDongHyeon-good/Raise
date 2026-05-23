import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/brand";

const siteUrl = new URL(getSiteUrl());

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
