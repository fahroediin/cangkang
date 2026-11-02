#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_dir/web"
node scripts/build-team-domain.cjs ../mobile/node_modules/typescript
node scripts/build-flock-report.cjs ../mobile/node_modules/typescript
node scripts/build-house-performance.cjs ../mobile/node_modules/typescript
python3 scripts/embed-worker.py
npm run build
node tests/v3-operations.cjs
node tests/v3-server.mjs
node tests/v51-rbac.mjs
node tests/v52-houses.mjs
node tests/v53-flock.mjs
node tests/v54-flock-approval.mjs
node tests/v55-monitor.mjs
node tests/v56-saved-monitor.mjs
node tests/v57-monitor-edit.mjs
node tests/v58-pamanku.mjs
node tests/v59-monitor-favorites.mjs
node tests/v60-performance.mjs
npm run validate
cd "$project_dir/mobile"
npm run typecheck
npm test
