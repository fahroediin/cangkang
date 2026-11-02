# PamanKu v6.0 — Ringkasan Operasional Kandang

29 Oktober 2026. Rilis ini melanjutkan PamanKu v5.9 dengan ringkasan per kandang dan periode untuk produksi telur, pakan, mortalitas dan kelengkapan pencatatan. Data populasi ditampilkan sebagai saldo saat ini. Modul transaksi, persetujuan, distribusi telur dan filter monitor favorit tetap tersedia.

## Panduan web

1. Masuk portal tim dan pilih ruang kerja yang sesuai.
2. Buka **Ringkasan kandang** pada menu. Menu tersedia bila pengguna memiliki house.read dan production.read.
3. Default periode adalah 30 hari kalender terakhir sampai hari ini menurut Asia/Jakarta, inklusif. Pilih tanggal Dari/Sampai dan semua kandang dalam cakupan atau satu kandang.
4. Klik **Terapkan periode**. Maksimal 366 hari. Pilihan yang belum diterapkan tidak digunakan untuk ekspor.
5. Baca kartu ringkasan serta rincian per kandang. Nilai “—” berarti belum diketahui atau tidak dapat dihitung, bukan nol.
6. Klik **Muat data terbaru** untuk memperbarui snapshot yang tampil. Perubahan transaksi pada sesi lain belum otomatis muncul pada snapshot lama.
7. Klik **Ekspor CSV ringkasan**. Server memeriksa kembali sesi, hak akses, kandang dan periode serta menghitung dari data terkini. File dapat berbeda dari snapshot sebelumnya bila data/penugasan berubah. Jika kandang pilihan tidak lagi diizinkan, ekspor ditolak; pilih ulang cakupan yang tersedia.

Saat akses berubah dan halaman dimuat ulang, pilihan kandang yang sudah tidak tersedia dikembalikan ke semua kandang yang masih diizinkan. Pergantian ruang kerja mengembalikan periode default. Pilihan periode hanya berada di memori sesi, tidak otomatis masuk daftar filter monitor tersimpan. Tidak ada penjadwalan pengiriman laporan.

## Arti angka dan rumus

| Angka | Definisi |
| --- | --- |
| Populasi kini | Saldo saat laporan dihitung: populasi awal + masuk − keluar ± pindah − mortalitas seluruh catatan. Bukan saldo pada akhir periode historis. |
| Total populasi | Ditampilkan hanya jika populasi semua kandang terpilih diketahui. Jika sebagian belum diketahui, total “—”, disertai jumlah kandang belum diketahui dan subtotal yang diketahui. |
| Telur baik butir/kg | Jumlah eggs dan kg pada catatan produksi yang tanggalnya dalam periode inklusif. |
| Rusak butir | Jumlah broken tercatat, terpisah dari telur baik. Tidak dikurangkan lagi dari eggs atau kg. |
| Pakan kg | Jumlah feed pada catatan produksi dalam periode. Bukan seluruh pembelian atau saldo gudang pakan. |
| Mortalitas ekor | Jumlah dead pada catatan produksi dalam periode. Tidak termasuk ayam keluar/afkir; tidak dihitung sebagai persentase populasi historis. |
| Hari tercatat | Jumlah tanggal unik yang memiliki setidaknya satu catatan untuk kandang itu. Banyak catatan pada tanggal sama tetap dihitung satu hari. |
| Hari tanpa catatan | Jumlah hari kalender periode dikurangi hari tercatat. Hari tanpa catatan tidak dianggap produksi nol. |
| Kelengkapan per kandang | Hari tercatat / hari periode × 100%. Menghitung semua hari kalender, termasuk hari sebelum kandang beroperasi atau saat tidak aktif bila tercakup periode. |
| Kelengkapan seluruh pilihan | Jumlah hari-kandang tercatat / (hari periode × jumlah kandang terpilih) × 100%. Tanpa kandang, hasil “—”. |
| Rata-rata telur/hari tercatat | Jumlah telur baik / hari tercatat. Jika tidak ada catatan, hasil “—”. Tidak menggunakan hari tanpa catatan sebagai penyebut. |
| Pakan kg/kg telur | Jumlah pakan tercatat / kg telur baik tercatat. Bila kg telur nol, hasil “—”. Ini rasio catatan periode, belum FCR biologis terverifikasi. |

Contoh: periode 3 hari, produksi baik 100 dan 60 butir pada 2 hari berbeda, total 9 kg, pakan 20 kg. Hari tercatat 2, tanpa catatan 1, kelengkapan 66,67%, rata-rata 80 butir/hari tercatat, rasio pakan 2,22 kg/kg telur. Jika populasi sekarang 99 ekor, angka 99 tetap ditampilkan meskipun periode dipilih lebih lampau.

Tidak menghitung hen-day egg production, persentase mortalitas historis, profitabilitas, FCR biologis atau prediksi AI. Populasi harian historis yang andal serta aturan periode aktif diperlukan sebelum indikator tersebut dapat ditambahkan. Kelengkapan pencatatan bukan ukuran kualitas kesehatan atau produktivitas ayam.

## Akses dan RBAC

| Peran | Ringkasan dan CSV |
| --- | --- |
| OW pemilik | Kandang/produksi dalam cakupan yang diizinkan |
| OM manajer operasional | Sesuai penugasan kandang dan depo |
| FA operator farm | Kandang/produksi yang diizinkan oleh penugasan saat ini |
| AU auditor | Sesuai hak baca dan cakupan; tidak mendapat hak menulis transaksi |
| SA, QC, DP, SL, FN, DS, DR, CS, CU | Tidak mendapat menu/endpoint karena tidak memiliki kedua izin yang diperlukan |

Tidak ada permission baru atau perubahan matriks transaksi. Endpoint memerlukan keanggotaan aktif, house.read dan production.read. Hanya rumah/kandang dan produksi dari proyeksi server yang diizinkan masuk perhitungan. Filter kandang client tidak memperluas cakupan. Akses workspace lain atau akses yang dicabut ditolak. CSV ringkasan adalah laporan cakupan terbatas, bukan backup global.

## Android dan iOS

Buka **Kelola → Master kandang**, bagian **Ringkasan operasional kandang**. Tekan **Atur periode ringkasan kandang**, pilih periode dan kandang lokal, lalu konfirmasi. Tekan **Ekspor CSV ringkasan kandang** untuk membuka menu berbagi perangkat jika tersedia.

Sumber data adalah SQLite lokal, terpisah dari portal tim. Perhitungan memakai salinan state saat ini dan modul yang sama dengan web; tidak menulis transaksi atau mengubah revisi data. Bila pilihan kandang sudah hilang setelah restore/perubahan data, atur ulang periode/kandang melalui tombol yang tersedia. Menu berbagi tidak tersedia pada semua lingkungan pengujian.

Native versi 6.0.0, Android versionCode 27, iOS build 27. Source proyek Android/iOS disertakan. Bundle Expo diekspor; APK/AAB/IPA belum dibuat atau ditandatangani untuk distribusi. Persetujuan tim tetap melalui portal browser sistem; belum ada sinkronisasi otomatis web/native.

## Teknis dan implementasi

Shared module house-performance.ts identik pada web/shared dan mobile/src. Fungsi recentPerformancePeriod menentukan 30 hari inklusif, validatePerformanceFilters memvalidasi kalender/rentang/cakupan, housePerformance menghitung baris dan ringkasan, dan housePerformanceCsv menghasilkan CSV dengan metadata, escaping kutip/newline dan perlindungan formula spreadsheet.

Endpoint GET `/api/team/performance?teamId=...&from=YYYY-MM-DD&to=YYYY-MM-DD&house=...` mengembalikan workspace, revision, filters, days, rows dan summary. house kosong berarti semua dalam cakupan. Tanggal wajib; rentang invalid atau kandang tidak tersedia menghasilkan 422, izin/keanggotaan tidak tersedia menghasilkan 403. Endpoint hanya membaca data; tidak menulis aktivitas, preferensi, saldo atau fingerprint persetujuan. Halaman menghitung snapshot dari proyeksi view; ekspor meminta perhitungan server terbaru.

Tidak ada tabel, DDL, schema transaksi atau key preferensi baru. Pilihan periode tidak dipersist. Identitas bundle/package com.telurfarm.mobile, proyek Xcode, skema URL telurfarm, database SQLite, tabel D1, URL hosting dan tag format backup lama tetap digunakan untuk kompatibilitas dari versi TelurFarm/PamanKu sebelumnya.

Urutan kompilasi dari folder web:

1. `node scripts/build-team-domain.cjs ../mobile/node_modules/typescript`
2. `node scripts/build-flock-report.cjs ../mobile/node_modules/typescript`
3. `node scripts/build-house-performance.cjs ../mobile/node_modules/typescript`
4. `python3 scripts/embed-worker.py`
5. `npm run build` kemudian `npm run validate`

Script baru menghasilkan web/house-performance.js, dimuat sebelum team.js serta di-embed sebelum worker/team.js. Paket check-all menjalankan urutan ini dan seluruh regresi. Manifest distribusi tidak membawa project_id produksi; siapkan staging, binding D1 dan gateway identitas tepercaya untuk instalasi baru. Development menggunakan SQLite in-memory dan identitas dummy; restart menghapus data uji.

## Backup, implementasi dan serah terima

1. Cadangkan D1 dan penyimpanan aplikasi perangkat sebelum upgrade; ekspor transaksi tidak mencakup seluruh anggota/ACL/pengajuan/preferensi.
2. Verifikasi checksum paket, instal dependency native dengan npm ci pada lingkungan yang sesuai, lalu jalankan scripts/check-all.sh.
3. Siapkan staging dan identitas; gunakan data kandang/populasi/produksi yang telah direkonsiliasi, termasuk status data lama yang belum lengkap.
4. Jalankan UAT empat peran pembaca, penolakan peran lain, cakupan lintas depo/kandang, periode, produksi kosong/nol dan ekspor.
5. Bangun serta tanda tangani Android/iOS pada toolchain masing-masing; uji upgrade instalasi dan restore pada perangkat nyata. Langkah tersebut belum dijalankan dalam rilis source ini.
6. Tetapkan penanggung jawab data dan backup, rekam hasil UAT, lalu serahkan source, konfigurasi tanpa rahasia, panduan serta catatan batas verifikasi.

Laporan CSV bukan berkas pemulihan data. Baseline dokumentasi dan proposal TelurFarm terdahulu merupakan riwayat; rilis ini tidak otomatis mengubah proposal atau menyatakan seluruh rencana produksi sudah selesai.

## Verifikasi rilis

- 137 assertion server v6.0 lulus: penjumlahan, populasi kini, periode/kalender, data kosong, populasi tak diketahui, scope/role/workspace, pencabutan dan GET yang tidak mengubah state/fingerprint persetujuan.
- 309 tes native dan TypeScript lulus. Termasuk 13 tes baru modul web/native untuk tanggal, cakupan, hari unik, nol/kosong, ketidakmutasian, CSV dan kesamaan hasil kedua platform.
- Regresi lulus: v5.9 158, v5.8 117, v5.7 172, v5.6 128, monitor 100, persetujuan 269, ledger 147, master kandang 116 dan RBAC 206 assertion; operasi web sebelumnya, SQLite server dan ESM lulus.
- Bundle Expo Android/iOS berhasil diekspor.
- Browser preview pemilik dummy memverifikasi menu, ringkasan kosong/populasi belum diketahui, penerapan satu hari dan satu kandang serta klik ekspor yang berhasil melalui server. Tampilan diperiksa; file unduhan browser belum dibuka manual di spreadsheet. Perhitungan dengan produksi terisi diuji pada server dan modul.
- Belum UAT seluruh peran pada hosting, emulator/perangkat nyata, menu berbagi native, APK/AAB/IPA, upgrade instalasi, GPS atau restore perangkat. Bundle/deployment berhasil bukan bukti semua pemeriksaan tersebut.
