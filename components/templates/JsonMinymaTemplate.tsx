import { TemplateProps, contactItems, formatDateRange } from "./shared";

export function JsonMinymaTemplate({ data }: TemplateProps) {
  const contact = contactItems(data.contact);
  return (
    <div className="bg-white text-gray-800 min-h-[842px] font-sans p-8 text-[10.5px]">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{data.fullName || "Your Name"}</h1>
        <p className="text-gray-500 text-sm">{data.title || "Professional Title"}</p>
        <div className="flex flex-wrap gap-x-4 mt-2 text-[10px] text-gray-400">
          {contact.map((c, i) => <span key={i}>{c}</span>)}
        </div>
      </header>
      {data.summary && (
        <section className="mb-5">
          <p className="text-gray-600 leading-relaxed text-[10.5px]">{data.summary}</p>
        </section>
      )}
      {data.experience.length > 0 && (
        <section className="mb-5">
          <h2 className="font-bold text-gray-900 text-xs uppercase tracking-widest mb-3 border-t border-gray-200 pt-3">
            Work Experience
          </h2>
          <div className="space-y-4">
            {data.experience.map((exp) => (
              <div key={exp.id} className="flex gap-4">
                <div className="text-[10px] text-gray-400 w-24 shrink-0 text-right pt-0.5">
                  {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                </div>
                <div className="flex-1 border-l border-gray-200 pl-4">
                  <strong className="text-gray-900 text-[11px]">{exp.title}</strong>
                  <div className="text-gray-500 text-[10px]">{exp.company}{exp.location ? `, ${exp.location}` : ""}</div>
                  <ul className="mt-1.5 space-y-0.5 text-gray-600">
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="shrink-0 text-gray-300 mt-0.5">—</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="grid grid-cols-3 gap-6 border-t border-gray-200 pt-4">
        {data.education.length > 0 && (
          <section className="col-span-2">
            <h2 className="font-bold text-gray-900 text-xs uppercase tracking-widest mb-3">Education</h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="flex gap-4 mb-2">
                <div className="text-[10px] text-gray-400 w-24 shrink-0 text-right">{edu.endDate || edu.startDate}</div>
                <div className="border-l border-gray-200 pl-4">
                  <strong className="text-gray-900 text-[10.5px]">{edu.degree}, {edu.field}</strong>
                  <div className="text-gray-500 text-[10px]">{edu.school}</div>
                </div>
              </div>
            ))}
          </section>
        )}
        {data.skills.filter(Boolean).length > 0 && (
          <section>
            <h2 className="font-bold text-gray-900 text-xs uppercase tracking-widest mb-3">Skills</h2>
            <ul className="space-y-0.5">
              {data.skills.filter(Boolean).map((s, i) => (
                <li key={i} className="text-gray-600 text-[10px] flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-gray-400 rounded-full shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
