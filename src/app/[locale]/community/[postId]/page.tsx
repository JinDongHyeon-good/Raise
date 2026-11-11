import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLocalizedBrandName } from "@/lib/brand";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { PostDetail } from "@/components/community/post-detail";
import { RaisePageShell } from "@/components/raise/raise-chrome";
import { buildPageMetadata } from "@/lib/seo";
import { toRoutedLocale } from "@/lib/seo-i18n";

type Props = { params: Promise<{ locale: string; postId: string }> };

const UUID_RE = /^[0-9a-f-]{36}$/i;

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
      .select("title, content_html")
      .eq("id", postId)
      .is("deleted_at", null)
      .maybeSingle<{ title: string; content_html: string }>();
    if (!data) return fallback;
    const text = data.content_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
    return buildPageMetadata({
      locale,
      title: data.title,
      description: text || t("fallbackDescription", { brand }),
      path: `/community/${postId}`,
      image: "/og-community.png",
      imageAlt: t("imageAlt", { brand }),
      socialTitle: t("socialTitle", { title: data.title, brand }),
      type: "article",
    });
  } catch {
    return fallback;
  }
}

export default async function CommunityPostPage({ params }: Props) {
  const { locale, postId } = await params;
  setRequestLocale(locale);
  if (!UUID_RE.test(postId)) notFound();
  return (
    <RaisePageShell plain>
      <PostDetail postId={postId} />
    </RaisePageShell>
  );
}
