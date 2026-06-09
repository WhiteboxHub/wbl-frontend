#!/usr/bin/env bash
# =============================================================================
# run-playwright-precommit.sh
#
# Pre-commit wrapper for the Playwright UI grid regression suite.
#
# Behaviour:
#   1. Runs the full Playwright grid regression via Docker on every commit.
#   2. The commit is BLOCKED if any grid test fails (exit code from Docker).
# =============================================================================

set -euo pipefail

echo ""
echo "================================================================"
echo " UI Grid Regression Pre-commit Hook (Force Run)"
echo "================================================================"
echo " Starting Playwright grid regression tests via Docker..."
echo ""

# --- Run Playwright via the Docker 'playwright' service from parent dir ---
cd ..
docker compose \
  --profile playwright \
  run \
  --rm \
  playwright

EXIT_CODE=$?

echo ""
echo "================================================================"
if [ $EXIT_CODE -eq 0 ]; then
  echo "   All grid regression tests PASSED. Commit allowed."
else
  echo "   Grid regression tests FAILED (exit code: ${EXIT_CODE})."
  echo ""
  echo "   Fix the failing grid(s) before committing."
  echo "   To see the full HTML report, open:"
  echo "     wbl-frontend/playwright-report/index.html"
fi
echo "================================================================"
echo ""

exit $EXIT_CODE
