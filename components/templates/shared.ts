import { ResumeData } from "@/types/resume";

function formatMonthYear(value: string): string {
  if (!value) return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  return trimmed;
}

export function formatDateRange(start: string, end: string, current?: boolean): string {
  if (!start && !end) return "";

  const formattedStart = formatMonthYear(start);
  const hasEndDate = Boolean(end && end.trim());
  const formattedEnd = current || !hasEndDate ? "Present" : formatMonthYear(end);

  if (formattedStart && formattedEnd) {
    if (current || !hasEndDate) return `${formattedStart} - Present`;
    return `${formattedStart} - ${formattedEnd}`;
  }

  return formattedStart || formattedEnd;
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
