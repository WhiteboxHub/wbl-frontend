import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function BoldTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white min-h-[842px] font-sans">
      <header className="p-8 pb-4">
        <h1 className="text-5xl font-black text-gray-900 leading-none tracking-tighter uppercase">
          {(data.fullName || "Your Name").split(" ").map((w, i) => (
            <span key={i} className={i % 2 === 1 ? "text-[#dc2626]" : ""}>{w} </span>
          ))}
        </h1>
        <p className="text-xl font-bold text-gray-400 mt-2 uppercase tracking-widest">{data.title || "Professional Title"}</p>
        <div className="mt-4 h-1 bg-[#dc2626] w-24" />
        <p className="mt-4 text-[10px] text-gray-500 font-medium">{contact.join("  /  ")}</p>
      </header>
      <div className="px-8 text-[11px]">
        {data.summary && (
          <section className="mb-6 bg-gray-900 text-white p-4 -mx-0">
            <p className="leading-relaxed font-medium">{data.summary}</p>
          </section>
        )}
        {data.experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-2xl font-black text-gray-900 mb-4">EXPERIENCE</h2>
            {data.experience.map((exp) => (
              <div key={exp.id} className="mb-5 border-l-4 border-[#dc2626] pl-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-black text-[13px] uppercase">{exp.title}</h3>
                  <span className="font-bold text-[#dc2626] text-[10px]">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                </div>
                <p className="font-bold text-gray-500 uppercase text-[10px] tracking-wider">{exp.company}</p>
                <ul className="mt-2 space-y-1 text-gray-700">
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
        <div className="grid grid-cols-2 gap-6">
          {data.education.length > 0 && (
            <section>
              <h2 className="text-lg font-black mb-3">EDUCATION</h2>
              {data.education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <p className="font-bold">{edu.degree}, {edu.field}</p>
                  <p className="text-gray-500">{edu.school}</p>
                </div>
              ))}
            </section>
          )}
          {data.skills.filter(Boolean).length > 0 && (
            <section>
              <h2 className="text-lg font-black mb-3">SKILLS</h2>
              <div className="flex flex-wrap gap-2">
                {data.skills.filter(Boolean).map((s, i) => (
                  <span key={i} className="bg-[#dc2626] text-white px-2 py-1 font-bold text-[9px] uppercase">{s}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
