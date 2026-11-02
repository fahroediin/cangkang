# Paket rilis native TelurFarm 3.0.0

## Android untuk uji internal

Gunakan `bash scripts/build-android-preview.sh` pada mesin dengan Android SDK dan JDK 17. Script menjalankan task `:app:assembleRelease` untuk konfigurasi release dengan JavaScript/Hermes tertanam sehingga tidak memerlukan server Metro. Target ABI uji adalah arm64-v8a.

Signing tetap memakai debug keystore standar bawaan proyek. Berkas ini hanya untuk uji internal, bukan rilis Play Store. Kunci produksi serta perubahan application ID harus dikelola pemilik aplikasi sebelum distribusi publik.

Sebelum memasang pada perangkat yang berisi data penting, ekspor cadangan JSON dari versi yang sudah terpasang. Android hanya mengizinkan pembaruan package yang sama bila signature kompatibel. Jangan menghapus aplikasi untuk memaksa update tanpa menyimpan cadangan terlebih dahulu.

Sesudah APK tersedia:

1. Salin APK ke ponsel Android arm64.
2. Buka dengan pengelola berkas dan berikan izin instalasi untuk sumber tersebut bila diminta Android.
3. Instal dan buka TelurFarm. Versi preview berjalan dengan data lokal.
4. Uji data contoh terlebih dahulu melalui Kelola → Pengaturan → Muat data contoh.
5. Catat hasil pada `docs/UAT.md`, termasuk GPS, penyimpanan setelah tutup paksa, berbagi PDF/JSON, dan impor cadangan.

Untuk developer dengan adb:

```bash
adb install -r artifacts/apk/TelurFarm-v5.0.0-preview-arm64.apk
adb shell am start -n com.telurfarm.mobile/.MainActivity
```

Alternatif: jalankan `bash scripts/smoke-android.sh` ketika satu perangkat adb sudah terhubung dan diotorisasi. Script memasang APK dengan update `-r` lalu meluncurkan aktivitas utama. Tidak ada perangkat yang dihapus atau direset oleh script.

Build yang berhasil tidak membuktikan seluruh fungsi berjalan pada perangkat. Tidak ada perangkat Android fisik yang terhubung ke lingkungan pembuatan saat ini.

## iOS Simulator

Pada Mac dengan Xcode dan CocoaPods kompatibel:

```bash
npm ci
bash scripts/build-ios-simulator.sh
```

Hasilnya `.app` dalam ZIP khusus Simulator, bukan IPA iPhone. Jalankan simulator yang sesuai lalu gunakan `xcrun simctl install booted path/ke/TelurFarm.app`.

## iPhone / archive

Pilih Team signing milik usaha pada Xcode, atau gunakan:

```bash
export TELURFARM_APPLE_TEAM_ID='TEAM_ID_ANDA'
bash scripts/build-ios-archive.sh
```

Script akan membuat `.xcarchive` dengan automatic signing. Xcode memerlukan akun serta provisioning yang sah. Ekspor IPA melalui Organizer dengan metode distribusi yang sesuai. Alternatif EAS beserta profil APK/IPA tercantum di README.md dan eas.json.

Tidak ada Apple ID, Team ID nyata, password, certificate signing produksi, maupun provisioning profile yang ditanamkan pada paket source. Tidak ada unggahan App Store, Play Store, atau EAS yang dilakukan oleh script tanpa Anda menjalankannya sendiri.

## Cakupan data

Data native tetap lokal per perangkat. Web TelurFarm, akun pelanggan/kurir, dan stok server belum tersambung ke APK/IPA ini. Cadangan web dan native memiliki format berbeda. Jangan menanamkan credential privat Sites untuk menghubungkan mobile; ikuti rancangan API pada `docs/INTEGRASI.md`.

## Perbaikan toolchain Android

Build awal menemukan `IBM_SEMERU` pada resolver Foojay 0.5.0 bawaan React Native. Gradle 9 telah menghapus constant vendor tersebut. Script `scripts/fix-android-toolchain.cjs` mengganti deklarasi resolver menjadi 1.0.0 secara terbatas dan idempotent. Script dijalankan otomatis oleh npm postinstall, sehingga tidak perlu mengedit node_modules manual setelah npm ci. Tidak ada downgrade Gradle, penggantian runtime aplikasi, atau perubahan aturan stok.

Referensi upstream: https://github.com/gradle/foojay-toolchains/blob/main/CHANGELOG.md dan https://github.com/reactwg/react-native-releases/issues/1349.
