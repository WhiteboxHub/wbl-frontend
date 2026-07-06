import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonFlatTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-[#16a085] min-h-[842px] font-sans text-[11px]">
      <header className="px-10 py-8 text-white">
        <h1 className="text-4xl font-bold">{data.fullName || "Your Name"}</h1>
        <p className="text-green-200 mt-1 text-sm">{data.title || "Professional Title"}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[10px] text-green-100">
          {contact.map((c, i) => <span key={i}>{c}</span>)}
        </div>
      </header>
      <div className="bg-white mx-4 mb-4 rounded-lg shadow-xl p-8">
        {data.summary && (
          <section className="mb-6 pb-5 border-b border-gray-100">
            <p className="text-gray-600 leading-relaxed">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-6 pb-5 border-b border-gray-100">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#16a085] mb-4">Experience</h2>
            <div className="space-y-5">
              {data.experience.map((exp) => (
                <div key={exp.id} className="flex gap-4">
                  <div className="w-1 bg-[#16a085] rounded-full self-stretch flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                      <strong className="text-[12px] text-gray-900">{exp.title}</strong>
                      <span className="text-[10px] text-[#16a085] bg-green-50 px-2 py-0.5 rounded">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                    </div>
                    <div className="text-[#16a085] text-[10px] font-medium">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
                    <ul className="mt-1.5 space-y-1 text-gray-600">
                      {exp.bullets.filter(Boolean).map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="shrink-0 text-[#16a085]">→</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        <div className="grid grid-cols-2 gap-8">
          {data.education.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#16a085] mb-3">Education</h2>
              {data.education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <strong className="text-[11px] text-gray-900">{edu.degree}, {edu.field}</strong>
                  <div className="text-gray-500 text-[10px]">{edu.school}</div>
                  <div className="text-[10px] text-gray-400">{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</div>
                </div>
              ))}
            </section>
          )}
          {data.skills.filter(Boolean).length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#16a085] mb-3">Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.filter(Boolean).map((s, i) => (
                  <span key={i} className="bg-green-50 border border-green-200 text-[#16a085] px-2 py-0.5 rounded text-[10px]">{s}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
