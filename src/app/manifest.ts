import type { MetadataRoute } from "next";
import { SERVICE_DESCRIPTION, SERVICE_NAME } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SERVICE_NAME} - 코인·미국증시 차트 · AI 영상 요약 · 투자 커뮤니티`,
    short_name: SERVICE_NAME,
    description: SERVICE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0c10",
    theme_color: "#0a0c10",
    lang: "ko",
    categories: ["finance", "news", "social"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
