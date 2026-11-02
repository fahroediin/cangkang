#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_dir"
if [[ "$(uname -s)" != 'Darwin' ]]; then
  echo 'Archive iOS harus dibuat pada macOS dengan Xcode.' >&2
  exit 1
fi
: "${TELURFARM_APPLE_TEAM_ID:?Set TELURFARM_APPLE_TEAM_ID ke Team ID Apple Developer milik usaha}"
npm run typecheck
npm test
npx pod-install
xcodebuild -workspace ios/TelurFarm.xcworkspace -scheme TelurFarm -configuration Release -destination 'generic/platform=iOS' -archivePath artifacts/TelurFarm.xcarchive DEVELOPMENT_TEAM="$TELURFARM_APPLE_TEAM_ID" CODE_SIGN_STYLE=Automatic -allowProvisioningUpdates archive
printf '%s\n' 'Archive selesai. Ekspor melalui Xcode Organizer menggunakan profil distribusi milik usaha.' 'Archive bukan IPA siap instal sebelum export dan provisioning berhasil.'
