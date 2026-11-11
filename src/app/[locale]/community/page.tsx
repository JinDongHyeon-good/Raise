import type { Metadata } from "next";
import { SERVICE_NAME } from "@/lib/brand";
import { buildPageMetadata } from "@/lib/seo";
import { Suspense } from "react";
import { CommunityList } from "@/components/community/community-list";
import { RaisePageShell } from "@/components/raise/raise-chrome";

export const metadata: Metadata = buildPageMetadata({
  title: "코인·주식 커뮤니티",
  description: `${SERVICE_NAME} 코인·주식 커뮤니티 — 코인분석, 주식분석, 해외주식, 국내주식, 뉴스·정보, 질문, 손익인증 게시판에서 비트코인·나스닥·미국 주식 이야기를 나눠 보세요.`,
  path: "/community",
  image: "/og-community.png",
});

export default function CommunityPage() {
  return (
    <RaisePageShell plain>
      <Suspense>
        <CommunityList />
      </Suspense>
    </RaisePageShell>
  );
}
