import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonReactTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-[#20232a] text-gray-100 min-h-[842px] font-sans text-[11px]">
      <header className="px-10 py-8 border-b border-[#282c34]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#282c34] border-2 border-[#61dafb] flex items-center justify-center shrink-0">
            <span className="text-[#61dafb] text-2xl font-black">{(data.fullName || "Y").charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{data.fullName || "Your Name"}</h1>
            <p className="text-[#61dafb] mt-0.5">{data.title || "Professional Title"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4 text-[10px] text-gray-400">
          {contact.map((c, i) => <span key={i} className="font-mono">{c}</span>)}
        </div>
      </header>
      <div className="px-10 py-7">
        {data.summary && (
          <section className="mb-6">
            <h2 className="text-[#61dafb] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="text-[#61dafb]">{"<"}</span>About<span className="text-[#61dafb]">{"/>"}</span>
            </h2>
            <p className="text-gray-300 leading-relaxed font-mono text-[10px]">{`// ${data.summary}`}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-[#61dafb] text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="text-[#61dafb]">{"<"}</span>Experience<span className="text-[#61dafb]">{"/>"}</span>
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp) => (
                <div key={exp.id} className="bg-[#282c34] border border-[#3a3f4b] rounded-lg p-4">
                  <div className="flex justify-between items-baseline">
                    <strong className="text-white text-[12px]">{exp.title}</strong>
                    <span className="text-[#61dafb] text-[10px] font-mono">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                  </div>
                  <div className="text-[#61dafb] text-[10px] mt-0.5">{exp.company}{exp.location ? ` @ ${exp.location}` : ""}</div>
                  <ul className="mt-2 space-y-1 text-gray-300">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="shrink-0 text-[#61dafb] font-mono text-[10px]">›</span>
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
              <h2 className="text-[#61dafb] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <span>{"<"}</span>Education<span>{"/>"}</span>
              </h2>
              {data.education.map((edu) => (
                <div key={edu.id} className="bg-[#282c34] border border-[#3a3f4b] rounded-lg p-3 mb-2">
                  <strong className="text-white text-[11px]">{edu.degree}, {edu.field}</strong>
                  <div className="text-gray-400 text-[10px]">{edu.school}</div>
                  <div className="text-[#61dafb] text-[10px] font-mono">{edu.startDate}{edu.endDate ? ` → ${edu.endDate}` : ""}</div>
                </div>
              ))}
            </section>
          )}
          {data.skills.filter(Boolean).length > 0 && (
            <section>
              <h2 className="text-[#61dafb] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <span>{"<"}</span>Skills<span>{"/>"}</span>
              </h2>
              <div className="bg-[#282c34] border border-[#3a3f4b] rounded-lg p-3">
                <div className="flex flex-wrap gap-1.5">
                  {data.skills.filter(Boolean).map((s, i) => (
                    <span key={i} className="bg-[#61dafb20] border border-[#61dafb40] text-[#61dafb] px-2 py-0.5 rounded text-[9px] font-mono">{s}</span>
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
