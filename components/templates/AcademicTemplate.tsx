import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function AcademicTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-900 p-8 min-h-[842px] font-sans text-[10px] leading-relaxed">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-[#4338ca]">{data.fullName || "Your Name"}</h1>
        <p className="text-gray-600 italic">{data.title || "Professional Title"}</p>
        <p className="text-[9px] text-gray-500 mt-1">{contact.join(" | ")}</p>
      </header>
      {data.summary && (
        <section className="mb-4">
          <h2 className="font-bold text-[#4338ca] text-[11px] mb-1">Research Interests & Summary</h2>
          <p className="text-gray-700 text-justify">{data.summary}</p>
        </section>
      )}
      {data.education.length > 0 && (
        <section className="mb-4">
          <h2 className="font-bold text-[#4338ca] text-[11px] border-b border-indigo-200 pb-0.5 mb-2">Education</h2>
          {data.education.map((edu) => (
            <div key={edu.id} className="mb-2 ml-2">
              <div className="flex justify-between">
                <strong>{edu.degree} in {edu.field}</strong>
                <span className="text-gray-500">{formatDateRange(edu.startDate, edu.endDate)}</span>
              </div>
              <div className="text-gray-600">{edu.school}{edu.gpa ? ` — GPA: ${edu.gpa}` : ""}</div>
            </div>
          ))}
        </section>
      )}
      {data.experience.length > 0 && (
        <section className="mb-4">
          <h2 className="font-bold text-[#4338ca] text-[11px] border-b border-indigo-200 pb-0.5 mb-2">Professional Experience</h2>
          {data.experience.map((exp) => (
            <div key={exp.id} className="mb-3 ml-2">
              <div className="flex justify-between">
                <span><strong>{exp.title}</strong>, {exp.company}</span>
                <span className="text-gray-500">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
              </div>
              <ul className="mt-1 text-gray-700 space-y-1">
                {exp.bullets.filter(Boolean).map((b, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="shrink-0">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
      {data.skills.filter(Boolean).length > 0 && (
        <section className="mb-4">
          <h2 className="font-bold text-[#4338ca] text-[11px] border-b border-indigo-200 pb-0.5 mb-2">Technical Skills</h2>
          <p className="ml-2">{data.skills.filter(Boolean).join("; ")}</p>
        </section>
      )}
      {data.certifications && data.certifications.length > 0 && (
        <section>
          <h2 className="font-bold text-[#4338ca] text-[11px] border-b border-indigo-200 pb-0.5 mb-2">Certifications & Awards</h2>
          <ul className="list-disc list-inside ml-2">
            {data.certifications.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
