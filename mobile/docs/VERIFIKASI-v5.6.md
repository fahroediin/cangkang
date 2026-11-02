# Verifikasi v5.6

## Verifikasi dan batas pengujian

- 128 assertion server v5.6 lulus: isolasi akun/ruang kerja, userId client diabaikan, redaksi scope, perubahan peran, batas dan nama, tanggal, hapus milik sendiri, replay dan konflik CAS, tidak mengubah transaksi/fingerprint serta tidak masuk backup transaksi.
- Regresi web lulus: 100 assertion monitor, 269 persetujuan, 147 ledger, 116 master kandang, 206 RBAC, operasi web sebelumnya, server SQLite dan validasi Worker ESM.
- TypeScript dan 282 tes native lulus; termasuk preferensi shared serta CAS dan korupsi SQLite. Ekspor bundle Expo Android/iOS berhasil.
- Browser preview dengan data dummy memverifikasi simpan, pakai pada data terbaru dan daftar tetap tersedia setelah muat ulang; tampilan diperiksa. Gangguan preview sempat mengembalikan halaman/respons non-JSON dan pulih setelah restart; penanganan error diperbaiki. Ini bukan bukti UAT produksi seluruh peran.
- Belum dilakukan UAT seluruh peran pada hosting, pengujian emulator/perangkat nyata, pembuatan APK/AAB/IPA, atau pengujian restore preferensi perangkat. Kelulusan bundle tidak sama dengan build aplikasi native bertanda tangan.
