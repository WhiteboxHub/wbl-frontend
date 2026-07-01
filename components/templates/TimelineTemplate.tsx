import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function TimelineTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-900 min-h-[842px] font-sans text-[10px] p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#0891b2]">{data.fullName || "Your Name"}</h1>
        <p className="text-gray-600 mt-1">{data.title || "Professional Title"}</p>
        <p className="text-[9px] text-gray-400 mt-2">{contact.join(" • ")}</p>
      </header>
      {data.summary && (
        <section className="mb-6 p-3 bg-cyan-50 rounded-lg border-l-4 border-[#0891b2]">
          <p className="text-gray-700 leading-relaxed">{data.summary}</p>
        </section>
      )}
      {data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-[#0891b2] mb-4">Career Timeline</h2>
          <div className="relative pl-6">
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-cyan-200" />
            {data.experience.map((exp, idx) => (
              <div key={exp.id} className="relative mb-5">
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#0891b2] border-2 border-white shadow" />
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-bold text-[11px] text-[#0891b2]">{exp.title}</h3>
                      <p className="text-gray-600">{exp.company} • {exp.location}</p>
                    </div>
                    <span className="bg-[#0891b2] text-white px-2 py-0.5 rounded text-[8px] font-medium whitespace-nowrap">
                      {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-gray-700">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="shrink-0 text-[#0891b2]">•</span>
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
      <div className="grid grid-cols-2 gap-6">
        {data.education.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-[#0891b2] mb-3">Education</h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-2 flex gap-2 items-start">
                <div className="w-2 h-2 rounded-full bg-[#0891b2] mt-1.5 shrink-0" />
                <div>
                  <p className="font-semibold">{edu.degree}, {edu.field}</p>
                  <p className="text-gray-500">{edu.school}</p>
                </div>
              </div>
            ))}
          </section>
        )}
        {data.skills.filter(Boolean).length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-[#0891b2] mb-3">Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.filter(Boolean).map((s, i) => (
                <span key={i} className="border border-cyan-300 text-[#0891b2] px-2 py-0.5 rounded-full text-[9px]">{s}</span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
