import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/brand";

const siteUrl = new URL(getSiteUrl());

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/mypage",
          "/*/mypage",
          "/auth/",
          "/*/auth/",
          "/trading-floor",
          "/*/trading-floor",
          "/resume",
          "/*/resume",
          "/api/",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.origin,
  };
}
