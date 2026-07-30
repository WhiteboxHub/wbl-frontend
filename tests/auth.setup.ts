import { test as setup } from "@playwright/test";
import { smartLogin } from "./utils/auth";

const adminFile = ".auth/admin.json";
const candidateFile = ".auth/candidate.json";

setup("authenticate as candidate", async ({ page }) => {
  await smartLogin(page, "candidate");
  await page.context().storageState({ path: candidateFile });
});

setup("authenticate as admin", async ({ page }) => {
  await smartLogin(page, "admin");
  await page.context().storageState({ path: adminFile });
});
