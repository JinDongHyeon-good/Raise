import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/brand";

const siteUrl = new URL(getSiteUrl());

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // 로그인 없이도 폼·설명이 그대로 노출되는 세 툴 페이지는 /dashboard 차단보다
        // 더 구체적인 allow로 예외를 둔다(robots.txt는 가장 구체적인 규칙이 우선한다).
        allow: [
          "/",
          "/dashboard/today",
          "/*/dashboard/today",
          "/dashboard/saju",
          "/*/dashboard/saju",
          "/dashboard/gunghap",
          "/*/dashboard/gunghap",
        ],
        disallow: [
          "/dashboard",
          "/*/dashboard",
          "/mypage",
          "/*/mypage",
          "/auth/",
          "/*/auth/",
          "/trading-floor",
          "/*/trading-floor",
          "/resume",
          "/*/resume",
          "/topics",
          "/*/topics",
          "/guides",
          "/*/guides",
          "/api/",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.origin,
  };
}
