import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function AtsTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-900 p-10 font-sans text-[11px] leading-relaxed min-h-[842px]">
      {/* Header section with clean, centered contact info */}
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-wide uppercase">
          {data.fullName || "Your Name"}
        </h1>
        <p className="text-xs font-semibold text-gray-700 mt-1 uppercase tracking-wider">
          {data.title || "Professional Title"}
        </p>
        <p className="text-[10px] text-gray-600 mt-2 font-mono">
          {contact.join("   |   ")}
        </p>
      </header>

      {/* Summary section */}
      {data.summary && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-900 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-gray-800 text-justify">{data.summary}</p>
        </section>
      )}

      {/* Work Experience section */}
      {data.experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-900 pb-1 mb-3">
            Professional Experience
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline font-semibold">
                  <span className="text-[12px] text-gray-900">{exp.title}</span>
                  <span className="text-gray-800 text-[10px] font-mono">
                    {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700 text-[10px] mt-0.5">
                  <span className="italic">{exp.company}</span>
                  <span>{exp.location}</span>
                </div>
                <ul className="mt-1.5 text-gray-800 space-y-1 pl-4 list-disc">
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} className="pl-0.5 leading-relaxed">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education section */}
      {data.education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-900 pb-1 mb-3">
            Education
          </h2>
          <div className="space-y-3">
            {data.education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline font-semibold">
                  <span className="text-gray-900">
                    {edu.degree} in {edu.field}
                  </span>
                  <span className="text-gray-800 text-[10px] font-mono">
                    {formatDateRange(edu.startDate, edu.endDate)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700 text-[10px] mt-0.5">
                  <span>{edu.school}</span>
                  {edu.gpa ? <span>GPA: {edu.gpa}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills section */}
      {data.skills.filter(Boolean).length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-900 pb-1 mb-2">
            Skills & Competencies
          </h2>
          <p className="text-gray-800 leading-relaxed">
            {data.skills.filter(Boolean).join("  •  ")}
          </p>
        </section>
      )}
    </div>
  );
}
