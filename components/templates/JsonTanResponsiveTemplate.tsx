import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonTanResponsiveTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-[#fdf6e3] text-[#586e75] min-h-[842px] font-sans text-[11px]">
      <header className="bg-[#073642] text-[#839496] px-10 py-7">
        <h1 className="text-3xl font-bold text-[#fdf6e3]">{data.fullName || "Your Name"}</h1>
        <p className="text-[#b58900] mt-1 text-sm">{data.title || "Professional Title"}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-[10px] text-[#657b83]">
          {contact.map((c, i) => <span key={i}>{c}</span>)}
        </div>
      </header>
      <div className="px-10 py-7">
        {data.summary && (
          <section className="mb-6 border-l-4 border-[#b58900] pl-4">
            <p className="text-[#586e75] leading-relaxed">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#b58900] mb-4">Work History</h2>
            <div className="space-y-5">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <strong className="text-[12px] text-[#073642]">{exp.title}</strong>
                    <span className="text-[10px] text-[#657b83] font-mono">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                  </div>
                  <div className="text-[#b58900] text-[10px] font-medium">{exp.company}{exp.location ? ` — ${exp.location}` : ""}</div>
                  <ul className="mt-1.5 space-y-1 text-[#586e75]">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="shrink-0 text-[#2aa198]">›</span>
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
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#b58900] mb-3">Education</h2>
              {data.education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <strong className="text-[11px] text-[#073642]">{edu.degree}, {edu.field}</strong>
                  <div className="text-[10px]">{edu.school}</div>
                  <div className="text-[10px] text-[#657b83] font-mono">{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</div>
                </div>
              ))}
            </section>
          )}
          {data.skills.filter(Boolean).length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#b58900] mb-3">Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.filter(Boolean).map((s, i) => (
                  <span key={i} className="bg-[#073642] text-[#839496] px-2 py-0.5 rounded text-[9px] font-mono">{s}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
