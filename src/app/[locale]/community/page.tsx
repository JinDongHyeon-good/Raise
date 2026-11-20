import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLocalizedBrandName } from "@/lib/brand";
import { buildPageMetadata } from "@/lib/seo";
import { toRoutedLocale } from "@/lib/seo-i18n";
import { Suspense } from "react";
import { CommunityList } from "@/components/community/community-list";
import { fetchPublicPostList } from "@/lib/board-public";
import { isBoardPostType, parseBoardSort } from "@/lib/board-types";
import { RaisePageShell } from "@/components/raise/raise-chrome";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 20;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = toRoutedLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "seo.pages.community" });
  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("description", { brand: getLocalizedBrandName(locale) }),
    path: "/community",
    image: "/og-community.png",
  });
}

export default async function CommunityPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // 첫 화면 목록을 서버에서 그려 HTML에 글이 들어가게 한다 (작성자별 목록은 브라우저에서)
  const sp = (await searchParams) ?? {};
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) ?? "";
  const typeParam = one("type");
  const type = isBoardPostType(typeParam) ? typeParam : null;
  const sort = parseBoardSort(one("sort"));
  const page = Math.max(1, Number(one("page")) || 1);
  const q = one("q").trim().slice(0, 50);
  let initial = null;
  if (!one("author")) {
    const list = await fetchPublicPostList({ locale: toRoutedLocale(locale) === "en" ? "en" : "ko", page, limit: PAGE_SIZE, sort, type, q });
    if (list) {
      // CommunityList 가 만드는 key 와 같은 순서여야 브라우저가 다시 받지 않는다
      const key = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort });
      if (type) key.set("type", type);
      if (one("q")) key.set("q", one("q"));
      initial = { key: key.toString(), items: list.items, total: list.total, error: null };
    }
  }

  return (
    <RaisePageShell plain>
      <Suspense>
        <CommunityList initial={initial} />
      </Suspense>
    </RaisePageShell>
  );
}
