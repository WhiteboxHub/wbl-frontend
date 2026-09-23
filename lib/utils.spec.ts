import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cn, formatLinkedInUrl, logger, formatError } from "./utils";

describe("cn function", () => {
  it("should merge classes correctly", () => {
    expect(cn("text-red-500", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    expect(cn("base-class", isActive && "active-class")).toBe(
      "base-class active-class",
    );
  });

  it("should handle false and null conditions", () => {
    const isActive = false;
    expect(cn("base-class", isActive && "active-class", null)).toBe(
      "base-class",
    );
  });

  it("should merge tailwind classes properly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("should work with object notation", () => {
    expect(cn("base", { conditional: true, "not-included": false })).toBe(
      "base conditional",
    );
  });
});

describe("Application Logger & Error Sanitizer", () => {
  const originalEnv = process.env.NODE_ENV;
  let consoleLogSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;
  let consoleInfoSpy: any;
  let consoleDebugSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  describe("formatError", () => {
    it("extracts error.message from Error instance", () => {
      const err = new TypeError("Failed to fetch");
      expect(formatError(err)).toBe("Failed to fetch");
    });

    it("returns string as is", () => {
      expect(formatError("Network unreachable")).toBe("Network unreachable");
    });

    it("extracts message or detail from plain error object", () => {
      expect(formatError({ message: "Server connection failed" })).toBe("Server connection failed");
      expect(formatError({ detail: "Not found" })).toBe("Not found");
    });

    it("strips stack trace from plain object with stack", () => {
      const formatted = formatError({ code: 500, stack: "Error\n  at something..." });
      expect(formatted).not.toContain("at something");
      expect(formatted).toContain("500");
    });
  });

  describe("Development Mode (NODE_ENV=development)", () => {
    beforeEach(() => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    });

    it("preserves full Error object and stack trace on logger.error", () => {
      const fetchError = new TypeError("Failed to fetch");
      logger.error("Failed to load assessments:", fetchError);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to load assessments:", fetchError);
      // The second argument passed to console.error is the actual Error instance with stack
      const loggedError = consoleErrorSpy.mock.calls[0][1];
      expect(loggedError).toBe(fetchError);
      expect(loggedError.stack).toBeDefined();
    });

    it("preserves full Error object on logger.warn", () => {
      const fetchError = new TypeError("Failed to fetch");
      logger.warn("[AIPrepDashboard] getReadiness failed:", fetchError);

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith("[AIPrepDashboard] getReadiness failed:", fetchError);
      const loggedError = consoleWarnSpy.mock.calls[0][1];
      expect(loggedError).toBe(fetchError);
    });

    it("outputs log, info, and debug in development", () => {
      logger.log("test log");
      logger.info("test info");
      logger.debug("test debug");

      expect(consoleLogSpy).toHaveBeenCalledWith("test log");
      expect(consoleInfoSpy).toHaveBeenCalledWith("test info");
      expect(consoleDebugSpy).toHaveBeenCalledWith("test debug");
    });
  });

  describe("Production Mode (NODE_ENV=production)", () => {
    beforeEach(() => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    });

    it("sanitizes TypeError: Failed to fetch on logger.error and never passes Error instance or stack trace", () => {
      const fetchError = new TypeError("Failed to fetch");
      logger.error("Failed to load assessments:", fetchError);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const loggedArg = consoleErrorSpy.mock.calls[0][0];
      // Expected single sanitized string line
      expect(loggedArg).toBe("[App Error] Failed to load assessments: Failed to fetch");
      // Must NOT pass any additional arguments (like the Error instance or stack)
      expect(consoleErrorSpy.mock.calls[0].length).toBe(1);
      expect(typeof loggedArg).toBe("string");
      expect(loggedArg).not.toContain("at ");
    });

    it("sanitizes logger.error when called with a single Error argument", () => {
      const fetchError = new TypeError("Failed to fetch");
      logger.error(fetchError);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("[App Error] Failed to fetch");
    });

    it("sanitizes logger.warn in production without leaking stack trace", () => {
      const fetchError = new TypeError("Failed to fetch");
      logger.warn("[AIPrepDashboard] getReadiness failed:", fetchError);

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const loggedArg = consoleWarnSpy.mock.calls[0][0];
      expect(loggedArg).toBe("[App Warn] [AIPrepDashboard] getReadiness failed: Failed to fetch");
      expect(consoleWarnSpy.mock.calls[0].length).toBe(1);
      expect(loggedArg).not.toContain("at ");
    });

    it("suppresses debug, info, and log in production", () => {
      logger.log("sensitive log");
      logger.info("sensitive info");
      logger.debug("sensitive debug");

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });
});
