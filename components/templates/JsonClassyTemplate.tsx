import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonClassyTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-900 min-h-[842px] p-10 text-[11px]" style={{ fontFamily: "'Georgia', serif" }}>
      <header className="text-center mb-8">
        <h1 className="text-4xl font-normal text-gray-900 tracking-wider uppercase">{data.fullName || "Your Name"}</h1>
        <div className="flex items-center justify-center gap-3 mt-2">
          <div className="h-px w-16 bg-gray-400" />
          <p className="text-sm text-gray-500 italic">{data.title || "Professional Title"}</p>
          <div className="h-px w-16 bg-gray-400" />
        </div>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-3 text-[10px] text-gray-500">
          {contact.map((c, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-gray-300">|</span>}
              {c}
            </span>
          ))}
        </div>
      </header>
      {data.summary && (
        <section className="mb-7 max-w-xl mx-auto text-center">
          <p className="text-gray-600 leading-loose text-[10.5px] italic">{data.summary}</p>
        </section>
      )}
      {data.experience.length > 0 && (
        <section className="mb-7">
          <h2 className="text-xs uppercase tracking-[0.25em] text-gray-600 text-center mb-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-300" />
            Experience
            <div className="flex-1 h-px bg-gray-300" />
          </h2>
          <div className="space-y-5">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <strong className="text-[12px]">{exp.title}</strong>
                  <span className="text-[10px] text-gray-400 italic">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                </div>
                <div className="text-gray-500 text-[10px] italic">{exp.company}{exp.location ? `, ${exp.location}` : ""}</div>
                <ul className="mt-2 space-y-1 text-gray-600 text-[10px]">
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="shrink-0 text-gray-400">▪</span>
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
            <h2 className="text-xs uppercase tracking-[0.25em] text-gray-600 mb-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-300" />
              Education
              <div className="flex-1 h-px bg-gray-300" />
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
            <h2 className="text-xs uppercase tracking-[0.25em] text-gray-600 mb-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-300" />
              Skills
              <div className="flex-1 h-px bg-gray-300" />
            </h2>
            <p className="text-[10px] text-gray-600 leading-loose">{data.skills.filter(Boolean).join(" · ")}</p>
          </section>
        )}
      </div>
    </div>
  );
}
