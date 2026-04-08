import { projects } from "@/data/resume";

type ProjectGroup = {
  company: string;
  items: (typeof projects)[number][];
};

function groupByCompany(): ProjectGroup[] {
  const map = new Map<string, (typeof projects)[number][]>();

  for (const project of projects) {
    const list = map.get(project.company) ?? [];
    list.push(project);
    map.set(project.company, list);
  }

  return Array.from(map.entries()).map(([company, items]) => ({
    company,
    items,
  }));
}

export function ProjectSections() {
  const groups = groupByCompany();

  return (
    <section className="resume-anchor resume-section space-y-4.5 sm:space-y-6" id="project">
      <h2 className="section-title resume-heading fade-up">Project</h2>

      <div className="space-y-6">
        {groups.map((group, groupIndex) => (
          <div key={group.company} className={`fade-up stagger-${Math.min(groupIndex + 1, 5)}`}>
            <h3 className="mb-3 text-[1.05rem] font-semibold tracking-tight text-slate-800 sm:mb-4 sm:text-[1.18rem]">
              {group.company}
            </h3>
            <div className="space-y-4">
              {group.items.map((project, index) => (
                <article
                  key={`${project.company}-${project.name}-${project.period}`}
                  className={`resume-card scale-in p-4 sm:p-6 stagger-${(index % 5) + 1}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="resume-card-title flex-1 pr-2 text-slate-900">{project.name}</h4>
                    <span className="glass-chip resume-meta w-fit px-2.5 py-1 font-medium">
                      {project.period}
                    </span>
                  </div>

                  {project.summary ? <p className="resume-body mt-3">{project.summary}</p> : null}
                  <ul className="bullet-soft resume-list mt-3 list-disc space-y-2 pl-5">
                    {project.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
