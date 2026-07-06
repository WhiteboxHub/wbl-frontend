import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function ProfessionalTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-900 p-8 min-h-[842px] font-sans text-[11px]">
      <header className="mb-6">
        <h1 className="text-xl font-bold uppercase tracking-widest text-gray-900">{data.fullName || "Your Name"}</h1>
        <p className="text-gray-600 mt-1">{data.title || "Professional Title"}</p>
        <div className="mt-2 text-[10px] text-gray-500 border-t border-b border-gray-300 py-2 flex flex-wrap gap-x-6">
          {contact.map((c, i) => <span key={i}>{c}</span>)}
        </div>
      </header>
      {data.summary && (
        <section className="mb-5">
          <h2 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-1">Professional Summary</h2>
          <p className="text-gray-700 leading-relaxed">{data.summary}</p>
        </section>
      )}
      {data.experience.length > 0 && (
        <section className="mb-5">
          <h2 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-3 bg-gray-100 px-2 py-1">Professional Experience</h2>
          {data.experience.map((exp) => (
            <div key={exp.id} className="mb-4 pl-2">
              <table className="w-full text-[11px]">
                <tbody>
                  <tr>
                    <td className="font-bold">{exp.company}</td>
                    <td className="text-right text-gray-500">{exp.location}</td>
                  </tr>
                  <tr>
                    <td className="italic text-gray-700">{exp.title}</td>
                    <td className="text-right text-gray-500">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</td>
                  </tr>
                </tbody>
              </table>
              <ul className="mt-1 text-gray-700 space-y-1 ml-1">
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
        <section className="mb-5">
          <h2 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-3 bg-gray-100 px-2 py-1">Education</h2>
          {data.education.map((edu) => (
            <div key={edu.id} className="mb-2 pl-2 flex justify-between">
              <div><strong>{edu.school}</strong> — {edu.degree}, {edu.field}</div>
              <span className="text-gray-500">{formatDateRange(edu.startDate, edu.endDate)}</span>
            </div>
          ))}
        </section>
      )}
      {data.skills.filter(Boolean).length > 0 && (
        <section>
          <h2 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-2 bg-gray-100 px-2 py-1">Core Competencies</h2>
          <div className="grid grid-cols-3 gap-1 pl-2 text-[10px]">
            {data.skills.filter(Boolean).map((s, i) => <span key={i}>• {s}</span>)}
          </div>
        </section>
      )}
    </div>
  );
}
