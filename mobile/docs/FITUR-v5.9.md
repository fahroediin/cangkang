# PamanKu v5.9 — Filter Monitor Favorit

29 Oktober 2026. Melanjutkan PamanKu v5.8, sebelumnya bernama TelurFarm. Warna coklat telur, krem, kuning telur dan putih dipertahankan. Rilis ini menambahkan tanda favorit pada filter monitor tersimpan, urutan favorit dahulu dan tampilan hanya favorit di web serta source native Android/iOS.

## Panduan web

1. Masuk portal tim, pilih ruang kerja lalu **Monitor mutasi**.
2. Buat filter dengan **Terapkan filter → Simpan filter yang diterapkan**, atau gunakan entri yang sudah tersimpan.
3. Pada entri, klik **Jadikan favorit**. Tanda **★** muncul di depan nama dan jumlah favorit bertambah.
4. Daftar menampilkan favorit lebih dahulu. Urutan relatif antar favorit dan antar nonfavorit mengikuti urutan penyimpanan awal, bukan waktu terakhir ditandai.
5. Klik **Hanya favorit** untuk menyembunyikan entri nonfavorit. Klik **Tampilkan semua filter** untuk kembali. Jika kosong, aplikasi memberi petunjuk untuk menampilkan semua entri.
6. Klik **Lepas favorit** untuk menghapus tanda saja. Entri tetap tersimpan. Dalam mode hanya favorit, entri langsung tidak terlihat setelah tandanya dilepas.
7. Klik **Pakai filter** untuk menerapkannya pada data dan cakupan akses terbaru. Menandai favorit atau mengubah mode daftar tidak menerapkan kriteria secara otomatis dan tidak mengubah laporan aktif.

Penanda favorit bertahan setelah muat ulang. Mode Hanya favorit adalah pilihan tampilan sementara, kembali ke semua filter saat halaman dimuat ulang atau ruang kerja diganti. Maksimal tetap 10 entri per akun per ruang kerja, termasuk favorit; penandaan tidak menggunakan slot tambahan. Semua 10 entri boleh ditandai.

## Hubungan dengan fitur sebelumnya

| Tindakan | Perilaku favorit |
| --- | --- |
| Simpan entri baru | Mulai tanpa tanda favorit |
| Ubah nama | Tanda favorit dipertahankan |
| Perbarui isi dari filter aktif | Tanda favorit dipertahankan, sumber/kriteria diperiksa ulang |
| Duplikasi | Salinan mendapat ID baru dan mulai tanpa tanda favorit; entri asli tetap |
| Hapus filter | Entri dan tandanya dihapus; transaksi tidak terhapus |
| Pakai filter | Mengambil data terbaru, mengikuti hak akses, kembali ke halaman pertama |
| Hanya favorit | Menyaring daftar preferensi saja; tidak menyaring hasil laporan atau CSV |

Nama tetap unik 1–60 karakter Unicode, maksimal 10 filter; tanggal tetap dan inklusif menurut tanggal mutasi. Tidak ada favorit bersama, jadwal laporan, filter bawaan otomatis atau sinkronisasi preferensi web/native.

## Hak akses dan RBAC

| Peran | Sumber monitor | Pengelolaan favorit |
| --- | --- | --- |
| OW pemilik | Pengajuan dan ledger sesuai cakupan | Preferensi akun sendiri pada ruang kerja |
| OM manajer operasional | Pengajuan dan ledger sesuai cakupan | Preferensi akun sendiri pada ruang kerja |
| FA petugas kandang | Pengajuan yang terlihat dan ledger sesuai penugasan | Preferensi akun sendiri pada ruang kerja |
| AU auditor | Ledger sesuai hak baca | Preferensi sendiri, tanpa hak mengubah transaksi |
| Tanpa house.read | Monitor tidak tersedia | Perintah favorit ditolak |

Pemilik daftar berasal dari sesi server. userId, nama atau kriteria tambahan kiriman client tidak mengganti pemilik maupun isi entri dalam perintah favorit. Akun dan ruang kerja terisolasi. Menandai favorit baru memerlukan sumber/kandang yang masih tersedia bagi pengguna saat server memprosesnya.

Jika cakupan berubah, favorit dapat menjadi tidak tersedia. Nama, sumber dan tanda favorit tetap terlihat pada daftar pemilik, tetapi kriteria disembunyikan. Pakai/duplikasi tetap tidak tersedia. **Lepas favorit** masih diizinkan pada entri sendiri yang tidak tersedia; tidak membuka kriterianya. Pengguna juga dapat mengganti nama, menghapus atau memperbaiki isi dengan kriteria baru yang diizinkan, mengikuti aturan v5.8. Favorit tidak memberikan akses tambahan.

## Android dan iOS

Buka **Kelola → Master kandang → Filter mutasi tersimpan**. Tombol **Jadikan favorit mutasi**, **Lepas favorit mutasi**, **Hanya favorit mutasi** dan **Tampilkan semua filter mutasi** mengikuti aturan serupa. Tampilan memakai favorit lebih dahulu, dengan jumlah keseluruhan dan jumlah favorit. Entri lokal yang kandangnya tidak lagi dikenal tidak bisa ditandai baru atau dipakai; tanda favorit lama masih dapat dilepas.

Native memakai ledger lokal saja. Preferensi bersifat pribadi per penyimpanan aplikasi perangkat, terpisah dari akun/ruang kerja web dan belum tersinkron otomatis. Mode hanya favorit berada di memori sesi aplikasi. Versi 5.9.0, Android versionCode 26, iOS build 26. Source Android/iOS tersedia dan bundle Expo berhasil diekspor; APK/AAB/IPA belum dibangun atau ditandatangani untuk distribusi.

## Teknis, penyimpanan dan kompatibilitas

MonitorSavedFilter menambah field opsional favorite:boolean. Entri lama tanpa field ini dianggap bukan favorit. Nilai true dipertahankan, false dikanonisasi menjadi field yang tidak ada; tipe selain boolean ditolak bila field hadir. Store tetap schema 1. Tidak ada DDL atau reset data. Data transaksi, anggota, scope, URL hosting, bundle/package com.telurfarm.mobile, URL scheme telurfarm, nama SQLite dan tag backup lama tetap dipertahankan dari v5.8.

Modul bersama flock-report.ts menyediakan setMonitorSavedFavorite untuk perubahan immutable dan listMonitorSavedFilters untuk penyaringan serta pengurutan stabil pada salinan array. Urutan array yang tersimpan tidak diubah oleh pengurutan tampilan. Kriteria/nama/id tidak berubah akibat penandaan.

Web memakai perintah monitor.filter.favorite dengan {id,favorite:boolean}, bukan toggle tanpa nilai. Pemeriksaan membership, house.read dan daftar milik peminta mendahului operasi. favorite:true memeriksa cakupan sumber/kandang; favorite:false mengizinkan pelepasan tanda pada entri sendiri yang sudah tidak tersedia. Store tetap di monitorFilterStores per user di luar data transaksi. Revisi metadata dan aktivitas umum bertambah; CAS dan replay request yang sama tetap berlaku. Pengulangan request yang sama tidak membalik tanda atau membuat entri baru. Tidak mengubah ledger, saldo, status persetujuan atau fingerprint sumber.

Native tetap menggunakan app_preferences key monitor_saved_filters dengan CAS dan lock UI. Kesalahan tulis/revisi memerlukan muat ulang daftar; nilai rusak/schema tak dikenal tidak ditimpa. Field favorit ditangani validator yang sama dengan web. Menjalankan penulis preferensi dari versi lama dapat menghilangkan field baru yang tidak dikenalnya; gunakan versi yang sama untuk operasi preferensi setelah upgrade dan pertahankan backup sebelum rollback.

Kompilasi dari web: `node scripts/build-team-domain.cjs ../mobile/node_modules/typescript`, `node scripts/build-flock-report.cjs ../mobile/node_modules/typescript`, `python3 scripts/embed-worker.py`, lalu `npm run build`. check-all pada paket menjalankan kompilasi, build, regresi server, TypeScript dan tes native. Shared domain dan flock-report identik antara web/shared dan mobile/src. Manifest distribusi tidak membawa project_id produksi; konfigurasi hosting/DB/identitas perlu disiapkan untuk instalasi baru.

## Backup dan pemulihan

Ekspor transaksi web/native tidak mencakup daftar preferensi monitor beserta favorit. Backup tim lengkap membutuhkan database D1, termasuk payload tim, anggota, ACL dan pengajuan. Pelestarian preferensi native membutuhkan backup penyimpanan aplikasi yang membawa SQLite. Data pribadi web lama, portal tim dan native tetap terpisah. Panduan rilis sebelumnya dalam folder baseline adalah riwayat, dan proposal TelurFarm lama belum otomatis diperbarui oleh rilis ini.

## Pengujian dan batas verifikasi

- 158 assertion server v5.9 lulus: field lama tanpa favorit, tipe boolean ketat, isolasi akun/ruang kerja, scope/redaksi, hak auditor, batas daftar, replay/CAS, penghapusan favorit dan sumber persetujuan yang tetap valid.
- Regresi lulus: 117 assertion v5.8, 172 v5.7, 128 v5.6, 100 monitor, 269 persetujuan, 147 ledger, 116 master kandang dan 206 RBAC; operasi web sebelumnya, SQLite server serta validasi Worker ESM.
- TypeScript dan 296 tes native lulus, termasuk urutan stabil tanpa mutasi, favorit pada kapasitas penuh, rename/update/copy, persistensi SQLite dan penolakan konflik revisi. Ekspor bundle Android/iOS berhasil.
- Browser preview dengan identitas dan data dummy memverifikasi simpan filter, tandai favorit, mode hanya favorit, lepas tanda sampai daftar kosong, kembali ke semua entri dan favorit tetap ada setelah reload. Tampilan diperiksa secara visual. Pengujian ini hanya pada lingkungan lokal dan peran pemilik dummy.
- UAT hosting seluruh peran, emulator/perangkat nyata, APK/AAB/IPA, upgrade instalasi lama, GPS dan restore perangkat belum dilakukan. Keberhasilan bundle/deployment bukan bukti pengujian tersebut.
