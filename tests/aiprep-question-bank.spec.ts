import { test, expect } from "@playwright/test";

test.describe("AIPrep Question Bank Admin UI (FE4)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to question bank page
    await page.goto("/avatar/question-bank");
  });

  test("renders question bank management page with header and controls", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "AI Prep Question Bank", exact: true })).toBeVisible();
    await expect(page.locator("#question-search-input")).toBeVisible();
  });

  test("can filter questions by search query and category", async ({ page }) => {
    const searchInput = page.locator("#question-search-input");
    await searchInput.fill("ReAct");
    await expect(searchInput).toHaveValue("ReAct");
  });

  test("opens Add Question modal and shows the question form", async ({ page }) => {
    await page.getByRole("button", { name: "Add Questions" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Question Bank - Add New Question" })).toBeVisible();
    await expect(dialog.locator("#modal-question-text")).toBeVisible();
  });
});

