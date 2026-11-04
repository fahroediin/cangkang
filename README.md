# PamanKu 6.0.0 — Source Code Lengkap

Ringkasan operasional kandang per periode: telur baik/rusak, pakan, mortalitas, hari tercatat, rata-rata dan CSV. Populasi memakai saldo kini; bukan populasi historis atau indikator hen-day. Data tidak lengkap diberi tanda, bukan dianggap nol. Seluruh fitur transaksi/persetujuan/filter favorit v5.9 dipertahankan.

Acuan: documentation/Panduan-PamanKu-v6.0.md. Baseline terdahulu adalah riwayat.

## Mulai

1. `python3 scripts/verify-checksums.py`
2. Gunakan Node24 dengan node:sqlite, npm dan Python3.
3. `cd mobile` lalu `npm ci`; kembali ke akar paket.
4. `bash scripts/check-all.sh`
5. `cd web` lalu `npm run dev`; buka http://localhost:3000/team.html.
6. Demo terpandu, dua mode dari folder `web` (keduanya di http://localhost:3000/demo, 16 langkah 0–15 yang sama):
   - `npm run demo`: **Panduan Demo**, panel ringkas satu baris berisi tombol langkah, Sebelumnya/Berikutnya dan **Catatan** (kolom tulis masukan per langkah). Naskah pembawa: documentation/Rundown-Demo-PamanKu-v6.0.md.
   - `npm run fgd`: **Panduan FGD** format FIF dengan tujuan, pertanyaan berkode, kolom Perlu diubah / Sudah diubah dan unduh catatan. Rundown: documentation/Rundown-FGD-PamanKu-v6.0.md.

   Konfigurasi, langkah dan pertanyaan ada di web/demo. Data contoh (2 usaha untuk menunjukkan multi-tenant, 3 kandang dengan produksi 29 hari, 5 pesanan hari ini pada tahap berbeda, 1 keluhan) dibuat ulang setiap start; catatan tersimpan terpisah di web/demo/catatan-demo.json dan web/demo/catatan-fgd.json sampai dikosongkan. Tambahkan `-- --empty` untuk mulai kosong.
7. Deploy ke Cloudflare (Workers + D1, login lewat Cloudflare Access): ikuti web/cloudflare/DEPLOY-CLOUDFLARE.md. `npm run cf:test` menguji gerbang login, `npm run cf:migrate` membuat tabel D1, `npm run cf:deploy` mengunggah. Tanpa ACCESS_TEAM_DOMAIN dan ACCESS_AUD aplikasi menolak semua akses.
8. Publish /demo saja ke Cloudflare (Worker dan D1 terpisah `pamanku-demo`, data contoh, dilindungi Cloudflare Access): ikuti web/cloudflare/DEPLOY-DEMO-CLOUDFLARE.md. `npm run cf:demo:reset` wajib dijalankan sebelum setiap sesi.

Development memakai SQLite in-memory dan identitas dummy. Restart menghapus data uji; jangan gunakan sebagai produksi. Untuk instalasi baru, siapkan staging, binding D1 dan gateway identitas. Jangan percaya header identitas client di hosting umum. Manifest distribusi tidak membawa project_id produksi. Tidak ada rahasia, dependency terpasang atau runtime data dalam paket.

## Kompilasi dan data

check-all membangun shared domain, flock-report dan house-performance, kemudian embed-worker/build/validasi dan regresi. Modul transaksi/laporan/performance identik dengan mobile/src. Endpoint GET /api/team/performance memerlukan house.read + production.read dan menghitung hanya dari proyeksi berizin. CSV menggunakan data server terkini. Tidak ada DDL, reset atau schema baru.

Identitas com.telurfarm.mobile, skema URL telurfarm, proyek Xcode TelurFarm, SQLite, tabel D1, key browser dan tag backup lama tetap dipertahankan. Ekspor transaksi bukan backup lengkap tim/preferensi; pemulihan penuh memerlukan backup D1 atau penyimpanan aplikasi perangkat.

## Native

React Native6.0.0, Android versionCode27, iOS build27. Kelola → Master kandang menyediakan ringkasan dan CSV lokal. SQLite belum tersinkron otomatis dengan web. Persetujuan multiuser melalui portal browser. APK/AAB/IPA belum dibangun; debug signing hanya development.

## Verifikasi

137 assertion server v6.0, seluruh regresi web, TypeScript dan309 tes native lulus. Bundle Expo Android/iOS diekspor. Browser lokal: menu/ringkasan kosong, periode/kandang dan tombol CSV server berhasil. UAT hosting semua peran/perangkat nyata, share/restore dan build biner belum dilakukan.

## Status publikasi

Source v6.0 siap; publikasi web tertahan oleh HTTP500 layanan repositori. Aplikasi online terakhir terverifikasi v5.9. Lihat documentation/Status-Publikasi-PamanKu-v6.0.md.
