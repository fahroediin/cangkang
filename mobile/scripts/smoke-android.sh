#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_dir"
apk_path="${1:-artifacts/apk/PamanKu-v6.0.0-preview-arm64.apk}"
if [[ ! -f "$apk_path" ]]; then
  echo "APK tidak ditemukan: $apk_path" >&2
  exit 1
fi
adb get-state
adb install -r "$apk_path"
adb shell am start -W -n com.telurfarm.mobile/.MainActivity
printf '%s\n' 'Periksa layar di perangkat dan lanjutkan daftar docs/UAT.md.' 'Perintah launch sukses bukan bukti semua fitur lolos UAT.'
