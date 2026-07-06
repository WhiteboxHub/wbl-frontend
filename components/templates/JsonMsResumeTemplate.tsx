import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonMsResumeTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-900 min-h-[842px] font-sans text-[11px]">
      {/* MS Office-inspired header */}
      <header className="px-10 py-7 border-b-4 border-[#0078d4]">
        <h1 className="text-4xl font-light text-gray-900 tracking-tight">{data.fullName || "Your Name"}</h1>
        <p className="text-[#0078d4] text-sm font-semibold mt-1 uppercase tracking-wider">{data.title || "Professional Title"}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[10px] text-gray-600">
          {contact.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="w-1 h-1 bg-[#0078d4] rounded-full" />
              {c}
            </span>
          ))}
        </div>
      </header>
      <div className="px-10 py-6">
        {data.summary && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#0078d4] bg-blue-50 px-3 py-1 mb-3 -mx-3">Objective</h2>
            <p className="text-gray-700 leading-relaxed">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#0078d4] bg-blue-50 px-3 py-1 mb-4 -mx-3">Experience</h2>
            <div className="space-y-4">
              {data.experience.map((exp) => (
                <div key={exp.id} className="pl-3 border-l-2 border-gray-200">
                  <div className="flex justify-between items-baseline">
                    <strong className="text-[12px] text-gray-900">{exp.title}</strong>
                    <span className="text-[10px] text-[#0078d4]">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                  </div>
                  <div className="text-gray-600 text-[10px]">{exp.company}{exp.location ? ` | ${exp.location}` : ""}</div>
                  <ul className="mt-1.5 space-y-0.5 text-gray-700">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="shrink-0 text-[#0078d4]">•</span>
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
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#0078d4] bg-blue-50 px-3 py-1 mb-3 -mx-3">Education</h2>
              {data.education.map((edu) => (
                <div key={edu.id} className="mb-2 pl-3 border-l-2 border-gray-200">
                  <strong className="text-[11px]">{edu.degree}, {edu.field}</strong>
                  <div className="text-gray-600 text-[10px]">{edu.school}</div>
                  <div className="text-[10px] text-gray-400">{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</div>
                </div>
              ))}
            </section>
          )}
          {data.skills.filter(Boolean).length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#0078d4] bg-blue-50 px-3 py-1 mb-3 -mx-3">Skills</h2>
              <ul className="space-y-0.5 text-gray-700">
                {data.skills.filter(Boolean).map((s, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#0078d4] rounded-full shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
