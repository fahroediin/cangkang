# Ringkasan dokumen sumber TelurFarm

Disusun 2026-10-19 dari lima berkas di `Downloads/TelurFarm/`. Angka dan istilah dikutip dari dokumen; penilaian ditandai sebagai catatan.

## 1. Notulen rapat 2026-10-14

**Pengambil keputusan:** Speaker 1, peternak dan inisiator bisnis.

**Masalah bisnis**

| Data | Nilai |
|---|---|
| Populasi ayam petelur | 10.000 ekor |
| Pelanggan saat ini | Hotel di Anyer (Marbella, Aston, dll.) |
| Harga pasar | Rp25.000 |
| Harga jual peternak | Rp23.000 - Rp24.000 |
| Harga beli tengkulak ke petani | Rp21.000 - Rp23.000 |
| HPP proyeksi pemerintah | Rp26.000 |
| Margin telur | Rp1.000 |
| Rencana perluasan lahan | 3 hektar |

**Permintaan Speaker 1:** aplikasi sederhana, "enggak usah yang harus kuat fiturnya": akses lokasi, alamat, WhatsApp, pilihan menu telur. Developer ditawari saham.

**Alur yang disepakati:** pilih jenis telur, berat/timbangan, keranjang, alamat kirim, pilih ruko/agen terdekat.

**Keputusan**
- Uji coba pemesanan dan distribusi skala kecil di Banten.
- Ruko milik Speaker 1 dipakai sebagai depo.
- Ongkir gratis selama 1 tahun.
- Saham untuk tim pengembang.

**Masih tertunda:** detail fitur, arsitektur Android/iOS, model kemitraan saham.

**Risiko yang dicatat:** tengkulak menekan harga di bawah HPP; margin tipis Rp1.000 sensitif terhadap biaya operasional; ketergantungan modal pada armada.

Topik lain di rapat (bakso, sayur, mesin air dari udara, AI hukum Rp12,5 M) di luar lingkup repo ini.

## 2. Aplikasi TelurFarm v3.1 (panduan pengguna + mockup)

### Platform

| Aspek | Web | Mobile native |
|---|---|---|
| Penyimpanan | PostgreSQL di server, per akun, ada salinan browser | Lokal per perangkat |
| Lintas perangkat | Sinkronisasi akun yang sama, batas 1,5 MB | Belum terhubung ke web |
| Lokasi | Izin browser atau koordinat | GPS atau koordinat manual |
| Pembelian rutin | Template harian/mingguan/bulanan | Jadwal 1, 2, atau 4 minggu |
| Pakan, kesehatan, HPP | Lengkap | Lebih sederhana, tanpa HPP |
| Cadangan | JSON via browser | JSON via menu berbagi, maks 5 MB |

Web: `https://xyz.devoutsys.com` (privat). Mobile: source React Native/Expo (`telurfarm-native`, package `com.telurfarm.mobile`); APK/IPA belum diserahkan, belum diuji di perangkat fisik.

### Modul

**Peternakan:** produksi harian (butir baik, kg, rusak, pakan, mortalitas), kandang dan populasi, pakan (persediaan), kesehatan ayam.

**Stok:** 3 depo (Anyer, Cilegon, Serang) dengan koordinat dan radius; batch dengan asal, tanggal panen, batas jual; varian Telur reguler / pilihan / ekonomis; status Karantina, Diblokir, Aktif; sortir sebagian jadi batch anak; transfer antar depo; koreksi opname; FEFO.

**Penjualan:** 3 kategori pembeli (Perorangan, Wholesale, Hotel/Resort) dengan harga masing-masing; satuan kg (desimal) atau butir (bulat); keranjang tidak mereservasi stok; rekomendasi depo berdasarkan lokasi tujuan, radius, stok tiap varian, dan kelayakan batch pada tanggal kirim (jarak garis lurus); pesan lagi; pembelian rutin.

**Pemenuhan:** Diproses -> Dalam pengiriman -> Selesai. Hitung dan timbang wajib sebelum kirim, kurir wajib diisi, nama penerima wajib untuk Selesai. Pembatalan hanya saat Diproses dan belum dibayar.

**Keuangan:** invoice (cetak/PDF), pembayaran manual (Transfer bank/Tunai/QRIS sebagai catatan), piutang dengan umur 0/1-30/31-60/61-90/>90 hari, biaya dan HPP per kg/butir, laporan usaha.

**Kasus:** keluhan dan retur; retur fisik masuk Karantina; nota kredit mengurangi tagihan; refund hanya mencatat dana yang sudah dikembalikan.

**Peringatan stok (baru v3.1):** stok menipis (ambang kg), mendekati batas jual (rentang hari 0-365), perlu tinjauan.

### Batas yang dinyatakan dokumen

Belum ada: login dan hak akses per peran, sinkronisasi native ke web, payment gateway, push notification, pelacakan kurir, order otomatis. Pesanan mobile tidak terkirim ke depo nyata atau server. Layar W24, W25 (login, hak akses), M07, M31, M32 (ringkasan sukses, login mobile, notifikasi) masih usulan.

### Sistem visual

| Token | Hex | Pakai |
|---|---|---|
| Coklat telur | `#704529` | Identitas, navigasi aktif, tombol utama |
| Krem | `#FAF5EB` | Latar halaman |
| Cangkang muda | `#E4CCAC` | Aksen ringan |
| Kuning telur | `#F3BF38` | Pilihan aktif, pengingat |
| Putih | `#FFFFFF` | Kartu, formulir, tabel |
| Coklat gelap | `#33251B` | Teks utama |
| Coklat lembut | `#806D5D` | Teks pendukung |
| Garis krem | `#EBDDCC` | Batas dan pemisah |

Web: sidebar. Mobile: 4 tab (Beranda, Pesan, Aktivitas, Kelola). Status selalu disertai teks, tidak hanya warna.

### Peran (rancangan, belum ditegakkan sistem)

Owner, Admin operasional, Petugas kandang, Operator depo, Kurir, Pelanggan.

## 3. RAB v3 (per 2026-10-15, sebelum pajak)

| Komponen | Rp |
|---|---|
| Jasa pengembangan (346 OH) | 848.000.000 |
| Perangkat uji | 5.000.000 |
| Infrastruktur 6 bulan implementasi | 44.652.000 |
| Akun store dan domain | 5.420.000 |
| Cadangan 10% | 90.307.200 |
| **Sampai BAST + cadangan** | **993.379.200** |
| Operasional 12 bulan setelah BAST | 125.304.000 |
| **Total implementasi + 12 bulan** | **1.118.683.200** |

Lingkup: 1 perusahaan, 5 depo, web + 1 aplikasi React Native. Target 1.000 order/hari, 100 sesi bersamaan, 24 minggu. Infrastruktur DigitalOcean (droplet + managed PostgreSQL + Spaces), Rp7.442.000/bulan. Penetration test Rp150.000.000 adalah pos terbesar setelah gabungan backend.

## 4. Yang perlu diputuskan

Catatan BA dari membandingkan kelima dokumen:

1. **Lingkup tidak sejalan dengan permintaan.** Rapat meminta aplikasi sederhana (telur, berat, keranjang, alamat, depo terdekat, WhatsApp). Aplikasi v3.1 sudah mencakup ERP peternakan penuh (pakan, kesehatan, HPP, piutang berumur, nota kredit). RAB menghitung versi produksi Rp1,1 M. Perlu dipastikan mana yang mau dibangun di repo ini: MVP pesan-antar untuk pilot Banten, atau melanjutkan v3.1 ke produksi.
2. **Ekonomi ongkir gratis.** Margin Rp1.000/kg, ongkir gratis 1 tahun. Belum ada angka biaya kirim per order, minimum order, atau radius gratis. Tanpa itu, setiap order kecil bisa rugi.
3. **Siapa pembayar dan model saham.** Developer ditawari saham, RAB disusun sebagai proyek berbayar. Dua model ini belum didamaikan.
4. **Pelanggan nyata pilot.** Hotel Anyer sudah membeli tanpa aplikasi. Belum jelas apakah pilot menyasar hotel (Wholesale/Hotel) atau rumah tangga (Perorangan), dan berapa order/hari yang realistis. Target RAB 1.000 order/hari perlu dicek terhadap produksi 10.000 ekor.
5. **WhatsApp.** Diminta di rapat, tapi v3.1 sengaja tidak mengirim apa pun otomatis ke WhatsApp. Perlu diputuskan: link `wa.me` ke admin depo, atau integrasi.
6. **Data mobile lokal.** Pesanan dari ponsel pelanggan tidak sampai ke depo. Untuk pilot pesan-antar, ini penghalang utama: order harus sampai ke server.
7. **Login dan peran.** Pelanggan dan operator masih di aplikasi yang sama tanpa login. Pilot dengan pelanggan publik butuh pemisahan ini.
