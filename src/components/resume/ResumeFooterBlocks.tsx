import { certificates, contacts, education } from "@/data/resume";

export function ResumeFooterBlocks() {
  return (
    <section className="resume-anchor resume-section space-y-4.5 sm:space-y-6" id="etc">
      <h2 className="section-title resume-heading fade-up">
        Education · Certificate · Contact
      </h2>
      <div className="grid grid-cols-1 gap-4">
        <article className="resume-card scale-in p-4 sm:p-6 stagger-1">
          <span className="glass-chip footer-badge resume-meta px-2.5 py-1 font-semibold uppercase tracking-wide">
            Education
          </span>
          <ul className="resume-list mt-3 space-y-2">
            {education.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="resume-card scale-in p-4 sm:p-6 stagger-2">
          <span className="glass-chip footer-badge resume-meta px-2.5 py-1 font-semibold uppercase tracking-wide">
            Certificate
          </span>
          <ul className="resume-list mt-3 space-y-2">
            {certificates.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="resume-card scale-in p-4 sm:p-6 stagger-3">
          <span className="glass-chip footer-badge resume-meta px-2.5 py-1 font-semibold uppercase tracking-wide">
            Contact
          </span>
          <ul className="resume-list mt-3 space-y-3">
            {contacts.map((item) => (
              <li key={item.label}>
                <p className="resume-meta uppercase tracking-wide">{item.label}</p>
                <a
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="break-all text-[0.94rem] font-medium text-slate-800 underline-offset-4 hover:underline"
                >
                  {item.value}
                </a>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
