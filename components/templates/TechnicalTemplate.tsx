import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function TechnicalTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-[#0f172a] text-gray-100 min-h-[842px] font-mono text-[10px] p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#34d399]">
          <span className="text-gray-500">&gt; </span>{data.fullName || "your.name"}
        </h1>
        <p className="text-emerald-400/80 mt-1">{`// ${data.title || "Professional Title"}`}</p>
        <div className="mt-3 text-gray-500 flex flex-wrap gap-x-4">
          {contact.map((c, i) => <span key={i}>{c}</span>)}
        </div>
      </header>
      {data.skills.filter(Boolean).length > 0 && (
        <section className="mb-5">
          <h2 className="text-[#34d399] font-bold mb-2">const skills = [</h2>
          <div className="pl-4 flex flex-wrap gap-2">
            {data.skills.filter(Boolean).map((s, i) => (
              <span key={i} className="bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">&quot;{s}&quot;{i < data.skills.filter(Boolean).length - 1 ? "," : ""}</span>
            ))}
          </div>
          <p className="text-[#34d399]">];</p>
        </section>
      )}
      {data.summary && (
        <section className="mb-5">
          <h2 className="text-[#34d399] font-bold mb-2">{"/* Summary */"}</h2>
          <p className="text-gray-400 leading-relaxed pl-2 border-l border-emerald-800">{data.summary}</p>
        </section>
      )}
      {data.experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[#34d399] font-bold mb-3">experience.map(exp =&gt; (</h2>
          <div className="pl-4 space-y-4">
            {data.experience.map((exp) => (
              <div key={exp.id} className="border border-gray-800 rounded p-3 bg-gray-900/50">
                <div className="flex justify-between">
                  <span className="text-emerald-400 font-bold">{exp.title}</span>
                  <span className="text-gray-600">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</span>
                </div>
                <div className="text-gray-500">@ {exp.company}</div>
                <ul className="mt-2 space-y-1 text-gray-400">
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="shrink-0 text-emerald-400">-</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-[#34d399] mt-2">));</p>
        </section>
      )}
      {data.education.length > 0 && (
        <section>
          <h2 className="text-[#34d399] font-bold mb-2">{"/* Education */"}</h2>
          {data.education.map((edu) => (
            <div key={edu.id} className="pl-2 mb-1 text-gray-400">
              {edu.degree} — {edu.field} @ {edu.school}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
