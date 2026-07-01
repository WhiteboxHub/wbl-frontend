import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function ClassicTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-900 p-8 font-sans text-[11px] leading-relaxed min-h-[842px]">
      <header className="text-center border-b-2 border-[#1e3a5f] pb-4 mb-5">
        <h1 className="text-2xl font-bold text-[#1e3a5f] tracking-wide">{data.fullName || "Your Name"}</h1>
        <p className="text-sm text-gray-600 mt-1">{data.title || "Professional Title"}</p>
        <p className="text-[10px] text-gray-500 mt-2">{contact.join("  •  ")}</p>
      </header>
      {data.summary && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f] border-b border-gray-300 pb-1 mb-2">Summary</h2>
          <p className="text-gray-700">{data.summary}</p>
        </section>
      )}
      {data.experience.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f] border-b border-gray-300 pb-1 mb-2">Experience</h2>
          {data.experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <strong className="text-[12px]">{exp.title}</strong>
                <span className="text-gray-500 text-[10px]">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="italic">{exp.company}</span>
                <span className="text-[10px]">{exp.location}</span>
              </div>
              <ul className="mt-1 text-gray-700 space-y-1">
                {exp.bullets.filter(Boolean).map((b, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="shrink-0 text-gray-900">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
      {data.education.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f] border-b border-gray-300 pb-1 mb-2">Education</h2>
          {data.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <strong>{edu.degree} in {edu.field}</strong>
              <span className="text-gray-500 ml-2">{formatDateRange(edu.startDate, edu.endDate)}</span>
              <div className="text-gray-600">{edu.school}{edu.gpa ? ` • GPA: ${edu.gpa}` : ""}</div>
            </div>
          ))}
        </section>
      )}
      {data.skills.filter(Boolean).length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f] border-b border-gray-300 pb-1 mb-2">Skills</h2>
          <p>{data.skills.filter(Boolean).join(" • ")}</p>
        </section>
      )}
    </div>
  );
}
