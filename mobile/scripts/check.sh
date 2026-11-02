#!/usr/bin/env bash
set -euo pipefail
npm run typecheck
npm test
npx expo export --platform android --platform ios --output-dir artifacts/bundles
