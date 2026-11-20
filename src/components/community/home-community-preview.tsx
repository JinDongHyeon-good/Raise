import { getTranslations } from "next-intl/server";
import { PostTypeBadge } from "@/components/community/post-type-badge";
import { fetchPublicPostList } from "@/lib/board-public";
import { Link } from "@/navigation";

/** 홈 하단: 서버에서 그리는 최신 커뮤니티 글 (첫 HTML에 직접 쓴 글이 보이도록) */
export async function HomeCommunityPreview({ locale }: { locale: "ko" | "en" }) {
  const list = await fetchPublicPostList({ locale, page: 1, limit: 8, sort: "latest", type: null, q: "" });
  if (!list || list.items.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "home" });
  const tc = await getTranslations({ locale, namespace: "community" });

  return (
    <section className="space-y-3 pt-4" aria-labelledby="home-community-title">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="home-community-title" className="font-[family-name:var(--font-brand-display)] text-lg font-semibold tracking-tight sm:text-xl">
            {t("latestCommunity")}
          </h2>
          <p className="mt-1 text-sm text-[var(--rz-muted)]">{t("latestCommunityDesc")}</p>
        </div>
        <Link href="/community" className="shrink-0 text-sm text-[var(--rz-muted)] underline-offset-4 hover:underline">
          {t("seeAllPosts")}
        </Link>
      </div>
      <ul className="divide-y divide-[var(--rz-line)] rounded-xl border border-[var(--rz-line)] bg-[var(--rz-panel)]">
        {list.items.map((post) => (
          <li key={post.id}>
            <Link href={`/community/${post.id}`} className="block px-4 py-3 transition hover:bg-[var(--rz-panel-2)]">
              <div className="flex items-center gap-2">
                <PostTypeBadge type={post.post_type} />
                <span className="min-w-0 truncate text-sm font-medium">{post.title}</span>
                {post.comment_count > 0 && (
                  <span className="shrink-0 text-xs text-[var(--rz-accent)]" aria-label={tc("comments", { count: post.comment_count })}>
                    [{post.comment_count}]
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[var(--rz-muted)]">{post.author_nickname}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
