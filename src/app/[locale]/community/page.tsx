import type { Metadata } from "next";
import { Suspense } from "react";
import { CommunityList } from "@/components/community/community-list";
import { RaisePageShell } from "@/components/raise/raise-chrome";

export const metadata: Metadata = {
  title: "커뮤니티",
  description: "코인 자유게시판, 코인분석, 뉴스·정보, 질문, 손익인증 게시판.",
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
