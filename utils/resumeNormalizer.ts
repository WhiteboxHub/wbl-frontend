/**
 * resumeNormalizer.ts
 *
 * Accepts any common resume JSON shape and maps it into
 * the app's internal ResumeData schema.
 */

import { ResumeData, Experience, Education } from "@/types/resume";

function str(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return "";
}

function arr(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  return [];
}

function flattenSkills(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.flatMap((s) => {
      if (typeof s === "string") return [s];
      if (Array.isArray(s)) return s as string[];
      if (s && typeof s === "object") {
        const obj = s as Record<string, unknown>;
        const name = str(obj.name || obj.category || obj.title || obj.label);
        let keywords = arr(obj.keywords || obj.values || obj.skills).map(str).filter(Boolean);
        if (!keywords.length && obj.details) {
          const det = str(obj.details);
          keywords = det.split(",").map((x) => x.trim()).filter(Boolean);
        }
        if (name && keywords.length) {
          return [`${name}: ${keywords.join(", ")}`];
        }
        if (name) return [name];
        if (keywords.length) return keywords;
      }
      return [];
    });
  }
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>).flatMap(([key, val]) => {
      if (Array.isArray(val)) {
        const keywords = val.map(str).filter(Boolean);
        return [`${key}: ${keywords.join(", ")}`];
      }
      return [str(val)].filter(Boolean);
    });
  }
  return [];
}

function parseDates(dates: unknown): {
  startDate: string;
  endDate: string;
  current: boolean;
} {
  const raw = str(dates);
  const sep = raw.includes(" - ") ? " - " : raw.includes("–") ? "–" : null;
  if (sep) {
    const [start, end] = raw.split(sep).map((s) => s.trim());
    const current = /present|current|now/i.test(end);
    return { startDate: start, endDate: current ? "Present" : end, current };
  }
  return { startDate: raw, endDate: "", current: false };
}

function pick(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) if (obj[k]) return str(obj[k]);
  return "";
}

export function normalizeResume(raw: unknown): ResumeData {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("JSON must be an object at the root level.");
  }

  let r = raw as Record<string, unknown>;

  // Unwrap "cv" or "resume" if they exist at the root
  if (r.cv && typeof r.cv === "object" && !Array.isArray(r.cv)) {
    r = r.cv as Record<string, unknown>;
  } else if (r.resume && typeof r.resume === "object" && !Array.isArray(r.resume)) {
    r = r.resume as Record<string, unknown>;
  }

  // Merge "sections" or "section" if they exist
  if (r.sections && typeof r.sections === "object" && !Array.isArray(r.sections)) {
    r = { ...r.sections as Record<string, unknown>, ...r };
  } else if (r.section && typeof r.section === "object" && !Array.isArray(r.section)) {
    r = { ...r.section as Record<string, unknown>, ...r };
  }

  const basics = (r.basics ?? {}) as Record<string, unknown>;

  const personal = (r.personal ?? r.basics ?? {}) as Record<string, unknown>;
  const firstName = pick(personal, "first_name", "firstName");
  const lastName = pick(personal, "last_name", "lastName");
  const parsedName = (firstName && lastName) ? `${firstName} ${lastName}`.trim() : (firstName || lastName || "");

  const fullName = pick(r, "fullName", "full_name", "name") || pick(basics, "fullName", "full_name", "name") || parsedName;
  const title = pick(r, "title", "jobTitle", "job_title", "role", "position", "headline") || 
                pick(basics, "label", "title", "jobTitle", "job_title");
  const summary = pick(r, "summary", "profile", "objective", "about", "bio") || 
                  pick(basics, "summary", "profile", "objective", "about", "bio");

  const rawContact = (r.contact ?? r.basics ?? {}) as Record<string, unknown>;
  const contact = {
    email: pick(rawContact, "email", "mail"),
    phone: pick(rawContact, "phone", "mobile", "telephone", "cell"),
    location: typeof rawContact.location === "object" && rawContact.location !== null
      ? pick(rawContact.location as Record<string, unknown>, "address", "city", "region") || str(rawContact.location)
      : pick(rawContact, "location", "address", "city"),
    linkedin: pick(rawContact, "linkedin", "linkedIn", "linkedInUrl", "linkedinUrl"),
    website: pick(rawContact, "website", "portfolio", "url", "web"),
    github: pick(rawContact, "github", "githubUrl", "github_url"),
  };

  if (!contact.email) contact.email = pick(r, "email");
  if (!contact.phone) contact.phone = pick(r, "phone", "mobile");
  if (!contact.location) contact.location = pick(r, "location", "address");

  const rawExp = arr(
    r.experience ?? r.work_experience ?? r.workExperience ?? r.work ?? r.jobs ?? r.positions
  );

  const experience: Experience[] = rawExp.map((e, i) => {
    const exp = (e ?? {}) as Record<string, unknown>;
    const { startDate, endDate, current } = parseDates(
      exp.dates ?? exp.date ?? exp.duration ?? exp.period ?? ""
    );
    const bullets = arr(
      exp.bullets ??
        exp.highlights ??
        exp.responsibilities ??
        exp.achievements ??
        exp.description ??
        exp.duties ??
        exp.tasks
    ).map(str).filter(Boolean);

    const companyName = pick(exp, "company", "name", "client");

    return {
      id: String(i + 1),
      company: companyName,
      title: pick(exp, "role", "title", "position", "jobTitle", "job_title", "designation"),
      location: pick(exp, "location", "city", "place"),
      startDate: str(exp.startDate ?? exp.start_date ?? "").trim() || startDate,
      endDate: str(exp.endDate ?? exp.end_date ?? "").trim() || endDate,
      current:
        typeof exp.current === "boolean"
          ? exp.current
          : /present|current|now/i.test(str(exp.endDate ?? exp.end_date ?? endDate)),
      bullets: bullets.length ? bullets : [""],
    };
  });

  if (experience.length === 0) {
    experience.push({
      id: "1",
      company: "",
      title: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      bullets: [""],
    });
  }

  const rawEdu = arr(r.education ?? r.qualifications ?? r.academics);

  const education: Education[] = rawEdu.map((e, i) => {
    const edu = (e ?? {}) as Record<string, unknown>;
    return {
      id: String(i + 1),
      school: pick(edu, "school", "institution", "university", "college", "name"),
      degree: pick(edu, "degree", "studyType", "qualification", "certificate", "award"),
      field: pick(edu, "field", "area", "major", "specialization", "subject", "study", "fieldOfStudy"),
      startDate: str(edu.startDate ?? edu.start_date ?? edu.from ?? ""),
      endDate: str(edu.endDate ?? edu.end_date ?? edu.year ?? edu.graduationYear ?? edu.to ?? ""),
      gpa: str(edu.gpa ?? edu.grade ?? edu.cgpa ?? ""),
    };
  });

  if (education.length === 0) {
    education.push({
      id: "1",
      school: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
    });
  }

  const skills = flattenSkills(
    r.skills ?? r.technicalSkills ?? r.technical_skills ?? r.competencies
  ).filter(Boolean);

  const certifications = arr(r.certifications ?? r.certificates ?? r.certs).map(str).filter(Boolean);
  const languages = arr(r.languages ?? r.languagesSpoken).map(str).filter(Boolean);

  return {
    fullName,
    title,
    summary,
    contact,
    experience,
    education,
    skills: skills.length ? skills : [""],
    ...(certifications.length ? { certifications } : {}),
    ...(languages.length ? { languages } : {}),
  };
}

export function isNativeFormat(raw: unknown): boolean {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const r = raw as Record<string, unknown>;
  return (
    typeof r.fullName === "string" &&
    Array.isArray(r.experience) &&
    Array.isArray(r.education) &&
    Array.isArray(r.skills)
  );
}
