import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonJupeTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-900 min-h-[842px] font-sans text-[11px]">
      <div className="flex">
        {/* Color strip */}
        <div className="w-2 bg-gradient-to-b from-[#6c63ff] to-[#a78bfa] flex-shrink-0" />
        {/* Content */}
        <div className="flex-1">
          <header className="px-8 py-7 border-b border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black text-gray-900">{data.fullName || "Your Name"}</h1>
                <p className="text-[#6c63ff] font-semibold mt-1">{data.title || "Professional Title"}</p>
              </div>
              <div className="text-right text-[10px] text-gray-500 space-y-1">
                {contact.map((c, i) => <div key={i}>{c}</div>)}
              </div>
            </div>
          </header>
          <div className="px-8 py-6">
            {data.summary && (
              <section className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-3 h-3 bg-[#6c63ff] rounded-sm" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-gray-900">Summary</h2>
                </div>
                <p className="text-gray-600 leading-relaxed pl-6">{data.summary}</p>
              </section>
            )}
            {data.experience.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-3 h-3 bg-[#6c63ff] rounded-sm" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-gray-900">Experience</h2>
                </div>
                <div className="pl-6 space-y-5">
                  {data.experience.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-baseline">
                        <strong className="text-[12px]">{exp.title}</strong>
                        <span className="text-[10px] text-[#6c63ff] bg-purple-50 px-2 py-0.5 rounded-full">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                      </div>
                      <div className="text-[#6c63ff] text-[10px] font-medium">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
                      <ul className="mt-1.5 space-y-1 text-gray-600">
                        {exp.bullets.filter(Boolean).map((b, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="shrink-0 text-[#6c63ff] font-bold mt-0.5">›</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <div className="grid grid-cols-2 gap-6">
              {data.education.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-3 h-3 bg-[#6c63ff] rounded-sm" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-900">Education</h2>
                  </div>
                  <div className="pl-6">
                    {data.education.map((edu) => (
                      <div key={edu.id} className="mb-2">
                        <strong className="text-[11px]">{edu.degree}, {edu.field}</strong>
                        <div className="text-gray-500 text-[10px]">{edu.school}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {data.skills.filter(Boolean).length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-3 h-3 bg-[#6c63ff] rounded-sm" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-900">Skills</h2>
                  </div>
                  <div className="pl-6 flex flex-wrap gap-1.5">
                    {data.skills.filter(Boolean).map((s, i) => (
                      <span key={i} className="bg-purple-50 text-[#6c63ff] border border-purple-200 px-2 py-0.5 rounded text-[10px]">{s}</span>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
