# TelurFarm 5.5 — Monitor Mutasi dan Persetujuan

27 Oktober 2026. Rilis ini menambahkan monitor pengajuan populasi dan mutasi tercatat dengan filter, ringkasan, indikator sumber serta ekspor CSV sesuai cakupan akses. Alur Ajukan → Setujui/Tolak → Jalankan dari 5.4 tetap berlaku.

## User guide web

1. Masuk ke portal tim dan buka **Monitor mutasi**, atau **Ringkasan → Buka monitor mutasi**.
2. Pilih sumber **Pengajuan populasi** atau **Mutasi yang sudah dicatat**. Auditor hanya mendapat ledger/mutasi tercatat; FA melihat pengajuannya sendiri yang masih dalam scope dan ledger sesuai penugasan.
3. Pilih jenis masuk, keluar/afkir atau pindah; kandang; periode tanggal; pencarian ID, nama atau catatan. Untuk pengajuan, tersedia status dan kondisi sumber.
4. Klik **Terapkan filter**. Periode inklusif memakai tanggal mutasi yang diminta/dicatat, bukan tanggal pengajuan. Pencarian maksimal 80 karakter, tidak membedakan kapital dan menormalisasi Unicode.
5. Periksa ringkasan jumlah transaksi cocok, Menunggu/Disetujui dan Sumber/Penugasan berubah. Angka selalu mengikuti hasil filter dan cakupan pengguna, bukan keseluruhan usaha.
6. Gunakan **Sebelumnya/Berikutnya** untuk halaman berisi 25 baris. Urutan berdasarkan tanggal mutasi terbaru, lalu urutan pencatatan terbaru pada tanggal yang sama.
7. Klik **Ekspor CSV hasil filter**. Aplikasi memuat ulang data dan hak akses dari server sebelum menyusun CSV. Ekspor mencakup seluruh hasil filter, bukan hanya halaman yang terlihat.
8. **Reset filter** mengembalikan semua jenis/kandang/periode/status yang terlihat. Perubahan filter tidak mengubah transaksi, saldo maupun persetujuan. Filter tidak disimpan permanen dan direset saat berpindah workspace.

Perubahan pilihan filter baru berlaku sesudah tombol Terapkan filter. Ekspor menggunakan filter yang sudah diterapkan. Bila scope kandang berubah dan pilihan lama tidak lagi dapat diakses, filter dikembalikan ke default dari data yang kini terlihat. CSV memakai data terbaru sehingga dapat berbeda dari snapshot layar sebelumnya; konfirmasi jumlah baris pada pesan ekspor.

## Arti indikator

| Indikator | Arti | Tindak lanjut |
| --- | --- | --- |
| Sumber sesuai | Master, produksi dan ledger kandang masih sesuai saat pengajuan; penugasan terkait yang diperiksa masih berlaku | Pengelola berwenang dapat memeriksa atau menjalankan sesuai status |
| Sumber berubah | Master, produksi atau mutasi kandang berubah sejak pengajuan | Tarik pengajuan sendiri dan ajukan ulang dengan data terbaru; pemeriksa lain dapat menolak |
| Penugasan berubah | Pembuat atau pemeriksa yang dibutuhkan tidak aktif atau tidak lagi memiliki permission/scope | Tinjau penugasan dengan pemilik; tidak ada pembukaan akses otomatis |
| Selesai | Status pengajuan sudah dijalankan, ditolak atau ditarik; atau baris berasal dari ledger tercatat | Baca status untuk membedakan hasil akhirnya |

Indikator merupakan snapshot saat data dimuat, bukan jaminan bahwa tindakan berikutnya pasti berhasil. Server tetap memeriksa role, scope, fingerprint dan revisi ketika pengguna menekan tindakan. Bila sumber dan penugasan sama-sama berubah, indikator sumber berubah ditampilkan lebih dahulu. Data di luar cakupan tidak dipakai untuk membuka detail permintaan kepada pengguna lain.

Dari monitor pengajuan, OW/OM dapat **Setujui**, **Tolak** atau **Jalankan** sesuai hak dan status; pembuat dapat **Tarik** pengajuan sendiri yang masih terbuka. Tombol Setujui/Jalankan tidak ditawarkan pada indikator sumber/penugasan berubah. Larangan menyetujui pengajuan sendiri tetap berlaku. Semua pemeriksaan server 5.4 tetap menjadi pengendali akses.

## Isi dan batas laporan

CSV memuat workspace, peran, sumber, waktu ekspor, filter, jumlah baris dan kolom ID, tanggal mutasi, jenis, asal, tujuan, ekor, status, kondisi sumber, catatan, pembuat serta pemeriksa bila tersedia. Waktu ekspor memakai ISO8601 UTC; periode operasional tetap tanggal Asia/Jakarta. Data transfer yang hanya terlihat satu sisi tetap disamarkan, termasuk catatan dan referensi persetujuannya.

Teks CSV diapit kutip dengan escape yang sesuai. Teks yang berpotensi menjadi formula spreadsheet dinetralkan. Encoding UTF-8 dengan BOM pada unduhan web.

**Volume ekor adalah jumlah pada transaksi yang terpilih, bukan jumlah ayam unik, saldo populasi atau rekonsiliasi sensus.** Ayam yang berpindah beberapa kali dapat muncul beberapa kali. Pengajuan belum mereservasi ayam atau kapasitas. Pengajuan yang sudah dijalankan juga mempunyai baris ledger; kedua sumber sengaja ditampilkan terpisah agar tidak dijumlahkan ganda. Ledger lama tanpa referensi persetujuan tetap dapat dilaporkan, dan tidak dianggap sebagai bukti persetujuan 5.4.

## Role dan menu

| Role | Monitor pengajuan | Monitor ledger dan CSV | Tindakan |
| --- | --- | --- | --- |
| OW | Pengajuan dalam cakupan | Ya | Sesuai aturan 5.4 |
| OM | Pengajuan dalam cakupan | Sesuai scope | Setujui/tolak orang lain, jalankan dan tarik milik sendiri |
| FA | Pengajuan sendiri dalam scope | Sesuai penugasan | Ajukan/tarik; tidak menyetujui atau menjalankan |
| AU | Tidak | Sesuai scope | Baca dan ekspor hasil yang terlihat |
| SA dan role lain | Tidak | Tidak | Tidak ada menu monitor mutasi |

Rilis ini tidak menambah permission bisnis baru. Ekspor CSV menggunakan hak baca data yang sudah dimiliki; bukan akses backup global. Hak OW/OM/FA/AU tetap dibatasi proyeksi server. Audience hosting privat dan mekanisme undangan tidak berubah.

## User guide native lokal

**Kelola → Master kandang → Filter riwayat mutasi**. Pilih jenis/kandang, tanggal dari/sampai dan pencarian, lalu simpan. Field kandang/periode/pencarian boleh kosong. Tanggal tidak valid atau rentang terbalik ditolak sebelum filter diterapkan. Gunakan Reset filter mutasi untuk kembali ke semua data lokal. Riwayat memiliki halaman 20 baris dan menampilkan jumlah transaksi cocok serta filter aktif.

Source native **5.5.0**, Android versionCode **22**, iOS build **22**. Monitor persetujuan tim dan ekspor CSV tersedia melalui portal online. SQLite native tetap pribadi, tidak memiliki antrean persetujuan multiuser dan tidak otomatis sinkron dengan tim. Filter lokal hanya mengubah tampilan; tidak masuk backup transaksi. APK/AAB/IPA belum dibuat.

## Dokumen teknis dan implementasi

Tidak ada perubahan schema transaksi atau tabel SQL. Server menambahkan field turunan **health** pada pengajuan flock yang sudah lolos proyeksi scope. Nilainya current, changed, blocked atau closed. Fingerprint tetap tidak dikirim ke client. GET tidak menulis perubahan status, ledger, audit ataupun database. Pemeriksaan health membaca keadaan sekarang tanpa mengeksekusi mutasi.

Filter, pagination, ringkasan dan serialisasi CSV memakai modul bersama **mobile/src/flock-report.ts** dan **web/shared/flock-report.ts** yang identik. Browser memakai hasil generate **web/flock-report.js**; file dimuat sebelum team.js. Native memakai modul TypeScript yang sama dan memoization untuk hasil filter. Backend tetap memeriksa otorisasi penuh untuk tindakan; laporan tidak menjadi jalur penulisan baru.

Build bila modul laporan diubah, dari web:

```sh
node scripts/build-flock-report.cjs ../mobile/node_modules/typescript
python3 scripts/embed-worker.py
npm run build
node tests/v55-monitor.mjs
```

Untuk domain transaksi gunakan build-team-domain.cjs yang sudah ada. Baca script check-all.sh pada paket untuk regresi lengkap. Hosting production tetap memerlukan gateway identitas tepercaya dan DB; server development menggunakan identitas dummy dan SQLite in-memory.

Rollout: backup D1 → uji staging dengan OW/OM/FA/AU → deploy web → muat ulang portal → cocokkan jumlah hasil dan CSV dengan data scope → uji signing/build serta perangkat nyata sebelum distribusi native. Backup transaksi bukan backup lengkap ACL, pengajuan atau metadata persetujuan; pemulihan tim penuh tetap memakai D1.

## Verifikasi

- **100 assertion monitor server/browser-runtime**: current/changed/blocked/closed, GET tanpa penulisan, scope/role, fingerprint tersembunyi, redaksi CSV dan aset browser.
- **272 tes native** serta TypeScript lulus, termasuk enam tes laporan baru untuk filter gabungan, Unicode, periode, pagination, summary, ekspor dan netralisasi formula.
- Regresi 269 assertion persetujuan, 147 ledger, 116 Master Kandang dan 206 RBAC lulus.
- Operasi web, SQLite server, Worker ESM dan ekspor bundle Android/iOS lulus.
- Browser preview lokal: buat workspace/kandang, ajukan masuk20, monitor menampilkan satu pengajuan sumber sesuai; pencarian tanpa hasil, reset dan aksi ekspor CSV satu baris berhasil. Tampilan diperiksa. Isi CSV diuji melalui tes serialisasi; berkas unduhan browser tidak dibuka ulang secara manual.
- Full hosted multi-role UI, file CSV pada berbagai spreadsheet, emulator/perangkat nyata, GPS, share dan restore masih memerlukan UAT.
