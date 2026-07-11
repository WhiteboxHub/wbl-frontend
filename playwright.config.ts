import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import os from "os";
import path from "path";

dotenv.config();

const isCI = !!process.env.CI;
const baseURL = process.env.BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",

  // Write all test artifacts (if any) to OS temp — keeps the project folder clean
  outputDir: path.join(os.tmpdir(), "playwright-test-results"),

  // 120 s per test — enough for slow grid loads; individual tests can override
  timeout: 120 * 1000,

  // Fully sequential: grids depend on login state, parallel breaks auth flow
  fullyParallel: false,

  // Fail fast in CI if someone accidentally left test.only() in the code
  forbidOnly: isCI,

  // No retries — a flaky grid test should surface immediately
  retries: 0,

  workers: 1,

  reporter: [["list"], ["html"]],

  use: {
    baseURL,

    // Capture trace on failure to aid debugging
    trace: "retain-on-failure",

    // Always capture screenshot on failure for clear evidence
    screenshot: "only-on-failure",

    // Keep video on failure so we can see exactly when the grid disappeared
    video: "off",

    // Always run headless locally and in CI
    headless: true,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Only spin up the dev server locally (not in CI where Docker provides it)
  webServer: !isCI
    ? {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120 * 1000,
      }
    : undefined,
});
