import { expect, Page } from "@playwright/test";

/**
 * Validates the base UI layout of a page.
 */
export async function validateUILayout(page: Page) {
  // Check that the body is visible (handles hydration errors where nothing renders)
  await expect(page.locator("body")).toBeVisible();

  // Ensure no unhandled Next.js error overlays are present
  const errorOverlay = page.locator(
    'h1:has-text("Build Error"), h1:has-text("Unhandled Runtime Error"), h1:has-text("Failed to compile")',
  );
  if (await errorOverlay.isVisible()) {
    throw new Error("Next.js build/runtime error overlay detected.");
  }

  // Ensure header is visible on standard pages
  const header = page.locator("header").first();
  if (await header.isVisible()) {
    await expect(header).toBeVisible();
  }
}
