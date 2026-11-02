# Rundown Demo PamanKu v6.0 · Operasional Peternakan Ayam Petelur

Naskah pembawa untuk Panduan Demo. Panel di layar hanya berisi tombol langkah, Sebelumnya/Berikutnya dan Catatan, jadi tujuan, poin bicara dan instruksi klik ada di naskah ini (sumber: steps.json).

## Persiapan

1. Dari folder web jalankan `npm run demo` (aplikasi dan proxy sekaligus).
2. Buka http://localhost:3000/demo lalu klik **Mulai Panduan Demo ▶**.
3. Panel menempel di bawah layar dalam satu baris: tombol nomor **0, 1, 2, …** untuk lompat langkah, **‹ Sebelumnya / Berikutnya ›** atau panah kiri/kanan untuk berurutan, dan **×** untuk menutup. Bagian layar yang dibahas otomatis disorot.
4. Pegang naskah ini di samping laptop: tujuan, poin bicara dan instruksi klik tiap langkah tidak tampil di layar.
5. Klik **Catatan** untuk membuka kolom tulis masukan langkah itu; jumlahnya muncul sebagai badge di nomor langkah. Unduh .md / .csv dari kolom itu atau dari halaman /demo.
6. Uji coba sekali dari awal sampai akhir sebelum hari-H, lalu restart agar data kembali bersih dan hapus file catatan uji.
7. Pertanyaan (bila ada) ada di naskah ini, tidak di layar.
8. Peserta yang mencoba sendiri: WiFi yang sama, buka http://<IP-laptop>:3000/demo, pilih peran di **Masuk bebas sebagai peran**.

Durasi: 90 menit.

## Pemeran

| Peran | Nama | Kelompok |
|---|---|---|
| OW | Bu Sari (Pemilik) | Peternakan Demo Banten |
| OM | Pak Budi (Manajer Operasional) | Peternakan Demo Banten |
| FA | Joko (Operator Farm) | Peternakan Demo Banten |
| QC | Rina (Petugas Mutu) | Peternakan Demo Banten |
| DP | Agus (Operator Depo) | Peternakan Demo Banten |
| SL | Dewi (Penjualan) | Peternakan Demo Banten |
| FN | Lina (Keuangan) | Peternakan Demo Banten |
| DS | Hendra (Koordinator Distribusi) | Peternakan Demo Banten |
| DR | Udin (Kurir) | Peternakan Demo Banten |
| CS | Maya (Layanan Pelanggan) | Peternakan Demo Banten |
| AU | Pak Teguh (Auditor, 2 usaha) | Peternakan Demo Banten |
| SA | Admin Sistem | Peternakan Demo Banten |
| CU | Toko Berkah (Pelanggan) | Peternakan Demo Banten |
| OW | Pak Hasan (Pemilik usaha lain) | Peternakan Maju Serang |
| FA | Rudi (Operator Farm usaha lain) | Peternakan Maju Serang |

## Ringkasan rundown

| # | Menit | Langkah | Pembawa | Masuk sebagai | Pertanyaan |
|---|---|---|---|---|---|
| 0 | 0–5 | Pembukaan | Fasilitator | Bu Sari (Pemilik) |  |
| 1 | 5–9 | Satu aplikasi, banyak usaha | Fasilitator | Pak Hasan (Pemilik usaha lain) | K1 |
| 2 | 9–13 | Satu orang di dua usaha | Fasilitator | Pak Teguh (Auditor, 2 usaha) | D2 |
| 3 | 13–20 | Siapa mengerjakan apa | Fasilitator | Bu Sari (Pemilik) | D1, D2 |
| 4 | 20–30 | Catat produksi harian | Fasilitator | Joko (Operator Farm) | A1, A2, A3 |
| 5 | 30–37 | Periksa mutu batch | Fasilitator | Rina (Petugas Mutu) | B1, B2 |
| 6 | 37–47 | Ringkasan kandang per periode (baru di v6) | Fasilitator | Bu Sari (Pemilik) | B3, P2-02 |
| 7 | 47–53 | Pesanan dan harga | Fasilitator | Dewi (Penjualan) | C1, C2 |
| 8 | 53–58 | Depo menimbang dan mengemas | Fasilitator | Agus (Operator Depo) | B2 |
| 9 | 58–62 | Tugaskan kurir | Fasilitator | Hendra (Koordinator Distribusi) | C6 |
| 10 | 62–66 | Kurir mencatat penerima | Fasilitator | Udin (Kurir) | K2 |
| 11 | 66–71 | Keuangan mencatat pelunasan | Fasilitator | Lina (Keuangan) | C3 |
| 12 | 71–75 | Keluhan pelanggan | Fasilitator | Maya (Layanan Pelanggan) | C4 |
| 13 | 75–78 | Akun pelanggan | Fasilitator | Toko Berkah (Pelanggan) | C5 |
| 14 | 78–82 | Jejak aktivitas | Fasilitator | Bu Sari (Pemilik) | D3 |
| 15 | 82–90 | Ukuran berhasil dan penutup | Fasilitator | Bu Sari (Pemilik) | E1, E2, E3, D4 |

## 0. Pembukaan (menit 0–5)

**Tujuan:** Sepakati tujuan sesi: memastikan alur dari kandang sampai pembayaran sesuai cara kerja peternakan, dan mencatat apa yang perlu diubah.

**Masuk sebagai:** Bu Sari (Pemilik) · Peternakan Demo Banten · **Dibawakan:** Fasilitator

**Tampilkan:**
- Web: Ringkasan ruang kerja Peternakan Demo Banten
- Kartu Pesanan terlihat, Batch terlihat, Permintaan menunggu

**Sampaikan (pembawa):**
- PamanKu mencatat kandang, produksi, mutu, stok depo, pesanan, pengiriman, pembayaran dan keluhan.
- Kita masuk sebagai Bu Sari, pemilik. Setiap langkah berganti orang sesuai tugasnya.

**Lakukan (pembawa):** Tunjukkan nama ruang kerja di kiri atas dan kartu ringkasan.

**Catatan:** ______________________________

## 1. Satu aplikasi, banyak usaha (menit 5–9)

**Tujuan:** Pastikan peserta paham bahwa setiap usaha punya ruang kerja sendiri dan datanya tidak terlihat oleh usaha lain.

**Masuk sebagai:** Pak Hasan (Pemilik usaha lain) · Peternakan Maju Serang · **Dibawakan:** Fasilitator

**Tampilkan:**
- Web: Master kandang Peternakan Maju Serang (pemilik usaha lain)

**Pertanyaan:**
- **K1** Data apa yang tidak boleh dilihat peran tertentu (harga, piutang, produksi usaha lain)?

**Sampaikan (pembawa):**
- Pak Hasan pemilik usaha lain di aplikasi yang sama. Ia hanya melihat kandang SRG-1 sampai SRG-3.

**Lakukan (pembawa):** Tunjukkan tabel Master kandang: tidak ada kandang Peternakan Demo Banten.

**Catatan:** ______________________________

## 2. Satu orang di dua usaha (menit 9–13)

**Tujuan:** Sepakati apakah ada orang (auditor, konsultan, pemilik beberapa farm) yang perlu mengakses lebih dari satu usaha.

**Masuk sebagai:** Pak Teguh (Auditor, 2 usaha) · Peternakan Demo Banten · **Dibawakan:** Fasilitator

**Tampilkan:**
- Web: menu Ruang kerja berisi dua usaha
- Ringkasan kandang Peternakan Maju Serang (3.621 ekor)

**Pertanyaan:**
- **D2** Satu orang boleh memegang lebih dari satu peran? Siapa yang mengatur akses saat ada karyawan baru atau keluar?

**Sampaikan (pembawa):**
- Pak Teguh auditor untuk dua usaha. Ia hanya bisa membaca, tidak bisa mengubah transaksi.

**Lakukan (pembawa):** Klik menu Ruang kerja untuk menunjukkan dua usaha, lalu pilih Peternakan Demo Banten dan bandingkan Populasi kini (2.801 ekor).

**Catatan:** ______________________________

## 3. Siapa mengerjakan apa (menit 13–20)

**Tujuan:** Petakan 13 peran di aplikasi ke orang-orang di peternakan, dan temukan peran yang kurang atau tidak perlu.

**Masuk sebagai:** Bu Sari (Pemilik) · Peternakan Demo Banten · **Dibawakan:** Fasilitator

**Tampilkan:**
- Web: Anggota dan akses (peran, cakupan depo dan kandang)

**Pertanyaan:**
- **D1** Siapa saja yang terlibat dari kandang sampai pembayaran? Ada peran yang belum terwakili, atau yang tidak diperlukan?
- **D2** Satu orang boleh memegang lebih dari satu peran? Siapa yang mengatur akses saat ada karyawan baru atau keluar?

**Sampaikan (pembawa):**
- Pemilik mengundang anggota lewat email dan menentukan peran serta cakupan depo/kandang.
- Setiap tindakan diperiksa server, bukan hanya tombol yang disembunyikan.

**Lakukan (pembawa):** Gulir daftar anggota dan peran.

**Catatan:** ______________________________

## 4. Catat produksi harian (menit 20–30)

**Tujuan:** Pastikan form produksi harian berisi angka yang memang dicatat di kandang, dan sepakati siapa serta kapan mencatat.

**Masuk sebagai:** Joko (Operator Farm) · Peternakan Demo Banten · **Dibawakan:** Fasilitator

**Tampilkan:**
- Web: Ringkasan Operator Farm, tombol Catat produksi
- Form: telur baik, berat, telur rusak, pakan, kematian

**Pertanyaan:**
- **A1** Ceritakan satu hari kerja di kandang kemarin, dari ambil telur pagi sampai lapor sore. Dicatat di mana saja?
- **A2** Angka apa yang dicatat per kandang setiap hari (telur baik, berat, retak, pakan, mati)? Ada yang belum ada di form?
- **A3** Siapa yang mencatat, dan jam berapa data harian dianggap final?

**Sampaikan (pembawa):**
- Joko mencatat hasil harian per kandang. Satu kandang hanya sekali per tanggal; sistem menolak duplikat.

**Lakukan (pembawa):** Klik Catat produksi → pilih KDG-A · Kandang A → isi 820 butir, 51 kg, rusak 6, pakan 105, kematian 0 → Konfirmasi.

**Catatan:** ______________________________

## 5. Periksa mutu batch (menit 30–37)

**Tujuan:** Sepakati aturan mutu: siapa memeriksa, kapan batch boleh dijual, dan batas simpan di depo.

**Masuk sebagai:** Rina (Petugas Mutu) · Peternakan Demo Banten · **Dibawakan:** Fasilitator

**Tampilkan:**
- Web: Batch dan stok, batch berstatus Karantina

**Pertanyaan:**
- **B1** Bagaimana telur diperiksa sebelum dijual? Siapa yang memutuskan lolos, karantina atau diblokir?
- **B2** Berapa lama telur boleh disimpan di depo sebelum batas jual?

**Sampaikan (pembawa):**
- Setiap produksi otomatis menjadi batch Karantina. Pemeriksa harus orang yang berbeda dari pencatat produksi.

**Lakukan (pembawa):** Cari batch Karantina → klik Periksa mutu → Varian: Telur reguler, Kualitas: Aktif → Konfirmasi.

**Catatan:** ______________________________

## 6. Ringkasan kandang per periode (baru di v6) (menit 37–47)

**Tujuan:** Tentukan angka ringkasan yang dipakai pemilik setiap minggu, dan cara menangani hari tanpa catatan.

**Masuk sebagai:** Bu Sari (Pemilik) · Peternakan Demo Banten · **Dibawakan:** Fasilitator

**Tampilkan:**
- Web: Ringkasan kandang 30 hari: populasi, telur baik, pakan dan mortalitas, kelengkapan catatan
- Kandang C: 8 hari tanpa catatan ditandai, tidak dianggap nol

**Pertanyaan:**
- **B3** Dari ringkasan kandang, angka mana yang benar-benar dipakai pemilik untuk mengambil keputusan setiap minggu?
- **P2-02** Laporan apa yang diminta pemilik tiap minggu dan bulan?

**Sampaikan (pembawa):**
- Rasio pakan per kg telur dihitung dari catatan, belum FCR biologis. Bisa diekspor ke CSV.

**Lakukan (pembawa):** Tunjukkan kartu Kelengkapan catatan, lalu baris KDG-C di tabel. Opsional: Ekspor CSV ringkasan.

**Catatan:** ______________________________

## 7. Pesanan dan harga (menit 47–53)

**Tujuan:** Pastikan kategori pelanggan, harga dan cara pesanan masuk sesuai kebiasaan penjualan.

**Masuk sebagai:** Dewi (Penjualan) · Peternakan Demo Banten · **Dibawakan:** Fasilitator

**Tampilkan:**
- Web: Pesanan, lima pesanan di tahap berbeda (Diproses, Dalam pengiriman, Selesai)

**Pertanyaan:**
- **C1** Kategori pelanggan apa saja (perorangan, wholesale, hotel), dan siapa yang menetapkan harga?
- **C2** Pesanan hari ini masuk lewat apa (telepon, WhatsApp, datang langsung)? Siapa yang mencatatnya?

**Sampaikan (pembawa):**
- Stok diambil otomatis dari batch yang sudah lolos mutu di depo yang dipilih.

**Lakukan (pembawa):** Tunjukkan status tiap pesanan. Tombol Buat pesanan ada di Ringkasan.

**Catatan:** ______________________________

## 8. Depo menimbang dan mengemas (menit 53–58)

**Tujuan:** Sepakati bukti timbang di depo: apakah berat dan butir fisik plus catatan pemeriksaan sudah cukup.

**Masuk sebagai:** Agus (Operator Depo) · Peternakan Demo Banten · **Dibawakan:** Fasilitator

**Tampilkan:**
- Web: Pesanan Katering Bunda (Depo Cilegon), tombol Hitung dan timbang

**Pertanyaan:**
- **B2** Berapa lama telur boleh disimpan di depo sebelum batas jual?

**Sampaikan (pembawa):**
- Berat fisik harus sesuai pesanan dan diambil dari batch yang layak jual.

**Lakukan (pembawa):** Pada Katering Bunda klik Hitung dan timbang → berat dan butir sudah terisi → isi Catatan pemeriksaan, mis. Kemasan baik → Konfirmasi.

**Catatan:** ______________________________

## 9. Tugaskan kurir (menit 58–62)

**Tujuan:** Petakan cara pembagian pengiriman ke kurir per depo hari ini.

**Masuk sebagai:** Hendra (Koordinator Distribusi) · Peternakan Demo Banten · **Dibawakan:** Fasilitator

**Tampilkan:**
- Web: Pesanan Rumah Makan Sederhana, tombol Tugaskan kurir

**Pertanyaan:**
- **C6** Berapa kurir dan kendaraan per depo? Rute ditentukan siapa?

**Sampaikan (pembawa):**
- Hendra hanya bisa memilih kurir yang bertugas di depo pesanan itu.

**Lakukan (pembawa):** Pada Rumah Makan Sederhana klik Tugaskan kurir → pilih Udin (Kurir) → Konfirmasi.

**Catatan:** ______________________________

## 10. Kurir mencatat penerima (menit 62–66)

**Tujuan:** Pastikan bukti terima yang dicatat kurir cukup untuk penagihan.

**Masuk sebagai:** Udin (Kurir) · Peternakan Demo Banten · **Dibawakan:** Fasilitator

**Tampilkan:**
- Web: Pesanan milik kurir Udin saja; nilai tagihan disembunyikan

**Pertanyaan:**
- **K2** HP apa yang dipakai di kandang dan depo, dan bagaimana sinyalnya?

**Sampaikan (pembawa):**
- Pesanan Rumah Makan Sederhana dari langkah sebelumnya langsung muncul di daftar Udin.

**Lakukan (pembawa):** Pada Warung Bu Ani (Dalam pengiriman) klik Catat penerima → isi Bu Ani → Konfirmasi. Status menjadi Selesai.

**Catatan:** ______________________________

## 11. Keuangan mencatat pelunasan (menit 66–71)

**Tujuan:** Sepakati aturan tempo, cara mencatat pembayaran, dan penagihan piutang.

**Masuk sebagai:** Lina (Keuangan) · Peternakan Demo Banten · **Dibawakan:** Fasilitator

**Tampilkan:**
- Web: Pesanan Hotel Pantai Anyer dengan saldo Rp450.000
- Menu Keuangan: pembayaran tercatat

**Pertanyaan:**
- **C3** Pembayaran tempo berapa lama, dan bagaimana piutang ditagih?

**Sampaikan (pembawa):**
- Pembayaran tidak bisa melebihi sisa tagihan dan wajib punya referensi transfer.

**Lakukan (pembawa):** Pada Hotel Pantai Anyer klik Catat pembayaran → jumlah 450000 → referensi mis. TRF-BCA-0001 → Konfirmasi. Saldo menjadi Rp0.

**Catatan:** ______________________________

## 12. Keluhan pelanggan (menit 71–75)

**Tujuan:** Petakan keluhan yang sering terjadi dan bentuk kompensasi yang disetujui.

**Masuk sebagai:** Maya (Layanan Pelanggan) · Peternakan Demo Banten · **Dibawakan:** Fasilitator

**Tampilkan:**
- Web: Keluhan "3 butir retak saat diterima" dari Toko Berkah

**Pertanyaan:**
- **C4** Keluhan apa yang paling sering, dan kompensasinya apa (ganti barang, potong tagihan, refund)?

**Sampaikan (pembawa):**
- Kompensasi berupa nota kredit atau refund perlu persetujuan, bukan langsung dicairkan.

**Lakukan (pembawa):** Pada keluhan 3 butir retak klik Tutup kasus → isi penyelesaian, mis. Diganti pada pengiriman berikutnya → Konfirmasi.

**Catatan:** ______________________________

## 13. Akun pelanggan (menit 75–78)

**Tujuan:** Putuskan apakah pelanggan tetap diberi akun untuk memesan dan memantau pesanannya.

**Masuk sebagai:** Toko Berkah (Pelanggan) · Peternakan Demo Banten · **Dibawakan:** Fasilitator

**Tampilkan:**
- Web: Toko Berkah hanya melihat pesanannya sendiri

**Pertanyaan:**
- **C5** Pelanggan tetap perlu akun sendiri untuk memesan, atau cukup lewat penjualan?

**Sampaikan (pembawa):**
- Pelanggan tidak melihat pesanan pelanggan lain.

**Lakukan (pembawa):** Tunjukkan hanya ada satu pesanan.

**Catatan:** ______________________________

## 14. Jejak aktivitas (menit 78–82)

**Tujuan:** Sepakati siapa yang memeriksa jejak aktivitas dan seberapa sering.

**Masuk sebagai:** Bu Sari (Pemilik) · Peternakan Demo Banten · **Dibawakan:** Fasilitator

**Tampilkan:**
- Web: Aktivitas, tindakan dari langkah-langkah barusan (order.pack, payment.post, case.resolve)

**Pertanyaan:**
- **D3** Siapa yang perlu melihat jejak aktivitas, dan seberapa sering diperiksa?

**Sampaikan (pembawa):**
- Setiap tindakan tercatat: akun siapa, kapan, dan tindakan apa.

**Lakukan (pembawa):** Tunjukkan baris aktivitas teratas.

**Catatan:** ______________________________

## 15. Ukuran berhasil dan penutup (menit 82–90)

**Tujuan:** Sepakati ukuran berhasil, lokasi pilot dan persiapan sebelum mulai. Unduh catatan sesi.

**Masuk sebagai:** Bu Sari (Pemilik) · Peternakan Demo Banten · **Dibawakan:** Fasilitator

**Tampilkan:**
- Panel ini: Ringkasan catatan sesi dan tombol Unduh

**Pertanyaan:**
- **E1** Tiga bulan berjalan, apa tanda aplikasi ini berhasil (mis. catatan harian lengkap 95%, piutang turun)?
- **E2** Kandang atau depo mana yang cocok jadi pilot? Kenapa?
- **E3** Apa yang harus disiapkan sebelum mulai: perangkat, pelatihan, atau data awal?
- **D4** Data lama (buku, Excel) mana yang perlu dimasukkan sebelum mulai?

**Sampaikan (pembawa):**
- Bacakan ringkasan catatan, konfirmasi yang sudah disepakati, lalu unduh catatan.

**Lakukan (pembawa):** Klik Unduh catatan (.md) dan Unduh (.csv).

**Catatan:** ______________________________

## Pertanyaan lain

- **P2-01** Pernah memakai aplikasi lain lalu berhenti? Kenapa?
- **P2-03** Mutasi ayam (masuk, pindah, afkir) perlu dibahas di sesi ini atau sesi terpisah?

## Catatan untuk pembawa

- Dua mode dari folder web: npm run demo (Panduan Demo: tombol langkah, Sebelumnya/Berikutnya, Catatan) dan npm run fgd (Panduan FGD format FIF). Data demo dibuat ulang setiap start; catatan tetap tersimpan di demo/catatan-demo.json dan demo/catatan-fgd.json sampai dikosongkan.
- Pesanan contoh semuanya bertanggal hari ini karena sistem tidak menerima tanggal kirim di masa lalu.
- Tampilan di HP masih perlu digeser ke samping; presentasi utama pakai laptop.
- Pada pesanan selesai, tombol seperti Mulai pengiriman masih tampil; bila diklik, server menolak. Ini perilaku aplikasi saat ini.
- Halaman Aktivitas menampilkan ID akun (mis. demo-fn), belum nama orang.
- Form Hitung dan timbang mewajibkan Catatan pemeriksaan.
