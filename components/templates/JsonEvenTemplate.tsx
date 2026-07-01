import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonEvenTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-800 min-h-[842px] font-sans text-[11px]">
      <header className="px-10 pt-8 pb-5 flex justify-between items-start border-b-2 border-gray-900">
        <div>
          <h1 className="text-4xl font-black text-gray-900 leading-none">{data.fullName || "Your Name"}</h1>
          <p className="text-gray-500 mt-1">{data.title || "Professional Title"}</p>
        </div>
        <div className="text-right text-[10px] text-gray-500 space-y-0.5">
          {contact.map((c, i) => <div key={i}>{c}</div>)}
        </div>
      </header>
      <div className="px-10 py-6">
        {data.summary && (
          <section className="mb-6 flex gap-8">
            <div className="w-24 shrink-0 text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">About</span>
            </div>
            <p className="text-gray-700 leading-relaxed flex-1">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-6">
            {data.experience.map((exp, idx) => (
              <div key={exp.id} className="flex gap-8 mb-5 pb-5" style={{ borderBottom: idx < data.experience.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <div className="w-24 shrink-0 text-right text-[10px] text-gray-400 pt-0.5">
                  {idx === 0 && <span className="font-bold uppercase tracking-widest block mb-2 text-gray-400">Work</span>}
                  <div className="font-mono">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</div>
                </div>
                <div className="flex-1">
                  <strong className="text-[12px] text-gray-900">{exp.title}</strong>
                  <div className="text-gray-600 text-[10px]">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
                  <ul className="mt-1.5 space-y-1 text-gray-600">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="shrink-0 text-gray-400">‒</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </section>
        )}
        {data.education.length > 0 && (
          <section className="mb-5 flex gap-8">
            <div className="w-24 shrink-0 text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Education</span>
            </div>
            <div className="flex-1 space-y-2">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <strong className="text-[11px] text-gray-900">{edu.degree}, {edu.field}</strong>
                  <div className="text-gray-500 text-[10px]">{edu.school}</div>
                </div>
              ))}
            </div>
          </section>
        )}
        {data.skills.filter(Boolean).length > 0 && (
          <section className="flex gap-8">
            <div className="w-24 shrink-0 text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Skills</span>
            </div>
            <div className="flex-1 flex flex-wrap gap-1.5">
              {data.skills.filter(Boolean).map((s, i) => (
                <span key={i} className="text-gray-700 text-[10px] bg-gray-100 px-2 py-0.5 rounded">{s}</span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
