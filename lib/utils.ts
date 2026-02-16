import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLinkedInUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  // Check if it's already a full URL
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Check if it starts with www.linkedin.com or linkedin.com
  if (/^(www\.)?linkedin\.com/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  // Otherwise treat as ID and append to base URL
  // Remove any leading slashes
  const cleanId = trimmed.replace(/^\/+/, "");
  return `https://www.linkedin.com/in/${cleanId}`;
}
