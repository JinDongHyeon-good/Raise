import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { locales, localizedPath } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/brand";

/** 1시간마다 다시 생성 (새 글 반영) */
export const revalidate = 3600;

const STATIC_PATHS = ["/", "/chart", "/community", "/bybit", "/faq", "/about", "/contact", "/privacy", "/terms"] as const;

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

/** 한 경로에 대해 ko·en 주소를 모두 만들고, 각 항목에 hreflang 대체 주소(ko·en·x-default)를 단다 */
function localizedEntries(
  siteUrl: string,
  path: string,
  entry: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
): MetadataRoute.Sitemap {
  const urlFor = (locale: (typeof locales)[number]) => new URL(localizedPath(path, locale), siteUrl).toString();
  const languages = {
    ko: urlFor("ko"),
    en: urlFor("en"),
    "x-default": urlFor("ko"),
  };
  return locales.map((locale) => ({
    ...entry,
    url: urlFor(locale),
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap((path) =>
    localizedEntries(siteUrl, path, {
      lastModified: now,
      changeFrequency: path === "/" || path === "/chart" || path === "/community" ? "hourly" : "monthly",
      priority: path === "/" ? 1 : path === "/chart" || path === "/community" ? 0.9 : path === "/bybit" ? 0.8 : path === "/faq" ? 0.6 : 0.4,
    }),
  );

  const posts = await fetchCommunityPosts();
  const postEntries: MetadataRoute.Sitemap = posts.flatMap((post) =>
    localizedEntries(siteUrl, `/community/${post.id}`, {
      lastModified: new Date(post.updated_at),
      changeFrequency: "weekly",
      priority: 0.6,
    }),
  );

  return [...staticEntries, ...postEntries];
}
