/**
 * playwright.config.ts  — Single parallel config
 *
 * HOW IT WORKS
 * ────────────
 * 1. "setup" project runs tests/global.setup.ts FIRST (single-threaded).
 *    - Logs in as admin and candidate simultaneously (two browser instances).
 *    - Saves session cookies to tests/.auth/admin.json and candidate.json.
 *    - Reads credentials from process.env:
 *        Local  → .env file  (ADMIN_EMAIL, ADMIN_PASSWORD, CANDIDATE_EMAIL, …)
 *        CI/CD  → GitHub Secrets (same variable names)
 *        URL    → BASE_URL env var (or http://localhost:3000 fallback)
 *
 * 2. "admin" and "candidate" projects start AFTER setup finishes.
 *    - Each test gets a pre-authenticated context — no login per test.
 *    - fullyParallel:true + workers:4 → ~3–4 min total (down from 13–15 min).
 *
 * 3. "smoke" runs in parallel with admin/candidate — no auth needed.
 *
 * USAGE
 * ─────
 *   Local:  npx playwright test
 *   CI/CD:  npx playwright test        (env vars come from GitHub Secrets)
 */

import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import os from "os";
import path from "path";

dotenv.config();

const isCI = !!process.env.CI;
const baseURL = process.env.BASE_URL || "http://localhost:3000";

// Auth state written by global.setup.ts at the start of each run
const ADMIN_AUTH = path.join(__dirname, "tests", ".auth", "admin.json");
const CANDIDATE_AUTH = path.join(__dirname, "tests", ".auth", "candidate.json");

export default defineConfig({
  testDir: "./tests",

  // Write test artifacts to OS temp — keeps the project folder clean
  outputDir: path.join(os.tmpdir(), "playwright-test-results"),

  // 240 s per test — safe buffer for 180s spinner wait times
  timeout: 240 * 1000,

  // Each test runs in its own worker → full parallelism
  fullyParallel: true,

  // Fail fast in CI if someone accidentally left test.only() in the code
  forbidOnly: isCI,

  // No retries — flaky tests should surface immediately
  retries: 0,

  // 3 parallel workers — balances speed vs. server load
  workers: 3,

  reporter: [["list"], ["html"]],

  // Runs once before any worker starts — creates .auth/*.json files
  globalSetup: require.resolve("./tests/global.setup.ts"),

  use: {
    baseURL,

    // Trace disabled — set to "retain-on-failure" to re-enable for debugging
    trace: "off",

    // Always capture screenshot on failure for clear evidence
    screenshot: "only-on-failure",

    // Video off for speed — enable "retain-on-failure" if needed
    video: "off",

    headless: true,
  },

  projects: [
    // ── 1. One-time auth setup ────────────────────────────────────────────
    // Runs first, creates the .auth/*.json files all other projects depend on.
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },

    // ── 2. Admin regression ───────────────────────────────────────────────
    // All /avatar/** routes, each as a separate test.
    // Session loaded from admin.json — no login per test.
    {
      name: "admin",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ADMIN_AUTH,
      },
      testMatch: /admin-regression\.spec\.ts/,
      dependencies: ["setup"],
    },

    // ── 3. Candidate regression ───────────────────────────────────────────
    // /user_dashboard + all 7 tabs, each as a separate test.
    // Session loaded from candidate.json — no login per test.
    {
      name: "candidate",
      use: {
        ...devices["Desktop Chrome"],
        storageState: CANDIDATE_AUTH,
      },
      testMatch: /candidate-regression\.spec\.ts/,
      dependencies: ["setup"],
    },

    // ── 4. Smoke tests ────────────────────────────────────────────────────
    // No auth needed — verifies the login page is reachable.
    // Runs in parallel with admin and candidate projects.
    {
      name: "smoke",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /smoke\.spec\.ts/,
    },
  ],

  // Spin up the dev server locally only.
  // In CI, GitHub Actions / Docker provides the server at BASE_URL.
  webServer: !isCI
    ? {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120 * 1000,
      }
    : undefined,
});