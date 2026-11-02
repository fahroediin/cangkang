# Verifikasi PamanKu v6.0

## Verifikasi rilis

- 137 assertion server v6.0 lulus: penjumlahan, populasi kini, periode/kalender, data kosong, populasi tak diketahui, scope/role/workspace, pencabutan dan GET yang tidak mengubah state/fingerprint persetujuan.
- 309 tes native dan TypeScript lulus. Termasuk 13 tes baru modul web/native untuk tanggal, cakupan, hari unik, nol/kosong, ketidakmutasian, CSV dan kesamaan hasil kedua platform.
- Regresi lulus: v5.9 158, v5.8 117, v5.7 172, v5.6 128, monitor 100, persetujuan 269, ledger 147, master kandang 116 dan RBAC 206 assertion; operasi web sebelumnya, SQLite server dan ESM lulus.
- Bundle Expo Android/iOS berhasil diekspor.
- Browser preview pemilik dummy memverifikasi menu, ringkasan kosong/populasi belum diketahui, penerapan satu hari dan satu kandang serta klik ekspor yang berhasil melalui server. Tampilan diperiksa; file unduhan browser belum dibuka manual di spreadsheet. Perhitungan dengan produksi terisi diuji pada server dan modul.
- Belum UAT seluruh peran pada hosting, emulator/perangkat nyata, menu berbagi native, APK/AAB/IPA, upgrade instalasi, GPS atau restore perangkat. Bundle/deployment berhasil bukan bukti semua pemeriksaan tersebut.
