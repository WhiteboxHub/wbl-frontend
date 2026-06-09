const { execSync } = require("child_process");
const path = require("path");

console.log(
  "\n================================================================",
);
console.log(" UI Grid Regression Pre-commit Hook");
console.log("================================================================");

let dockerRunning = false;
try {
  execSync("docker info", { stdio: "ignore" });
  dockerRunning = true;
} catch (e) {
  dockerRunning = false;
}

try {
  if (dockerRunning) {
    console.log(
      " Docker detected! Starting Playwright tests inside Docker...\n",
    );
    execSync("docker compose --profile playwright run --rm playwright", {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."), // Point to parent directory for docker-compose.yml
    });
  } else {
    console.log(
      " Docker not running. Falling back to local Node.js environment...\n",
    );
    execSync("npx playwright test", {
      stdio: "inherit",
      cwd: path.join(__dirname), // Run locally from wbl-frontend
    });
  }

  console.log(
    "\n================================================================",
  );
  console.log("   All grid regression tests PASSED. Commit allowed.");
  console.log(
    "================================================================\n",
  );
  process.exit(0);
} catch (error) {
  console.log(
    "\n================================================================",
  );
  console.log(
    `   Grid regression tests FAILED (exit code: ${error.status || 1}).`,
  );
  console.log("\n   Fix the failing grid(s) before committing.");
  console.log(
    "================================================================\n",
  );
  process.exit(error.status || 1);
}
