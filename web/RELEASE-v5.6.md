# TelurFarm v5.6 — Filter Monitor Tersimpan

Rilis 29 Oktober 2026. Melanjutkan monitor mutasi v5.5 dan alur persetujuan v5.4. Pengembangan ini menambahkan penyimpanan pilihan filter bernama untuk pekerjaan berulang.

## Panduan web

1. Masuk portal tim dan pilih ruang kerja, lalu **Monitor mutasi**.
2. Pilih sumber laporan: pengajuan populasi atau mutasi yang sudah dicatat. Atur jenis, kandang, tanggal, pencarian; untuk pengajuan tersedia status dan kondisi sumber.
3. Klik **Terapkan filter**. Tombol simpan mengambil pilihan yang sudah diterapkan, bukan perubahan formulir yang belum diterapkan.
4. Klik **Simpan filter yang diterapkan**, masukkan nama, lalu simpan. Maksimal 10 filter per akun per ruang kerja, nama 1–60 karakter. Nama dinormalisasi spasi dan tidak boleh duplikat tanpa membedakan kapitalisasi atau bentuk Unicode setara.
5. Klik **Pakai filter** untuk membaca ulang data server, memeriksa akses terkini, menerapkan kriteria dan kembali ke halaman pertama. CSV mengikuti seluruh hasil filter yang diizinkan, bukan hanya halaman terlihat.
6. **Hapus filter** meminta konfirmasi dan menghapus preferensi tersebut secara permanen. Preferensi dapat dibuat ulang; transaksi dan catatan kandang tidak terhapus.

Filter menyimpan sumber dan tujuh kriteria, bukan salinan laporan atau transaksi. Rentang tanggal bersifat tetap dan inklusif berdasarkan tanggal mutasi. Tidak ada jadwal otomatis, tautan berbagi atau filter bawaan yang otomatis aktif saat masuk. Nama tetap tersedia setelah muat ulang halaman.

## Akses dan RBAC

| Peran | Sumber yang tersedia | Simpan/pakai/hapus |
| --- | --- | --- |
| OW pemilik | Pengajuan dan ledger sesuai cakupan | Daftar pribadi sendiri |
| OM manajer operasional | Pengajuan dan ledger sesuai cakupan | Daftar pribadi sendiri |
| FA petugas kandang | Pengajuan yang terlihat dan ledger sesuai cakupan | Daftar pribadi sendiri |
| AU auditor | Ledger sesuai hak baca | Daftar pribadi sendiri |
| Peran tanpa house.read | Monitor tidak tersedia | Ditolak server |

Tidak ada perluasan izin transaksi. Auditor boleh mengatur preferensi pribadinya tanpa memperoleh hak mengubah populasi. Identitas pemilik preferensi berasal dari sesi server, bukan userId kiriman client. Akun dan ruang kerja terisolasi.

Saat penugasan kandang/depot atau peran berubah, server memeriksa kembali akses sebelum menyimpan atau memakai filter. Entri yang tidak tersedia hanya memaparkan ID, nama, sumber dan penanda ketersediaan; kriterianya disembunyikan. Pemilik daftar masih dapat menghapus entri tersebut. Pilihan Semua dalam cakupan selalu mengikuti akses terkini, sehingga hasil dapat berubah setelah penugasan berubah. Filter khusus kandang yang tidak lagi dikenal tidak dapat dipakai.

## Panduan Android dan iOS

Buka **Kelola → Master kandang** dan bagian filter riwayat mutasi. Terapkan pilihan, simpan dengan nama, kemudian gunakan atau hapus dari daftar. Aplikasi native hanya menyimpan filter ledger lokal: jenis, kandang, tanggal dan pencarian; status/kondisi pengajuan bernilai semua. Maksimal 10 filter per penyimpanan aplikasi perangkat. Penggunaan kembali kembali ke halaman pertama dan memeriksa kandang lokal terkini.

Versi native 5.6.0, Android versionCode 23, iOS build 23. Portal tim dibuka melalui browser sistem. Data SQLite native bersifat lokal dan belum tersinkron otomatis dengan web; persetujuan multiuser dilakukan pada portal tim. Source Android/iOS tersedia; APK, AAB dan IPA belum dibangun atau ditandatangani untuk distribusi.

## Penyimpanan, pemulihan dan implementasi

Web menyimpan monitorFilterStores berisi userId dan store {schema:1, revision, items} pada payload ruang kerja, di luar data transaksi. Proyeksi API hanya mengembalikan savedMonitorFilters milik peminta. Perintah monitor.filter.save/delete memakai CAS revisi ruang kerja dan mekanisme replay yang sudah ada. Penyimpanan memperbarui revisi metadata dan aktivitas umum, tetapi tidak mengubah ledger populasi, saldo, pesanan, status persetujuan atau fingerprint sumber persetujuan. Tidak ada tabel SQL baru atau perubahan DDL. Batas payload ruang kerja yang sudah ada tetap berlaku.

Native memakai tabel app_preferences dan key monitor_saved_filters, schema 1 serta CAS revisi tersendiri. Nilai rusak atau schema tak dikenal ditolak tanpa ditimpa. Operasi dikunci jika pemuatan gagal sampai preferensi dimuat ulang. Preferensi ini terpisah dari app_state, trace_saved_filters dan backup transaksi.

Ekspor transaksi tim tidak menyertakan monitorFilterStores; pemulihan penuh tim membutuhkan backup database D1 beserta data akses dan pengajuan. Backup transaksi native tidak menyertakan preferensi ini; pelestarian preferensi memerlukan backup penyimpanan aplikasi yang memuat SQLite. Menghapus data aplikasi/perangkat dapat menghilangkannya.

Modul shared/flock-report.ts web identik dengan src/flock-report.ts native. Setelah mengubahnya, jalankan dari web: `node scripts/build-flock-report.cjs ../mobile/node_modules/typescript`, lalu `python3 scripts/embed-worker.py` dan `npm run build`. Modul hasil kompilasi di-embed sebelum worker/team.js agar validasi server dan browser memakai aturan yang sama. Paket source menyertakan script check-all dan checksum. Manifest hosting distribusi tidak memuat ID produksi; konfigurasi staging, DB dan identitas perlu disiapkan untuk instalasi baru.

## Gangguan dan penanganan

Jika server mengembalikan sesi kedaluwarsa atau respons non-JSON, aplikasi menampilkan pesan sesi/HTTP yang dapat ditindaklanjuti. Muat ulang sebelum mencoba lagi. Kegagalan memuat view tidak diteruskan menjadi akses revision dari objek kosong. Jika terjadi konflik revisi, muat ulang data terbaru. Jika nama duplikat atau daftar penuh, pilih nama lain atau hapus preferensi sendiri yang tidak diperlukan. Jangan menimpa penyimpanan rusak dengan nilai kosong tanpa pemeriksaan dan backup.

## Verifikasi dan batas pengujian

- 128 assertion server v5.6 lulus: isolasi akun/ruang kerja, userId client diabaikan, redaksi scope, perubahan peran, batas dan nama, tanggal, hapus milik sendiri, replay dan konflik CAS, tidak mengubah transaksi/fingerprint serta tidak masuk backup transaksi.
- Regresi web lulus: 100 assertion monitor, 269 persetujuan, 147 ledger, 116 master kandang, 206 RBAC, operasi web sebelumnya, server SQLite dan validasi Worker ESM.
- TypeScript dan 282 tes native lulus; termasuk preferensi shared serta CAS dan korupsi SQLite. Ekspor bundle Expo Android/iOS berhasil.
- Browser preview dengan data dummy memverifikasi simpan, pakai pada data terbaru dan daftar tetap tersedia setelah muat ulang; tampilan diperiksa. Gangguan preview sempat mengembalikan halaman/respons non-JSON dan pulih setelah restart; penanganan error diperbaiki. Ini bukan bukti UAT produksi seluruh peran.
- Belum dilakukan UAT seluruh peran pada hosting, pengujian emulator/perangkat nyata, pembuatan APK/AAB/IPA, atau pengujian restore preferensi perangkat. Kelulusan bundle tidak sama dengan build aplikasi native bertanda tangan.
