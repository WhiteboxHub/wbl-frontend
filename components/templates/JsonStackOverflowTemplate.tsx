import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonStackOverflowTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-[#f8f9f9] text-gray-800 min-h-[842px] font-sans text-[11px]">
      <header className="bg-[#f48024] px-10 py-6">
        <h1 className="text-3xl font-bold text-white">{data.fullName || "Your Name"}</h1>
        <p className="text-orange-100 mt-0.5">{data.title || "Professional Title"}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-[10px] text-orange-100">
          {contact.map((c, i) => <span key={i}>{c}</span>)}
        </div>
      </header>
      <div className="flex gap-0">
        {/* Sidebar */}
        <aside className="w-[180px] bg-white border-r border-gray-200 flex-shrink-0 p-5">
          {data.skills.filter(Boolean).length > 0 && (
            <div className="mb-5">
              <h2 className="text-[9px] font-bold uppercase tracking-widest text-[#f48024] mb-2">Technologies</h2>
              <div className="flex flex-col gap-1">
                {data.skills.filter(Boolean).map((s, i) => (
                  <span key={i} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[9px] border border-gray-200">{s}</span>
                ))}
              </div>
            </div>
          )}
          {data.education.length > 0 && (
            <div>
              <h2 className="text-[9px] font-bold uppercase tracking-widest text-[#f48024] mb-2">Education</h2>
              {data.education.map((edu) => (
                <div key={edu.id} className="mb-2 text-[10px]">
                  <strong className="text-gray-800">{edu.degree}</strong>
                  <div className="text-gray-500">{edu.field}</div>
                  <div className="text-gray-400 italic">{edu.school}</div>
                </div>
              ))}
            </div>
          )}
        </aside>
        {/* Main */}
        <main className="flex-1 px-7 py-6">
          {data.summary && (
            <section className="mb-5">
              <h2 className="text-xs font-bold text-[#f48024] border-b border-gray-200 pb-1 mb-2">About me</h2>
              <p className="text-gray-600 leading-relaxed">{data.summary}</p>
            </section>
          )}
          {data.experience.length > 0 && (
            <section className="mb-5">
              <h2 className="text-xs font-bold text-[#f48024] border-b border-gray-200 pb-1 mb-4">Experience</h2>
              <div className="space-y-4">
                {data.experience.map((exp) => (
                  <div key={exp.id} className="bg-white border border-gray-200 rounded p-3 shadow-sm">
                    <div className="flex justify-between items-baseline">
                      <strong className="text-[12px] text-gray-900">{exp.title}</strong>
                      <span className="text-[10px] text-[#f48024]">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                    </div>
                    <div className="text-gray-500 text-[10px]">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
                    <ul className="mt-1.5 space-y-1 text-gray-600">
                      {exp.bullets.filter(Boolean).map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="shrink-0 text-[#f48024]">▸</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
