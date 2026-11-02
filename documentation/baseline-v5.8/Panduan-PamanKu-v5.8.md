# PamanKu v5.8 — Panduan Rilis dan Pengelolaan Filter Monitor

29 Oktober 2026. Nama produk TelurFarm berubah menjadi **PamanKu**. Warna coklat telur, krem, kuning telur dan putih dipertahankan. Rilis ini menggabungkan kemampuan v5.7 (ubah nama dan perbarui isi filter) dengan v5.8 (duplikasi filter dan pergantian nama produk). v5.7 tidak dipublikasikan terpisah karena dilanjutkan langsung ke v5.8.

## Hasil dan ruang lingkup

Nama baru diterapkan pada judul dan header web, PWA manifest, layar native, nama aplikasi Android/iOS yang ditampilkan, pesan izin lokasi, invoice, laporan dan nama berkas ekspor. Ikon telur yang ada tetap dipakai. URL hosting yang sudah digunakan tetap sama; akses privat dan akun pemilik dipertahankan.

Pengelolaan filter mencakup simpan, pakai, ubah nama, perbarui isi, duplikasi dan hapus. Maksimal 10 per daftar, nama 1–60 karakter Unicode, trim/spasi dinormalisasi, unik tanpa membedakan kapitalisasi dan bentuk Unicode setara. Filter menyimpan pilihan, bukan snapshot transaksi. Tanggal bersifat tetap, inklusif, berdasarkan tanggal mutasi.

## Panduan web

Buka portal tim, pilih ruang kerja lalu **Monitor mutasi**. Pilih sumber, jenis, kandang, periode dan pencarian; status/kondisi sumber tersedia untuk pengajuan. Klik **Terapkan filter** sebelum menyimpan atau memperbarui preferensi.

| Tindakan | Cara dan hasil |
| --- | --- |
| Simpan filter yang diterapkan | Beri nama; membuat entri baru dari kriteria yang telah diterapkan. Perubahan formulir yang belum diterapkan tidak digunakan. |
| Pakai filter | Membaca ulang data server dan akses terkini; menerapkan kriteria lalu membuka halaman pertama. |
| Ubah nama | Masukkan nama baru. ID, sumber, kriteria, urutan dan jumlah tetap. |
| Perbarui isi dari filter aktif | Memperlihatkan ringkasan sumber/kriteria yang sudah diterapkan, lalu meminta konfirmasi. Mengganti isi entri tujuan; nama, ID, urutan dan jumlah tetap. Dapat mengubah sumber laporan sesuai hak akses. |
| Duplikasi | Beri nama unik untuk salinan. Server menyalin isi entri tersimpan, bukan formulir aktif; membuat ID baru dan menambah satu slot di akhir daftar. |
| Hapus filter | Konfirmasi penghapusan preferensi. Tidak menghapus transaksi atau kandang. Preferensi dapat dibuat ulang manual. |

Perubahan preferensi tidak otomatis mengaktifkan entri yang diedit atau diduplikasi; tekan **Pakai filter** untuk melihatnya. Ringkasan kriteria ditampilkan pada entri yang tersedia. Pada 10 entri, duplikasi tidak tersedia; ubah nama dan perbarui isi tetap bisa dipakai. CSV mengikuti seluruh hasil filter aktif yang diizinkan, bukan hanya halaman terlihat.

Contoh: pakai filter “Pengajuan harian”, atur status menjadi Menunggu dan terapkan. Klik **Perbarui isi dari filter aktif** pada entri itu untuk mengganti kriterianya. Untuk mempertahankan versi lama, gunakan **Duplikasi**, beri nama “Pengajuan menunggu”, pakai salinannya, sesuaikan dan perbarui isi salinan. Entri asli tetap terpisah.

## RBAC dan pembatasan cakupan

| Peran | Sumber | Pengelolaan preferensi |
| --- | --- | --- |
| OW pemilik | Pengajuan dan mutasi tercatat sesuai akses | Daftar pribadi sendiri dalam ruang kerja |
| OM manajer operasional | Pengajuan dan mutasi tercatat sesuai akses | Daftar pribadi sendiri dalam ruang kerja |
| FA petugas kandang | Pengajuan yang terlihat dan ledger sesuai penugasan | Daftar pribadi sendiri dalam ruang kerja |
| AU auditor | Mutasi tercatat | Daftar pribadi sendiri; tidak memperoleh hak mengubah transaksi |
| Tanpa house.read | Tidak mendapat monitor | Semua perintah preferensi ditolak |

Akun dan ruang kerja terisolasi; userId client diabaikan. Server menentukan pemilik dari sesi. Tidak ada hak baru untuk transaksi atau persetujuan. Perintah tetap memakai pemeriksaan keanggotaan aktif, hak baca, scope dan revisi.

Entri yang kehilangan cakupan menampilkan nama/sumber, tanpa kriteria dan tanpa tombol pakai/duplikasi. Pengguna masih bisa mengganti nama atau menghapus preferensi sendiri. **Perbarui isi** dapat memperbaiki entri tersebut dengan pilihan baru yang diizinkan sekarang; tidak membaca atau menyalin kriteria tersembunyi. Duplikasi memerlukan sumber dan kandang asli yang masih tersedia. Pilihan semua kandang selalu mengikuti cakupan terkini. Tidak ada akses ke preferensi anggota lain.

## Android dan iOS

Buka **Kelola → Master kandang → Filter mutasi tersimpan**. Tombol **Ubah nama filter mutasi**, **Perbarui isi dari filter mutasi aktif**, dan **Duplikasi filter mutasi** mengikuti aturan di atas. Ringkasan pilihan ditampilkan sebelum konfirmasi pembaruan. Native memakai sumber ledger lokal saja; batas 10 berlaku pada penyimpanan aplikasi perangkat. Kandangan yang tidak lagi dikenal menyebabkan pakai/duplikasi ditolak. Kriteria pengganti diperiksa terhadap kandang terkini.

Versi aplikasi 5.8.0, Android versionCode 25, iOS build 25. Source proyek Android dan iOS disertakan. Bundle Expo berhasil diekspor; APK/AAB/IPA belum dibuat atau ditandatangani untuk distribusi. Persetujuan tim melalui portal browser sistem. Data SQLite native tetap lokal, terpisah dari portal tim, tanpa sinkronisasi otomatis.

## Kompatibilitas nama dan data

Nama tampilan menjadi PamanKu, tetapi identitas `com.telurfarm.mobile`, skema URL `telurfarm`, nama proyek Xcode, nama SQLite `telurfarm-native.db`, tabel D1, key penyimpanan browser dan tag format backup lama dipertahankan. Hal ini menghindari penggantian identitas instalasi atau pemutusan akses data lama hanya karena pergantian merek. Prefix nama berkas unduhan kini PamanKu. File JSON tetap memakai penanda protokol `TelurFarm` atau `TelurFarm Native` sesuai jenis backup; penanda ini bukan nama tampilan produk. Jangan mengubahnya manual.

Data lama yang valid tetap menggunakan schema yang sama. Tidak ada migrasi tabel atau reset data. PWA memakai cache versi baru PamanKu v5.8; browser yang sudah memasang PWA mungkin perlu memuat ulang atau memasang ulang shortcut untuk memperbarui label launcher sesuai perilaku browser. Pembaruan biner native dengan identitas/signing yang sama tetap memerlukan build dan instalasi yang benar; belum diuji pada perangkat nyata dalam rilis ini.

## Teknis dan implementasi

Modul bersama flock-report.ts menambahkan renameMonitorSavedFilter, updateMonitorSavedFilter dan duplicateMonitorSavedFilter. Operasi immutable mempertahankan ID/order saat edit, membuat ID baru saat copy, serta menaikkan revisi satu kali. Validasi canonical membuang field tak dikenal. Kesalahan nama, sumber, tanggal, kapasitas daftar atau target tidak ditemukan tidak mengubah state awal.

Web: monitor.filter.rename, monitor.filter.update, monitor.filter.duplicate melalui endpoint perintah tim yang sama. Store tetap schema 1 pada monitorFilterStores per user di luar data transaksi. Update hanya mengganti sumber dan tujuh kriteria; nama diubah lewat rename. Duplicate menyalin entri server, mengabaikan sumber/kriteria/newId kiriman client. CAS revisi ruang kerja dan replay idempotent mencegah salinan ganda pada pengulangan request yang sama serta menolak penulisan konkuren yang stale. Aktivitas umum dan revisi metadata bertambah, tetapi ledger, saldo, pesanan, status persetujuan dan fingerprint sumber tidak berubah.

Native: key app_preferences.monitor_saved_filters, schema 1, CAS preferensi dan lock UI tetap dipakai. Data rusak/schema tak dikenal tidak ditimpa; operasi dinonaktifkan sampai daftar dimuat ulang. Jika konflik atau gagal tulis, muat ulang preferensi sebelum melanjutkan.

Dari folder web, kompilasi dengan `node scripts/build-team-domain.cjs ../mobile/node_modules/typescript` dan `node scripts/build-flock-report.cjs ../mobile/node_modules/typescript`, kemudian `python3 scripts/embed-worker.py` dan `npm run build`. Modul transaksi dan laporan di-embed sebelum worker/team.js. Paket distribusi menyertakan check-all, checksum, konfigurasi tanpa project_id produksi dan baseline dokumentasi sebelumnya.

## Backup dan pemulihan

Ekspor transaksi tidak mencakup preferensi monitor, anggota, ACL dan seluruh proses pengajuan. Pemulihan tim lengkap membutuhkan backup D1. Backup transaksi native juga tidak menyertakan preferensi; backup penyimpanan aplikasi perlu mempertahankan SQLite untuk membawa preferensi. Perubahan nama tidak menyatukan data pribadi web, tim dan perangkat. Arsip dan proposal lama tetap dokumen historis TelurFarm, belum direvisi otomatis menjadi proposal PamanKu.

## Verifikasi dan batas pengujian

- v5.8: 117 assertion server lulus untuk duplikasi, isolasi ID/akun/ruang kerja, scope saat menyalin, audit ledger, validasi, batas 10, replay/CAS, kompatibilitas backup dan nama produk.
- v5.7: 172 assertion server lulus untuk ubah nama/isi, scope menyempit, pemulihan entri unavailable, edit pada batas 10, replay/CAS dan persetujuan yang tetap berlaku.
- Regresi: 128 assertion v5.6, 100 monitor, 269 persetujuan, 147 ledger, 116 master kandang dan 206 RBAC lulus; operasi web sebelumnya, SQLite server dan validasi ESM lulus.
- TypeScript dan 290 tes native lulus. Fixture laporan web diperbarui dari source web aktual setelah pergantian nama; kesamaan hasil web/native kembali lulus. Bundle Expo Android/iOS diekspor.
- Browser preview memperlihatkan nama PamanKu v5.8, ruang kerja dummy dan monitor. Saat menyimpan filter, infrastruktur preview mengembalikan HTTP 405 non-JSON; satu reload kemudian menghasilkan Cannot GET /team.html. Karena itu alur ubah/duplikasi melalui browser belum terverifikasi. Pemeriksaan server langsung dengan SQLite berhasil. Tidak mengubah kode aplikasi untuk menutupi keterbatasan preview.
- UAT hosting seluruh peran, emulator/perangkat nyata, APK/AAB/IPA, upgrade instalasi lama dan restore backup perangkat belum dilakukan. Keberhasilan deployment dan bundle bukan bukti pengujian tersebut.
