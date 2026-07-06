import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonElephantTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-900 min-h-[842px] font-sans text-[11px]">
      <header className="bg-[#c0392b] text-white px-10 py-7 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)" }} />
        <h1 className="text-4xl font-black text-white relative z-10">{data.fullName || "Your Name"}</h1>
        <p className="text-red-200 text-sm mt-1 relative z-10">{data.title || "Professional Title"}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[10px] text-red-100 relative z-10">
          {contact.map((c, i) => <span key={i}>◆ {c}</span>)}
        </div>
      </header>
      <div className="px-10 py-7">
        {data.summary && (
          <section className="mb-6 p-4 border-l-4 border-[#c0392b] bg-red-50">
            <p className="text-gray-700 leading-relaxed italic">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-black text-[#c0392b] uppercase tracking-wider mb-4">Work Experience</h2>
            <div className="space-y-5">
              {data.experience.map((exp) => (
                <div key={exp.id} className="relative">
                  <div className="absolute left-0 top-1 w-2 h-2 bg-[#c0392b] rounded-full" />
                  <div className="pl-5">
                    <div className="flex justify-between items-baseline">
                      <strong className="text-[12px] text-gray-900">{exp.title}</strong>
                      <span className="text-[10px] text-[#c0392b] font-bold">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                    </div>
                    <div className="text-[#c0392b] text-[10px] font-medium">{exp.company}{exp.location ? `, ${exp.location}` : ""}</div>
                    <ul className="mt-1.5 space-y-1 text-gray-600">
                      {exp.bullets.filter(Boolean).map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="shrink-0 text-[#c0392b] font-bold">›</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        <div className="grid grid-cols-2 gap-8">
          {data.education.length > 0 && (
            <section>
              <h2 className="text-sm font-black text-[#c0392b] uppercase tracking-wider mb-3">Education</h2>
              {data.education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <strong className="text-[11px]">{edu.degree}, {edu.field}</strong>
                  <div className="text-gray-500 text-[10px]">{edu.school}</div>
                  <div className="text-[10px] text-gray-400">{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</div>
                </div>
              ))}
            </section>
          )}
          {data.skills.filter(Boolean).length > 0 && (
            <section>
              <h2 className="text-sm font-black text-[#c0392b] uppercase tracking-wider mb-3">Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.filter(Boolean).map((s, i) => (
                  <span key={i} className="bg-[#c0392b] text-white px-2 py-0.5 rounded text-[9px] font-medium">{s}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
