import { expect, Page } from "@playwright/test";

/**
 * Performs a robust login for either Admin or Candidate.
 * Handles Next.js hydration issues, chunk errors, and landing page redirects.
 */
export async function smartLogin(page: Page, role: "admin" | "candidate") {
  const email = process.env[`${role.toUpperCase()}_EMAIL`];
  const password = process.env[`${role.toUpperCase()}_PASSWORD`];

  if (!email || !password) {
    throw new Error(
      `Missing credentials for role: ${role}. Ensure environment variables are set.`,
    );
  }

  console.log(`[smartLogin] Checking for existing session for ${role}...`);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // Handle existing valid session
  const currentPath = new URL(page.url()).pathname;
  if (
    currentPath.startsWith("/avatar") ||
    currentPath.startsWith("/user_dashboard")
  ) {
    if (
      (role === "admin" && currentPath.startsWith("/avatar")) ||
      (role === "candidate" && currentPath.startsWith("/user_dashboard"))
    ) {
      console.log(`[smartLogin] Already logged in as ${role}.`);
      return;
    }
    console.log(
      `[smartLogin] Logged in as wrong role (${currentPath}). Logging out...`,
    );
    await logout(page);
  }

  console.log(`[smartLogin] Navigating to /login...`);
  page.on("pageerror", (error) =>
    console.log(`[BROWSER ERROR] ${error.message}`),
  );
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    }
  });
  await page.goto("/login", { waitUntil: "networkidle" });

  // Retry loop for Next.js ChunkLoadErrors or hydration failures
  for (let attempt = 1; attempt <= 3; attempt++) {
    const errorOverlay = page.locator(
      'h1:has-text("Build Error"), h1:has-text("Unhandled Runtime Error"), h1:has-text("Failed to compile")',
    );
    const emailInput = page.locator('input[name="email"]');

    // Dynamic wait for either the error overlay or the inputs to appear
    await Promise.race([
      errorOverlay.waitFor({ state: "visible", timeout: 5000 }).catch(() => {}),
      emailInput.waitFor({ state: "visible", timeout: 5000 }).catch(() => {}),
    ]);

    if (await errorOverlay.isVisible()) {
      console.warn(
        `[smartLogin] Next.js Error detected on attempt ${attempt}. Reloading...`,
      );
      await page.reload({ waitUntil: "networkidle" });
      continue;
    }

    if (await emailInput.isVisible()) {
      break;
    }

    if (attempt === 3) {
      throw new Error(
        "Failed to load login page after 3 attempts. Possible app crash or network issue.",
      );
    }

    await page.reload({ waitUntil: "networkidle" });
  }

  // --- API health preflight check ---
  // Verify the backend is reachable before we attempt to log in, so we get a
  // clear diagnostic instead of the generic "An error occurred during login".
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  console.log(`[smartLogin] Checking backend reachability at ${apiUrl} ...`);
  try {
    const healthRes = await page.request.get(apiUrl.replace(/\/api$/, "/"), {
      timeout: 10000,
    });
    console.log(
      `[smartLogin] Backend responded with status ${healthRes.status()}.`,
    );
  } catch (err) {
    throw new Error(
      `[smartLogin] Cannot reach the backend API at ${apiUrl}. ` +
        `Make sure the backend server is running before executing tests. ` +
        `Original error: ${err}`,
    );
  }
  // --- end preflight check ---

  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');

  console.log(`[smartLogin] Filling credentials for ${role}...`);
  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  await emailInput.fill(email);
  await passwordInput.fill(password);

  const loginBtn = page.getByRole("button", { name: "Login", exact: true });
  await loginBtn.waitFor({ state: "visible", timeout: 10000 });

  // Wait for button to be enabled (hydration complete)
  console.log(`[smartLogin] Waiting for login button to be enabled...`);
  await expect(loginBtn).toBeEnabled({ timeout: 15000 });

  // Add a slight delay to ensure React hydration has attached the onSubmit handler
  // Otherwise, Playwright clicks too fast and triggers a native HTML GET form submission.
  await page.waitForTimeout(2000);

  // Set up the result race BEFORE clicking so we don't miss fast responses
  const alertLocator = page.locator(
    'div[role="alert"]:not(#__next-route-announcer__)',
  );
  const errorAlert = alertLocator.filter({
    hasText: /error|invalid|failed|not found/i,
  });
  const successAlert = alertLocator.filter({ hasText: /success|successful/i });

  console.log(`[smartLogin] Submitting form...`);
  await loginBtn.click();

  console.log(`[smartLogin] Waiting for redirect or error...`);
  const result = await Promise.race([
    page
      .waitForURL(
        (url) => {
          const p = new URL(url).pathname;
          return (
            p === "/" ||
            p === "" ||
            p.startsWith("/avatar") ||
            p.startsWith("/user_dashboard")
          );
        },
        { timeout: 45000 },
      )
      .then(() => "success")
      .catch(() => "timeout"),
    errorAlert
      .waitFor({ state: "visible", timeout: 45000 })
      .then(() => "error")
      .catch(() => "timeout"),
    successAlert
      .waitFor({ state: "visible", timeout: 45000 })
      .then(() => "success_alert")
      .catch(() => "timeout"),
  ]);

  if (result === "error") {
    const msg = await errorAlert.innerText();
    const trimmed = msg.trim();
    // Distinguish a network/fetch failure from a real auth rejection
    if (/an error occurred during login/i.test(trimmed)) {
      throw new Error(
        `Login failed for ${role} due to a network error when contacting the backend API. ` +
          `Verify that the backend at ${apiUrl} is running and accessible. Raw message: "${trimmed}"`,
      );
    }
    throw new Error(`Login failed for ${role}: ${trimmed}`);
  } else if (result === "timeout") {
    throw new Error(`Login timed out for ${role}. Current URL: ${page.url()}`);
  }

  // If we got a success alert, wait a bit longer for the actual redirect to happen
  if (result === "success_alert") {
    console.log(
      `[smartLogin] Success alert detected, waiting for final redirect...`,
    );
    await page
      .waitForURL(
        (url) => {
          const p = new URL(url).pathname;
          return (
            p === "/" ||
            p === "" ||
            p.startsWith("/avatar") ||
            p.startsWith("/user_dashboard")
          );
        },
        { timeout: 10000 },
      )
      .catch(() => {});
  }

  // Handle landing page "Entry" buttons
  const pathAfterLogin = new URL(page.url()).pathname;
  if (pathAfterLogin === "/" || pathAfterLogin === "") {
    console.log(`[smartLogin] On landing page, navigating to dashboard...`);
    if (role === "admin") {
      await page.goto("/avatar", { waitUntil: "networkidle" });
    } else {
      await page.goto("/user_dashboard", { waitUntil: "networkidle" });
    }
  }

  console.log(`[smartLogin] Success! Logged in as ${role}.`);
}

/**
 * Performs a clean logout.
 */
export async function logout(page: Page) {
  console.log(`[logout] Initiating logout...`);

  const logoutBtn = page.getByRole("button", { name: "Logout", exact: true });

  try {
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      // Try mobile menu
      const navToggle = page.locator("#navbarToggler");
      if (await navToggle.isVisible()) {
        await navToggle.click();
        await logoutBtn.waitFor({ state: "visible", timeout: 5000 });
        await logoutBtn.click();
      } else {
        throw new Error("Logout button not found");
      }
    }
  } catch (e) {
    console.warn(
      `[logout] UI Logout failed, forcing logout via storage clear...`,
    );
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto("/login");
  }

  // Ensure we are on the login page
  await page.waitForURL((url) => url.toString().includes("/login"), {
    timeout: 15000,
  });
  await page.waitForLoadState("networkidle");

  console.log(`[logout] Logout successful.`);
}
