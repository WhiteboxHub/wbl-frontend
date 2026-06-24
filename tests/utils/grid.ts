import { expect, Page } from "@playwright/test";



/** Summary returned after validating all grids on a page. */
export interface GridValidationSummary {
  gridsFound: number;
  columnsChecked: number;
  rowsChecked: number;
}

/**
 * Validates ALL AG-Grid instances on the current page.
 *
 * Behaviour:
 *  - If `expectGrid` is true  → waits up to 30 s for at least one grid; FAILS if none appear.
 *  - If `expectGrid` is false → waits up to 3 s; if no grid shows up, logs & returns cleanly.
 *  - For every grid found it validates:
 *      1. Loading spinner clears
 *      2. At least one column header is visible with non-empty text
 *      3. Every column header is individually visible
 *      4. First-row cells contain no JS render errors (undefined / NaN / [object Object])
 *  - If ANY check fails the test throws → with bail:1 in playwright.config.ts the
 *    entire Playwright run stops immediately.
 *
 * @returns GridValidationSummary with counts of grids, columns, and rows checked.
 */
export async function validateAllTables(
  page: Page,
  expectGrid: boolean = false,
): Promise<GridValidationSummary> {
  const summary: GridValidationSummary = {
    gridsFound: 0,
    columnsChecked: 0,
    rowsChecked: 0,
  };

  const gridWrapper = page.locator(".ag-root-wrapper");

  // ── 1. Wait for at least one grid to appear ──────────────────────────────
  if (expectGrid) {
    console.log(
      "[grid] Grid expected — waiting up to 45 s for it to appear...",
    );
    try {
      await gridWrapper.first().waitFor({ state: "visible", timeout: 45_000 });
    } catch {
      throw new Error(
        `[grid] FAIL: A grid was expected on route "${page.url()}" but none appeared within 45 s. ` +
          `Check that the AG-Grid component is rendered and the API call returns data.`,
      );
    }
  } else {
    // Soft-wait: give grids up to 3 s to mount on pages that may or may not have one
    try {
      await gridWrapper.first().waitFor({ state: "visible", timeout: 3_000 });
    } catch {
      console.log(
        "[grid] No AG-Grid appeared on this page within 3 s — skipping grid checks.",
      );
      return summary;
    }
  }

  // ── 2. Count how many grids are on the page ───────────────────────────────
  const gridCount = await gridWrapper.count();
  if (gridCount === 0) {
    console.log("[grid] No AG-Grid found on this page.");
    return summary;
  }

  console.log(
    `[grid] Found ${gridCount} AG-Grid instance(s) on this page. Validating each...`,
  );

  // ── 3. Validate each grid individually ───────────────────────────────────
  for (let gridIndex = 0; gridIndex < gridCount; gridIndex++) {
    const grid = gridWrapper.nth(gridIndex);
    const gridLabel = gridCount > 1 ? `Grid #${gridIndex + 1}` : "Grid";

    console.log(`\n[grid] ── ${gridLabel} ──────────────────────────────────`);

    // 3a. Wait for loading overlay to clear (data fetch in progress)
    const loadingOverlay = grid.locator(".ag-overlay-loading-center");
    if (await loadingOverlay.isVisible()) {
      console.log(
        `[grid] ${gridLabel}: Loading spinner visible — waiting up to 20 s for data...`,
      );
      await loadingOverlay.waitFor({ state: "hidden", timeout: 20_000 });
      console.log(`[grid] ${gridLabel}: Spinner cleared.`);
    }

    // 3b. Check for "No Rows" overlay — grid is healthy, just empty
    const noRowsOverlay = grid.locator(".ag-overlay-no-rows-center");
    const hasNoRowsOverlay = await noRowsOverlay.isVisible();

    // 3c. Validate column headers
    const headers = grid.locator(".ag-header-cell");
    
    // IMPROVED: Wait longer and retry with exponential backoff for column definitions to attach
    // This prevents race conditions where the grid wrapper is visible but React hasn't injected headers yet
    let headerCount = 0;
    let attemptCount = 0;
    const maxAttempts = 3;
    
    while (headerCount === 0 && attemptCount < maxAttempts) {
      try {
        // Increase timeout on each retry for slow renders
        const timeout = 5000 + (attemptCount * 2000);
        await headers.first().waitFor({ state: "attached", timeout });
        headerCount = await headers.count();
        
        if (headerCount === 0 && attemptCount < maxAttempts - 1) {
          console.log(
            `[grid] ${gridLabel}: Headers not yet attached, retrying (attempt ${attemptCount + 2}/${maxAttempts})...`,
          );
          // Give React time to render columns
          await page.waitForTimeout(500);
          attemptCount++;
        }
      } catch {
        if (attemptCount < maxAttempts - 1) {
          console.log(
            `[grid] ${gridLabel}: Header detection failed, retrying...`,
          );
          await page.waitForTimeout(500);
          attemptCount++;
        } else {
          break;
        }
      }
    }

    if (headerCount === 0) {
      // This is a hard failure — bail:1 will stop the whole run
      throw new Error(
        `[grid] FAIL: ${gridLabel} on "${page.url()}" rendered with 0 column headers after ${maxAttempts} attempts. ` +
          `The grid mounted but column definitions appear to be missing or broken. ` +
          `Check that: (1) columnDefs is properly initialized, (2) rowData loads before render, (3) component state is synced.`,
      );
    }

    console.log(
      `[grid] ${gridLabel}: Validating ${headerCount} column header(s)...`,
    );

    for (let i = 0; i < headerCount; i++) {
      const headerCell = headers.nth(i);

      // Each header must be visible in the viewport
      await expect(headerCell).toBeVisible({ timeout: 5_000 });

      const headerText = (await headerCell.innerText()).trim();

      // Header must have non-empty text
      expect(
        headerText.length,
        `Column header #${i + 1} in ${gridLabel} on "${page.url()}" is empty. ` +
          `Check the 'headerName' / 'field' in your column definition.`,
      ).toBeGreaterThan(0);

      console.log(`  ✓ Col ${i + 1}/${headerCount}: "${headerText}"`);
      summary.columnsChecked++;
    }

    // 3d. Validate row data — only if rows are present
    const dataRows = grid.locator(".ag-row:not(.ag-row-empty)");
    const rowCount = await dataRows.count();

    if (hasNoRowsOverlay || rowCount === 0) {
      console.log(
        `[grid] ${gridLabel}: 0 data rows — grid is empty but headers are healthy. ✓`,
      );
    } else {
      console.log(
        `[grid] ${gridLabel}: ${rowCount} data row(s) found — checking first row cells...`,
      );
      summary.rowsChecked += rowCount;

      const firstRowCells = dataRows.first().locator(".ag-cell");
      const cellCount = await firstRowCells.count();

      for (let j = 0; j < cellCount; j++) {
        const cell = firstRowCells.nth(j);
        const cellText = await cell.innerText();

        // Detect common JavaScript render-error strings that slip through as text
        expect(
          cellText,
          `Cell ${j + 1} in row 1 of ${gridLabel} contains a JS render error`,
        ).not.toContain("undefined");
        expect(
          cellText,
          `Cell ${j + 1} in row 1 of ${gridLabel} contains a JS render error`,
        ).not.toContain("NaN");
        expect(
          cellText,
          `Cell ${j + 1} in row 1 of ${gridLabel} contains a JS render error`,
        ).not.toContain("[object Object]");
      }

      console.log(
        `  ✓ Row 1 — all ${cellCount} cell(s) free of JS render errors.`,
      );
    }

    summary.gridsFound++;
    console.log(
      `[grid] ${gridLabel}: PASSED ✓  (${headerCount} columns, ${rowCount} rows)\n`,
    );
  }

  console.log(
    `[grid] ── Summary: ${summary.gridsFound} grid(s) validated, ` +
      `${summary.columnsChecked} columns checked, ${summary.rowsChecked} data rows scanned. ──\n`,
  );

  return summary;
}
