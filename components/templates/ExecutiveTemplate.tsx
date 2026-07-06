import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function ExecutiveTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white min-h-[842px] font-sans">
      <header className="bg-[#92400e] text-white px-8 py-8">
        <h1 className="text-4xl font-bold tracking-tight">{data.fullName || "Your Name"}</h1>
        <p className="text-amber-100 text-lg mt-2 font-light">{data.title || "Professional Title"}</p>
      </header>
      <div className="px-8 py-2 bg-amber-50 text-[10px] text-amber-800 flex flex-wrap gap-x-6">
        {contact.map((c, i) => <span key={i}>{c}</span>)}
      </div>
      <div className="p-8 text-[11px] text-gray-800">
        {data.summary && (
          <section className="mb-6 border-l-4 border-[#92400e] pl-4">
            <h2 className="text-lg font-bold text-[#92400e] mb-2">Executive Summary</h2>
            <p className="leading-relaxed text-gray-700">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-[#92400e] mb-4 border-b-2 border-amber-200 pb-1">Leadership Experience</h2>
            {data.experience.map((exp) => (
              <div key={exp.id} className="mb-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-[13px]">{exp.title}</h3>
                    <p className="text-[#92400e] font-semibold">{exp.company}</p>
                  </div>
                  <span className="text-gray-500 text-[10px] whitespace-nowrap">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                </div>
                <ul className="mt-2 space-y-1.5 text-gray-700">
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="shrink-0 text-[#92400e] font-bold">—</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}
        <div className="grid grid-cols-2 gap-8">
          {data.education.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[#92400e] mb-3">Education</h2>
              {data.education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <strong>{edu.degree}, {edu.field}</strong>
                  <div className="text-gray-500">{edu.school}</div>
                </div>
              ))}
            </section>
          )}
          {data.skills.filter(Boolean).length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[#92400e] mb-3">Expertise</h2>
              <p>{data.skills.filter(Boolean).join(" • ")}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
