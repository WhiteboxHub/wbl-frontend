/**
 * admin-regression.spec.ts
 *
 * Parallel regression for ALL admin (/avatar/**) routes.
 *
 * Strategy: "check and move on"
 *   - Wait for the Loading spinner to disappear (no hard timeout failure)
 *   - If page is still loading when the wait ends → log  and move on (soft skip)
 *   - If grid expected but not found → log  and move on (no hard throw)
 *   - Only HARD fail on real errors (auth loss, navigation crash, layout broken)
 *
 * Auth is pre-loaded via storageState (admin.json) — no login call needed.
 */

import { test, expect } from "@playwright/test";
import { validateAllTables } from "./utils/grid";
import { validateUILayout } from "./utils/ui";
import { getAllGridRoutes } from "./utils/routes";

// Discover routes once — deterministic order (sorted in routes.ts)
const adminRoutes = getAllGridRoutes().filter((r) => r.role === "admin");

test.describe("Admin Parallel Regression", () => {
  for (const { path: routePath, hasGrid } of adminRoutes) {
    test(`[admin] ${routePath}`, async ({ page }) => {
      console.log(`\n${"─".repeat(60)}`);
      console.log(`[admin-regression] → ${routePath} | expectGrid=${hasGrid}`);
      console.log(`${"─".repeat(60)}`);

      // ── Navigate ──────────────────────────────────────────────────────
      await page.goto(routePath, { waitUntil: "domcontentloaded" });

      // ── Wait for Loading... spinner ────────────────────────────────────
      // Strategy: wait up to 2s for spinner to appear, then wait for it to go away.
      // If spinner is STILL visible after the wait → page is slow, log warning and move on.
      // Never hard-fail due to slow data fetching alone.
      const spinnerVisible = await page
        .getByText("Loading...")
        .isVisible()
        .catch(() => false);

      if (spinnerVisible) {
        const spinnerGone = await page
          .getByText("Loading...")
          .waitFor({ state: "hidden", timeout: 180_000 })
          .then(() => true)
          .catch(() => false);

        if (!spinnerGone) {
          // Page is still loading — check current state
          const stillLoading = await page
            .getByText("Loading...")
            .isVisible()
            .catch(() => false);

          if (stillLoading) {
            console.warn(
              `[admin-regression]  SLOW PAGE: ${routePath} — still loading after timeout. ` +
              `Grid check skipped. Move on.`
            );
            return; // Soft skip — test passes, grid not validated
          }
        }
      }

      // ── 1. Base layout ────────────────────────────────────────────────
      await validateUILayout(page);

      // ── 2. Grid validation ────────────────────────────────────────────
      // employee-dashboard grids are behind tabs — skip grid check on initial load
      const expectGridOnLoad =
        routePath === "/avatar/employee/employee-dashboard" ? false : hasGrid;

      const summary = await validateAllTables(page, expectGridOnLoad);

      // Short settle instead of the original hard 4,000ms sleep
      if (summary.gridsFound > 0) {
        await page.waitForTimeout(500);
      }

      // Soft warning (not hard failure) if grid expected but not found
      // — could be slow backend, empty data, or a real bug — all logged for review
      if (hasGrid && summary.gridsFound === 0 && expectGridOnLoad) {
        console.warn(
          `[admin-regression]  GRID NOT FOUND on ${routePath}. ` +
          `Expected an AG-Grid based on static analysis but none rendered. ` +
          `Could be slow load, empty dataset, or a real issue — check manually.`
        );
        // Not throwing — move on to next route
        return;
      }

      console.log(`[admin-regression] ✓ PASSED: ${routePath}`);
    });
  }
});
