import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonKendallTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-900 min-h-[842px] font-sans text-[11px] flex">
      {/* Sidebar */}
      <aside className="w-[185px] flex-shrink-0 bg-[#2e4057] text-white p-6 flex flex-col gap-6">
        <div>
          <div className="w-16 h-16 rounded-full bg-[#048a81] flex items-center justify-center text-3xl font-bold text-white mb-3">
            {(data.fullName || "Y").charAt(0)}
          </div>
          <h1 className="text-sm font-bold leading-tight">{data.fullName || "Your Name"}</h1>
          <p className="text-[#54c6bc] text-[10px] mt-0.5">{data.title || "Professional Title"}</p>
        </div>
        <div>
          <h2 className="text-[9px] font-bold uppercase tracking-widest text-[#54c6bc] mb-2">Contact</h2>
          <div className="space-y-1 text-[10px] text-teal-100">
            {contact.map((c, i) => <div key={i} className="break-words">{c}</div>)}
          </div>
        </div>
        {data.skills.filter(Boolean).length > 0 && (
          <div>
            <h2 className="text-[9px] font-bold uppercase tracking-widest text-[#54c6bc] mb-2">Skills</h2>
            <div className="space-y-1.5">
              {data.skills.filter(Boolean).map((s, i) => (
                <div key={i} className="text-[10px] text-teal-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#048a81] rounded-full shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}
        {data.education.length > 0 && (
          <div>
            <h2 className="text-[9px] font-bold uppercase tracking-widest text-[#54c6bc] mb-2">Education</h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-2 text-[10px]">
                <strong className="text-white">{edu.degree}</strong>
                <div className="text-teal-200">{edu.field}</div>
                <div className="text-teal-300 italic text-[9px]">{edu.school}</div>
                <div className="text-teal-400 text-[9px]">{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</div>
              </div>
            ))}
          </div>
        )}
      </aside>
      {/* Main */}
      <main className="flex-1 p-8">
        {data.summary && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#2e4057] border-b-2 border-[#048a81] pb-1 mb-3">Profile</h2>
            <p className="text-gray-600 leading-relaxed">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#2e4057] border-b-2 border-[#048a81] pb-1 mb-4">Experience</h2>
            <div className="space-y-5">
              {data.experience.map((exp) => (
                <div key={exp.id} className="relative pl-4 border-l-2 border-[#048a81]">
                  <div className="absolute -left-1.5 top-1 w-2.5 h-2.5 rounded-full bg-[#048a81]" />
                  <div className="flex justify-between items-baseline">
                    <strong className="text-[12px] text-gray-900">{exp.title}</strong>
                    <span className="text-[10px] text-[#048a81] font-medium">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                  </div>
                  <div className="text-[#2e4057] text-[10px] font-medium">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
                  <ul className="mt-1.5 space-y-1 text-gray-600">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="shrink-0 text-[#048a81]">▸</span>
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
  );
}
