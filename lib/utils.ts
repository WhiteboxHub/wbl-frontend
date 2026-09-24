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

/**
 * Application Logger & Error Sanitizer
 * Controls logging output based on environment.
 * In development: outputs full logs and error details including stack traces.
 * In production: suppresses debug logs and sanitizes errors to avoid leaking stack traces or internal endpoints.
 */

const isDevelopment = () => process.env.NODE_ENV === "development";

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object") {
    const errObj = error as Record<string, unknown>;
    if (typeof errObj.message === "string") {
      return errObj.message;
    }
    if (typeof errObj.detail === "string") {
      return errObj.detail;
    }
    // Strip stack or trace if present to avoid leaking stack traces in production
    const { stack, ...rest } = errObj;
    try {
      return JSON.stringify(rest);
    } catch {
      return String(error);
    }
  }
  try {
    return JSON.stringify(error) ?? String(error);
  } catch {
    return String(error);
  }
}

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment()) {
      console.log(...args);
    }
  },

  warn: (message: unknown, error?: unknown, ...args: any[]) => {
    if (isDevelopment()) {
      if (error !== undefined) {
        console.warn(message, error, ...args);
      } else {
        console.warn(message, ...args);
      }
    } else {
      // In production: sanitize and omit stack trace
      if (error !== undefined) {
        const cleanMsg =
          typeof message === "string"
            ? message.replace(/:\s*$/, "")
            : formatError(message);
        console.warn(`[App Warn] ${cleanMsg}: ${formatError(error)}`);
      } else {
        const cleanMsg =
          typeof message === "string"
            ? message
            : formatError(message);
        console.warn(`[App Warn] ${cleanMsg}`);
      }
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment()) {
      console.info(...args);
    }
  },

  debug: (...args: any[]) => {
    if (isDevelopment()) {
      console.debug(...args);
    }
  },

  /**
   * Log an error.
   * In development: prints the full error/stack.
   * In production: prints a single sanitized message line without stack trace exposure.
   */
  error: (message: unknown, error?: unknown, ...args: any[]) => {
    if (isDevelopment()) {
      if (error !== undefined) {
        console.error(message, error, ...args);
      } else {
        console.error(message, ...args);
      }
    } else {
      // In production: sanitize and omit stack trace
      if (error !== undefined) {
        const cleanMsg =
          typeof message === "string"
            ? message.replace(/:\s*$/, "")
            : formatError(message);
        console.error(`[App Error] ${cleanMsg}: ${formatError(error)}`);
      } else {
        const cleanMsg =
          typeof message === "string"
            ? message
            : formatError(message);
        console.error(`[App Error] ${cleanMsg}`);
      }
    }
  },
};

export { formatError };
