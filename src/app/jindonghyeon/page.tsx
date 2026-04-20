import { HeroTransition } from "@/components/resume/HeroTransition";
import { CareerTimeline } from "@/components/resume/CareerTimeline";
import { TitleUnderlineObserver } from "@/components/TitleUnderlineObserver";

export default function JindonghyeonPage() {
  return (
    <div id="page-top" className="resume-soft space-theme relative min-h-dvh font-sans text-slate-900">
      <TitleUnderlineObserver />

      <div className="glass-orb glass-orb--one float-soft" />
      <div className="glass-orb glass-orb--two float-soft" style={{ animationDelay: "900ms" }} />
      <div className="glass-orb glass-orb--three float-soft" style={{ animationDelay: "1600ms" }} />

      <HeroTransition />

      <main className="relative z-10 w-full bg-[#000000]">
        <CareerTimeline />
      </main>
    </div>
  );
}
