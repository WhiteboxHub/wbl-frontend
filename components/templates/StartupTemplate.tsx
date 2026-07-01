import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function StartupTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-gradient-to-br from-orange-50 to-white min-h-[842px] font-sans text-[10px]">
      <header className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ea580c] flex items-center justify-center text-white font-bold text-lg">
            {(data.fullName || "Y").charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.fullName || "Your Name"}</h1>
            <p className="text-[#ea580c] font-semibold">{data.title || "Professional Title"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {contact.map((c, i) => (
            <span key={i} className="bg-white border border-orange-200 text-gray-600 px-2 py-1 rounded-full text-[9px]">{c}</span>
          ))}
        </div>
      </header>
      <div className="px-6 pb-6">
        {data.summary && (
          <section className="mb-5 bg-white rounded-xl p-4 shadow-sm border border-orange-100">
            <h2 className="text-[#ea580c] font-bold text-sm mb-2">🚀 About</h2>
            <p className="text-gray-600 leading-relaxed">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-[#ea580c] font-bold text-sm mb-3">💼 Experience</h2>
            <div className="space-y-3">
              {data.experience.map((exp) => (
                <div key={exp.id} className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-[11px]">{exp.title}</h3>
                      <p className="text-[#ea580c]">{exp.company}</p>
                    </div>
                    <span className="bg-orange-100 text-[#ea580c] px-2 py-0.5 rounded-full text-[8px] font-medium">
                      {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-gray-600">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="shrink-0 text-[#ea580c]">→</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
        <div className="grid grid-cols-2 gap-3">
          {data.education.length > 0 && (
            <section className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
              <h2 className="text-[#ea580c] font-bold text-sm mb-2">🎓 Education</h2>
              {data.education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <p className="font-semibold">{edu.degree}, {edu.field}</p>
                  <p className="text-gray-500">{edu.school}</p>
                </div>
              ))}
            </section>
          )}
          {data.skills.filter(Boolean).length > 0 && (
            <section className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
              <h2 className="text-[#ea580c] font-bold text-sm mb-2">⚡ Skills</h2>
              <div className="flex flex-wrap gap-1">
                {data.skills.filter(Boolean).map((s, i) => (
                  <span key={i} className="bg-orange-100 text-[#ea580c] px-2 py-0.5 rounded-lg text-[9px] font-medium">{s}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
