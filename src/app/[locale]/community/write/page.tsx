import type { Metadata } from "next";
import { Suspense } from "react";
import { PostWrite } from "@/components/community/post-write";
import { RaisePageShell } from "@/components/raise/raise-chrome";

export const metadata: Metadata = {
  title: "글쓰기",
  robots: { index: false, follow: false },
};

export default function CommunityWritePage() {
  return (
    <RaisePageShell plain>
      <Suspense>
        <PostWrite />
      </Suspense>
    </RaisePageShell>
  );
}
