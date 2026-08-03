/**
 * smoke.spec.ts
 *
 * Fast standalone smoke tests — no auth required.
 * Always runs regardless of role or environment.
 *
 * These complete in under 10 seconds and give instant confidence
 * that the app is reachable before the heavier regression tests run.
 */

import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("Login page is accessible and form fields are present", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
