#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_dir"
if [[ -z "${ANDROID_HOME:-}" ]]; then
  echo 'Set ANDROID_HOME ke direktori Android SDK terlebih dahulu.' >&2
  exit 1
fi
npm run typecheck
npm test
cd android
./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a --max-workers=2
cd "$project_dir"
mkdir -p artifacts/apk
cp android/app/build/outputs/apk/release/app-release.apk artifacts/apk/PamanKu-v6.0.0-preview-arm64.apk
printf '%s\n' 'APK uji internal: artifacts/apk/PamanKu-v6.0.0-preview-arm64.apk' 'Signing: kunci debug standar; bukan rilis Play Store.'
