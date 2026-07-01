import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonSceptileTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-[#0d1117] text-gray-100 min-h-[842px] font-sans text-[11px]">
      <header className="border-b border-[#30363d] px-10 py-7">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{data.fullName || "Your Name"}</h1>
            <p className="text-[#58a6ff] mt-1">{data.title || "Professional Title"}</p>
          </div>
          <div className="text-right text-[10px] text-gray-400 space-y-1">
            {contact.map((c, i) => <div key={i}>{c}</div>)}
          </div>
        </div>
      </header>
      <div className="px-10 py-7">
        {data.summary && (
          <section className="mb-6 bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <h2 className="text-xs font-bold text-[#58a6ff] uppercase tracking-widest mb-2">{"// About"}</h2>
            <p className="text-gray-300 leading-relaxed">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-bold text-[#58a6ff] uppercase tracking-widest mb-4">{"// Experience"}</h2>
            <div className="space-y-4">
              {data.experience.map((exp) => (
                <div key={exp.id} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                  <div className="flex justify-between items-baseline">
                    <strong className="text-white text-[12px]">{exp.title}</strong>
                    <span className="text-[#3fb950] text-[10px] font-mono">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                  </div>
                  <div className="text-[#58a6ff] text-[10px] mt-0.5">{exp.company}{exp.location ? ` @ ${exp.location}` : ""}</div>
                  <ul className="mt-2 space-y-1 text-gray-300">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="shrink-0 text-[#3fb950]">›</span>
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
              <h2 className="text-xs font-bold text-[#58a6ff] uppercase tracking-widest mb-3">{"// Education"}</h2>
              {data.education.map((edu) => (
                <div key={edu.id} className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 mb-2">
                  <strong className="text-white text-[11px]">{edu.degree}, {edu.field}</strong>
                  <div className="text-gray-400 text-[10px]">{edu.school}</div>
                  <div className="text-[#3fb950] text-[10px] font-mono">{edu.startDate}{edu.endDate ? ` → ${edu.endDate}` : ""}</div>
                </div>
              ))}
            </section>
          )}
          {data.skills.filter(Boolean).length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-[#58a6ff] uppercase tracking-widest mb-3">{"// Skills"}</h2>
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                <div className="flex flex-wrap gap-1.5">
                  {data.skills.filter(Boolean).map((s, i) => (
                    <span key={i} className="bg-[#3fb95020] border border-[#3fb95040] text-[#3fb950] px-2 py-0.5 rounded text-[9px] font-mono">{s}</span>
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
