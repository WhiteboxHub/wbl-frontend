import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonModernTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-[#f8f9fa] text-gray-800 min-h-[842px] font-sans text-[11px]">
      <header className="bg-[#2d3748] text-white px-10 py-8">
        <h1 className="text-3xl font-bold tracking-tight">{data.fullName || "Your Name"}</h1>
        <p className="text-[#90cdf4] mt-1 text-sm">{data.title || "Professional Title"}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[10px] text-gray-300">
          {contact.map((c, i) => <span key={i} className="flex items-center gap-1">◈ {c}</span>)}
        </div>
      </header>
      <div className="px-10 py-7">
        {data.summary && (
          <section className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#2d3748] mb-2">About</h2>
            <p className="text-gray-600 leading-relaxed">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#2d3748] mb-4 flex items-center gap-2">
              <span className="w-6 h-0.5 bg-[#4299e1] inline-block" /> Work Experience
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp) => (
                <div key={exp.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-baseline">
                    <strong className="text-[12px] text-[#2d3748]">{exp.title}</strong>
                    <span className="text-[10px] text-[#4299e1] font-medium">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                  </div>
                  <div className="text-gray-500 text-[10px] mt-0.5">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
                  <ul className="mt-2 space-y-1 text-gray-600">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="shrink-0 text-[#4299e1] mt-0.5">▸</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
        <div className="grid grid-cols-2 gap-5">
          {data.education.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#2d3748] mb-3 flex items-center gap-2">
                <span className="w-4 h-0.5 bg-[#4299e1] inline-block" /> Education
              </h2>
              {data.education.map((edu) => (
                <div key={edu.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 mb-2">
                  <strong className="text-[11px] text-[#2d3748]">{edu.degree}</strong>
                  <div className="text-gray-500 text-[10px]">{edu.field} · {edu.school}</div>
                  <div className="text-gray-400 text-[10px]">{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</div>
                </div>
              ))}
            </section>
          )}
          {data.skills.filter(Boolean).length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#2d3748] mb-3 flex items-center gap-2">
                <span className="w-4 h-0.5 bg-[#4299e1] inline-block" /> Skills
              </h2>
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                <div className="flex flex-wrap gap-1.5">
                  {data.skills.filter(Boolean).map((s, i) => (
                    <span key={i} className="bg-blue-50 text-[#2d3748] px-2 py-0.5 rounded-full text-[10px] font-medium">{s}</span>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
