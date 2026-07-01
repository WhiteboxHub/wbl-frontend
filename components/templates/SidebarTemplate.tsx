import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function SidebarTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white min-h-[842px] flex font-sans text-[10px]">
      <aside className="w-[32%] bg-[#be185d] text-white p-5">
        <div className="w-16 h-16 rounded-full bg-white/20 mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
          {(data.fullName || "Y").charAt(0)}
        </div>
        <h1 className="text-center text-lg font-bold mb-1">{data.fullName || "Your Name"}</h1>
        <p className="text-center text-pink-200 text-[10px] mb-6">{data.title || "Professional Title"}</p>
        <div className="space-y-4">
          <div>
            <h3 className="text-[8px] uppercase tracking-widest text-pink-300 mb-2 border-b border-pink-400/30 pb-1">Contact</h3>
            {contact.map((c, i) => <p key={i} className="text-pink-50 mb-1 text-[9px]">{c}</p>)}
          </div>
          {data.skills.filter(Boolean).length > 0 && (
            <div>
              <h3 className="text-[8px] uppercase tracking-widest text-pink-300 mb-2 border-b border-pink-400/30 pb-1">Skills</h3>
              <div className="flex flex-wrap gap-1">
                {data.skills.filter(Boolean).map((s, i) => (
                  <span key={i} className="bg-white/15 px-1.5 py-0.5 rounded text-[8px]">{s}</span>
                ))}
              </div>
            </div>
          )}
          {data.certifications && data.certifications.length > 0 && (
            <div>
              <h3 className="text-[8px] uppercase tracking-widest text-pink-300 mb-2 border-b border-pink-400/30 pb-1">Certifications</h3>
              {data.certifications.map((c, i) => <p key={i} className="text-[9px]">{c}</p>)}
            </div>
          )}
        </div>
      </aside>
      <main className="flex-1 p-6 text-gray-800">
        {data.summary && (
          <section className="mb-5">
            <h2 className="text-[#be185d] font-bold uppercase text-[9px] tracking-wider mb-2">About</h2>
            <p className="text-gray-600 leading-relaxed">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-[#be185d] font-bold uppercase text-[9px] tracking-wider mb-3">Experience</h2>
            {data.experience.map((exp) => (
              <div key={exp.id} className="mb-4">
                <div className="flex justify-between">
                  <strong className="text-[11px]">{exp.title}</strong>
                  <span className="text-gray-400">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                </div>
                <div className="text-[#be185d]">{exp.company}</div>
                <ul className="mt-1 space-y-1 text-gray-600">
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="shrink-0 text-[#be185d]">•</span>
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
            <h2 className="text-[#be185d] font-bold uppercase text-[9px] tracking-wider mb-3">Education</h2>
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
