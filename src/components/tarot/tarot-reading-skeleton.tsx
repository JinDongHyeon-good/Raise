"use client";

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`tarot-skeleton-line h-3 rounded-md ${className}`} aria-hidden />;
}

function SkeletonSection({ showDivider }: { showDivider: boolean }) {
  return (
    <div className={showDivider ? "border-t border-slate-100 pt-4" : undefined} aria-hidden>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-slate-100 tarot-skeleton-line" />

        <div className="min-w-0 flex-1">
          <SkeletonLine className="h-3.5 w-[46%] max-w-[10rem]" />
          <div className="mt-3 space-y-2">
            <SkeletonLine className="w-full" />
            <SkeletonLine className="w-[92%]" />
            <SkeletonLine className="w-[76%]" />
          </div>
          <div className="mt-3 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-200" />
              <SkeletonLine className="h-2.5 flex-1" />
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-200" />
              <SkeletonLine className="h-2.5 w-[84%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TarotReadingSkeleton({ sectionCount = 3 }: { sectionCount?: number }) {
  const detailSections = Math.max(sectionCount, 1);

  return (
    <div className="tarot-reading-skeleton min-w-0 space-y-4" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">AI가 카드를 읽는 중입니다</span>

      <div className="border-l-2 border-slate-200 pl-3 sm:pl-4">
        <SkeletonLine className="h-2.5 w-16 opacity-70" />
        <div className="mt-2.5 space-y-2">
          <SkeletonLine className="h-3.5 w-full" />
          <SkeletonLine className="h-3.5 w-[90%]" />
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: detailSections }).map((_, index) => (
          <SkeletonSection key={`skeleton-section-${index}`} showDivider={index > 0} />
        ))}
      </div>
    </div>
  );
}
