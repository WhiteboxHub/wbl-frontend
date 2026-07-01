import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function MinimalTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-800 p-12 min-h-[842px] font-sans">
      <header className="mb-12">
        <h1 className="text-4xl font-light tracking-tight text-gray-900">{data.fullName || "Your Name"}</h1>
        <p className="text-gray-400 mt-2 text-sm font-light">{data.title || "Professional Title"}</p>
        <p className="text-gray-300 mt-4 text-[10px] tracking-widest uppercase">{contact.join(" / ")}</p>
      </header>
      {data.summary && (
        <section className="mb-10">
          <p className="text-gray-600 text-[11px] leading-loose font-light max-w-lg">{data.summary}</p>
        </section>
      )}
      {data.experience.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-gray-300 mb-6">Experience</h2>
          <div className="space-y-8">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="font-medium text-gray-900 text-[12px]">{exp.title}</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">{exp.company}</p>
                  </div>
                  <span className="text-gray-300 text-[10px]">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                </div>
                <ul className="mt-3 space-y-1.5 text-gray-500 text-[10px] leading-relaxed">
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="shrink-0 text-gray-400">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="grid grid-cols-2 gap-12">
        {data.education.length > 0 && (
          <section>
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-gray-300 mb-4">Education</h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-3">
                <p className="text-[11px] text-gray-800">{edu.degree}, {edu.field}</p>
                <p className="text-[10px] text-gray-400">{edu.school}</p>
              </div>
            ))}
          </section>
        )}
        {data.skills.filter(Boolean).length > 0 && (
          <section>
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-gray-300 mb-4">Skills</h2>
            <p className="text-[10px] text-gray-500 leading-loose">{data.skills.filter(Boolean).join(", ")}</p>
          </section>
        )}
      </div>
    </div>
  );
}
