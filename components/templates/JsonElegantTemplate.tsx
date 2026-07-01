import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonElegantTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-800 min-h-[842px] font-sans p-10 text-[11px]">
      <header className="border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-4xl font-light text-gray-900 tracking-tight">{data.fullName || "Your Name"}</h1>
        <p className="text-base text-gray-500 mt-1 font-light">{data.title || "Professional Title"}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[10px] text-gray-500">
          {contact.map((c, i) => <span key={i}>{c}</span>)}
        </div>
      </header>
      {data.summary && (
        <section className="mb-6">
          <p className="text-gray-600 leading-relaxed">{data.summary}</p>
        </section>
      )}
      {data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Experience</h2>
          <div className="space-y-5">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <strong className="text-[12px] text-gray-900">{exp.title}</strong>
                  <span className="text-[10px] text-gray-400">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                </div>
                <div className="text-gray-500 text-[10px]">{exp.company}{exp.location ? `, ${exp.location}` : ""}</div>
                <ul className="mt-1.5 space-y-1 text-gray-600">
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
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
      <div className="grid grid-cols-2 gap-8">
        {data.education.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Education</h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-2">
                <strong className="text-[11px] text-gray-900">{edu.degree}, {edu.field}</strong>
                <div className="text-gray-500 text-[10px]">{edu.school}</div>
                <div className="text-gray-400 text-[10px]">{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</div>
              </div>
            ))}
          </section>
        )}
        {data.skills.filter(Boolean).length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.filter(Boolean).map((s, i) => (
                <span key={i} className="border border-gray-300 text-gray-600 px-2 py-0.5 rounded text-[10px]">{s}</span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
