#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_dir"
if [[ "$(uname -s)" != 'Darwin' ]]; then
  echo 'Build iOS harus dijalankan pada macOS dengan Xcode.' >&2
  exit 1
fi
npm run typecheck
npm test
npx pod-install
xcodebuild -workspace ios/TelurFarm.xcworkspace -scheme TelurFarm -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath artifacts/ios-simulator CODE_SIGNING_ALLOWED=NO build
app_path="$project_dir/artifacts/ios-simulator/Build/Products/Release-iphonesimulator/TelurFarm.app"
if [[ ! -d "$app_path" ]]; then
  echo 'TelurFarm.app tidak ditemukan.' >&2
  exit 1
fi
ditto -c -k --sequesterRsrc --keepParent "$app_path" artifacts/TelurFarm-v3.0.0-ios-simulator.zip
printf '%s\n' 'Hasil ini khusus iOS Simulator, bukan IPA untuk iPhone.'
