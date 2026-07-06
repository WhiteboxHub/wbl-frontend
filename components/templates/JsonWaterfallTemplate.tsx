import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonWaterfallTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-800 min-h-[842px] font-sans text-[11px]">
      {/* Top cascade */}
      <div className="relative">
        <div className="bg-[#1a1a2e] h-24" />
        <div className="bg-[#16213e] h-8 -mt-2" />
        <div className="bg-[#0f3460] h-4 -mt-1" />
      </div>
      <div className="px-10 -mt-20 relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-[#1a1a2e]">{data.fullName || "Your Name"}</h1>
          <p className="text-[#0f3460] mt-1 text-sm font-medium">{data.title || "Professional Title"}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-[10px] text-gray-500">
            {contact.map((c, i) => <span key={i}>{c}</span>)}
          </div>
        </div>
        {data.summary && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#0f3460] mb-2 border-l-4 border-[#0f3460] pl-3">Profile</h2>
            <p className="text-gray-600 leading-relaxed pl-4">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#0f3460] mb-4 border-l-4 border-[#0f3460] pl-3">Experience</h2>
            <div className="space-y-4 pl-4">
              {data.experience.map((exp, idx) => (
                <div key={exp.id} className="relative pl-4 border-l-2" style={{ borderColor: idx % 2 === 0 ? "#0f3460" : "#e94560" }}>
                  <div className="absolute -left-1.5 top-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: idx % 2 === 0 ? "#0f3460" : "#e94560" }} />
                  <div className="flex justify-between items-baseline">
                    <strong className="text-[12px] text-gray-900">{exp.title}</strong>
                    <span className="text-[10px] text-gray-400">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                  </div>
                  <div className="text-[#0f3460] text-[10px] font-medium">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
                  <ul className="mt-1.5 space-y-1 text-gray-600">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="shrink-0 text-gray-400">↳</span>
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
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#0f3460] mb-3 border-l-4 border-[#e94560] pl-3">Education</h2>
              {data.education.map((edu) => (
                <div key={edu.id} className="mb-2 pl-4">
                  <strong className="text-[11px]">{edu.degree}, {edu.field}</strong>
                  <div className="text-gray-500 text-[10px]">{edu.school}</div>
                </div>
              ))}
            </section>
          )}
          {data.skills.filter(Boolean).length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#0f3460] mb-3 border-l-4 border-[#e94560] pl-3">Skills</h2>
              <div className="flex flex-wrap gap-1.5 pl-4">
                {data.skills.filter(Boolean).map((s, i) => (
                  <span key={i} className="bg-[#1a1a2e] text-white px-2 py-0.5 rounded text-[9px]">{s}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
