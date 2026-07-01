import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function CompactTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-900 p-5 min-h-[842px] font-sans text-[9px] leading-snug">
      <header className="flex justify-between items-end border-b border-[#0369a1] pb-2 mb-3">
        <div>
          <h1 className="text-lg font-bold text-[#0369a1]">{data.fullName || "Your Name"}</h1>
          <p className="text-gray-600">{data.title || "Professional Title"}</p>
        </div>
        <div className="text-right text-gray-500">
          {contact.map((c, i) => <div key={i}>{c}</div>)}
        </div>
      </header>
      {data.summary && (
        <section className="mb-2">
          <h2 className="font-bold text-[#0369a1] text-[8px] uppercase mb-0.5">Summary</h2>
          <p className="text-gray-700">{data.summary}</p>
        </section>
      )}
      {data.experience.length > 0 && (
        <section className="mb-2">
          <h2 className="font-bold text-[#0369a1] text-[8px] uppercase mb-1">Experience</h2>
          {data.experience.map((exp) => (
            <div key={exp.id} className="mb-2">
              <div className="flex justify-between font-semibold">
                <span>{exp.title} — {exp.company}</span>
                <span className="text-gray-500 font-normal">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
              </div>
              <ul className="ml-3 mt-0.5 space-y-0.5 text-gray-700">
                {exp.bullets.filter(Boolean).map((b, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="shrink-0 text-[#0369a1]">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
      <div className="grid grid-cols-2 gap-4">
        {data.education.length > 0 && (
          <section>
            <h2 className="font-bold text-[#0369a1] text-[8px] uppercase mb-1">Education</h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-1">
                <strong>{edu.degree}, {edu.field}</strong> — {edu.school}
              </div>
            ))}
          </section>
        )}
        {data.skills.filter(Boolean).length > 0 && (
          <section>
            <h2 className="font-bold text-[#0369a1] text-[8px] uppercase mb-1">Skills</h2>
            <p>{data.skills.filter(Boolean).join(" | ")}</p>
          </section>
        )}
      </div>
    </div>
  );
}
