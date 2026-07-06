import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonProfessionalTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-900 min-h-[842px] font-sans text-[11px]">
      <header className="bg-gradient-to-r from-[#1a237e] to-[#283593] text-white px-10 py-8">
        <h1 className="text-4xl font-bold tracking-tight">{data.fullName || "Your Name"}</h1>
        <p className="text-blue-200 text-sm mt-1 font-light">{data.title || "Professional Title"}</p>
        <div className="mt-4 h-px bg-blue-400 opacity-50" />
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-[10px] text-blue-100">
          {contact.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-blue-300 rounded-full" />
              {c}
            </span>
          ))}
        </div>
      </header>
      <div className="px-10 py-7">
        {data.summary && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1a237e] mb-2">Executive Summary</h2>
            <div className="bg-blue-50 border-l-4 border-[#1a237e] p-4">
              <p className="text-gray-700 leading-relaxed">{data.summary}</p>
            </div>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1a237e] mb-4 pb-1 border-b-2 border-[#1a237e]">Professional Experience</h2>
            <div className="space-y-5">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-[12px] text-gray-900">{exp.title}</strong>
                      <div className="text-[#1a237e] font-semibold text-[10.5px]">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
                    </div>
                    <span className="text-[10px] text-white bg-[#1a237e] px-2 py-0.5 rounded shrink-0 ml-2">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-gray-600">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="shrink-0 text-[#1a237e] font-bold">◆</span>
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
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#1a237e] mb-3 pb-1 border-b-2 border-[#1a237e]">Education</h2>
              {data.education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <strong className="text-[11px] text-gray-900">{edu.degree}, {edu.field}</strong>
                  <div className="text-gray-600 text-[10px]">{edu.school}</div>
                  <div className="text-[10px] text-gray-400">{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}</div>
                </div>
              ))}
            </section>
          )}
          {data.skills.filter(Boolean).length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#1a237e] mb-3 pb-1 border-b-2 border-[#1a237e]">Core Competencies</h2>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.filter(Boolean).map((s, i) => (
                  <span key={i} className="border-2 border-[#1a237e] text-[#1a237e] px-2 py-0.5 rounded text-[9px] font-semibold">{s}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
