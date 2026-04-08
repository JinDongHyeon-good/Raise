import { careers } from "@/data/resume";

export function CareerTimeline() {
  return (
    <section className="resume-anchor resume-section space-y-4.5 sm:space-y-6" id="career">
      <h2 className="section-title resume-heading fade-up">Career</h2>
      <ul className="grid grid-cols-1 gap-5">
        {careers.map((career, index) => (
          <li
            key={`${career.company}-${career.period}`}
            className={`resume-card career-link-card group scale-in p-5 sm:p-7 stagger-${Math.min(index + 1, 5)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[1.08rem] font-semibold tracking-tight text-slate-900 sm:text-[1.2rem]">
                {career.company}
              </p>
              <span className="glass-chip resume-meta px-2.5 py-1 font-medium">
                {career.period}
              </span>
            </div>
            <p className="resume-body mt-2 border-l-2 border-indigo-900/80 pl-3 font-medium">
              {career.role}
            </p>

            {career.href ? (
              <>
                <a
                  href={career.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${career.company} 알아보기`}
                  className="absolute inset-0 z-10 cursor-pointer rounded-[inherit]"
                />
                <div className="career-overlay pointer-events-none absolute inset-0 z-[5] flex items-center justify-center rounded-[inherit]">
                  <span className="career-overlay-label">알아보기</span>
                </div>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
