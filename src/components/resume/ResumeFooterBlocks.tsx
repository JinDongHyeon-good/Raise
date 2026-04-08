import { certificates, contacts, education } from "@/data/resume";

export function ResumeFooterBlocks() {
  return (
    <>
      <section className="resume-anchor resume-section space-y-4.5 sm:space-y-6" id="education">
        <h2 className="section-title resume-heading fade-up">Education</h2>
        <article className="resume-card scale-in p-4 sm:p-6 stagger-1">
          <ul className="resume-list space-y-2">
            {education.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="resume-anchor resume-section space-y-4.5 sm:space-y-6" id="certificate">
        <h2 className="section-title resume-heading fade-up">Certificate</h2>
        <article className="resume-card scale-in p-4 sm:p-6 stagger-2">
          <ul className="resume-list space-y-2">
            {certificates.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="resume-anchor resume-section space-y-4.5 sm:space-y-6" id="contact">
        <h2 className="section-title resume-heading fade-up">Contact</h2>
        <article className="resume-card scale-in p-4 sm:p-6 stagger-3">
          <ul className="resume-list space-y-3">
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
      </section>
    </>
  );
}
