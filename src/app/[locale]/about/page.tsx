import type { Metadata } from "next";
import { SitePageShell } from "@/components/site/site-page-shell";
import { TarotServiceInfoContent } from "@/components/seo/tarot-service-info-content";
import { HOME_SEO_INTRO } from "@/lib/seo";

export const metadata: Metadata = {
  title: "서비스 소개",
  description: HOME_SEO_INTRO.body,
};

export default function AboutPage() {
  return (
    <SitePageShell title="서비스 소개">
      <TarotServiceInfoContent />
    </SitePageShell>
  );
}
