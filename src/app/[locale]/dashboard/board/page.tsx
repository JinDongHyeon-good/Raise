import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/seo/json-ld";
import { DashboardBoardClient } from "@/components/board/dashboard-board-client";
import { getSiteUrl, SERVICE_NAME } from "@/lib/brand";

const BOARD_PATH = "/dashboard/board";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("board");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: BOARD_PATH,
      languages: { ko: BOARD_PATH },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: BOARD_PATH,
      type: "website",
      locale: "ko_KR",
    },
  };
}

function getBoardJsonLd(title: string, description: string) {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${BOARD_PATH}`;
  const homeUrl = `${siteUrl}/`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: title,
      description,
      inLanguage: "ko-KR",
      isPartOf: { "@id": `${homeUrl}#website` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SERVICE_NAME, item: homeUrl },
        { "@type": "ListItem", position: 2, name: "대시보드", item: `${siteUrl}/dashboard` },
        { "@type": "ListItem", position: 3, name: "커뮤니티 게시판", item: pageUrl },
      ],
    },
  ];
}

export default async function DashboardBoardPage() {
  const t = await getTranslations("board");
  return (
    <>
      <JsonLd data={getBoardJsonLd(t("metaTitle"), t("metaDescription"))} />
      <DashboardBoardClient />
    </>
  );
}
