# TelurFarm 5.3 — Mutasi Populasi Kandang

27 Oktober 2026. Rilis ini melanjutkan Master Kandang 5.2 dengan pencatatan ayam masuk, keluar/afkir dan pindah kandang. Fitur tersedia di portal tim web dan source native Android/iOS lokal.

## Cara menggunakan

1. Buka portal tim sebagai **Pemilik (OW)** atau **Manajer Operasional (OM)**.
2. Buka **Master kandang**. Lengkapi kapasitas, populasi awal dan depo hasil panen pada kandang aktif.
3. Pilih **Catat mutasi ayam**.
4. Pilih jenis: **Ayam masuk**, **Ayam keluar / afkir**, atau **Pindah kandang**.
5. Isi tanggal, kandang yang sesuai, jumlah ekor bulat positif, serta alasan/referensi pembelian, afkir atau perpindahan.
6. Untuk ayam masuk, pilih tujuan; untuk keluar, pilih asal; untuk pindah, pilih asal dan tujuan berbeda.
7. Konfirmasi. Periksa saldo populasi serta **Riwayat mutasi ayam** di bawah daftar kandang.

Contoh: Kandang D awal 100 ekor. Pembelian 20 → 120; pindah 15 ke E → D 105 dan E bertambah 15; afkir 5 → D 100; mortalitas produksi 2 → D 98. Perpindahan tidak mengubah jumlah gabungan kedua kandang.

Pada native: **Kelola → Master kandang → Catat mutasi ayam**. Pilihan asal diabaikan untuk ayam masuk; pilihan tujuan diabaikan untuk ayam keluar. Riwayat disimpan di SQLite dan ikut backup JSON. Mode lokal tetap pribadi; tidak otomatis sinkron ke portal tim.

## Peran dan akses

| Fungsi | OW | OM | FA | AU | Role lain |
| --- | --- | --- | --- | --- | --- |
| Baca master dan populasi | Ya | Sesuai cakupan | Sesuai penugasan | Sesuai cakupan | Tidak |
| Catat masuk/keluar/pindah ayam | Ya | Sesuai cakupan | Tidak | Tidak | Tidak |
| Baca riwayat mutasi | Ya | Sesuai cakupan | Sesuai penugasan | Sesuai cakupan | Tidak |
| Tugaskan operator | Ya | Tidak | Tidak | Tidak | Tidak |

Permission baru **flock.manage** diberikan hanya kepada OW/OM. Server memeriksa kandang dan depo untuk kedua sisi transfer, termasuk cakupan Semua kandang yang tetap dibatasi depo. Pembaca yang hanya mendapat satu sisi mutasi dapat melihat dampak pada kandangnya; ID/nama sisi lain dan catatan dibatasi. Pencatatan mutasi langsung oleh OW/OM belum memakai alur maker–approver. Penugasan tersebut harus sesuai kebijakan usaha.

## Aturan saldo dan histori

**Populasi tercatat = populasi awal + masuk − keluar + transfer masuk − transfer keluar − mortalitas produksi.**

- Jumlah bulat positif, maksimal 10 juta ekor. Ayam keluar tidak boleh melebihi saldo; ayam masuk tidak boleh melebihi kapasitas.
- Kedua sisi transfer disimpan dalam satu command/CAS. Konflik revisi menolak seluruh perubahan; muat ulang lalu periksa riwayat sebelum mencoba kembali.
- Kandang harus aktif dengan kapasitas, populasi awal dan depo lengkap. Kandang tujuan transfer harus berbeda dari asal.
- Tanggal menggunakan Asia/Jakarta. Tanggal masa depan dan tanggal sebelum transaksi produksi/mutasi terakhir pada kandang terkait ditolak. Tanggal yang sama diperbolehkan; riwayat menampilkan urutan pencatatan.
- Setelah mutasi, pencatatan produksi sebelum tanggal mutasi terakhir kandang ditolak. Ini menjaga agar ayam yang baru masuk tidak dipakai untuk membenarkan mortalitas periode sebelumnya.
- Populasi awal dan depo terkunci setelah ada produksi atau mutasi. Kapasitas dapat diubah selama tidak kurang dari populasi awal dan tidak melanggar saldo harian dari riwayat.
- Nama lama tetap menjadi snapshot riwayat meskipun master diganti nama.
- Tidak ada edit atau hapus mutasi. Koreksi dilakukan melalui transaksi pembalik dengan alasan dan referensi ID transaksi lama, lalu catat transaksi yang benar. Pembalik tetap harus memenuhi saldo, kapasitas dan tanggal; kasus yang terhalang harus direkonsiliasi bersama penanggung jawab, jangan mengubah JSON produksi langsung.
- Mortalitas tetap dicatat melalui produksi harian; jangan mencatat kematian yang sama lagi sebagai ayam keluar.
- Ini saldo pencatatan, bukan sensus fisik otomatis. Belum ada master flock/breed, umur ayam, harga pembelian ayam, dokumen afkir, biaya otomatis atau sinkronisasi perangkat.
- Status kandang/mutasi ayam tidak mengubah stok telur, kualitas batch, pesanan ataupun pembayaran.

## Teknis dan implementasi

Field opsional **State.flockMovements** bersifat additive pada schema transaksi 2. Setiap record berisi id, date, kind, fromHouseId/toHouseId, snapshot fromName/toName, quantity, note. Riwayat maksimal 10.000 record per salinan data; batas payload workspace yang sudah ada tetap berlaku. Domain bersama pada mobile/src/domain.ts dan web/shared/native-domain.ts identik.

Server menyediakan command **flock.create** melalui POST /api/team/action. ID dibuat server, requestId mencegah pengulangan request, expectedRevision menjaga CAS, dan actor/action dicatat dalam log aktivitas tim. Tidak ada endpoint hapus mutasi dan tidak ada tabel SQL baru. Record mutasi masuk ke payload workspace yang sudah ada. Audit transaksi lokal dan log aktivitas tim mengikuti batas retensi yang sudah ada; bukan arsip audit eksternal permanen.

Backup lama tanpa field mutasi tetap dapat dibaca tanpa mengubah nilainya. Ekspor transaksi tim/native baru mencakup mutasi; pulihkan hanya melalui aplikasi versi 5.3 atau lebih baru yang mendukung ledger. Jangan membuka lalu menyimpan backup baru dengan versi lama. Backup transaksi tim tetap tidak memuat ACL/anggota/persetujuan; pemulihan tim penuh memerlukan backup D1.

Langkah rollout: backup database → uji source di staging → deploy web → muat ulang portal → lengkapi master lama → cocokkan saldo awal dengan catatan fisik → catat mutasi uji terkontrol → distribusikan build native sesudah signing dan UAT perangkat. Pemisahan data web pribadi, portal tim, dan native tetap berlaku. Audience hosting tetap privat; undangan aplikasi tidak mengubah akses hosting.

## Verifikasi rilis

- 112 assertion server baru: RBAC, scope kedua sisi, redaksi, saldo, kapasitas, tanggal, snapshot, baseline terkunci, replay, backup dan CAS bersamaan.
- 116 assertion Master Kandang 5.2 dan 206 assertion RBAC 5.1 lulus.
- TypeScript dan 266 tes native lulus, termasuk tujuh tes ledger populasi baru.
- Regresi web/server SQLite dan validasi Worker ESM lulus.
- Browser preview lokal: buat ruang kerja, tambah kandang, catat ayam masuk 20, saldo berubah 100 → 120 dan riwayat tersimpan; tampilan diperiksa.
- Ekspor bundle Android/iOS berhasil. Native 5.3.0, Android versionCode 20, iOS build 20. Ini source/bundle, **bukan APK/AAB/IPA siap instal**.
- UAT seluruh role UI di hosting, perangkat fisik, GPS, berbagi dan pemulihan masih perlu dilakukan sebelum penggunaan produksi penuh.

## Pemeriksaan source

Dari web setelah dependency mobile dipasang:

```sh
node scripts/build-team-domain.cjs ../mobile/node_modules/typescript
python3 scripts/embed-worker.py
npm run build
node tests/v53-flock.mjs
node tests/v52-houses.mjs
node tests/v51-rbac.mjs
node tests/v3-operations.cjs
node tests/v3-server.mjs
npm run validate
```

Dari mobile: npm run typecheck dan npm test. Paket lengkap menyertakan script verifikasi checksum dan check-all.sh.
