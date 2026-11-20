import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLocalizedBrandName } from "@/lib/brand";
import { createClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import { localizedPath } from "@/i18n/routing";
import { PostDetail } from "@/components/community/post-detail";
import { fetchPublicPost } from "@/lib/board-public";
import { RaisePageShell } from "@/components/raise/raise-chrome";
import { buildPageMetadata } from "@/lib/seo";
import { toRoutedLocale } from "@/lib/seo-i18n";

type Props = { params: Promise<{ locale: string; postId: string }> };

const UUID_RE = /^[0-9a-f-]{36}$/i;

/** 글이 쓰인 언어 (ko/en). 글이 없으면(삭제 포함) "missing", 조회 실패 시 null — 그때는 그냥 현재 주소에서 보여준다 */
async function fetchPostLocale(postId: string): Promise<"ko" | "en" | "missing" | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("BOARD_POSTS")
      .select("locale")
      .eq("id", postId)
      .is("deleted_at", null)
      .maybeSingle<{ locale: string }>();
    if (error) return null;
    if (!data) return "missing";
    return data.locale === "en" ? "en" : "ko";
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale, postId } = await params;
  const locale = toRoutedLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "seo.pages.communityPost" });
  const brand = getLocalizedBrandName(locale);
  const fallback: Metadata = { title: t("fallbackTitle") };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !UUID_RE.test(postId)) return fallback;
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await supabase
      .from("BOARD_POSTS")
      .select("title, content_html, locale")
      .eq("id", postId)
      .is("deleted_at", null)
      .maybeSingle<{ title: string; content_html: string; locale: string }>();
    if (!data) return fallback;
    const postLocale = toRoutedLocale(data.locale);
    const text = data.content_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
    const meta = buildPageMetadata({
      locale: postLocale,
      title: data.title,
      description: text || t("fallbackDescription", { brand }),
      path: `/community/${postId}`,
      image: "/og-community.png",
      imageAlt: t("imageAlt", { brand }),
      socialTitle: t("socialTitle", { title: data.title, brand }),
      type: "article",
    });
    // 글은 한 언어로만 존재하므로 다른 언어 대체 주소(hreflang)를 달지 않는다
    const canonical = localizedPath(`/community/${postId}`, postLocale);
    return { ...meta, alternates: { canonical, languages: { [postLocale]: canonical } } };
  } catch {
    return fallback;
  }
}

export default async function CommunityPostPage({ params }: Props) {
  const { locale, postId } = await params;
  setRequestLocale(locale);
  if (!UUID_RE.test(postId)) notFound();
  // 한국어 글은 한국어 주소, 영어 글은 /en 주소에서만 — 다른 언어 주소로 들어오면 글의 언어 주소로 보낸다
  const initial = await fetchPublicPost(postId);
  const postLocale = initial?.locale ?? (await fetchPostLocale(postId));
  // 없는 글·삭제된 글은 404 — 200 으로 빈 껍데기를 주면 검색엔진이 홈 canonical 의 중복 페이지로 쌓는다
  if (postLocale === "missing") notFound();
  if (postLocale && postLocale !== toRoutedLocale(locale)) redirect(localizedPath(`/community/${postId}`, postLocale));
  return (
    <RaisePageShell plain>
      <PostDetail postId={postId} initial={initial ? { item: initial.item, comments: initial.comments } : null} />
    </RaisePageShell>
  );
}
