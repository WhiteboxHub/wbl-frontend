import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function ElegantTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-[#faf9f7] text-gray-800 min-h-[842px] font-serif p-10">
      <header className="text-center mb-8">
        <div className="w-16 h-px bg-[#78350f] mx-auto mb-4" />
        <h1 className="text-3xl font-serif text-[#78350f] tracking-wide">{data.fullName || "Your Name"}</h1>
        <p className="text-gray-500 italic mt-2 text-sm">{data.title || "Professional Title"}</p>
        <p className="text-[10px] text-gray-400 mt-3 tracking-wider">{contact.join("  ·  ")}</p>
        <div className="w-16 h-px bg-[#78350f] mx-auto mt-4" />
      </header>
      {data.summary && (
        <section className="mb-7 text-center max-w-md mx-auto">
          <p className="text-[11px] leading-loose text-gray-600 italic">{data.summary}</p>
        </section>
      )}
      {data.experience.length > 0 && (
        <section className="mb-7">
          <h2 className="text-center text-[#78350f] text-sm tracking-[0.2em] uppercase mb-5">Experience</h2>
          {data.experience.map((exp) => (
            <div key={exp.id} className="mb-5 text-center">
              <h3 className="font-semibold text-[12px]">{exp.title}</h3>
              <p className="text-[#78350f] italic text-[11px]">{exp.company}</p>
              <p className="text-[10px] text-gray-400 mb-2">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</p>
              <ul className="text-[10px] text-gray-600 space-y-1 max-w-sm mx-auto text-left">
                {exp.bullets.filter(Boolean).map((b, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="shrink-0 text-[#78350f]">·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
      <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto">
        {data.education.length > 0 && (
          <section className="text-center">
            <h2 className="text-[#78350f] text-[10px] tracking-[0.2em] uppercase mb-3">Education</h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-2 text-[10px]">
                <p className="font-semibold">{edu.degree}, {edu.field}</p>
                <p className="text-gray-500 italic">{edu.school}</p>
              </div>
            ))}
          </section>
        )}
        {data.skills.filter(Boolean).length > 0 && (
          <section className="text-center">
            <h2 className="text-[#78350f] text-[10px] tracking-[0.2em] uppercase mb-3">Skills</h2>
            <p className="text-[10px] text-gray-600">{data.skills.filter(Boolean).join(" · ")}</p>
          </section>
        )}
      </div>
    </div>
  );
}
