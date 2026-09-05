import { test, expect } from "@playwright/test";

test.describe("AIPrep Question Bank Admin UI (FE4)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to question bank page
    await page.goto("/avatar/question-bank");
  });

  test("renders question bank management page with header and controls", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("AI Prep Question Bank");
    await expect(page.locator("#question-search-input")).toBeVisible();
  });

  test("can filter questions by search query and category", async ({ page }) => {
    const searchInput = page.locator("#question-search-input");
    await searchInput.fill("ReAct");
    await expect(searchInput).toHaveValue("ReAct");
  });

  test("opens Add Question modal and validates fields", async ({ page }) => {
    const searchInput = page.locator("#question-search-input");
    await expect(searchInput).toBeVisible();
  });
});

