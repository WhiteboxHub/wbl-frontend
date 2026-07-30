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

  // Enable parallel execution now that authentication is decoupled and cached
  fullyParallel: true,

  // Fail fast in CI if someone accidentally left test.only() in the code
  forbidOnly: isCI,

  // No retries — a flaky grid test should surface immediately
  retries: 0,

  // Run tests in parallel: limit to 2 workers in CI, use default locally
  workers: isCI ? 3 : undefined,

  reporter: [["list"], ["html"]],

  use: {
    baseURL,

    // Trace disabled — set to "retain-on-failure" to re-enable for debugging
    trace: "off",

    // Always capture screenshot on failure for clear evidence
    screenshot: "only-on-failure",

    // Keep video on failure so we can see exactly when the grid disappeared
    video: "off",

    // Always run headless locally and in CI
    headless: true,
  },

  projects: [
    // Setup project to authenticate once and save storage state
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    // Main testing project using the saved storage state
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],

  // Automatically start and stop the Next.js server for testing
  webServer: {
    command: isCI ? "npm run start" : "npm run dev",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
  },
});