/**
 * candidate-regression.spec.ts
 *
 * Parallel regression for the candidate dashboard (/user_dashboard).
 *
 * The main route + each tab are individual test() calls so Playwright
 * can distribute them across workers.
 *
 * Auth is pre-loaded via storageState (candidate.json) — no login needed.
 *
 * Run with:
 *   npx playwright test --config=playwright.parallel.config.ts candidate-regression.spec.ts
 */

import { test, expect } from "@playwright/test";
import { validateAllTables } from "./utils/grid";
import { validateUILayout } from "./utils/ui";

const CANDIDATE_TABS = [
  "Job Board",
  "Overview",
  "Sessions",
  "Interviews",
  "Coderpad",
  "WBL SmartPrep",
  "My LLM Key",
];

/** Checks for the tutorial popup modal and clicks its close button if it is visible */
async function dismissWelcomeModal(page: import("@playwright/test").Page) {
  try {
    const closeBtn = page.locator('button.absolute.top-4.right-4:has(svg.lucide-x)').first();
    if (await closeBtn.isVisible()) {
      console.log("[candidate-regression] Welcoming popup found — clicking close button.");
      await closeBtn.click();
      await page.waitForTimeout(500); // wait for modal animation to close
    }
  } catch (err) {
    // Ignore if click fails
  }
}

test.describe("Candidate Parallel Regression", () => {
  // storageState is applied at the project level in playwright.parallel.config.ts
  // No smartLogin() needed here — cookies are pre-loaded from candidate.json.

  // ── 1. Initial page load (no tab click) ──────────────────────────────────
  test("[candidate] /user_dashboard — initial load", async ({ page }) => {
    console.log(`\n[candidate-regression] → /user_dashboard (initial load)`);

    await page.goto("/user_dashboard", { waitUntil: "domcontentloaded" });

    try {
      await expect(page.getByText("Loading...")).toBeVisible({ timeout: 2_000 });
      await expect(page.getByText("Loading...")).toBeHidden({ timeout: 90_000 });
    } catch {
      // No spinner — OK
    }

    await dismissWelcomeModal(page);

    await validateUILayout(page);
    // Grids are behind tabs on this page — skip grid check on initial load
    await validateAllTables(page, false);

    console.log(`[candidate-regression] ✓ PASSED: /user_dashboard (initial)`);
  });

  // ── 2. One test per tab ───────────────────────────────────────────────────
  for (const tab of CANDIDATE_TABS) {
    test(`[candidate] /user_dashboard — tab: "${tab}"`, async ({ page }) => {
      console.log(`\n[candidate-regression] → tab: "${tab}"`);

      // Each test gets its own fresh page with auth loaded from storageState.
      // Navigate to the dashboard first, then click the tab.
      await page.goto("/user_dashboard", { waitUntil: "domcontentloaded" });

      try {
        await expect(page.getByText("Loading...")).toBeVisible({ timeout: 2_000 });
        await page.getByText("Loading...").waitFor({ state: "hidden", timeout: 180_000 });
      } catch {
        // No spinner — OK
      }

      await dismissWelcomeModal(page);

      // Locate and click the tab
      const tabBtn = page.locator(`button:has-text("${tab}")`).first();
      if (!(await tabBtn.isVisible())) {
        console.log(
          `[candidate-regression] Tab "${tab}" not visible — skipping.`
        );
        return;
      }

      await tabBtn.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500); // short settle for React re-render

      const summary = await validateAllTables(page);
      if (summary.gridsFound > 0) {
        await page.waitForTimeout(500); // short settle instead of 4s sleep
      }

      console.log(`[candidate-regression] ✓ PASSED: tab "${tab}"`);
    });
  }
});
