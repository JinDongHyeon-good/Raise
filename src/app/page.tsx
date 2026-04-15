import { ResumeHero } from "@/components/resume/ResumeHero";
import { CareerTimeline } from "@/components/resume/CareerTimeline";
import { ProjectSections } from "@/components/resume/ProjectSections";
import { SkillsGrid } from "@/components/resume/SkillsGrid";
import { ResumeFooterBlocks } from "@/components/resume/ResumeFooterBlocks";
import { TitleUnderlineObserver } from "@/components/TitleUnderlineObserver";
import { FloatingActions } from "@/components/FloatingActions";

export default function Home() {
  return (
    <div id="page-top" className="resume-soft relative min-h-dvh overflow-hidden font-sans text-slate-900">
      <TitleUnderlineObserver />
      <div className="glass-orb glass-orb--one float-soft" />
      <div className="glass-orb glass-orb--two float-soft" style={{ animationDelay: "900ms" }} />
      <div className="glass-orb glass-orb--three float-soft" style={{ animationDelay: "1600ms" }} />

      <main className="relative z-10 mx-auto w-full max-w-6xl space-y-9 px-3.5 py-7 sm:space-y-12 sm:px-6 sm:py-12 lg:space-y-14 lg:px-8">
        <ResumeHero />
        <CareerTimeline />
        <ProjectSections />
        <SkillsGrid />
        <ResumeFooterBlocks />
      </main>

      <FloatingActions />
    </div>
  );
}
