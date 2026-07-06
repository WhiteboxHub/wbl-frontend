import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonStraightforwardTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-900 min-h-[842px] font-mono p-10 text-[10.5px]">
      <header className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">{data.fullName || "Your Name"}</h1>
        <p className="text-gray-600 text-sm mt-0.5">{data.title || "Professional Title"}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-[10px] text-gray-500">
          {contact.map((c, i) => <span key={i}>{c}</span>)}
        </div>
        <div className="mt-4 border-t-2 border-gray-900" />
      </header>
      {data.summary && (
        <section className="mb-6">
          <p className="text-gray-700 leading-relaxed">{data.summary}</p>
        </section>
      )}
      {data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase text-gray-900 mb-4">── Experience ──</h2>
          <div className="space-y-5">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex flex-wrap justify-between items-baseline gap-1">
                  <strong className="text-[11px]">{exp.title} @ {exp.company}</strong>
                  <span className="text-[10px] text-gray-500">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                </div>
                {exp.location && <div className="text-[10px] text-gray-500">{exp.location}</div>}
                <ul className="mt-1.5 space-y-0.5 text-gray-700">
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="shrink-0 text-gray-400">*</span>
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
            <h2 className="text-xs font-bold uppercase text-gray-900 mb-3">── Education ──</h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-2">
                <strong className="text-[10.5px]">{edu.degree}, {edu.field}</strong>
                <div className="text-gray-500 text-[10px]">{edu.school}</div>
                <div className="text-gray-400 text-[10px]">{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</div>
              </div>
            ))}
          </section>
        )}
        {data.skills.filter(Boolean).length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase text-gray-900 mb-3">── Skills ──</h2>
            <ul className="space-y-0.5 text-gray-700 text-[10px]">
              {data.skills.filter(Boolean).map((s, i) => (
                <li key={i}>* {s}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
