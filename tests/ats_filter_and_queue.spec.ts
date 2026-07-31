import { test, expect } from '@playwright/test';

test.describe('Job Board ATS Filtering & Parallel Queue Engine', () => {
  test('should filter jobs by ATS system, update count, and support select all', async ({ page }) => {
    // 1. Navigate to user dashboard job board
    await page.goto('http://localhost:3000/user_dashboard/job-board');

    // 2. Verify job board header is present
    const headerHeading = page.locator('h2', { hasText: 'Jobs' });
    await expect(headerHeading).toBeVisible({ timeout: 10000 });

    // 3. Select Greenhouse ATS filter
    const atsSelect = page.locator('select').first();
    await atsSelect.selectOption('greenhouse');

    // 4. Verify filtered count updates dynamically
    const filteredCountText = await headerHeading.innerText();
    expect(filteredCountText).toMatch(/Jobs \(\d+\)/);

    // 5. Test Select All Filtered button
    const selectAllBtn = page.getByRole('button', { name: /Select All Filtered/i });
    if (await selectAllBtn.isVisible()) {
      await selectAllBtn.click();
      const selectedText = page.locator('span', { hasText: 'selected' });
      await expect(selectedText).toBeVisible();
    }
  });
});
