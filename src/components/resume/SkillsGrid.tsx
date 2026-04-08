import { skills } from "@/data/resume";

export function SkillsGrid() {
  return (
    <section className="resume-anchor resume-section space-y-4.5 sm:space-y-6" id="skills">
      <h2 className="section-title resume-heading fade-up">Skills</h2>
      <div className="grid grid-cols-1 gap-4">
        {skills.map((skill, index) => (
          <article
            key={skill.title}
            className={`resume-card scale-in p-4 sm:p-6 stagger-${Math.min(index + 1, 5)}`}
          >
            <span className="glass-chip resume-meta px-2.5 py-1 font-semibold uppercase tracking-wide">
              {skill.title}
            </span>
            <ul className="bullet-soft resume-list mt-3 list-disc space-y-2 pl-5">
              {skill.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
