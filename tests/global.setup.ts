/**
 * global.setup.ts
 *
 * Runs ONCE before any parallel worker starts.
 * Logs in as admin and candidate (simultaneously, in separate browsers),
 * then saves cookies + localStorage to .auth/*.json.
 *
 * Workers load those files via storageState — no re-login needed per test.
 *
 * Reads from process.env (works with both local .env and GitHub Secrets):
 *   ADMIN_EMAIL, ADMIN_PASSWORD
 *   CANDIDATE_EMAIL, CANDIDATE_PASSWORD
 *   BASE_URL
 *   NEXT_PUBLIC_API_URL
 */

import { chromium, FullConfig } from "@playwright/test";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const baseURL = process.env.BASE_URL || "http://localhost:3000";

export const AUTH_DIR = path.join(__dirname, ".auth");
export const ADMIN_AUTH_PATH = path.join(AUTH_DIR, "admin.json");
export const CANDIDATE_AUTH_PATH = path.join(AUTH_DIR, "candidate.json");

// ─────────────────────────────────────────────────────────────────────────────
// Core login helper
// ─────────────────────────────────────────────────────────────────────────────
async function loginAndSave(
  role: "admin" | "candidate",
  storageStatePath: string
) {
  const email = process.env[`${role.toUpperCase()}_EMAIL`];
  const password = process.env[`${role.toUpperCase()}_PASSWORD`];

  if (!email || !password) {
    throw new Error(
      `[global.setup] Missing credentials for role "${role}". ` +
        `Set ${role.toUpperCase()}_EMAIL and ${role.toUpperCase()}_PASSWORD ` +
        `in your .env file (local) or GitHub Secrets (CI/CD).`
    );
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  try {
    console.log(`\n[global.setup] ── Authenticating as ${role} ──────────────`);

    // ── 1. Backend health check (only if NEXT_PUBLIC_API_URL is set) ────────
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.log(`[global.setup] NEXT_PUBLIC_API_URL not set — skipping backend health check.`);
    } else {
      console.log(`[global.setup] Checking backend reachability...`);
      try {
        const res = await page.request.get(apiUrl.replace(/\/api$/, "/"), {
          timeout: 10_000,
        });
        console.log(`[global.setup] API responded: HTTP ${res.status()}`);
      } catch (err) {
        throw new Error(
          `[global.setup] Cannot reach the backend API. ` +
            `Ensure the backend is running and NEXT_PUBLIC_API_URL is set correctly. ` +
            `Error: ${err}`
        );
      }
    }

    // ── 2. Navigate to login page ─────────────────────────────────────────
    await page.goto("/login", { waitUntil: "networkidle" });

    // Retry loop: handles Next.js ChunkLoadErrors / hydration failures
    for (let attempt = 1; attempt <= 3; attempt++) {
      const errorOverlay = page.locator(
        'h1:has-text("Build Error"), h1:has-text("Unhandled Runtime Error"), h1:has-text("Failed to compile")'
      );
      const emailInput = page.locator('input[name="email"]');

      await Promise.race([
        errorOverlay.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {}),
        emailInput.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {}),
      ]);

      if (await errorOverlay.isVisible()) {
        console.warn(`[global.setup] Next.js error on attempt ${attempt}. Reloading...`);
        await page.reload({ waitUntil: "networkidle" });
        continue;
      }
      if (await emailInput.isVisible()) break;
      if (attempt === 3) {
        throw new Error(`[global.setup] Login page failed to load after 3 attempts.`);
      }
      await page.reload({ waitUntil: "networkidle" });
    }

    // ── 3. Fill and submit ────────────────────────────────────────────────
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const loginBtn = page.getByRole("button", { name: "Login", exact: true });

    await emailInput.waitFor({ state: "visible", timeout: 10_000 });
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await loginBtn.waitFor({ state: "visible", timeout: 10_000 });

    // Allow React hydration to attach the onSubmit handler before clicking
    await page.waitForTimeout(2_000);

    const errorAlert = page
      .locator('div[role="alert"]:not(#__next-route-announcer__)')
      .filter({ hasText: /error|invalid|failed|not found/i });

    await loginBtn.click();

    const result = await Promise.race([
      page
        .waitForURL(
          (url) => {
            const p = new URL(url).pathname;
            return (
              p === "/" ||
              p === "" ||
              p.startsWith("/avatar") ||
              p.startsWith("/user_dashboard")
            );
          },
          { timeout: 45_000 }
        )
        .then(() => "success")
        .catch(() => "timeout"),
      errorAlert
        .waitFor({ state: "visible", timeout: 45_000 })
        .then(() => "error")
        .catch(() => "timeout"),
    ]);

    if (result === "error") {
      const msg = (await errorAlert.innerText()).trim();
      throw new Error(
        `[global.setup] Login failed for ${role}: "${msg}". ` +
          `Check that the credentials in your .env / GitHub Secrets are correct ` +
          `and that NEXTAUTH_URL matches BASE_URL.`
      );
    }
    if (result === "timeout") {
      throw new Error(
        `[global.setup] Login timed out for ${role}. Current URL: ${page.url()}`
      );
    }

    // ── 4. Land on the dashboard ─────────────────────────────────────────
    const afterPath = new URL(page.url()).pathname;
    if (afterPath === "/" || afterPath === "") {
      const dest = role === "admin" ? "/avatar" : "/user_dashboard";
      await page.goto(dest, { waitUntil: "domcontentloaded" });
    }

    // ── 5. Persist auth state ─────────────────────────────────────────────
    await context.storageState({ path: storageStatePath });
    console.log(`[global.setup] ✓ Saved auth state → ${storageStatePath}`);
  } finally {
    await browser.close();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point — called by Playwright before any worker starts
// ─────────────────────────────────────────────────────────────────────────────
async function globalSetup(_config: FullConfig) {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  console.log(
    "\n[global.setup] Logging in as admin and candidate simultaneously..."
  );

  // Both use independent browser instances — safe to run in parallel
  await Promise.all([
    loginAndSave("admin", ADMIN_AUTH_PATH),
    loginAndSave("candidate", CANDIDATE_AUTH_PATH),
  ]);

  console.log(
    "\n[global.setup] ✓ Auth state saved for both roles. Workers starting...\n"
  );
}

export default globalSetup;
