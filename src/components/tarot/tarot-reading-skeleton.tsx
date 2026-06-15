"use client";

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`tarot-skeleton-line h-3 rounded-md ${className}`} aria-hidden />
  );
}

function SkeletonSection({ isLast }: { isLast: boolean }) {
  return (
    <div className="relative flex gap-3" aria-hidden>
      {!isLast ? (
        <span className="absolute left-[10px] top-7 bottom-0 w-px bg-slate-100" />
      ) : null}

      <div className="relative z-10 mt-0.5 h-6 w-6 shrink-0 rounded-full border border-slate-200 bg-slate-50 tarot-skeleton-line" />

      <div className="min-w-0 flex-1 pb-5">
        <SkeletonLine className="h-3.5 w-[42%] max-w-[9rem]" />
        <div className="mt-3 space-y-2">
          <SkeletonLine className="w-full" />
          <SkeletonLine className="w-[94%]" />
          <SkeletonLine className="w-[78%]" />
        </div>
        <ul className="mt-3 space-y-2.5">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-200" />
            <SkeletonLine className="h-2.5 flex-1" />
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-200" />
            <SkeletonLine className="h-2.5 w-[88%]" />
          </li>
        </ul>
      </div>
    </div>
  );
}

export function TarotReadingSkeleton({ sectionCount = 3 }: { sectionCount?: number }) {
  const detailSections = Math.max(sectionCount, 1);

  return (
    <div className="tarot-reading-skeleton space-y-5" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">AI가 카드를 읽는 중입니다</span>

      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/60 p-4 shadow-sm shadow-slate-100/50">
        <SkeletonLine className="h-2.5 w-16 opacity-70" />
        <div className="mt-3 space-y-2.5">
          <SkeletonLine className="h-3.5 w-full" />
          <SkeletonLine className="h-3.5 w-[92%]" />
          <SkeletonLine className="h-3.5 w-[68%]" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm sm:p-4">
        <SkeletonLine className="mb-4 h-2.5 w-14 opacity-70" />
        <div>
          {Array.from({ length: detailSections }).map((_, index) => (
            <SkeletonSection key={`skeleton-section-${index}`} isLast={index === detailSections - 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
