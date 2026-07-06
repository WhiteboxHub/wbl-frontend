import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonCoraTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-800 min-h-[842px] font-sans text-[11px] flex">
      {/* Sidebar */}
      <aside className="w-[200px] bg-[#e8eaf6] flex-shrink-0 p-6 flex flex-col gap-6">
        <div>
          <div className="w-16 h-16 rounded-full bg-[#5c6bc0] flex items-center justify-center text-white text-2xl font-bold mb-3">
            {(data.fullName || "Y").charAt(0)}
          </div>
          <h1 className="text-base font-bold text-[#3949ab] leading-tight">{data.fullName || "Your Name"}</h1>
          <p className="text-[10px] text-gray-600 mt-0.5 italic">{data.title || "Professional Title"}</p>
        </div>
        <div>
          <h2 className="text-[9px] font-bold uppercase tracking-widest text-[#5c6bc0] mb-2">Contact</h2>
          <div className="space-y-1 text-[10px] text-gray-600">
            {contact.map((c, i) => <div key={i}>{c}</div>)}
          </div>
        </div>
        {data.skills.filter(Boolean).length > 0 && (
          <div>
            <h2 className="text-[9px] font-bold uppercase tracking-widest text-[#5c6bc0] mb-2">Skills</h2>
            <div className="flex flex-col gap-1">
              {data.skills.filter(Boolean).map((s, i) => (
                <div key={i} className="text-[10px] text-gray-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#5c6bc0] rounded-full shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}
        {data.education.length > 0 && (
          <div>
            <h2 className="text-[9px] font-bold uppercase tracking-widest text-[#5c6bc0] mb-2">Education</h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-2 text-[10px]">
                <strong className="text-gray-800">{edu.degree}</strong>
                <div className="text-gray-600">{edu.field}</div>
                <div className="text-gray-500 italic">{edu.school}</div>
              </div>
            ))}
          </div>
        )}
      </aside>
      {/* Main */}
      <main className="flex-1 p-8">
        {data.summary && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#3949ab] border-b border-[#c5cae9] pb-1 mb-3">Profile</h2>
            <p className="text-gray-600 leading-relaxed">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#3949ab] border-b border-[#c5cae9] pb-1 mb-4">Experience</h2>
            <div className="space-y-5">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <strong className="text-[12px] text-gray-900">{exp.title}</strong>
                    <span className="text-[10px] text-[#5c6bc0]">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                  </div>
                  <div className="text-[#5c6bc0] text-[10px]">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
                  <ul className="mt-1.5 space-y-1 text-gray-600">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="shrink-0 text-[#5c6bc0]">›</span>
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
