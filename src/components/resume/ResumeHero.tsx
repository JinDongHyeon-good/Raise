export function ResumeHero() {
  return (
    <section className="resume-anchor resume-section fade-up space-y-4 sm:space-y-6" id="introduce">
      <video
        className="aspect-square w-full rounded-2xl object-contain"
        src="/introduce.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        fetchPriority="high"
        aria-label="소개 영상"
      />
    </section>
  );
}
