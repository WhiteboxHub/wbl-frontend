import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function CreativeTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white min-h-[842px] flex font-sans text-[10px]">
      <aside className="w-[35%] bg-[#7c3aed] text-white p-6">
        <h1 className="text-xl font-bold leading-tight mb-1">{data.fullName || "Your Name"}</h1>
        <p className="text-purple-200 text-[11px] mb-6">{data.title || "Professional Title"}</p>
        <div className="space-y-4">
          <div>
            <h3 className="text-[9px] uppercase tracking-widest text-purple-300 mb-2">Contact</h3>
            {contact.map((c, i) => <p key={i} className="text-purple-100 mb-1">{c}</p>)}
          </div>
          {data.skills.filter(Boolean).length > 0 && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest text-purple-300 mb-2">Skills</h3>
              {data.skills.filter(Boolean).map((s, i) => (
                <div key={i} className="mb-1.5">
                  <div className="flex justify-between mb-0.5"><span>{s}</span></div>
                  <div className="h-1 bg-purple-400/30 rounded"><div className="h-1 bg-white/70 rounded" style={{ width: `${70 + (i * 7) % 30}%` }} /></div>
                </div>
              ))}
            </div>
          )}
          {data.languages && data.languages.length > 0 && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest text-purple-300 mb-2">Languages</h3>
              {data.languages.map((l, i) => <p key={i}>{l}</p>)}
            </div>
          )}
        </div>
      </aside>
      <main className="flex-1 p-6 text-gray-800">
        {data.summary && (
          <section className="mb-5">
            <h2 className="text-[#7c3aed] font-bold text-sm mb-2">About Me</h2>
            <p className="leading-relaxed text-gray-600">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-[#7c3aed] font-bold text-sm mb-3">Work Experience</h2>
            {data.experience.map((exp) => (
              <div key={exp.id} className="mb-4 relative pl-4 border-l-2 border-purple-200">
                <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-[#7c3aed]" />
                <strong className="text-[11px]">{exp.title}</strong>
                <div className="text-gray-500">{exp.company} | {formatDateRange(exp.startDate, exp.endDate, exp.current)}</div>
                <ul className="mt-1 space-y-1 text-gray-600">
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="shrink-0 text-[#7c3aed]">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}
        {data.education.length > 0 && (
          <section>
            <h2 className="text-[#7c3aed] font-bold text-sm mb-3">Education</h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-2">
                <strong>{edu.degree} in {edu.field}</strong>
                <div className="text-gray-500">{edu.school} • {formatDateRange(edu.startDate, edu.endDate)}</div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
