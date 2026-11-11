import type { Metadata } from "next";
import { Suspense } from "react";
import { CommunityList } from "@/components/community/community-list";
import { RaisePageShell } from "@/components/raise/raise-chrome";

export const metadata: Metadata = {
  title: "커뮤니티",
  description: "진코 코인 커뮤니티 — 코인분석, 뉴스·정보, 질문, 손익인증, 자유게시판에서 비트코인·이더리움·알트코인 이야기를 나눠 보세요.",
  alternates: { canonical: "/community" },
};

export default function CommunityPage() {
  return (
    <RaisePageShell plain>
      <Suspense>
        <CommunityList />
      </Suspense>
    </RaisePageShell>
  );
}
