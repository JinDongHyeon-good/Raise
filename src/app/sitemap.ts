import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { getSiteUrl } from "@/lib/brand";

/** 1시간마다 다시 생성 (새 글 반영) */
export const revalidate = 3600;

const STATIC_PATHS = ["/", "/community", "/about", "/contact", "/privacy", "/terms"] as const;

async function fetchCommunityPosts() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await supabase
      .from("BOARD_POSTS")
      .select("id, updated_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5000);
    return (data ?? []) as Array<{ id: string; updated_at: string }>;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified: now,
    changeFrequency: path === "/" || path === "/community" ? "hourly" : "monthly",
    priority: path === "/" ? 1 : path === "/community" ? 0.9 : 0.4,
  }));

  const posts = await fetchCommunityPosts();
  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: new URL(`/community/${post.id}`, siteUrl).toString(),
    lastModified: new Date(post.updated_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...postEntries];
}
