# TelurFarm 5.4 — Persetujuan Mutasi Populasi

27 Oktober 2026. Melanjutkan ledger populasi 5.3 dengan pemisahan pembuat dan pemeriksa pada portal tim. Ayam masuk, keluar/afkir dan pindah kandang mengikuti **Ajukan → Setujui/Tolak → Jalankan**. Saldo hanya berubah pada tahap Jalankan.

## Cara menggunakan portal tim

1. Pastikan terdapat sedikitnya dua anggota aktif yang sesuai: pembuat (FA/OM/OW) dan pemeriksa (OM/OW) yang berbeda. OW menyiapkan penugasan melalui Anggota dan akses. Undangan aplikasi tetap berbeda dari izin masuk hosting; rilis ini tidak memperluas audience hosting privat.
2. Lengkapi master kandang: aktif, depo hasil panen, kapasitas dan populasi awal. Pembuat, pemeriksa dan pelaksana harus memiliki akses kandang serta depo terkait. Transfer memerlukan akses kedua sisi.
3. Sebagai pembuat, buka **Master kandang → Ajukan mutasi ayam**, atau **Persetujuan → Ajukan Mutasi populasi ayam**.
4. Pilih masuk, keluar/afkir atau pindah; isi tanggal, asal/tujuan yang sesuai, jumlah ekor dan alasan/referensi. Konfirmasi pengajuan. Saldo belum berubah dan ayam belum direservasi.
5. Sebagai pengelola berbeda, buka **Persetujuan**. Periksa ringkasan jenis, tanggal, kandang, jumlah dan alasan. Pilih **Setujui** atau **Tolak**, isi alasan keputusan, lalu konfirmasi. Persetujuan belum mengubah saldo.
6. Sebagai OW/OM yang berwenang, pilih **Jalankan** pada pengajuan disetujui. Pemeriksa boleh sekaligus menjadi pelaksana; tidak diwajibkan orang ketiga. Pembuat OM/OW juga boleh menjalankan setelah disetujui orang berbeda. FA tidak dapat menjalankan.
7. Periksa saldo dan **Riwayat mutasi ayam**. Mutasi baru menampilkan referensi pengajuan dan pemeriksa. Detail pengajuan menyimpan status, pembuat, pemeriksa, alasan keputusan, pelaksana dan waktu pelaksanaan.

Contoh: FA mengajukan masuk 20 ayam ke kandang dengan saldo 100. Status Menunggu: saldo 100. OW menyetujui: saldo 100. OM menjalankan: saldo 120 dan satu mutasi tercatat.

## Matriks fungsi tambahan

| Fungsi | OW | OM | FA | AU | SA dan role lain |
| --- | --- | --- | --- | --- | --- |
| Ajukan mutasi | Ya | Sesuai cakupan | Sesuai penugasan | Tidak | Tidak |
| Setujui/tolak pengajuan orang lain | Ya | Sesuai cakupan | Tidak | Tidak | Tidak |
| Jalankan pengajuan disetujui | Ya | Sesuai cakupan | Tidak | Tidak | Tidak |
| Tarik pengajuan sendiri, menunggu/disetujui | Ya | Ya | Ya | Tidak | Tidak |
| Baca master/populasi/ledger | Ya | Sesuai cakupan | Sesuai penugasan | Sesuai cakupan | Tidak |
| Baca antrean pengajuan | Sesuai cakupan | Sesuai cakupan | Pengajuan sendiri sesuai cakupan | Tidak | Tidak |

Permission **flock.request** untuk OW/OM/FA; **flock.approve** dan **flock.execute** hanya OW/OM. Permission lama flock.manage dan command langsung flock.create tidak dapat dipakai untuk melewati persetujuan pada portal tim. Auditor membaca ledger sesuai scope, termasuk referensi persetujuan yang boleh terlihat; auditor tidak mendapat antrean pengajuan.

## Penolakan, penarikan dan data berubah

- Pembuat tidak boleh menyetujui atau menolak pengajuannya sendiri, termasuk Pemilik. Akun tunggal perlu pengelola kedua agar alur dapat diselesaikan.
- Penolakan dan penarikan tidak mengubah populasi. Pengajuan ditolak/ditarik tidak bisa dijalankan atau diaktifkan kembali; buat pengajuan baru.
- Data disetujui berasal dari parameter yang disimpan server. Parameter tambahan pada command pelaksanaan tidak mengganti jumlah, kandang atau alasan yang sudah diperiksa.
- Perubahan master, produksi atau mutasi pada kandang terkait membuat pengajuan lama tidak berlaku untuk persetujuan/pelaksanaan. Tarik pengajuan sendiri, muat ulang data dan ajukan ulang; tidak ada penyegaran persetujuan otomatis.
- Pengajuan tidak mereservasi ayam atau kapasitas. Dua permintaan bisa sama-sama valid ketika diajukan; setelah salah satunya dijalankan, permintaan kedua harus diperiksa terhadap sumber terbaru melalui pengajuan baru.
- Hak pembuat dan pemeriksa diperiksa kembali saat pelaksanaan. Pencabutan anggota atau penyempitan scope dapat menghalangi proses meskipun sebelumnya disetujui. Data di luar scope tidak dibuka untuk menyelesaikan permintaan lama.
- Konflik penulisan bersamaan menolak seluruh transaksi. Muat ulang dan periksa status sebelum mencoba lagi. Pengulangan request identik tidak menerapkan perpindahan dua kali.
- Tidak ada hapus/edit mutasi yang telah dijalankan. Transaksi pembalik harus menjadi pengajuan baru, menyertakan alasan/referensi sebelumnya dan memenuhi saldo, kapasitas serta tanggal.

Aturan populasi 5.3 tetap berlaku: jumlah bulat positif, kandang aktif dan metadata lengkap, tidak boleh saldo negatif atau melebihi kapasitas, tanggal Asia/Jakarta tidak di masa depan dan tidak mendahului transaksi terakhir kandang. Mortalitas dicatat melalui produksi; jangan menghitung kematian yang sama sebagai ayam keluar lagi.

## Native Android/iOS

Source native naik ke **5.4.0**, Android versionCode **21**, iOS build **21**. **Kelola → Master kandang → Buka persetujuan tim online** membuka portal melalui browser sistem untuk alur multiuser server.

Tombol **Catat mutasi ayam lokal** tetap untuk SQLite pribadi tanpa login multiuser atau persetujuan. Data lokal dan tim terpisah; pengajuan lokal tidak otomatis dikirim ke server. Untuk kontrol persetujuan tim, gunakan portal. Tidak ada antrean persetujuan offline atau sinkronisasi otomatis pada rilis ini. APK/AAB/IPA belum dibuat; source proyek Android/iOS dan script build disertakan.

## Teknis dan migrasi

Tidak ada tabel SQL baru dan schema transaksi native tetap 2. Master, produksi dan ledger lama dipertahankan. Pengajuan memakai jenis **flock** pada requests workspace yang sudah ada. Server membuat params.newId untuk ledger, memvalidasi simulasi tanpa menulis saldo saat pengajuan, menyimpan fingerprint sumber, dan memeriksa ulang sumber serta scope sebelum eksekusi.

Metadata **flockApprovals[ledgerId]** pada payload tim berisi requestId, maker, approver, executor dan executedAt. Metadata ditautkan saat eksekusi atomik bersama ledger dan status permintaan. Riwayat sebelum 5.4 tetap terbaca dengan label tanpa referensi persetujuan; aplikasi tidak membuat persetujuan fiktif untuk data lama. Pembaca yang hanya memiliki satu sisi transfer tetap menerima redaksi sisi lain/catatan dan tidak menerima detail persetujuan transfer itu.

Ekspor transaksi native/tim mencakup ledger tetapi tidak memuat requests, ACL/anggota atau flockApprovals. Untuk backup dan pemulihan persetujuan tim lengkap, gunakan backup D1; ekspor transaksi tidak dapat memulihkan audit/persetujuan penuh. Log aktivitas operasional tetap dibatasi 1.000 tindakan terbaru; bukan arsip audit eksternal permanen. Batas 100 pengajuan terbuka dan payload 1,4 MB tetap berlaku.

Rollout: backup D1 → uji staging → pastikan dua pengelola/anggota yang sesuai memiliki akses → deploy web → muat ulang portal → uji masuk/keluar/pindah memakai pengajuan → cocokkan saldo dengan catatan fisik → lakukan signing dan UAT perangkat sebelum mendistribusikan native. Integrasi client lama yang memanggil flock.create harus diubah ke alur request.create, request.approve dan request.execute.

## Hasil verifikasi

- **269 assertion v5.4**: seluruh 13 role, penutupan command langsung, saldo tidak berubah saat menunggu/disetujui, larangan persetujuan sendiri, tolak/tarik, parameter tetap, perubahan sumber, scope terkini, pencabutan dan histori lama.
- **147 assertion regresi ledger 5.3** melalui alur persetujuan baru, termasuk kapasitas, saldo, transfer atomik, snapshot, replay, backup dan CAS bersamaan.
- **116 assertion Master Kandang** dan **206 assertion RBAC** tetap lulus.
- TypeScript dan **266 tes native** lulus. Ekspor bundle Android/iOS berhasil.
- Regresi operasi web, SQLite server dan validasi Worker ESM lulus.
- Browser preview lokal: buat workspace/kandang, ajukan masuk 20, ringkasan menunggu dan tidak ada tombol persetujuan sendiri; saldo tetap 100 diverifikasi. Tampilan diperiksa.
- Browser full multi-role pada hosting, perangkat fisik, GPS, share dan restore masih memerlukan UAT. Bukti server tidak menggantikan UAT perangkat.

## Pemeriksaan developer

Dari web: python3 scripts/embed-worker.py, npm run build, node tests/v54-flock-approval.mjs, node tests/v53-flock.mjs, node tests/v52-houses.mjs, node tests/v51-rbac.mjs, node tests/v3-operations.cjs, node tests/v3-server.mjs dan npm run validate.

Dari mobile: npm run typecheck, npm test, kemudian ekspor Expo kedua platform sesuai kebutuhan. Domain bersama mobile/src/domain.ts dan web/shared/native-domain.ts tetap identik.
