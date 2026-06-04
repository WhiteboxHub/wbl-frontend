import { test, expect } from "@playwright/test";
import { smartLogin, logout } from "./utils/auth";
import { validateAllTables } from "./utils/grid";
import { validateUILayout } from "./utils/ui";
import { getAllGridRoutes } from "./utils/routes";

/**
 * Full UI Grid Regression Suite
 *
 * Flow:
 *  1. Discover all routes via static analysis of the Next.js `app/` directory.
 *  2. For each role (admin, candidate) login once, then visit every route.
 *  3. On each route:
 *     a. Validate base UI layout (no crash overlays, header present).
 *     b. Validate every AG-Grid: column headers visible, no JS render errors.
 *     c. If a grid was EXPECTED but NOT found → hard failure → bail:1 stops the run.
 *     d. If no grid was expected and none appeared → pass silently.
 *  4. For the candidate dashboard, also click through internal tabs and re-validate.
 */
test.describe("Full UI Grid Regression", () => {
  test("Validate every grid on every route", async ({ page }) => {
    // Disable the per-test timeout — grids can take time to load data
    test.setTimeout(0);

    const gridRoutes = getAllGridRoutes();
    console.log(`\n${"=".repeat(60)}`);
    console.log(
      `[Regression] Starting — ${gridRoutes.length} route(s) discovered.`,
    );
    console.log(`${"=".repeat(60)}\n`);

    const roles: ("admin" | "candidate")[] = ["candidate", "admin"];

    for (const role of roles) {
      await test.step(`Role: ${role}`, async () => {
        await smartLogin(page, role);

        const routesToTest = gridRoutes.filter((r) => r.role === role);
        console.log(
          `\n[Regression] ${role.toUpperCase()} — ${routesToTest.length} route(s) to validate.\n`,
        );

        for (const { path: routePath, hasGrid } of routesToTest) {
          await test.step(`[${role}] ${routePath}`, async () => {
            console.log(`\n${"─".repeat(60)}`);
            console.log(
              `[Regression] → ${role} | ${routePath} | expectGrid=${hasGrid}`,
            );
            console.log(`${"─".repeat(60)}`);

            await page.goto(routePath, { waitUntil: "networkidle" });

            // ── 1. Base layout check ──────────────────────────────────────
            await validateUILayout(page);

            // ── 2. Grid validation ────────────────────────────────────────
            // The employee dashboard and candidate dashboard load grids lazily behind tabs — skip initial check
            const expectGridOnLoad = [
              "/avatar/employee/employee-dashboard",
              "/user_dashboard",
            ].includes(routePath)
              ? false
              : hasGrid;

            const summary = await validateAllTables(page, expectGridOnLoad);

            if (summary.gridsFound > 0) {
              console.log(
                `[Regression] Grid(s) found. Waiting for 9 seconds before moving to the next...`,
              );
              await page.waitForTimeout(9000);
            }

            // If static analysis says a grid should be here but none rendered → hard fail
            // (bail:1 in playwright.config.ts will stop the entire run immediately)
            if (hasGrid && summary.gridsFound === 0 && expectGridOnLoad) {
              throw new Error(
                `[Regression] GRID MISSING on ${routePath}. ` +
                  `Static analysis detected an AG-Grid component in the page source, ` +
                  `but no grid rendered at runtime. Check your data fetching and component mounting.`,
              );
            }

            // ── 3. Candidate dashboard: validate each tab's grids ─────────
            if (role === "candidate" && routePath === "/user_dashboard") {
              const candidateTabs = [
                "Job Board",
                "Overview",
                "Sessions",
                "Interviews",
                "Coderpad",
                "WBL SmartPrep",
                "My LLM Key",
              ];

              for (const tab of candidateTabs) {
                const tabBtn = page
                  .locator(`button:has-text("${tab}")`)
                  .first();

                if (!(await tabBtn.isVisible())) {
                  console.log(
                    `[Regression] Tab "${tab}" not visible — skipping.`,
                  );
                  continue;
                }

                await test.step(`Candidate tab: ${tab}`, async () => {
                  console.log(
                    `\n[Regression] Clicking candidate tab: "${tab}"`,
                  );
                  await tabBtn.click();

                  // Wait for the tab content to render (network + React paint)
                  await page.waitForLoadState("networkidle");
                  await page.waitForTimeout(800); // short settle time for React re-render

                  const tabSummary = await validateAllTables(page);

                  if (tabSummary.gridsFound > 0) {
                    console.log(
                      `[Regression] Grid(s) found in tab. Waiting for 9 seconds before moving to the next...`,
                    );
                    await page.waitForTimeout(9000);
                  }
                });
              }
            }

            console.log(`[Regression] ✓ PASSED: ${routePath}`);
          });
        }

        await logout(page);
        console.log(
          `\n[Regression] ${role.toUpperCase()} regression complete.\n`,
        );
      });
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`[Regression] ALL ROUTES PASSED ✓`);
    console.log(`${"=".repeat(60)}\n`);
  });

  // ── Smoke test: login page always accessible ──────────────────────────────
  test("Login page is accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
