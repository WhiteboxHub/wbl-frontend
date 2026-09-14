/**
 * E2E tests for the AI Prep wizard.
 *
 * Uses the candidate auth state (tests/.auth/candidate.json).
 * Runs under the "candidate" project in playwright.config.ts.
 *
 * Note: Tests stop before the final "Start Assessment" click to avoid
 * hitting the real backend.
 */

import { test, expect } from '@playwright/test'

// ─── Dashboard ────────────────────────────────────────────────────────────────

test('aiprep dashboard loads with welcome heading', async ({ page }) => {
  await page.goto('/aiprep')
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
})

test('aiprep dashboard shows 4 assessment cards', async ({ page }) => {
  await page.goto('/aiprep')
  // The dashboard renders 4 stat/feature cards — verify at least 4 card-like containers
  const cards = page.locator('[class*="rounded-2xl"]')
  await expect(cards).toHaveCount({ minimum: 4 } as never)
  // More targeted: confirm Start Assessment button exists
  await expect(page.getByRole('link', { name: /start assessment/i }).or(
    page.getByRole('button', { name: /start assessment/i })
  )).toBeVisible()
})

// ─── Wizard opens ────────────────────────────────────────────────────────────

test('clicking Start Assessment navigates to /aiprep/start', async ({ page }) => {
  await page.goto('/aiprep')
  await page.getByRole('link', { name: /start assessment/i })
    .or(page.getByRole('button', { name: /start assessment/i }))
    .first()
    .click()
  await expect(page).toHaveURL(/\/aiprep\/start/)
  await expect(page.getByText('Assessment Type')).toBeVisible()
})

// ─── Step 1 — Assessment Type ─────────────────────────────────────────────────

test('step 1: Intro card is present and selectable', async ({ page }) => {
  await page.goto('/aiprep/start')
  await expect(page.getByText('Intro').first()).toBeVisible()
})

test('step 1: locked cards show Coming Soon badge', async ({ page }) => {
  await page.goto('/aiprep/start')
  const badges = page.getByText('Coming Soon')
  await expect(badges.first()).toBeVisible()
})

test('step 1: Next button is disabled until a type is selected', async ({ page }) => {
  await page.goto('/aiprep/start')
  const nextBtn = page.getByRole('button', { name: /^next$/i })
  await expect(nextBtn).toBeDisabled()
})

test('step 1: Next button enabled after selecting Intro', async ({ page }) => {
  await page.goto('/aiprep/start')
  // Click the Intro card
  await page.getByText('Intro').first().click()
  const nextBtn = page.getByRole('button', { name: /^next$/i })
  await expect(nextBtn).toBeEnabled()
})

// ─── Step 1 — Info modal ──────────────────────────────────────────────────────

test('step 1: Info button opens the Intro Assessment Details modal', async ({ page }) => {
  await page.goto('/aiprep/start')
  await page.getByRole('button', { name: /info/i }).click()
  await expect(page.getByText('Intro Assessment Details')).toBeVisible()
})

test('step 1: Got It button closes the Info modal', async ({ page }) => {
  await page.goto('/aiprep/start')
  await page.getByRole('button', { name: /info/i }).click()
  await expect(page.getByText('Intro Assessment Details')).toBeVisible()
  await page.getByRole('button', { name: /got it/i }).click()
  await expect(page.getByText('Intro Assessment Details')).not.toBeVisible()
})

// ─── Step 2 — Media & Consent ─────────────────────────────────────────────────

test('step 2: media type options and consent checkboxes are visible', async ({ page }) => {
  await page.goto('/aiprep/start')
  await page.getByText('Intro').first().click()
  await page.getByRole('button', { name: /^next$/i }).click()

  await expect(page.getByText('Audio Only')).toBeVisible()
  await expect(page.getByText('Video + Audio')).toBeVisible()

  const checkboxes = page.getByRole('checkbox')
  await expect(checkboxes).toHaveCount(3)
  for (const cb of await checkboxes.all()) {
    await expect(cb).toBeChecked()
  }
})

test('step 2: clicking Audio Only selects it', async ({ page }) => {
  await page.goto('/aiprep/start')
  await page.getByText('Intro').first().click()
  await page.getByRole('button', { name: /^next$/i }).click()

  await page.getByText('Audio Only').click()
  // The Audio Only button should now have the selected border class
  const audioBtn = page.getByText('Audio Only').locator('..').locator('..')
  await expect(audioBtn).toHaveClass(/border-indigo-500/)
})

test('step 2: clicking ⓘ on Enable AI Video Analytics opens the analytics modal', async ({
  page,
}) => {
  await page.goto('/aiprep/start')
  await page.getByText('Intro').first().click()
  await page.getByRole('button', { name: /^next$/i }).click()

  // The info button next to "Enable AI Video Analytics"
  const row = page.getByText('Enable AI Video Analytics').locator('..')
  await row.getByRole('button').click()

  await expect(page.getByText('About AI Video Analytics')).toBeVisible()
  await page.getByRole('button', { name: /got it/i }).click()
  await expect(page.getByText('About AI Video Analytics')).not.toBeVisible()
})

// ─── Step 3 — Device Check ────────────────────────────────────────────────────

test('step 3: device check page shows Check Your Devices heading', async ({ page }) => {
  await page.goto('/aiprep/start')
  await page.getByText('Intro').first().click()
  await page.getByRole('button', { name: /^next$/i }).click()
  await page.getByRole('button', { name: /next: device check/i }).click()

  await expect(
    page.getByRole('heading', { name: /check your devices/i })
  ).toBeVisible()
})

// ─── Back navigation ──────────────────────────────────────────────────────────

test('full backward navigation: step 3 → step 2 → step 1', async ({ page }) => {
  await page.goto('/aiprep/start')
  await page.getByText('Intro').first().click()
  await page.getByRole('button', { name: /^next$/i }).click()
  await page.getByRole('button', { name: /next: device check/i }).click()

  // Back from step 3 to step 2
  await page.getByRole('button', { name: /back/i }).click()
  await expect(page.getByText('Media & Consent')).toBeVisible()

  // Back from step 2 to step 1
  await page.getByRole('button', { name: /back/i }).click()
  await expect(page.getByText('Choose Your Assessment Type')).toBeVisible()
})

test('← Back to Dashboard returns to /aiprep', async ({ page }) => {
  await page.goto('/aiprep/start')
  await page.getByRole('button', { name: /← back to dashboard/i }).click()
  await expect(page).toHaveURL(/\/aiprep$/)
})

// ─── Step 5 — Confirmation (no API call) ─────────────────────────────────────

test('step 5: confirmation shows selections and Start Assessment button', async ({ page }) => {
  await page.goto('/aiprep/start')

  // Step 1
  await page.getByText('Intro').first().click()
  await page.getByRole('button', { name: /^next$/i }).click()

  // Step 2
  await page.getByRole('button', { name: /next: device check/i }).click()

  // Step 3
  await page.getByRole('button', { name: /next: confirmation/i }).click()

  // Step 4 — skip practice to get to step 5
  await page.getByRole('button', { name: /skip practice/i }).click()

  // Step 5
  await expect(page.getByRole('heading', { name: /ready to start/i })).toBeVisible()
  await expect(page.getByText('Intro')).toBeVisible()
  await expect(page.getByText('Video + Audio')).toBeVisible()
  await expect(page.getByRole('button', { name: /start assessment/i })).toBeVisible()
})
