# Verifikasi PamanKu v5.8

## Verifikasi dan batas pengujian

- v5.8: 117 assertion server lulus untuk duplikasi, isolasi ID/akun/ruang kerja, scope saat menyalin, audit ledger, validasi, batas 10, replay/CAS, kompatibilitas backup dan nama produk.
- v5.7: 172 assertion server lulus untuk ubah nama/isi, scope menyempit, pemulihan entri unavailable, edit pada batas 10, replay/CAS dan persetujuan yang tetap berlaku.
- Regresi: 128 assertion v5.6, 100 monitor, 269 persetujuan, 147 ledger, 116 master kandang dan 206 RBAC lulus; operasi web sebelumnya, SQLite server dan validasi ESM lulus.
- TypeScript dan 290 tes native lulus. Fixture laporan web diperbarui dari source web aktual setelah pergantian nama; kesamaan hasil web/native kembali lulus. Bundle Expo Android/iOS diekspor.
- Browser preview memperlihatkan nama PamanKu v5.8, ruang kerja dummy dan monitor. Saat menyimpan filter, infrastruktur preview mengembalikan HTTP 405 non-JSON; satu reload kemudian menghasilkan Cannot GET /team.html. Karena itu alur ubah/duplikasi melalui browser belum terverifikasi. Pemeriksaan server langsung dengan SQLite berhasil. Tidak mengubah kode aplikasi untuk menutupi keterbatasan preview.
- UAT hosting seluruh peran, emulator/perangkat nyata, APK/AAB/IPA, upgrade instalasi lama dan restore backup perangkat belum dilakukan. Keberhasilan deployment dan bundle bukan bukti pengujian tersebut.
