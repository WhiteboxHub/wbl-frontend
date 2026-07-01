import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function ModernTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-900 min-h-[842px] font-sans">
      <header className="bg-[#0c8ee6] text-white px-8 py-6">
        <h1 className="text-3xl font-bold">{data.fullName || "Your Name"}</h1>
        <p className="text-blue-100 text-sm mt-1">{data.title || "Professional Title"}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] text-blue-50">
          {contact.map((c, i) => <span key={i}>{c}</span>)}
        </div>
      </header>
      <div className="p-8 text-[11px] leading-relaxed">
        {data.summary && (
          <section className="mb-5">
            <h2 className="text-sm font-bold text-[#0c8ee6] mb-2 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-[#0c8ee6] inline-block" /> Profile
            </h2>
            <p className="text-gray-700 pl-10">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-sm font-bold text-[#0c8ee6] mb-3 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-[#0c8ee6] inline-block" /> Experience
            </h2>
            <div className="pl-10 space-y-4">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between">
                    <strong className="text-[12px]">{exp.title}</strong>
                    <span className="text-[#0c8ee6] font-medium text-[10px]">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                  </div>
                  <div className="text-gray-500">{exp.company} • {exp.location}</div>
                  <ul className="mt-1 space-y-1.5 text-gray-700">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="shrink-0 text-[#0c8ee6]">▸</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
        <div className="grid grid-cols-2 gap-6 pl-10">
          {data.education.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[#0c8ee6] mb-2">Education</h2>
              {data.education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <strong className="text-[11px]">{edu.degree}, {edu.field}</strong>
                  <div className="text-gray-500 text-[10px]">{edu.school}</div>
                </div>
              ))}
            </section>
          )}
          {data.skills.filter(Boolean).length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[#0c8ee6] mb-2">Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.filter(Boolean).map((s, i) => (
                  <span key={i} className="bg-blue-50 text-[#0c8ee6] px-2 py-0.5 rounded text-[10px]">{s}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
