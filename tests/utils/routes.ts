import fs from "fs";
import path from "path";

export interface GridRoute {
  path: string;
  role: "admin" | "candidate";
  hasGrid: boolean;
}

/**
 * Dynamically discovers all testable routes from the Next.js `app/` directory.
 *
 * Rules:
 *  - Routes under `/avatar/**`      → role: 'admin'
 *  - Routes under `/user_dashboard` → role: 'candidate'
 *  - All other routes (login, api, coderpad…) are excluded
 *  - `hasGrid` is determined by static analysis of the page source file:
 *    if it imports any known AG-Grid component it is marked as expecting a grid.
 *
 * Add new grid component names to GRID_MARKERS as they are introduced.
 */
export function getAllGridRoutes(): GridRoute[] {
  const appDir = path.resolve(process.cwd(), "app");
  const routes: GridRoute[] = [];

  // ── Grid component markers ────────────────────────────────────────────────
  // Any page source that references one of these strings will have hasGrid: true.
  const GRID_MARKERS = [
    "AGGridTable",
    "AgGridReact",
    "CandidateGrid",
    "ag-grid-community",
    "ag-grid-react",
  ];

  function pageHasGrid(filePath: string): boolean {
    try {
      const source = fs.readFileSync(filePath, "utf-8");
      return GRID_MARKERS.some((marker) => source.includes(marker));
    } catch {
      return false;
    }
  }

  // ── Excluded folders — never tested ──────────────────────────────────────
  const EXCLUDED_FOLDERS = new Set([
    "api",
    "login",
    "signup",
    "forgot_password",
    "reset-password",
    "coderpad",
    "recording",
    "presentation",
    "resume",
    "test",
    "unsubscribe",
    "leads_unsubscribe",
    "error",
    "privacy-policy",
    "terms-of-use",
    "refer-and-earn",
    "contact",
    "faq",
    "schedule",
    "setup",
    "credentials", // Permanently skipped from tests
  ]);

  // ── Routes where hasGrid is always false regardless of source analysis ──
  const FORCE_NO_GRID = new Set([
    "/avatar/hr-contacts", // known false positive
  ]);

  // ── Routes we do not want Playwright to visit in the regression suite ──
  const SKIP_ROUTES = new Set([
    "/avatar/companies",
    "/avatar/company_contacts",
  ]);

  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || EXCLUDED_FOLDERS.has(entry.name))
          continue;
        walk(path.join(dir, entry.name));
      } else if (
        entry.isFile() &&
        (entry.name === "page.tsx" || entry.name === "page.js")
      ) {
        const fullPath = path.join(dir, entry.name);

        // Build a navigable URL: replace dynamic [param] segments with '1'
        let routePath = fullPath
          .replace(appDir, "")
          .replace(/\\/g, "/")
          .replace(/\/\[[^\]]+\]/g, "/1")
          .replace(/\/page\.(tsx|js)$/, "");
        if (routePath === "") routePath = "/";

        if (routePath.startsWith("/avatar")) {
          if (SKIP_ROUTES.has(routePath)) return;
          const hasGrid = FORCE_NO_GRID.has(routePath)
            ? false
            : pageHasGrid(fullPath);
          routes.push({ path: routePath, role: "admin", hasGrid });
          console.log(
            `[routes] admin  | hasGrid=${String(hasGrid).padEnd(5)} | ${routePath}`,
          );
        } else if (routePath.startsWith("/user_dashboard")) {
          // Grids on /user_dashboard are inside tabs, validated separately in the spec
          routes.push({ path: routePath, role: "candidate", hasGrid: false });
          console.log(`[routes] cand   | hasGrid=false | ${routePath}`);
        }
      }
    }
  };

  walk(appDir);

  // Sort for predictable, reproducible test ordering
  routes.sort((a, b) => {
    if (a.role !== b.role) return a.role.localeCompare(b.role);
    return a.path.localeCompare(b.path);
  });

  console.log(`[routes] Discovered ${routes.length} testable route(s) total.`);
  return routes;
}
