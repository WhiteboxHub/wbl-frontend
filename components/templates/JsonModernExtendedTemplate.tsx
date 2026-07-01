import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonModernExtendedTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-800 min-h-[842px] font-sans text-[11px] flex">
      {/* Left sidebar */}
      <aside className="w-[210px] bg-[#1b2a4a] flex-shrink-0 flex flex-col">
        <div className="bg-[#243b67] p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-[#3a5ba8] border-4 border-white mx-auto flex items-center justify-center text-white text-3xl font-bold mb-3">
            {(data.fullName || "Y").charAt(0)}
          </div>
          <h1 className="text-white text-base font-bold leading-tight">{data.fullName || "Your Name"}</h1>
          <p className="text-blue-300 text-[10px] mt-0.5">{data.title || "Professional Title"}</p>
        </div>
        <div className="p-5 flex flex-col gap-5 flex-1">
          <div>
            <h2 className="text-[9px] font-bold uppercase tracking-widest text-blue-300 mb-2">Contact</h2>
            <div className="space-y-1.5 text-[10px] text-gray-300">
              {contact.map((c, i) => <div key={i} className="break-words">{c}</div>)}
            </div>
          </div>
          {data.skills.filter(Boolean).length > 0 && (
            <div>
              <h2 className="text-[9px] font-bold uppercase tracking-widest text-blue-300 mb-2">Skills</h2>
              <div className="flex flex-col gap-1.5">
                {data.skills.filter(Boolean).map((s, i) => (
                  <div key={i} className="text-[10px] text-gray-300">
                    <div className="flex justify-between mb-0.5">
                      <span>{s}</span>
                    </div>
                    <div className="h-1 bg-[#1b2a4a] rounded-full">
                      <div className="h-1 bg-blue-400 rounded-full" style={{ width: `${70 + (i * 7) % 30}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.certifications && data.certifications.filter(Boolean).length > 0 && (
            <div>
              <h2 className="text-[9px] font-bold uppercase tracking-widest text-blue-300 mb-2">Certifications</h2>
              <ul className="space-y-1 text-[10px] text-gray-300">
                {data.certifications.filter(Boolean).map((c, i) => (
                  <li key={i} className="flex items-start gap-1"><span className="shrink-0">✓</span>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 p-7">
        {data.summary && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1b2a4a] border-b-2 border-[#1b2a4a] pb-1 mb-3">Professional Summary</h2>
            <p className="text-gray-600 leading-relaxed">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1b2a4a] border-b-2 border-[#1b2a4a] pb-1 mb-4">Work Experience</h2>
            <div className="space-y-5">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <strong className="text-[12px] text-gray-900">{exp.title}</strong>
                    <span className="text-[10px] text-[#3a5ba8] bg-blue-50 px-2 py-0.5 rounded">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                  </div>
                  <div className="text-[#3a5ba8] font-medium text-[10px]">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
                  <ul className="mt-1.5 space-y-1 text-gray-600">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="shrink-0 text-[#3a5ba8]">▶</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
        {data.education.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1b2a4a] border-b-2 border-[#1b2a4a] pb-1 mb-3">Education</h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-2 flex justify-between">
                <div>
                  <strong className="text-[11px] text-gray-900">{edu.degree}, {edu.field}</strong>
                  <div className="text-gray-500 text-[10px]">{edu.school}</div>
                </div>
                <div className="text-[10px] text-gray-400 text-right">{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
