import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonEliteTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-[#f5f5f0] text-gray-800 min-h-[842px] text-[11px]" style={{ fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" }}>
      <header className="bg-[#2c2c2c] text-white px-10 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-normal tracking-[0.15em] uppercase">{data.fullName || "Your Name"}</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-px flex-1 bg-[#c9a84c]" />
            <p className="text-[#c9a84c] text-xs tracking-[0.2em] uppercase">{data.title || "Professional Title"}</p>
            <div className="h-px flex-1 bg-[#c9a84c]" />
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-3 text-[10px] text-gray-300">
            {contact.map((c, i) => <span key={i}>{c}</span>)}
          </div>
        </div>
      </header>
      <div className="px-10 py-7 max-w-3xl mx-auto">
        {data.summary && (
          <section className="mb-7 text-center">
            <p className="text-gray-600 leading-loose italic text-[10.5px]">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-7">
            <h2 className="text-center text-[10px] uppercase tracking-[0.3em] text-[#c9a84c] mb-5 flex items-center gap-4">
              <div className="flex-1 h-px bg-[#c9a84c] opacity-50" />
              Experience
              <div className="flex-1 h-px bg-[#c9a84c] opacity-50" />
            </h2>
            <div className="space-y-5">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <strong className="text-[12px] text-gray-900">{exp.title}</strong>
                    <span className="text-[10px] text-[#c9a84c] italic">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                  </div>
                  <div className="text-gray-500 text-[10px] italic">{exp.company}{exp.location ? `, ${exp.location}` : ""}</div>
                  <ul className="mt-1.5 space-y-1 text-gray-600">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="shrink-0 text-[#c9a84c]">◆</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
        <div className="grid grid-cols-2 gap-10">
          {data.education.length > 0 && (
            <section>
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-[#c9a84c] mb-4 flex items-center gap-2">
                <div className="flex-1 h-px bg-[#c9a84c] opacity-50" />
                Education
                <div className="flex-1 h-px bg-[#c9a84c] opacity-50" />
              </h2>
              {data.education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <strong className="text-[11px]">{edu.degree}, {edu.field}</strong>
                  <div className="text-gray-500 text-[10px] italic">{edu.school}</div>
                </div>
              ))}
            </section>
          )}
          {data.skills.filter(Boolean).length > 0 && (
            <section>
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-[#c9a84c] mb-4 flex items-center gap-2">
                <div className="flex-1 h-px bg-[#c9a84c] opacity-50" />
                Skills
                <div className="flex-1 h-px bg-[#c9a84c] opacity-50" />
              </h2>
              <p className="text-[10px] text-gray-600 leading-loose">{data.skills.filter(Boolean).join(" · ")}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
