import { test, expect, Page } from "@playwright/test";
import { validateAllTables } from "./utils/grid";
import { validateUILayout } from "./utils/ui";
import { getAllGridRoutes } from "./utils/routes";

// Discover routes dynamically from Next.js filesystem
const gridRoutes = getAllGridRoutes();

async function runRouteValidation(page: Page, routePath: string, role: string, hasGrid: boolean) {
  console.log(`\n[Regression] → Starting check for ${role} on route: ${routePath}`);
  
  await page.goto(routePath);
  
  // Handle case where Loading... spinner may not appear
  try {
    await expect(page.getByText('Loading...')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Loading...')).toBeHidden({ timeout: 180000 });
  } catch {
    console.log(`[Regression] No Loading spinner found on ${routePath} - continuing...`);
  }

  // 1. Base layout check
  await validateUILayout(page);

  // 2. Grid validation
  const expectGridOnLoad = [
    "/avatar/employee/employee-dashboard",
    "/user_dashboard",
  ].includes(routePath)
    ? false
    : hasGrid;

  const summary = await validateAllTables(page, expectGridOnLoad);

  if (summary.gridsFound > 0) {
    console.log(`[Regression] Grid(s) found. Waiting for 500ms to settle...`);
    await page.waitForTimeout(500);
  }

  if (hasGrid && summary.gridsFound === 0 && expectGridOnLoad) {
    throw new Error(
      `[Regression] GRID MISSING on ${routePath}. ` +
        `Static analysis detected an AG-Grid component in the page source, ` +
        `but no grid rendered at runtime. Check your data fetching and component mounting.`
    );
  }

  // 3. Candidate dashboard tabs validation
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
      const tabBtn = page.locator(`button:has-text("${tab}")`).first();

      if (!(await tabBtn.isVisible())) {
        console.log(`[Regression] Tab "${tab}" not visible — skipping.`);
        continue;
      }

      await test.step(`Candidate tab: ${tab}`, async () => {
        console.log(`[Regression] Clicking candidate tab: "${tab}"`);
        await tabBtn.click();

        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(800); // short settle time for React re-render

        const tabSummary = await validateAllTables(page);

        if (tabSummary.gridsFound > 0) {
          console.log(`[Regression] Grid(s) found in tab. Waiting for 500ms to settle...`);
          await page.waitForTimeout(500);
        }
      });
    }
  }
  
  console.log(`[Regression] ✓ PASSED: ${routePath}`);
}

// ── Candidate Routes (Parallelized using cached session) ────────────────────
test.describe("Candidate routes", () => {
  // Use saved candidate authentication state
  test.use({ storageState: ".auth/candidate.json" });

  const candidateRoutes = gridRoutes.filter((r) => r.role === "candidate");
  for (const { path: routePath, hasGrid } of candidateRoutes) {
    test(`Validate route: ${routePath}`, async ({ page }) => {
      // Disable per-test timeout — individual grids can take time to load
      test.setTimeout(0);
      await runRouteValidation(page, routePath, "candidate", hasGrid);
    });
  }
});

// ── Admin Routes (Parallelized using cached session) ─────────────────────────
test.describe("Admin routes", () => {
  // Use saved admin authentication state
  test.use({ storageState: ".auth/admin.json" });

  const adminRoutes = gridRoutes.filter((r) => r.role === "admin");
  for (const { path: routePath, hasGrid } of adminRoutes) {
    test(`Validate route: ${routePath}`, async ({ page }) => {
      // Disable per-test timeout
      test.setTimeout(0);
      await runRouteValidation(page, routePath, "admin", hasGrid);
    });
  }
});

// ── Smoke test: login page always accessible (Unauthenticated) ──────────────
test.describe("Smoke test", () => {
  // Clear storage state to verify the unauthenticated login page
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Login page is accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
