import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { PostDetail } from "@/components/community/post-detail";
import { RaisePageShell } from "@/components/raise/raise-chrome";

type Props = { params: Promise<{ postId: string }> };

const UUID_RE = /^[0-9a-f-]{36}$/i;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !UUID_RE.test(postId)) return { title: "커뮤니티" };
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await supabase
      .from("BOARD_POSTS")
      .select("title, content_html")
      .eq("id", postId)
      .is("deleted_at", null)
      .maybeSingle<{ title: string; content_html: string }>();
    if (!data) return { title: "커뮤니티" };
    const text = data.content_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
    return {
      title: data.title,
      description: text || "진코 코인 커뮤니티 게시글",
      alternates: { canonical: `/community/${postId}` },
      openGraph: {
        type: "article",
        title: data.title,
        description: text || "진코 코인 커뮤니티 게시글",
        url: `/community/${postId}`,
        images: [{ url: "/ogImage.png", width: 1200, height: 630 }],
      },
    };
  } catch {
    return { title: "커뮤니티" };
  }
}

export default async function CommunityPostPage({ params }: Props) {
  const { postId } = await params;
  if (!UUID_RE.test(postId)) notFound();
  return (
    <RaisePageShell plain>
      <PostDetail postId={postId} />
    </RaisePageShell>
  );
}
