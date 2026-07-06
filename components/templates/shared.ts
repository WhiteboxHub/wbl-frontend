import { ResumeData } from "@/types/resume";

export function formatDateRange(start: string, end: string, current?: boolean): string {
  if (!start && !end) return "";
  const endStr = current ? "Present" : end;
  if (start && endStr) return `${start} – ${endStr}`;
  return start || endStr;
}

export function contactItems(contact: ResumeData["contact"]) {
  return [
    contact.email,
    contact.phone,
    contact.location,
    contact.linkedin,
    contact.website,
    contact.github,
  ].filter(Boolean);
}

export interface TemplateProps {
  data: ResumeData;
  scale?: number;
}
