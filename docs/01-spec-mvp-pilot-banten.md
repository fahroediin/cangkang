# Spec MVP Cangkang: Pesan-Antar Telur Pilot Banten

Versi 0.1 - 2026-10-19 - status: draf, menunggu konfirmasi asumsi (bagian 3)

Dokumen ini mandiri. Tempel utuh ke Google AI Studio (mode Build) sebagai prompt pertama. Bagian 9 (database) dijalankan manual di Supabase, bukan di-generate AI Studio.

---

## 0. Instruksi untuk AI Studio

Bangun aplikasi web mobile-first bernama **TelurFarm** sesuai dokumen ini.

- Stack: React 18 + Vite + TypeScript + Tailwind CSS, `react-router-dom`, `react-leaflet` + `leaflet` (peta OpenStreetMap), `@supabase/supabase-js`.
- Bahasa antarmuka: Bahasa Indonesia. Pakai teks UI persis seperti yang tertulis dalam tanda petik di dokumen ini.
- Semua data bisnis lewat lapisan `src/services/`. Buat interface `DataService` dengan dua implementasi: `mockService.ts` (localStorage, untuk pratinjau di AI Studio) dan `supabaseService.ts` (untuk pilot). Pilih lewat `VITE_DATA_MODE=mock|supabase`, default `mock`.
- Implementasi `supabaseService` WAJIB memanggil RPC yang tercantum di bagian 9. Jangan menghitung harga, stok, jarak kelayakan, atau status di klien lalu menulis langsung ke tabel.
- Jangan pernah menaruh service role key Supabase di kode klien. Hanya `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
- Tampilan dan teks UI WAJIB mengikuti bagian 6. Sebelum menyerahkan hasil, periksa layar satu per satu terhadap tabel larangan 6.1 dan token 6.2. Jika ada pola dari 6.1 yang muncul, ganti sebelum melapor selesai.

---

## 1. Masalah dan tujuan pilot

Peternak dengan 10.000 ekor ayam petelur di Banten menjual ke tengkulak yang membeli Rp21.000-23.000/kg, di bawah HPP proyeksi Rp26.000/kg. Rapat 2026-10-14 memutuskan menjual langsung ke rumah tangga dengan layanan antar, memakai ruko milik sendiri sebagai depo, dan menggratiskan ongkir selama 1 tahun.

Permintaan pemilik: aplikasi sederhana. Pilih telur, berat, keranjang, alamat, depo terdekat, WhatsApp.

**Tujuan pilot:** membuktikan bahwa penjualan langsung dengan antar gratis menghasilkan uang lebih banyak per kg daripada menjual ke tengkulak, setelah biaya antar dihitung.

### 1.1 Cek nilai bisnis sebelum membangun

| Pertanyaan | Jawaban saat ini |
|---|---|
| Siapa pembayar | Pemilik peternakan (Speaker 1). Model saham untuk developer belum final. |
| Alternatif yang sudah ada | Pesan lewat chat WhatsApp + catatan manual. MVP ini harus lebih murah dikelola daripada itu, bukan lebih canggih. |
| Kenapa tidak cukup WhatsApp saja | Admin harus menghitung harga, cek stok, dan menentukan depo untuk tiap chat. Saat order naik, ini yang macet. |
| Apa yang belum diketahui | Biaya antar per pesanan, rata-rata kg per pesanan, minat rumah tangga di sekitar depo. |

### 1.2 Kriteria lanjut atau berhenti (dicek setelah 4 minggu)

Rumus titik impas per pesanan:

```
kg minimum per pesanan = biaya antar per pesanan / (harga jual langsung per kg - harga jual ke tengkulak per kg)
```

Contoh: biaya antar Rp8.000, jual langsung Rp24.000, jual ke tengkulak Rp22.000 -> titik impas 4 kg per pesanan.

| Lanjut jika | Ubah aturan jika | Berhenti jika |
|---|---|---|
| Rata-rata kg per pesanan di atas titik impas, dan ada pelanggan yang memesan ulang | Rata-rata di bawah titik impas: naikkan minimal pesanan, persempit radius, atau kenakan ongkir | Pesanan per minggu tidak cukup menutup waktu admin depo, setelah promosi dijalankan |

Angka target pesanan per minggu ditetapkan pemilik sebelum pilot dimulai.

---

## 2. Lingkup

### Masuk MVP

1. Pelanggan: katalog 3 varian, keranjang dalam kg, tandai lokasi di peta, rekomendasi depo, kirim pesanan tanpa daftar akun, lacak status dengan kode, tombol WhatsApp ke depo.
2. Admin depo: masuk dengan email dan kata sandi, daftar pesanan depo sendiri, ubah status, batalkan, perbarui stok depo.
3. Owner: semua akses admin untuk semua depo, atur harga dan status jual varian, rekap pilot.

### Tidak masuk MVP (sengaja)

Aplikasi native Android/iOS, akun pelanggan dan login OTP, payment gateway, push notification, pelacakan kurir, batch/FEFO/karantina, produksi kandang, pakan, kesehatan, HPP, piutang, retur, nota kredit, refund, pembelian rutin, harga per kategori pembeli (Wholesale, Hotel/Resort), satuan butir.

Pesanan hotel dan grosir tetap lewat jalur yang sekarang (langsung ke pemilik). Fitur di atas sudah ada di TelurFarm v3.1 dan bisa ditarik masuk setelah pilot membuktikan nilai.

---

## 3. Asumsi yang perlu dikonfirmasi pemilik

Nilai di kolom "Default" dipakai di seluruh dokumen. Semua bisa diubah tanpa mengubah alur.

| ID | Asumsi | Default | Alasan |
|---|---|---|---|
| A-01 | Bentuk aplikasi | Web mobile-first, dibuka dari link yang disebar lewat WhatsApp | Tidak perlu review Play Store/App Store, tidak perlu instal, bisa diuji minggu ini |
| A-02 | Satuan jual | kg saja, kelipatan 0,5 kg | Rapat menyebut "berat/timbangan"; pasar telur rumah tangga di Banten umumnya per kg |
| A-03 | Batas per varian | 1 kg sampai 30 kg | Mencegah salah ketik dan pesanan grosir masuk jalur rumah tangga |
| A-04 | Minimal pesanan | 2 kg total | Placeholder. Ganti dengan hasil rumus titik impas 1.2 |
| A-05 | Maksimal pesanan | 50 kg total | Di atas itu diarahkan ke WhatsApp |
| A-06 | Ongkir | Rp0 di dalam radius depo | Keputusan rapat, promo 1 tahun |
| A-07 | Radius antar | 5 km per depo, bisa diubah owner di database | Jarak garis lurus, bukan rute jalan |
| A-08 | Depo pilot | Anyer, Cilegon, Serang | Dari panduan v3.1. Koordinat di bagian 9.3 adalah contoh dan wajib diganti titik ruko nyata |
| A-09 | Pembayaran | Bayar di tempat (tunai atau QRIS depo saat telur diterima) | Payment gateway di luar lingkup; tidak ada uang yang diproses aplikasi |
| A-10 | Jadwal antar | Hari ini, besok, lusa; slot Pagi 08.00-12.00 dan Sore 13.00-17.00 WIB | Pagi hari ini tutup pukul 07.00, Sore hari ini tutup pukul 12.00 |
| A-11 | Batas pesanan berjalan | 3 pesanan aktif per nomor WhatsApp | Tanpa login, ini rem sederhana terhadap pesanan iseng |
| A-12 | Harga contoh | Reguler Rp24.000/kg, Pilihan Rp27.000/kg, Ekonomis Rp22.000/kg | Ilustrasi. Owner mengisi harga nyata sebelum pilot |
| A-13 | Notifikasi pesanan masuk ke admin | Daftar pesanan diperbarui otomatis (Supabase Realtime) + bunyi singkat saat ada pesanan Baru | Tanpa push notification |

---

## 4. Persona

| Persona | Siapa | Perangkat |
|---|---|---|
| Pelanggan | Rumah tangga di sekitar depo, terbiasa WhatsApp, tidak mau daftar akun | Ponsel Android kelas menengah, sering sinyal lemah |
| Admin depo | Penjaga ruko depo, merangkap kurir atau mengatur kurir | Ponsel atau laptop di depo |
| Owner | Pemilik peternakan | Ponsel |

---

## 5. Peta layar

| Kode | Path | Layar | Persona |
|---|---|---|---|
| P1 | `/` | Katalog telur | Pelanggan |
| P2 | `/keranjang` | Keranjang | Pelanggan |
| P3 | `/lokasi` | Lokasi antar dan pilih depo | Pelanggan |
| P4 | `/checkout` | Data pengiriman | Pelanggan |
| P5 | `/pesanan/:code` | Status pesanan | Pelanggan |
| P6 | `/lacak` | Lacak pesanan | Pelanggan |
| A1 | `/admin/masuk` | Masuk petugas | Admin depo, Owner |
| A2 | `/admin` | Daftar pesanan | Admin depo, Owner |
| A3 | `/admin/pesanan/:id` | Detail pesanan | Admin depo, Owner |
| A4 | `/admin/stok` | Stok depo | Admin depo, Owner |
| A5 | `/admin/harga` | Harga varian | Owner |
| A6 | `/admin/rekap` | Rekap pilot | Owner |

Alur pelanggan: P1 -> P2 -> P3 -> P4 -> P5. Header pelanggan selalu menampilkan logo teks "TelurFarm", ikon keranjang dengan jumlah kg, dan link "Lacak pesanan".

Keranjang disimpan di localStorage dengan kunci `tf_cart` (boleh, ini data klien). Lokasi dan depo terpilih disimpan di sessionStorage `tf_checkout`.

---

## 6. Tampilan dan teks UI

TelurFarm dipakai warga untuk belanja kebutuhan dapur dan oleh penjaga ruko untuk bekerja seharian. Tampilannya harus terasa seperti warung yang rapi dan bisa dipercaya, bukan landing page startup. Bagian 6.1 sampai 6.5 mengatur tampilan. Bagian 6.6 mengatur tulisan.

### 6.1 Dilarang

Pola berikut adalah tanda tampilan buatan AI. Satu pun tidak boleh muncul.

| Pola | Ganti dengan |
|---|---|
| Gradient di latar, tombol, teks, atau border | Warna solid dari token 6.2 |
| Glassmorphism, blur latar, glow, neon | Permukaan `surface` solid dengan border 1px `line` |
| Hero banner dengan slogan ("Telur segar langsung dari kandang") di atas katalog | Katalog langsung di bawah header. Satu baris info "Gratis ongkir dalam 5 km dari depo" |
| Foto stok, ilustrasi orang, blob pastel, pola latar | Latar `cream` polos. Gambar produk hanya jika owner menyediakan foto telur asli; tanpa foto, kartu tanpa gambar |
| Ilustrasi telur kartun, ayam maskot | Tidak ada |
| Emoji sebagai ikon atau hiasan | Ikon garis Lucide 20px, hanya di samping label (keranjang, lokasi, telepon, WhatsApp) |
| Ikon dalam lingkaran berwarna di atas setiap judul atau kartu | Judul cukup teks |
| Grid tiga kartu "Kenapa memilih kami" dengan ikon, judul, satu kalimat | Tidak ada. Halaman hanya memuat yang ada di bagian 5 |
| Kartu statistik dengan panah naik dan persentase hijau di A6 | Angka apa adanya dengan label, tanpa panah, tanpa warna naik turun |
| Grafik dekoratif | A6 tanpa grafik. Tabel per depo sudah menjawab pertanyaan owner |
| Shadow besar dan berlapis di semua kartu | Border 1px `line`. Shadow `0 4px 12px rgb(51 37 27 / 0.12)` hanya untuk toast, dialog, dan bar bawah |
| Radius 16px ke atas di semua elemen | Radius 8px untuk kartu, field, tombol. Bentuk pill hanya untuk badge status |
| Semua konten rata tengah | Rata kiri. Rata tengah hanya untuk keadaan kosong |
| Animasi membal, membesar saat hover, angka berputar, confetti saat pesanan terkirim | Transisi 150ms hanya untuk muncul dan hilangnya toast, dialog, dan dropdown |
| Skeleton atau spinner di seluruh layar | Lihat 6.4 |
| Badge "Promo", "Terlaris", "Baru" di produk, rating bintang, jumlah terjual | Tidak ada. Satu-satunya label promosi adalah "Gratis ongkir" di kartu depo |
| Hitung mundur atau "stok tinggal sedikit" untuk menekan pembeli | Tidak ada. Stok tidak pernah ditampilkan ke pelanggan (BR-05) |
| Font Inter, Poppins, atau font dekoratif | Font sistem (6.2) |
| Mode gelap | Mode terang saja |
| Marker Leaflet bawaan biru (ikonnya juga sering rusak di Vite) | `CircleMarker` radius 10, isi `brand`, garis putih 3px untuk titik tujuan. Depo: `CircleMarker` radius 7, isi `surface`, garis `brand` 2px |
| Tile peta bergaya gelap atau warna-warni | Tile OpenStreetMap standar dengan atribusi |

### 6.2 Token desain

Pakai hanya nilai ini. Jangan memakai palet bawaan Tailwind (`amber-500`, `orange-600`, `indigo-500`, dan sejenisnya) secara langsung. Daftarkan di `tailwind.config` dengan nama di bawah.

Warna diambil dari Mockup Desain TelurFarm v3, ditambah `brand-hover`, `soft`, `edge`, dan `gray` supaya kontras terpenuhi.

| Token | Hex | Dipakai untuk |
|---|---|---|
| `brand` | `#704529` | Tombol utama, navigasi aktif, judul halaman, marker tujuan |
| `brand-hover` | `#5A3720` | Tombol utama saat ditekan |
| `cream` | `#FAF5EB` | Latar halaman |
| `surface` | `#FFFFFF` | Kartu, formulir, tabel, bar bawah |
| `soft` | `#F3E8D8` | Latar kartu depo terpilih, baris tabel saat disentuh |
| `shell` | `#E4CCAC` | Badge "Diproses" saja |
| `yolk` | `#F3BF38` | Badge "Baru" dan titik penanda jumlah keranjang saja |
| `ink` | `#33251B` | Teks utama |
| `muted` | `#806D5D` | Label field, keterangan, waktu |
| `line` | `#EBDDCC` | Border kartu dan pemisah (dekoratif) |
| `edge` | `#94806C` | Border field input, radio, checkbox |
| `danger` | `#B3261E` | Teks error dan border field yang error saja |
| `ok` | `#2E6B3F` | Badge "Selesai" saja |
| `gray` | `#E7E2DC` | Badge "Dibatalkan", tombol nonaktif, kerangka memuat |

- Font: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Harga, berat, jarak, dan kode pesanan memakai `font-variant-numeric: tabular-nums`.
- Skala ukuran teks: 12, 14, 16, 20, 24px. Teks isi 16px di layar pelanggan, 14px di tabel admin. Judul halaman 20px. Harga di kartu varian 20px tebal.
- Skala spasi: 4, 8, 12, 16, 24, 32px. Gutter halaman 16px. Jangan memakai nilai di luar skala.
- Border 1px, radius 8px. Field fokus: border 2px `brand`.
- Ketebalan font: 400 dan 600 saja.

### 6.3 Tata letak

- Pelanggan: desain untuk lebar 360px, konten maksimal 480px rata tengah di layar lebar. Tanpa sidebar.
- Header pelanggan 56px: teks "TelurFarm" 20px `brand` tebal di kiri; di kanan link "Lacak pesanan" dan ikon keranjang dengan jumlah kg.
- Bar bawah P1-P4: menempel di bawah, latar `surface`, satu tombol utama selebar layar setinggi 48px. Konten diberi padding bawah setinggi bar supaya tidak tertutup. Saat keyboard ponsel terbuka, bar ikut naik di atas keyboard (pakai `visualViewport`).
- Kartu varian (P1): satu kolom, tumpuk vertikal. Nama 16px tebal, deskripsi 14px `muted`, harga 20px tebal, stepper dan tombol "Tambah ke keranjang" dalam satu baris.
- Kartu depo (P3): satu kolom. Terpilih: border 2px `brand`, latar `soft`, dan teks "Dipilih". Tidak layak: teks `muted`, latar `cream`, alasan di baris kedua. Jangan memakai opacity untuk memudarkan kartu, karena opacity merusak kontras.
- Satu tombol utama (`brand`, teks putih) per layar. Tombol lain bergaya garis `edge` dengan teks `ink`. Tombol pembatalan bergaya garis dengan teks `danger`.
- Target sentuh minimal 44x44px, termasuk tombol "-" dan "+" stepper.
- Admin: di bawah 768px daftar pesanan berbentuk kartu; di 768px ke atas berbentuk tabel dengan header lengket, tinggi baris 48px, teks rata kiri, angka rata kanan. Navigasi admin: tab bawah di ponsel (Pesanan, Stok, plus Harga dan Rekap untuk owner), sidebar 220px di layar lebar.
- Badge status berbentuk pill, teks 12px tebal, selalu berisi nama status.

| Status | Latar | Teks |
|---|---|---|
| Baru | `yolk` | `ink` |
| Diproses | `shell` | `ink` |
| Dalam pengiriman | `brand` | putih |
| Selesai | `ok` | putih |
| Dibatalkan | `gray` | `ink` |

### 6.4 Keadaan layar

| Keadaan | Tampilan |
|---|---|
| Memuat awal katalog | 3 kerangka kartu `gray` setinggi kartu varian, tanpa animasi kilau |
| Memuat peta | Area peta berlatar `gray` dengan teks "Memuat peta..." di tengah |
| Memuat daftar depo | Teks "Mencari depo..." di bawah peta; peta tetap bisa digeser |
| Kosong | Satu kalimat dan satu tombol, rata tengah, tanpa ilustrasi. Contoh: "Keranjang masih kosong" dengan tombol "Pilih telur" |
| Gagal muat | Pesan di tempat konten dengan tombol "Coba lagi". Isian yang sudah diketik tidak dihapus |
| Tanpa koneksi | Strip `ink` teks putih di bawah header: "Tidak ada koneksi. Pesanan belum bisa dikirim." Keranjang tetap bisa diubah |
| Mengirim | Tombol berubah teks "Mengirim..." dan nonaktif; field ikut nonaktif |
| Galat validasi | Teks `danger` 14px di bawah field terkait dan border field `danger`, bukan dialog. Layar menggulir ke field error pertama |
| Sukses | Toast 3 detik di atas bar bawah, latar `ink`, teks putih. Toast hanya muncul setelah server mengonfirmasi |

### 6.5 Aksesibilitas

Kontras sudah dihitung dengan rumus WCAG 2.1:

| Pasangan | Rasio | Keputusan |
|---|---|---|
| `ink` di `cream` / `surface` | 13,6 / 14,8 | Lolos |
| `muted` di `surface` | 4,9 | Lolos |
| `muted` di `cream` | 4,5 | Lolos tipis. Jangan memakai warna yang lebih terang dari `muted` untuk teks |
| `muted` di `soft` | 4,1 | Tidak lolos. Teks di kartu depo terpilih memakai `ink` |
| `muted` di `shell` | 3,2 | Tidak lolos. Jangan menaruh teks `muted` di atas `shell` |
| Putih di `brand` | 8,2 | Lolos |
| `ink` di `yolk` | 8,7 | Lolos |
| `yolk` di `surface` | 1,7 | Tidak lolos. `yolk` tidak pernah dipakai sebagai warna teks, ikon, atau satu-satunya penanda pilihan |
| Putih di `ok` | 6,4 | Lolos |
| `danger` di `surface` / `cream` | 6,5 / 6,0 | Lolos |
| `edge` di `surface` / `cream` | 3,8 / 3,5 | Lolos untuk border komponen (minimal 3:1) |
| `line` di `surface` | 1,3 | Hanya untuk pemisah dekoratif, tidak untuk border field |

- Status dan pilihan tidak boleh dibedakan dengan warna saja. Selalu ada teks ("Dipilih", nama status, alasan).
- Fokus keyboard: outline 2px `brand` dengan offset 2px.
- Tombol berisi ikon saja wajib punya `aria-label`: "Keranjang, 3 kg", "Tutup", "Kurangi 0,5 kg", "Tambah 0,5 kg".
- Field berat memakai `inputmode="decimal"`, nomor WhatsApp `inputmode="tel"`, 4 digit lacak `inputmode="numeric"`.
- Peta bukan satu-satunya cara: tombol "Pakai lokasi saya" bisa dipakai tanpa menyentuh peta.

### 6.6 Teks UI

Bagian ini satu-satunya yang memakai prinsip stop-slop, karena berlaku untuk tulisan, bukan tampilan.

- Pakai teks persis seperti dalam tanda petik di bagian 8. Jangan menambah tagline, subjudul, atau kalimat sambutan.
- Bahasa Indonesia sehari-hari yang sopan, sapaan "Anda". Istilah tetap: "depo" (bukan depot, agen, atau toko), "pesanan" (bukan order), "Telur reguler", "Telur pilihan", "Telur ekonomis".
- Tombol berupa kata kerja yang menyebut hasilnya: "Tambah ke keranjang", "Pilih lokasi antar", "Kirim pesanan", "Proses pesanan", "Mulai antar". Bukan "Lanjut", "Submit", "OK", atau "Klik di sini".
- Pesan error menyebut masalah dan perbaikannya: "Berat minimal 1 kg". Bukan "Terjadi kesalahan" atau "Input tidak valid".
- Dilarang kata pemasaran: segar langsung dari kandang, kualitas terbaik, premium, terpercaya, nomor satu, hemat banget, revolusioner, solusi.
- Tanpa emoji, tanpa tanda seru, tanpa em dash, tanpa huruf kapital semua kecuali kode pesanan.
- Angka selalu dengan satuan: "3 kg", "Rp72.000", "2,3 km".

### 6.7 Data contoh mode mock

- Satu skenario konsisten: pelanggan Siti Aminah, nomor 0812-3456-7890, Jl. Merdeka No. 12, RT 02/RW 05, Cilegon. Pesanan contoh TF-261019-A7K2 dari Depo Cilegon.
- Waktu "sekarang" di mock: Senin, 19 Oktober 2026, 09.00 WIB.
- Stok awal mock: 50 kg tiap varian di tiap depo, kecuali Telur pilihan di Depo Anyer 0 kg, supaya alasan "Stok Telur pilihan tidak cukup" bisa dilihat.
- Isi 6 pesanan lain di A2 dengan nama dan alamat bergaya Banten (Cilegon, Serang, Anyer) dan status campuran.
- Dilarang lorem ipsum, "John Doe", "Test 123", nomor telepon yang sama berulang, angka bulat palsu.
- Angka di A6 dihitung dari data mock, bukan ditulis tangan.

---

## 7. Aturan bisnis

| ID | Aturan |
|---|---|
| BR-01 | Berat per varian 1-30 kg, kelipatan 0,5 kg. |
| BR-02 | Total keranjang 2-50 kg. |
| BR-03 | Harga per kg diambil dari varian saat pesanan dibuat dan disimpan di baris pesanan. Perubahan harga sesudahnya tidak mengubah pesanan lama. |
| BR-04 | Subtotal baris = berat x harga per kg, dibulatkan ke rupiah terdekat. Ongkir Rp0. Total = jumlah subtotal. |
| BR-05 | Depo layak jika aktif, jarak garis lurus ke titik tujuan <= radius depo, dan stok setiap varian di keranjang >= berat yang dipesan. Lihat MRTM_DEPO. |
| BR-06 | Rekomendasi: depo layak terdekat dipilih otomatis. Pelanggan boleh memilih depo layak lain. Depo tidak layak tampil dengan alasan dan tidak bisa dipilih. |
| BR-07 | Stok depo berkurang saat pesanan berhasil dibuat, dalam satu transaksi server. Jika stok salah satu varian kurang, seluruh pesanan gagal. |
| BR-08 | Stok dikembalikan tepat satu kali saat pesanan dibatalkan. |
| BR-09 | Nomor WhatsApp diterima dalam format `08...` atau `628...` atau `+62...`, 10-13 digit setelah tanda dan spasi dibuang (dihitung dalam format `08`). Disimpan sebagai `628...`. |
| BR-10 | Jadwal antar mengikuti MRTM_SLOT. Waktu acuan Asia/Jakarta. |
| BR-11 | Satu nomor WhatsApp maksimal 3 pesanan berstatus Baru, Diproses, atau Dalam pengiriman. |
| BR-12 | Kode pesanan berformat `TF-YYMMDD-XXXX` (4 karakter huruf besar/angka acak), unik. |
| BR-13 | Lacak pesanan butuh kode pesanan + 4 digit terakhir nomor WhatsApp. |
| BR-14 | Perpindahan status mengikuti MRTM_STATUS. Setiap perubahan dicatat di riwayat dengan waktu dan petugas. |
| BR-15 | Admin depo hanya melihat dan mengubah pesanan dan stok depo sendiri. Owner melihat dan mengubah semua. |
| BR-16 | Stok depo 0-10.000 kg, kelipatan 0,5 kg. |
| BR-17 | Harga varian Rp1.000-Rp100.000 per kg, bilangan bulat. |
| BR-18 | Varian dengan status jual nonaktif tidak tampil di katalog dan ditolak server jika tetap dikirim. |

---

## 8. User story dan acceptance criteria

Semua teks dalam tanda petik adalah teks UI persis.

### 8.1 Daftar user story

| US-ID | Judul | Persona | Aksi | Nilai bisnis |
|---|---|---|---|---|
| US-01 | Memilih Telur ke Keranjang | Pelanggan | memilih varian telur dan berat dalam kg lalu memasukkannya ke keranjang | pembeli tahu total harga sejak awal tanpa bertanya lewat chat |
| US-02 | Menandai Lokasi Antar | Pelanggan | menandai titik rumah tujuan antar di peta | telur diantar ke titik yang benar dan depo yang menjangkau bisa dihitung |
| US-03 | Memilih Depo Pengantar | Pelanggan | memilih depo yang menjangkau lokasi dan punya stok untuk seluruh isi keranjang | pesanan hanya diterima oleh depo yang sanggup memenuhinya |
| US-04 | Mengirim Pesanan Antar | Pelanggan | mengirim pesanan dengan nama, nomor WhatsApp, alamat, dan jadwal antar | depo menerima pesanan lengkap tanpa tanya ulang |
| US-05 | Memantau Status Pesanan | Pelanggan | memantau status pesanan dengan kode pesanan | pelanggan tidak perlu menelepon depo menanyakan posisi pesanan |
| US-06 | Menghubungi Depo lewat WhatsApp | Pelanggan | mengirim pesan WhatsApp ke depo dengan rincian pesanan sudah terisi | komunikasi tetap di kanal yang sudah dipakai warga |
| US-07 | Masuk sebagai Petugas | Admin depo, Owner | masuk ke panel petugas dengan akun dari owner | data pelanggan dan pesanan hanya terlihat oleh petugas yang berhak |
| US-08 | Memproses Pesanan Masuk | Admin depo | memajukan status pesanan dari Baru sampai Selesai sesuai pekerjaan fisik | status yang dilihat pelanggan sesuai kenyataan |
| US-09 | Membatalkan Pesanan | Admin depo | membatalkan pesanan yang belum diantar dengan alasan | stok yang tertahan kembali bisa dijual |
| US-10 | Memperbarui Stok Depo | Admin depo | memperbarui stok kg tiap varian di depo sendiri | pelanggan tidak memesan telur yang sebenarnya habis |
| US-11 | Mengatur Harga dan Status Jual | Owner | mengubah harga per kg dan status jual tiap varian | harga di aplikasi mengikuti harga pasar harian |
| US-12 | Melihat Rekap Pilot | Owner | melihat rekap pesanan, kg terjual, pelanggan ulang, dan pembatalan per periode | owner punya dasar memutuskan pilot lanjut, diubah, atau berhenti |

### 8.2 US-01 Memilih Telur ke Keranjang

Katalog P1 menampilkan kartu per varian aktif: nama, deskripsi singkat, harga "Rp24.000/kg", stepper berat (tombol "-" dan "+" langkah 0,5 kg, plus field angka), tombol "Tambah ke keranjang". Bawah layar: bar "Keranjang 0 kg - Rp0" dan tombol "Lihat keranjang". Data contoh varian:

| id | Nama | Deskripsi |
|---|---|---|
| reguler | Telur reguler | Ukuran campur, untuk masak harian |
| pilihan | Telur pilihan | Ukuran besar dan seragam |
| ekonomis | Telur ekonomis | Ukuran kecil, harga lebih hemat |

| AC-ID | Kategori | Skenario | GIVEN | WHEN | THEN |
|---|---|---|---|---|---|
| AC-01.01 | Happy | Menambah satu varian ke keranjang kosong | Saya seorang Pelanggan<br>AND saya berada di halaman "Katalog telur"<br>AND keranjang kosong<br>AND harga Telur reguler Rp24.000/kg | Saya mengetik "3" di field berat kartu "Telur reguler"<br>AND saya mengklik tombol "Tambah ke keranjang" di kartu tersebut | Muncul notifikasi "Telur reguler 3 kg masuk keranjang"<br>AND bar bawah menampilkan "Keranjang 3 kg - Rp72.000"<br>AND ikon keranjang di header menampilkan "3 kg" |
| AC-01.02 | Happy | Menambah varian yang sudah ada di keranjang | Saya seorang Pelanggan<br>AND saya berada di halaman "Katalog telur"<br>AND keranjang berisi Telur reguler 3 kg | Saya mengetik "2" di field berat kartu "Telur reguler"<br>AND saya mengklik tombol "Tambah ke keranjang" | Keranjang berisi satu baris Telur reguler 5 kg<br>AND bar bawah menampilkan "Keranjang 5 kg - Rp120.000" |
| AC-01.03 | Negative | Berat di bawah minimum | Saya seorang Pelanggan<br>AND saya berada di halaman "Katalog telur" | Saya mengetik "0,5" di field berat kartu "Telur pilihan"<br>AND saya mengklik tombol "Tambah ke keranjang" | Di bawah field muncul teks "Berat minimal 1 kg"<br>AND keranjang tidak berubah |
| AC-01.04 | Boundary | Berat tepat di batas bawah | Saya seorang Pelanggan<br>AND saya berada di halaman "Katalog telur"<br>AND keranjang kosong | Saya mengetik "1" di field berat kartu "Telur pilihan"<br>AND saya mengklik tombol "Tambah ke keranjang" | Bar bawah menampilkan "Keranjang 1 kg - Rp27.000" |
| AC-01.05 | Boundary | Berat tepat di batas atas | Saya seorang Pelanggan<br>AND saya berada di halaman "Katalog telur"<br>AND keranjang kosong | Saya mengetik "30" di field berat kartu "Telur ekonomis"<br>AND saya mengklik tombol "Tambah ke keranjang" | Bar bawah menampilkan "Keranjang 30 kg - Rp660.000" |
| AC-01.06 | Boundary | Berat melewati batas atas per varian | Saya seorang Pelanggan<br>AND saya berada di halaman "Katalog telur" | Saya mengetik "30,5" di field berat kartu "Telur ekonomis"<br>AND saya mengklik tombol "Tambah ke keranjang" | Di bawah field muncul teks "Berat maksimal 30 kg per varian"<br>AND keranjang tidak berubah |
| AC-01.07 | Boundary | Penambahan membuat satu varian melewati 30 kg | Saya seorang Pelanggan<br>AND saya berada di halaman "Katalog telur"<br>AND keranjang berisi Telur reguler 28 kg | Saya mengetik "3" di field berat kartu "Telur reguler"<br>AND saya mengklik tombol "Tambah ke keranjang" | Di bawah field muncul teks "Berat maksimal 30 kg per varian"<br>AND keranjang tetap Telur reguler 28 kg |
| AC-01.08 | Negative | Berat bukan kelipatan 0,5 | Saya seorang Pelanggan<br>AND saya berada di halaman "Katalog telur" | Saya mengetik "1,25" di field berat kartu "Telur reguler"<br>AND saya mengklik tombol "Tambah ke keranjang" | Di bawah field muncul teks "Berat harus kelipatan 0,5 kg"<br>AND keranjang tidak berubah |
| AC-01.09 | Negative | Field berat berisi huruf | Saya seorang Pelanggan<br>AND saya berada di halaman "Katalog telur" | Saya mengetik "dua" di field berat kartu "Telur reguler"<br>AND saya mengklik tombol "Tambah ke keranjang" | Di bawah field muncul teks "Isi berat dengan angka"<br>AND keranjang tidak berubah |
| AC-01.10 | Happy | Mengubah berat di halaman keranjang | Saya seorang Pelanggan<br>AND saya berada di halaman "Keranjang"<br>AND keranjang berisi Telur reguler 3 kg | Saya mengklik tombol "+" pada baris Telur reguler | Baris Telur reguler menampilkan "3,5 kg" dan "Rp84.000"<br>AND total menampilkan "Rp84.000" |
| AC-01.11 | Happy | Menghapus baris keranjang | Saya seorang Pelanggan<br>AND saya berada di halaman "Keranjang"<br>AND keranjang berisi Telur reguler 3 kg dan Telur pilihan 2 kg | Saya mengklik tombol "Hapus" pada baris Telur pilihan | Keranjang hanya berisi Telur reguler 3 kg<br>AND total menampilkan "Rp72.000" |
| AC-01.12 | Negative | Lanjut dengan total di bawah minimal pesanan | Saya seorang Pelanggan<br>AND saya berada di halaman "Keranjang"<br>AND total keranjang 1,5 kg | Saya mengklik tombol "Pilih lokasi antar" | Muncul teks "Minimal pesanan 2 kg" di atas tombol<br>AND saya tetap di halaman "Keranjang" |
| AC-01.13 | Boundary | Lanjut dengan total tepat 2 kg | Saya seorang Pelanggan<br>AND saya berada di halaman "Keranjang"<br>AND total keranjang 2 kg | Saya mengklik tombol "Pilih lokasi antar" | Sistem membuka halaman "Lokasi antar" |
| AC-01.14 | Boundary | Lanjut dengan total di atas maksimal | Saya seorang Pelanggan<br>AND saya berada di halaman "Keranjang"<br>AND total keranjang 50,5 kg | Saya mengklik tombol "Pilih lokasi antar" | Muncul teks "Maksimal pesanan 50 kg. Untuk jumlah lebih besar, hubungi depo lewat WhatsApp."<br>AND saya tetap di halaman "Keranjang" |
| AC-01.15 | Edge | Varian di keranjang dinonaktifkan owner | Saya seorang Pelanggan<br>AND keranjang berisi Telur pilihan 2 kg dan Telur reguler 2 kg<br>AND owner menonaktifkan Telur pilihan | Saya membuka halaman "Keranjang" | Baris Telur pilihan hilang dari keranjang<br>AND muncul teks "Telur pilihan sedang tidak dijual dan dihapus dari keranjang" |

Keranjang kosong di P2 menampilkan "Keranjang masih kosong" dan tombol "Pilih telur".

### 8.3 US-02 Menandai Lokasi Antar

P3 bagian atas: peta Leaflet setinggi 50% layar, titik tujuan ditentukan dengan mengetuk peta (lebih mudah di ponsel daripada menyeret pin), tombol "Pakai lokasi saya". Peta awal berpusat di tengah tiga depo, zoom 11.

| AC-ID | Kategori | Skenario | GIVEN | WHEN | THEN |
|---|---|---|---|---|---|
| AC-02.01 | Happy | Memakai GPS ponsel | Saya seorang Pelanggan<br>AND saya berada di halaman "Lokasi antar"<br>AND browser belum pernah ditanya izin lokasi | Saya mengklik tombol "Pakai lokasi saya"<br>AND saya mengklik "Izinkan" di dialog izin lokasi browser | Pin tujuan pindah ke posisi saya<br>AND peta memusat ke pin dengan zoom 16<br>AND daftar depo diperbarui dengan jarak dari pin |
| AC-02.02 | Negative | Izin lokasi ditolak | Saya seorang Pelanggan<br>AND saya berada di halaman "Lokasi antar" | Saya mengklik tombol "Pakai lokasi saya"<br>AND saya mengklik "Blokir" di dialog izin lokasi browser | Muncul teks "Izin lokasi ditolak. Ketuk peta di titik rumah Anda."<br>AND keranjang tidak berubah |
| AC-02.03 | Happy | Menentukan titik dengan mengetuk peta | Saya seorang Pelanggan<br>AND saya berada di halaman "Lokasi antar" | Saya mengetuk titik rumah saya di peta | Daftar depo diperbarui dengan jarak dari titik baru |
| AC-02.04 | Edge | Lanjut tanpa pernah menentukan titik | Saya seorang Pelanggan<br>AND saya berada di halaman "Lokasi antar"<br>AND saya belum memakai GPS dan belum mengetuk peta | Saya mengklik tombol "Isi data pengiriman" | Muncul teks "Tentukan titik antar dulu: pakai lokasi Anda atau ketuk peta."<br>AND saya tetap di halaman "Lokasi antar" |
| AC-02.05 | Edge | GPS tidak memberi posisi dalam 10 detik | Saya seorang Pelanggan<br>AND saya berada di halaman "Lokasi antar"<br>AND izin lokasi sudah diberikan<br>AND sinyal GPS lemah | Saya mengklik tombol "Pakai lokasi saya" | Setelah 10 detik muncul teks "Lokasi belum ketemu. Ketuk peta di titik rumah Anda." |

Akurasi GPS di atas 100 m ditampilkan sebagai teks "Lokasi kurang akurat (sekitar 250 m). Periksa posisi pin." tanpa memblokir.

### 8.4 US-03 Memilih Depo Pengantar

P3 bagian bawah: daftar kartu depo. Kartu layak menampilkan nama, alamat, "2,3 km", label "Gratis ongkir", radio pilih. Kartu tidak layak berwarna pudar, radio nonaktif, dan menampilkan alasan. Data berasal dari RPC `check_depots`.

AC-03.01 Refer to MRTM Rows TRM_DEPO_001 through TRM_DEPO_006.

| User Story ID | AC ID | User | TCID | Depo aktif | Jarak vs radius | Stok semua varian cukup | Kondisi khusus | Hasil |
|---|---|---|---|---|---|---|---|---|
| US_03 | AC_03.01 | Pelanggan | TRM_DEPO_001 | Ya | 4,9 km / 5 km | Ya | [-] | Depo layak, menampilkan "4,9 km" dan "Gratis ongkir" |
| US_03 | AC_03.01 | Pelanggan | TRM_DEPO_002 | Ya | 5,0 km / 5 km | Ya | [-] | Depo layak (batas radius inklusif) |
| US_03 | AC_03.01 | Pelanggan | TRM_DEPO_003 | Ya | 5,1 km / 5 km | [ANY] | [-] | Tidak layak, alasan "Di luar jangkauan antar (5,1 km, batas 5 km)" |
| US_03 | AC_03.01 | Pelanggan | TRM_DEPO_004 | Ya | 2,0 km / 5 km | Tidak (Telur pilihan) | [-] | Tidak layak, alasan "Stok Telur pilihan tidak cukup" |
| US_03 | AC_03.01 | Pelanggan | TRM_DEPO_005 | Tidak | [ANY] | [ANY] | [-] | Tidak layak, alasan "Depo sedang tutup" |
| US_03 | AC_03.01 | Pelanggan | TRM_DEPO_006 | Ya | 6 km / 5 km | Tidak | Dua alasan sekaligus | Tampilkan alasan prioritas tertinggi saja: tutup > jangkauan > stok |

Kartu tidak menampilkan angka stok, hanya cukup atau tidak.

| AC-ID | Kategori | Skenario | GIVEN | WHEN | THEN |
|---|---|---|---|---|---|
| AC-03.02 | Happy | Depo layak terdekat terpilih otomatis | Saya seorang Pelanggan<br>AND saya berada di halaman "Lokasi antar"<br>AND Depo Cilegon layak di 2,3 km dan Depo Serang layak di 4,1 km | Saya mengetuk titik rumah saya di peta | Kartu Depo Cilegon berada paling atas dengan radio terpilih<br>AND kartu Depo Serang di bawahnya tanpa radio terpilih |
| AC-03.03 | Happy | Memilih depo layak lain | Saya seorang Pelanggan<br>AND saya berada di halaman "Lokasi antar"<br>AND Depo Cilegon terpilih otomatis<br>AND Depo Serang juga layak | Saya mengklik kartu Depo Serang<br>AND saya mengklik tombol "Isi data pengiriman" | Sistem membuka halaman "Data pengiriman" dengan ringkasan "Diantar dari Depo Serang" |
| AC-03.04 | Negative | Tidak ada depo layak | Saya seorang Pelanggan<br>AND saya berada di halaman "Lokasi antar"<br>AND titik saya 12 km dari depo terdekat | Saya mengetuk titik rumah saya di peta | Muncul teks "Belum ada depo yang bisa mengantar ke lokasi ini dengan isi keranjang sekarang."<br>AND tombol "Isi data pengiriman" nonaktif<br>AND muncul tombol "Tanya lewat WhatsApp" |
| AC-03.05 | Edge | Tanpa sinyal saat memuat depo | Saya seorang Pelanggan<br>AND saya berada di halaman "Lokasi antar"<br>AND koneksi internet terputus | Saya mengetuk titik rumah saya di peta | Muncul teks "Gagal memuat depo. Periksa koneksi lalu coba lagi."<br>AND muncul tombol "Coba lagi"<br>AND keranjang tidak berubah |

"Tanya lewat WhatsApp" membuka nomor WhatsApp owner (konfigurasi `VITE_OWNER_WA`) dengan teks "Halo TelurFarm, saya mau pesan telur tapi lokasi saya belum terjangkau depo. Lokasi saya: https://maps.google.com/?q={lat},{lng}".

### 8.5 US-04 Mengirim Pesanan Antar

P4 berisi ringkasan (isi keranjang, depo, "Ongkir Rp0", total), lalu field: "Nama penerima", "Nomor WhatsApp", "Alamat lengkap" (textarea), "Patokan (opsional)", pilihan "Tanggal antar" (Hari ini / Besok / Lusa dengan tanggal), pilihan "Jam antar" (Pagi 08.00-12.00 / Sore 13.00-17.00), teks tetap "Pembayaran: bayar di tempat saat telur diterima (tunai atau QRIS)", tombol "Kirim pesanan".

Batas field: Nama 1-80 karakter, Alamat 5-300 karakter, Patokan 0-200 karakter. Teks disimpan apa adanya dan ditampilkan sebagai teks biasa (tidak pernah dirender sebagai HTML).

| AC-ID | Kategori | Skenario | GIVEN | WHEN | THEN |
|---|---|---|---|---|---|
| AC-04.01 | Happy | Mengirim pesanan lengkap | Saya seorang Pelanggan<br>AND saya berada di halaman "Data pengiriman"<br>AND keranjang berisi Telur reguler 3 kg dan Telur pilihan 2 kg<br>AND Depo Cilegon terpilih<br>AND sekarang Senin 19 Oktober 2026 pukul 09.00 WIB | Saya mengetik "Siti Aminah" di field "Nama penerima"<br>AND saya mengetik "0812-3456-7890" di field "Nomor WhatsApp"<br>AND saya mengetik "Jl. Merdeka No. 12, RT 02/RW 05" di field "Alamat lengkap"<br>AND saya memilih "Besok" di "Tanggal antar"<br>AND saya memilih "Pagi 08.00-12.00" di "Jam antar"<br>AND saya mengklik tombol "Kirim pesanan" | Sistem membuka halaman status pesanan dengan judul "Pesanan TF-261019-XXXX terkirim ke Depo Cilegon"<br>AND status "Baru"<br>AND total "Rp126.000"<br>AND keranjang menjadi kosong<br>AND stok Depo Cilegon berkurang 3 kg Telur reguler dan 2 kg Telur pilihan |
| AC-04.02 | Negative | Field wajib kosong | Saya seorang Pelanggan<br>AND saya berada di halaman "Data pengiriman" | Saya membiarkan field "Nama penerima", "Nomor WhatsApp", dan "Alamat lengkap" kosong<br>AND saya tidak memilih "Jam antar"<br>AND saya mengklik tombol "Kirim pesanan" | Di bawah field muncul "Nama wajib diisi", "Nomor WhatsApp wajib diisi", "Alamat wajib diisi", dan "Pilih jam antar"<br>AND tidak ada pesanan dibuat |
| AC-04.03 | Boundary | Nomor WhatsApp 9 digit | Saya seorang Pelanggan<br>AND saya berada di halaman "Data pengiriman" | Saya mengetik "081234567" di field "Nomor WhatsApp"<br>AND saya mengklik tombol "Kirim pesanan" | Di bawah field muncul "Nomor WhatsApp tidak valid. Contoh: 0812 3456 7890" |
| AC-04.04 | Boundary | Nomor WhatsApp 10 digit | Saya seorang Pelanggan<br>AND saya berada di halaman "Data pengiriman"<br>AND field lain terisi valid | Saya mengetik "0812345678" di field "Nomor WhatsApp"<br>AND saya mengklik tombol "Kirim pesanan" | Pesanan dibuat<br>AND nomor tersimpan sebagai "62812345678" |
| AC-04.05 | Boundary | Nomor WhatsApp 14 digit | Saya seorang Pelanggan<br>AND saya berada di halaman "Data pengiriman" | Saya mengetik "08123456789012" di field "Nomor WhatsApp"<br>AND saya mengklik tombol "Kirim pesanan" | Di bawah field muncul "Nomor WhatsApp tidak valid. Contoh: 0812 3456 7890" |
| AC-04.06 | Happy | Nomor dengan awalan +62 | Saya seorang Pelanggan<br>AND saya berada di halaman "Data pengiriman"<br>AND field lain terisi valid | Saya mengetik "+62 812 3456 7890" di field "Nomor WhatsApp"<br>AND saya mengklik tombol "Kirim pesanan" | Pesanan dibuat<br>AND nomor tersimpan sebagai "6281234567890" |
| AC-04.07 | Boundary | Nama 81 karakter | Saya seorang Pelanggan<br>AND saya berada di halaman "Data pengiriman" | Saya mengetik nama sepanjang 81 karakter di field "Nama penerima"<br>AND saya mengklik tombol "Kirim pesanan" | Di bawah field muncul "Nama maksimal 80 karakter" |
| AC-04.08 | Edge | Alamat berisi tag HTML | Saya seorang Pelanggan<br>AND saya berada di halaman "Data pengiriman"<br>AND field lain terisi valid | Saya mengetik "Jl. Mawar <script>alert(1)</script>" di field "Alamat lengkap"<br>AND saya mengklik tombol "Kirim pesanan" | Pesanan dibuat<br>AND di halaman status dan di panel admin alamat tampil sebagai teks "Jl. Mawar <script>alert(1)</script>" tanpa menjalankan script |
| AC-04.09 | Edge | Stok habis diambil pembeli lain sebelum kirim | Saya seorang Pelanggan<br>AND saya berada di halaman "Data pengiriman"<br>AND stok Telur pilihan Depo Cilegon tinggal 1 kg karena pesanan lain<br>AND keranjang saya berisi Telur pilihan 2 kg | Saya mengklik tombol "Kirim pesanan" | Muncul teks "Stok berubah saat Anda memesan. Pilih depo lagi atau kurangi berat."<br>AND muncul tombol "Pilih depo lagi"<br>AND tidak ada pesanan dibuat<br>AND keranjang tidak berubah |
| AC-04.10 | Edge | Ketukan ganda pada tombol kirim | Saya seorang Pelanggan<br>AND saya berada di halaman "Data pengiriman"<br>AND semua field valid | Saya mengklik tombol "Kirim pesanan" dua kali berturut-turut dengan cepat | Tombol berubah menjadi "Mengirim..." dan nonaktif setelah klik pertama<br>AND hanya satu pesanan dibuat |
| AC-04.11 | Negative | Nomor sudah punya 3 pesanan berjalan | Saya seorang Pelanggan<br>AND saya berada di halaman "Data pengiriman"<br>AND nomor 081234567890 punya 3 pesanan berstatus Baru atau Diproses | Saya mengetik "081234567890" di field "Nomor WhatsApp"<br>AND saya mengklik tombol "Kirim pesanan" | Muncul teks "Nomor ini masih punya 3 pesanan berjalan. Hubungi depo lewat WhatsApp untuk pesanan tambahan."<br>AND tidak ada pesanan dibuat |
| AC-04.12 | Edge | Koneksi putus saat mengirim | Saya seorang Pelanggan<br>AND saya berada di halaman "Data pengiriman"<br>AND koneksi internet terputus | Saya mengklik tombol "Kirim pesanan" | Muncul teks "Pesanan belum terkirim. Periksa koneksi lalu tekan Kirim pesanan lagi."<br>AND isian formulir tetap ada |

AC-04.13 Refer to MRTM Rows TRM_SLOT_001 through TRM_SLOT_007 untuk pilihan jadwal yang ditampilkan.

| User Story ID | AC ID | User | TCID | Waktu sekarang (WIB) | Tanggal | Slot | Hasil |
|---|---|---|---|---|---|---|---|
| US_04 | AC_04.13 | Pelanggan | TRM_SLOT_001 | 06.59 | Hari ini | Pagi | Bisa dipilih |
| US_04 | AC_04.13 | Pelanggan | TRM_SLOT_002 | 07.00 | Hari ini | Pagi | Nonaktif, teks "Sudah tutup" |
| US_04 | AC_04.13 | Pelanggan | TRM_SLOT_003 | 11.59 | Hari ini | Sore | Bisa dipilih |
| US_04 | AC_04.13 | Pelanggan | TRM_SLOT_004 | 12.00 | Hari ini | Sore | Nonaktif, teks "Sudah tutup" |
| US_04 | AC_04.13 | Pelanggan | TRM_SLOT_005 | 12.00 | Hari ini | [ANY] | Pilihan "Hari ini" nonaktif seluruhnya, "Besok" terpilih default |
| US_04 | AC_04.13 | Pelanggan | TRM_SLOT_006 | [ANY] | Besok, Lusa | [ANY] | Bisa dipilih |
| US_04 | AC_04.13 | Pelanggan | TRM_SLOT_007 | 11.58 isi form, kirim 12.01 | Hari ini | Sore | Server menolak, teks "Jadwal yang dipilih sudah tutup. Pilih jadwal lain." |

### 8.6 US-05 Memantau Status Pesanan

P5 menampilkan: kode, badge status, depo, tanggal dan jam antar, alamat, rincian barang, total, "Bayar di tempat", riwayat status dengan waktu. Halaman memuat ulang status tiap 30 detik saat terbuka. Kode pesanan terakhir disimpan di localStorage `tf_last_orders` (maks 5) dan tampil di P6 sebagai "Pesanan terakhir di perangkat ini".

P6 berisi field "Kode pesanan", "4 digit terakhir nomor WhatsApp", tombol "Lacak".

| AC-ID | Kategori | Skenario | GIVEN | WHEN | THEN |
|---|---|---|---|---|---|
| AC-05.01 | Happy | Melacak dengan kode dan 4 digit benar | Saya seorang Pelanggan<br>AND saya berada di halaman "Lacak pesanan"<br>AND pesanan TF-261019-A7K2 milik nomor 6281234567890 berstatus "Diproses" | Saya mengetik "TF-261019-A7K2" di field "Kode pesanan"<br>AND saya mengetik "7890" di field "4 digit terakhir nomor WhatsApp"<br>AND saya mengklik tombol "Lacak" | Sistem membuka halaman status pesanan TF-261019-A7K2 dengan badge "Diproses" |
| AC-05.02 | Negative | 4 digit tidak cocok | Saya seorang Pelanggan<br>AND saya berada di halaman "Lacak pesanan" | Saya mengetik "TF-261019-A7K2" di field "Kode pesanan"<br>AND saya mengetik "1111" di field "4 digit terakhir nomor WhatsApp"<br>AND saya mengklik tombol "Lacak" | Muncul teks "Pesanan tidak ditemukan. Periksa kode dan 4 digit terakhir nomor WhatsApp." |
| AC-05.03 | Edge | Kode diketik huruf kecil dan berspasi | Saya seorang Pelanggan<br>AND saya berada di halaman "Lacak pesanan" | Saya mengetik " tf-261019-a7k2 " di field "Kode pesanan"<br>AND saya mengetik "7890" di field "4 digit terakhir nomor WhatsApp"<br>AND saya mengklik tombol "Lacak" | Sistem membuka halaman status pesanan TF-261019-A7K2 |
| AC-05.04 | Happy | Status berubah saat halaman terbuka | Saya seorang Pelanggan<br>AND saya berada di halaman status pesanan TF-261019-A7K2 berstatus "Diproses" | Saya menunggu 30 detik setelah admin mengubah status ke Dalam pengiriman | Badge menampilkan "Dalam pengiriman"<br>AND riwayat menampilkan baris baru "Dalam pengiriman" dengan jam perubahan dan "Kurir: Budi" |
| AC-05.05 | Happy | Pesanan dibatalkan depo | Saya seorang Pelanggan<br>AND pesanan TF-261019-A7K2 dibatalkan admin dengan alasan "Stok rusak saat dikemas" | Saya membuka halaman status pesanan TF-261019-A7K2 | Badge menampilkan "Dibatalkan"<br>AND tampil teks "Alasan: Stok rusak saat dikemas" |

Halaman `/pesanan/:code` yang dibuka langsung dari link tanpa kode di `tf_last_orders` meminta 4 digit terakhir nomor WhatsApp sebelum menampilkan isi.

### 8.7 US-06 Menghubungi Depo lewat WhatsApp

Tombol "Chat depo di WhatsApp" ada di P5. Membuka `https://wa.me/{nomor_depo}?text={pesan}` dengan pesan:

```
Halo Depo {nama depo}, saya {nama} dengan pesanan {kode}.
{baris barang, contoh: Telur reguler 3 kg}
Antar {Besok, 20 Okt 2026, Pagi 08.00-12.00}
Alamat: {alamat}
```

| AC-ID | Kategori | Skenario | GIVEN | WHEN | THEN |
|---|---|---|---|---|---|
| AC-06.01 | Happy | Membuka chat dengan rincian terisi | Saya seorang Pelanggan<br>AND saya berada di halaman status pesanan TF-261019-A7K2 dari Depo Cilegon | Saya mengklik tombol "Chat depo di WhatsApp" | Tab atau aplikasi WhatsApp terbuka ke nomor Depo Cilegon<br>AND kolom pesan berisi kode TF-261019-A7K2, rincian barang, jadwal, dan alamat |
| AC-06.02 | Edge | Alamat berisi karakter & dan baris baru | Saya seorang Pelanggan<br>AND alamat pesanan "Gg. Haji & Sons<br>RT 03" | Saya mengklik tombol "Chat depo di WhatsApp" | Pesan WhatsApp menampilkan alamat utuh termasuk "&" dan baris baru (teks di-encode dengan `encodeURIComponent`) |

### 8.8 US-07 Masuk sebagai Petugas

Akun dibuat owner di Supabase (tidak ada pendaftaran mandiri). A1 berisi "Email", "Kata sandi", tombol "Masuk". Semua path `/admin/*` selain `/admin/masuk` mengarah ke A1 jika belum masuk.

| AC-ID | Kategori | Skenario | GIVEN | WHEN | THEN |
|---|---|---|---|---|---|
| AC-07.01 | Happy | Admin depo masuk | Saya seorang Admin depo Cilegon<br>AND saya berada di halaman "Masuk petugas" | Saya mengetik email dan kata sandi akun saya<br>AND saya mengklik tombol "Masuk" | Sistem membuka halaman "Pesanan" dengan judul "Pesanan Depo Cilegon" |
| AC-07.02 | Negative | Kata sandi salah | Saya seorang Admin depo<br>AND saya berada di halaman "Masuk petugas" | Saya mengetik email akun saya<br>AND saya mengetik kata sandi yang salah<br>AND saya mengklik tombol "Masuk" | Muncul teks "Email atau kata sandi salah"<br>AND saya tetap di halaman "Masuk petugas" |
| AC-07.03 | Permission | Akun Supabase tanpa baris staf | Saya pengguna dengan akun Supabase yang tidak terdaftar sebagai staf<br>AND saya berada di halaman "Masuk petugas" | Saya mengetik email dan kata sandi akun tersebut<br>AND saya mengklik tombol "Masuk" | Muncul teks "Akun ini belum terdaftar sebagai petugas. Hubungi owner."<br>AND sesi keluar otomatis |
| AC-07.04 | Permission | Admin depo membuka halaman owner | Saya seorang Admin depo Cilegon yang sudah masuk | Saya mengetik alamat "/admin/harga" di browser | Sistem membuka halaman "Pesanan"<br>AND muncul teks "Halaman ini khusus owner" |
| AC-07.05 | Happy | Keluar | Saya seorang Admin depo yang sudah masuk<br>AND saya berada di halaman "Pesanan" | Saya mengklik tombol "Keluar" | Sistem membuka halaman "Masuk petugas"<br>AND membuka "/admin" lagi mengarah ke "Masuk petugas" |

### 8.9 US-08 Memproses Pesanan Masuk

A2: tab filter "Baru", "Diproses", "Dalam pengiriman", "Selesai", "Dibatalkan", "Semua", masing-masing dengan jumlah. Kartu pesanan: kode, nama, jam antar, total kg, total rupiah, badge status, jarak. Owner punya dropdown "Depo" (Semua depo / per depo). Pesanan Baru diurutkan paling lama dulu. Daftar diperbarui realtime; pesanan Baru yang masuk memutar bunyi singkat dan menampilkan notifikasi "Pesanan baru TF-261019-A7K2".

A3: semua data pesanan, link "Buka di Google Maps" (`https://maps.google.com/?q={lat},{lng}`), tombol "Chat pelanggan" (wa.me ke nomor pelanggan), tombol aksi sesuai status, riwayat.

AC-08.01 Refer to MRTM Rows TRM_STATUS_001 through TRM_STATUS_009.

| User Story ID | AC ID | User | TCID | Status awal | Tombol | Input wajib | Hasil |
|---|---|---|---|---|---|---|---|
| US_08 | AC_08.01 | Admin depo | TRM_STATUS_001 | Baru | "Proses pesanan" | [-] | Status Diproses, notifikasi "Status pesanan diubah ke Diproses" |
| US_08 | AC_08.01 | Admin depo | TRM_STATUS_002 | Diproses | "Mulai antar" | "Nama kurir" 1-50 karakter | Status Dalam pengiriman, nama kurir tercatat |
| US_08 | AC_08.01 | Admin depo | TRM_STATUS_003 | Diproses | "Mulai antar" | "Nama kurir" kosong | Ditolak, teks "Nama kurir wajib diisi" |
| US_08 | AC_08.01 | Admin depo | TRM_STATUS_004 | Dalam pengiriman | "Tandai selesai" | Centang "Pembayaran sudah diterima" (default tercentang) | Status Selesai, `is_paid` sesuai centang |
| US_08 | AC_08.01 | Admin depo | TRM_STATUS_005 | Baru | "Mulai antar", "Tandai selesai" | [-] | Tombol tidak ditampilkan (tidak boleh melompati status) |
| US_08 | AC_08.01 | Admin depo | TRM_STATUS_006 | Selesai | Semua tombol aksi | [-] | Tidak ada tombol aksi |
| US_08 | AC_08.01 | Admin depo | TRM_STATUS_007 | Dibatalkan | Semua tombol aksi | [-] | Tidak ada tombol aksi |
| US_08 | AC_08.01 | Admin depo | TRM_STATUS_008 | Baru, tapi sudah diubah petugas lain ke Diproses | "Proses pesanan" | [-] | Ditolak, teks "Status pesanan sudah diubah petugas lain. Muat ulang halaman." |
| US_08 | AC_08.01 | Admin depo Serang | TRM_STATUS_009 | Pesanan Depo Cilegon | Buka `/admin/pesanan/:id` | [-] | Teks "Pesanan tidak ditemukan", data tidak tampil |

| AC-ID | Kategori | Skenario | GIVEN | WHEN | THEN |
|---|---|---|---|---|---|
| AC-08.02 | Happy | Pesanan baru masuk saat daftar terbuka | Saya seorang Admin depo Cilegon<br>AND saya berada di halaman "Pesanan" tab "Baru" berisi 2 pesanan | Saya menunggu pelanggan mengirim pesanan ke Depo Cilegon | Kartu pesanan baru muncul di tab "Baru" tanpa muat ulang<br>AND jumlah pada tab "Baru" menjadi 3<br>AND muncul notifikasi "Pesanan baru TF-261019-XXXX" |
| AC-08.03 | Permission | Admin depo hanya melihat depo sendiri | Saya seorang Admin depo Serang<br>AND ada 4 pesanan Depo Cilegon dan 1 pesanan Depo Serang | Saya membuka halaman "Pesanan" tab "Semua" | Daftar hanya berisi 1 pesanan Depo Serang<br>AND dropdown "Depo" tidak ditampilkan |
| AC-08.04 | Boundary | Nama kurir 51 karakter | Saya seorang Admin depo<br>AND saya berada di halaman "Detail pesanan" berstatus Diproses | Saya mengklik tombol "Mulai antar"<br>AND saya mengetik nama kurir sepanjang 51 karakter<br>AND saya mengklik tombol "Mulai antar" di dialog | Muncul teks "Nama kurir maksimal 50 karakter"<br>AND status tetap Diproses |

### 8.10 US-09 Membatalkan Pesanan

Tombol "Batalkan pesanan" hanya ada pada status Baru dan Diproses. Dialog berisi pilihan alasan ("Stok tidak cukup", "Pelanggan membatalkan", "Alamat tidak terjangkau", "Lainnya") dan field "Keterangan" (wajib jika "Lainnya", maks 200 karakter), tombol "Batalkan pesanan" dan "Jangan batalkan".

| AC-ID | Kategori | Skenario | GIVEN | WHEN | THEN |
|---|---|---|---|---|---|
| AC-09.01 | Happy | Membatalkan pesanan Diproses | Saya seorang Admin depo Cilegon<br>AND saya berada di halaman "Detail pesanan" TF-261019-A7K2 berstatus Diproses berisi Telur reguler 3 kg<br>AND stok Telur reguler Depo Cilegon 10 kg | Saya mengklik tombol "Batalkan pesanan"<br>AND saya memilih alasan "Pelanggan membatalkan"<br>AND saya mengklik tombol "Batalkan pesanan" di dialog | Muncul notifikasi "Pesanan dibatalkan. Stok dikembalikan."<br>AND status menjadi Dibatalkan<br>AND stok Telur reguler Depo Cilegon menjadi 13 kg |
| AC-09.02 | Negative | Alasan Lainnya tanpa keterangan | Saya seorang Admin depo<br>AND dialog "Batalkan pesanan" terbuka | Saya memilih alasan "Lainnya"<br>AND saya membiarkan field "Keterangan" kosong<br>AND saya mengklik tombol "Batalkan pesanan" di dialog | Muncul teks "Keterangan wajib diisi"<br>AND dialog tetap terbuka<br>AND status tidak berubah |
| AC-09.03 | Negative | Kembali dari dialog | Saya seorang Admin depo<br>AND dialog "Batalkan pesanan" terbuka | Saya mengklik tombol "Jangan batalkan" | Dialog tertutup<br>AND status dan stok tidak berubah |
| AC-09.04 | Edge | Pembatalan ganda dari dua perangkat | Saya seorang Admin depo<br>AND pesanan TF-261019-A7K2 sudah dibatalkan dari perangkat lain<br>AND halaman saya masih menampilkan status Diproses | Saya mengklik tombol "Batalkan pesanan"<br>AND saya memilih alasan "Stok tidak cukup"<br>AND saya mengklik tombol "Batalkan pesanan" di dialog | Muncul teks "Status pesanan sudah diubah petugas lain. Muat ulang halaman."<br>AND stok hanya bertambah satu kali (dari pembatalan pertama) |

### 8.11 US-10 Memperbarui Stok Depo

A4: tabel per varian dengan kolom "Varian", "Stok (kg)", "Diperbarui", field angka dan tombol "Simpan stok" per baris. Info "Stok berkurang otomatis saat pesanan masuk dan kembali saat pesanan dibatalkan. Isi angka hasil timbang terbaru." Owner memilih depo lewat dropdown.

| AC-ID | Kategori | Skenario | GIVEN | WHEN | THEN |
|---|---|---|---|---|---|
| AC-10.01 | Happy | Mengisi stok hasil timbang | Saya seorang Admin depo Cilegon<br>AND saya berada di halaman "Stok depo"<br>AND stok Telur reguler 10 kg | Saya mengetik "45,5" di field stok Telur reguler<br>AND saya mengklik tombol "Simpan stok" di baris tersebut | Muncul notifikasi "Stok disimpan"<br>AND kolom "Stok (kg)" menampilkan "45,5"<br>AND kolom "Diperbarui" menampilkan jam sekarang dan "oleh {nama saya}" |
| AC-10.02 | Negative | Stok negatif | Saya seorang Admin depo<br>AND saya berada di halaman "Stok depo" | Saya mengetik "-1" di field stok Telur reguler<br>AND saya mengklik tombol "Simpan stok" | Muncul teks "Stok tidak boleh kurang dari 0"<br>AND stok tidak berubah |
| AC-10.03 | Boundary | Stok 0 | Saya seorang Admin depo<br>AND saya berada di halaman "Stok depo" | Saya mengetik "0" di field stok Telur pilihan<br>AND saya mengklik tombol "Simpan stok" | Muncul notifikasi "Stok disimpan"<br>AND Depo ini tidak layak untuk keranjang berisi Telur pilihan |
| AC-10.04 | Boundary | Stok di atas 10.000 kg | Saya seorang Admin depo<br>AND saya berada di halaman "Stok depo" | Saya mengetik "10000,5" di field stok Telur reguler<br>AND saya mengklik tombol "Simpan stok" | Muncul teks "Stok maksimal 10.000 kg" |
| AC-10.05 | Negative | Stok bukan kelipatan 0,5 | Saya seorang Admin depo<br>AND saya berada di halaman "Stok depo" | Saya mengetik "12,3" di field stok Telur reguler<br>AND saya mengklik tombol "Simpan stok" | Muncul teks "Stok harus kelipatan 0,5 kg" |

### 8.12 US-11 Mengatur Harga dan Status Jual

A5: per varian ada field "Harga per kg (Rp)", toggle "Dijual", tombol "Simpan harga". Info "Harga baru berlaku untuk pesanan berikutnya. Pesanan yang sudah masuk memakai harga lama."

| AC-ID | Kategori | Skenario | GIVEN | WHEN | THEN |
|---|---|---|---|---|---|
| AC-11.01 | Happy | Mengubah harga | Saya seorang Owner<br>AND saya berada di halaman "Harga varian"<br>AND harga Telur reguler Rp24.000<br>AND ada pesanan Baru berisi Telur reguler 3 kg senilai Rp72.000 | Saya mengetik "25000" di field "Harga per kg (Rp)" Telur reguler<br>AND saya mengklik tombol "Simpan harga" | Muncul notifikasi "Harga disimpan"<br>AND katalog menampilkan "Rp25.000/kg"<br>AND pesanan Baru tadi tetap bernilai Rp72.000 |
| AC-11.02 | Boundary | Harga di bawah Rp1.000 | Saya seorang Owner<br>AND saya berada di halaman "Harga varian" | Saya mengetik "999" di field "Harga per kg (Rp)" Telur ekonomis<br>AND saya mengklik tombol "Simpan harga" | Muncul teks "Harga harus antara Rp1.000 dan Rp100.000" |
| AC-11.03 | Boundary | Harga tepat Rp100.000 | Saya seorang Owner<br>AND saya berada di halaman "Harga varian" | Saya mengetik "100000" di field "Harga per kg (Rp)" Telur pilihan<br>AND saya mengklik tombol "Simpan harga" | Muncul notifikasi "Harga disimpan" |
| AC-11.04 | Happy | Menonaktifkan varian | Saya seorang Owner<br>AND saya berada di halaman "Harga varian" | Saya mengklik toggle "Dijual" Telur pilihan sampai mati<br>AND saya mengklik tombol "Simpan harga" | Muncul notifikasi "Harga disimpan"<br>AND kartu Telur pilihan tidak tampil di katalog |
| AC-11.05 | Negative | Menonaktifkan semua varian | Saya seorang Owner<br>AND saya berada di halaman "Harga varian"<br>AND hanya Telur reguler yang masih dijual | Saya mengklik toggle "Dijual" Telur reguler sampai mati<br>AND saya mengklik tombol "Simpan harga" | Muncul teks "Minimal satu varian harus dijual"<br>AND Telur reguler tetap dijual |

### 8.13 US-12 Melihat Rekap Pilot

A6: filter periode ("7 hari terakhir", "30 hari terakhir", "Pilih tanggal" dengan dari/sampai), dropdown "Depo". Kartu angka:

| Label | Definisi |
|---|---|
| "Pesanan selesai" | Jumlah pesanan berstatus Selesai, tanggal antar dalam periode |
| "Kg terjual" | Jumlah berat pesanan Selesai |
| "Rata-rata kg per pesanan" | Kg terjual / Pesanan selesai, 1 desimal |
| "Pendapatan diterima" | Jumlah total pesanan Selesai dengan pembayaran diterima |
| "Pelanggan" | Jumlah nomor WhatsApp unik dengan pesanan Selesai |
| "Pelanggan pesan ulang" | Nomor dengan 2 pesanan Selesai atau lebih dalam periode, beserta persentase dari "Pelanggan" |
| "Pembatalan" | Pesanan Dibatalkan / semua pesanan dibuat dalam periode, persen |

Tabel per depo dengan kolom yang sama. Di bawahnya kalkulator titik impas (hanya di klien, tidak disimpan): field "Biaya antar per pesanan (Rp)", "Harga jual ke tengkulak per kg (Rp)"; hasil "Titik impas: X kg per pesanan" dihitung dengan rumus bagian 1.2 memakai harga rata-rata per kg dari pesanan Selesai, dan teks "Di atas titik impas" atau "Di bawah titik impas" dibandingkan dengan "Rata-rata kg per pesanan".

| AC-ID | Kategori | Skenario | GIVEN | WHEN | THEN |
|---|---|---|---|---|---|
| AC-12.01 | Happy | Melihat rekap 7 hari | Saya seorang Owner<br>AND saya berada di halaman "Rekap pilot"<br>AND 7 hari terakhir ada 10 pesanan Selesai total 42 kg dari 8 nomor, 2 nomor memesan 2 kali, dan 2 pesanan Dibatalkan | Saya memilih "7 hari terakhir" | Kartu menampilkan "Pesanan selesai 10", "Kg terjual 42 kg", "Rata-rata kg per pesanan 4,2 kg", "Pelanggan 8", "Pelanggan pesan ulang 2 (25%)", "Pembatalan 17%" |
| AC-12.02 | Happy | Kalkulator titik impas | Saya seorang Owner<br>AND saya berada di halaman "Rekap pilot"<br>AND harga rata-rata pesanan Selesai Rp24.000/kg<br>AND rata-rata 4,2 kg per pesanan | Saya mengetik "8000" di field "Biaya antar per pesanan (Rp)"<br>AND saya mengetik "22000" di field "Harga jual ke tengkulak per kg (Rp)" | Tampil "Titik impas: 4,0 kg per pesanan"<br>AND tampil "Di atas titik impas" |
| AC-12.03 | Edge | Harga tengkulak sama atau lebih tinggi dari harga jual | Saya seorang Owner<br>AND saya berada di halaman "Rekap pilot"<br>AND harga rata-rata pesanan Selesai Rp24.000/kg | Saya mengetik "24000" di field "Harga jual ke tengkulak per kg (Rp)" | Tampil "Harga jual langsung tidak lebih tinggi dari harga tengkulak. Antar gratis selalu rugi." |
| AC-12.04 | Edge | Periode tanpa pesanan | Saya seorang Owner<br>AND saya berada di halaman "Rekap pilot" | Saya memilih "Pilih tanggal" dari 1 Januari 2026 sampai 2 Januari 2026 | Semua kartu menampilkan 0<br>AND "Rata-rata kg per pesanan" menampilkan "-"<br>AND tampil teks "Belum ada pesanan selesai di periode ini" |
| AC-12.05 | Negative | Tanggal sampai sebelum tanggal dari | Saya seorang Owner<br>AND saya berada di halaman "Rekap pilot" | Saya memilih "Pilih tanggal" dari 10 Oktober 2026 sampai 1 Oktober 2026 | Muncul teks "Tanggal sampai harus sama atau setelah tanggal dari"<br>AND kartu tidak diperbarui |

---

## 9. Backend Supabase

### 9.1 Mana yang wajib server, mana yang boleh mock

| Bagian | Pilot | Pratinjau AI Studio |
|---|---|---|
| Pembuatan pesanan, pengurangan stok, harga, kelayakan depo, jadwal | WAJIB RPC server (`create_order`). Satu transaksi, aman dari dua pembeli bersamaan | Mock boleh di localStorage |
| Login petugas dan pembatasan per depo | WAJIB Supabase Auth + RLS | Mock: pilihan peran di layar masuk |
| Lacak pesanan pelanggan | WAJIB RPC (`track_order`) yang memeriksa 4 digit | Mock boleh |
| Perubahan status dan pembatalan | WAJIB RPC (`set_order_status`) dengan cek status awal | Mock boleh |
| Pesanan baru realtime | Supabase Realtime pada tabel `orders` (sudah difilter RLS) | Mock: polling localStorage |
| Keranjang, lokasi sementara, pesanan terakhir | Klien saja (localStorage/sessionStorage) | Sama |
| Kalkulator titik impas | Klien saja | Sama |

### 9.2 Skema

Jalankan di Supabase SQL Editor.

```sql
create extension if not exists pgcrypto;

create table depots (
  id text primary key,
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  radius_km numeric(5,2) not null default 5 check (radius_km > 0),
  wa_number text not null,
  is_active boolean not null default true,
  coords_verified boolean not null default false
);

create table variants (
  id text primary key,
  name text not null,
  description text not null,
  price_per_kg integer not null check (price_per_kg between 1000 and 100000),
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table depot_stock (
  depot_id text not null references depots(id),
  variant_id text not null references variants(id),
  stock_kg numeric(8,1) not null default 0
    check (stock_kg >= 0 and stock_kg <= 10000 and stock_kg * 2 = trunc(stock_kg * 2)),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  updated_by_name text, -- nama petugas; null = berubah otomatis karena pesanan dibuat atau dibatalkan
  primary key (depot_id, variant_id)
);

create table staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('owner', 'admin_depo')),
  depot_id text references depots(id),
  check ((role = 'owner' and depot_id is null) or (role = 'admin_depo' and depot_id is not null))
);

create type order_status as enum ('baru', 'diproses', 'dikirim', 'selesai', 'dibatalkan');

create table orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  depot_id text not null references depots(id),
  customer_name text not null,
  customer_phone text not null,
  address_text text not null,
  address_note text,
  lat double precision not null,
  lng double precision not null,
  distance_km numeric(6,2) not null,
  delivery_date date not null,
  delivery_slot text not null check (delivery_slot in ('pagi', 'sore')),
  subtotal integer not null default 0,
  delivery_fee integer not null default 0,
  total integer not null default 0,
  payment_method text not null default 'bayar_di_tempat',
  is_paid boolean not null default false,
  status order_status not null default 'baru',
  courier_name text,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_depot_status on orders (depot_id, status);
create index orders_phone_status on orders (customer_phone, status);

create table order_items (
  order_id uuid not null references orders(id) on delete cascade,
  variant_id text not null references variants(id),
  variant_name text not null,
  qty_kg numeric(5,1) not null,
  price_per_kg integer not null,
  line_total integer not null,
  primary key (order_id, variant_id)
);

create table order_events (
  id bigserial primary key,
  order_id uuid not null references orders(id) on delete cascade,
  from_status order_status,
  to_status order_status not null,
  note text,
  actor uuid references auth.users(id),
  created_at timestamptz not null default now()
);
```

### 9.3 Data awal (koordinat CONTOH, wajib diganti titik ruko nyata)

```sql
insert into depots (id, name, address, lat, lng, wa_number) values
  ('anyer',   'Depo Anyer',   'GANTI alamat ruko Anyer',   -6.0620, 105.9230, '628GANTI'),
  ('cilegon', 'Depo Cilegon', 'GANTI alamat ruko Cilegon', -6.0170, 106.0560, '628GANTI'),
  ('serang',  'Depo Serang',  'GANTI alamat ruko Serang',  -6.1200, 106.1500, '628GANTI');

insert into variants (id, name, description, price_per_kg, sort_order) values
  ('reguler',  'Telur reguler',  'Ukuran campur, untuk masak harian', 24000, 1),
  ('pilihan',  'Telur pilihan',  'Ukuran besar dan seragam',          27000, 2),
  ('ekonomis', 'Telur ekonomis', 'Ukuran kecil, harga lebih hemat',   22000, 3);

insert into depot_stock (depot_id, variant_id, stock_kg)
select d.id, v.id, 0 from depots d cross join variants v;
```

### 9.4 Fungsi bantu

```sql
create or replace function distance_km(lat1 float8, lng1 float8, lat2 float8, lng2 float8)
returns float8 language sql immutable as $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- 08xxxxxxxx (10-13 digit) atau 628xxxxxxxx -> 628xxxxxxxx; selain itu null
create or replace function normalize_phone(raw text)
returns text language sql immutable as $$
  select case
    when d ~ '^08[0-9]{8,11}$' then '62' || substr(d, 2)
    when d ~ '^628[0-9]{8,11}$' then d
    else null end
  from (select regexp_replace(coalesce(raw, ''), '[^0-9]', '', 'g') as d) s;
$$;

create or replace function current_staff()
returns staff language sql stable security definer set search_path = public as $$
  select * from staff where user_id = auth.uid();
$$;
```

### 9.5 RPC `create_order` (dipanggil anon)

Mengembalikan kode error sebagai pesan exception. Frontend memetakan kode ke teks UI:

| Kode | Teks UI |
|---|---|
| ERR_NAME | "Nama wajib diisi" / "Nama maksimal 80 karakter" (bedakan di klien) |
| ERR_PHONE | "Nomor WhatsApp tidak valid. Contoh: 0812 3456 7890" |
| ERR_ADDRESS | "Alamat wajib diisi" |
| ERR_SLOT | "Jadwal yang dipilih sudah tutup. Pilih jadwal lain." |
| ERR_LIMIT | "Nomor ini masih punya 3 pesanan berjalan. Hubungi depo lewat WhatsApp untuk pesanan tambahan." |
| ERR_DEPOT | "Depo yang dipilih tidak bisa mengantar ke lokasi ini. Pilih depo lagi." |
| ERR_EMPTY | "Keranjang masih kosong" |
| ERR_QTY | "Berat tidak valid. Periksa keranjang." |
| ERR_VARIANT | "Ada telur yang sedang tidak dijual. Periksa keranjang." |
| ERR_STOCK | "Stok berubah saat Anda memesan. Pilih depo lagi atau kurangi berat." |
| ERR_MIN_TOTAL | "Minimal pesanan 2 kg" |
| ERR_MAX_TOTAL | "Maksimal pesanan 50 kg. Untuk jumlah lebih besar, hubungi depo lewat WhatsApp." |

```sql
create or replace function create_order(p jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_now timestamp := now() at time zone 'Asia/Jakarta';
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
  v_phone text := normalize_phone(p->>'phone');
  v_name text := trim(coalesce(p->>'name', ''));
  v_address text := trim(coalesce(p->>'address', ''));
  v_note text := nullif(trim(coalesce(p->>'note', '')), '');
  v_date date := (p->>'delivery_date')::date;
  v_slot text := p->>'delivery_slot';
  v_lat float8 := (p->>'lat')::float8;
  v_lng float8 := (p->>'lng')::float8;
  v_depot depots%rowtype;
  v_variant variants%rowtype;
  v_dist float8;
  v_item jsonb;
  v_qty numeric;
  v_line integer;
  v_total_kg numeric := 0;
  v_subtotal integer := 0;
  v_order_id uuid;
  v_code text;
begin
  if length(v_name) not between 1 and 80 then raise exception 'ERR_NAME'; end if;
  if v_phone is null then raise exception 'ERR_PHONE'; end if;
  if length(v_address) not between 5 and 300 then raise exception 'ERR_ADDRESS'; end if;
  if v_note is not null and length(v_note) > 200 then v_note := left(v_note, 200); end if;

  if v_slot is null or v_slot not in ('pagi', 'sore')
     or v_date is null or v_date < v_today or v_date > v_today + 2
     or (v_date = v_today and v_slot = 'pagi' and v_now::time >= time '07:00')
     or (v_date = v_today and v_slot = 'sore' and v_now::time >= time '12:00') then
    raise exception 'ERR_SLOT';
  end if;

  if (select count(*) from orders
      where customer_phone = v_phone and status in ('baru', 'diproses', 'dikirim')) >= 3 then
    raise exception 'ERR_LIMIT';
  end if;

  select * into v_depot from depots where id = p->>'depot_id' and is_active;
  if not found then raise exception 'ERR_DEPOT'; end if;
  v_dist := distance_km(v_lat, v_lng, v_depot.lat, v_depot.lng);
  if v_dist > v_depot.radius_km then raise exception 'ERR_DEPOT'; end if;

  if jsonb_typeof(p->'items') <> 'array' or jsonb_array_length(p->'items') = 0 then
    raise exception 'ERR_EMPTY';
  end if;

  loop
    v_code := 'TF-' || to_char(v_now, 'YYMMDD') || '-' || upper(substr(encode(gen_random_bytes(3), 'hex'), 1, 4));
    exit when not exists (select 1 from orders where code = v_code);
  end loop;

  insert into orders (code, depot_id, customer_name, customer_phone, address_text, address_note,
                      lat, lng, distance_km, delivery_date, delivery_slot)
  values (v_code, v_depot.id, v_name, v_phone, v_address, v_note,
          v_lat, v_lng, round(v_dist::numeric, 2), v_date, v_slot)
  returning id into v_order_id;

  -- urut per variant_id supaya penguncian baris stok konsisten
  for v_item in
    select value from jsonb_array_elements(p->'items') order by value->>'variant_id'
  loop
    v_qty := (v_item->>'qty_kg')::numeric;
    if v_qty is null or v_qty < 1 or v_qty > 30 or v_qty * 2 <> trunc(v_qty * 2) then
      raise exception 'ERR_QTY';
    end if;

    select * into v_variant from variants where id = v_item->>'variant_id' and is_active;
    if not found then raise exception 'ERR_VARIANT'; end if;

    update depot_stock
       set stock_kg = stock_kg - v_qty, updated_at = now(), updated_by = null, updated_by_name = null
     where depot_id = v_depot.id and variant_id = v_variant.id and stock_kg >= v_qty;
    if not found then raise exception 'ERR_STOCK'; end if;

    v_line := round(v_qty * v_variant.price_per_kg);
    begin
      insert into order_items (order_id, variant_id, variant_name, qty_kg, price_per_kg, line_total)
      values (v_order_id, v_variant.id, v_variant.name, v_qty, v_variant.price_per_kg, v_line);
    exception when unique_violation then
      raise exception 'ERR_QTY';
    end;

    v_total_kg := v_total_kg + v_qty;
    v_subtotal := v_subtotal + v_line;
  end loop;

  if v_total_kg < 2 then raise exception 'ERR_MIN_TOTAL'; end if;
  if v_total_kg > 50 then raise exception 'ERR_MAX_TOTAL'; end if;

  update orders set subtotal = v_subtotal, total = v_subtotal where id = v_order_id;
  insert into order_events (order_id, from_status, to_status, note)
  values (v_order_id, null, 'baru', 'Pesanan dibuat pelanggan');

  return jsonb_build_object('code', v_code, 'depot_name', v_depot.name,
                            'depot_wa', v_depot.wa_number, 'total', v_subtotal);
end;
$$;
```

Setiap `raise exception` membatalkan seluruh transaksi, termasuk pengurangan stok yang sudah terjadi di iterasi sebelumnya.

### 9.6 RPC lain (kontrak)

Semua `security definer`, `set search_path = public, extensions` (di Supabase, pgcrypto terpasang di schema `extensions`). Nama parameter memakai awalan `p_` supaya tidak bentrok dengan nama kolom di PL/pgSQL (`depot_id`, `stock_kg`, dan seterusnya akan dianggap ambigu). Klien memanggil dengan nama yang sama persis.

| RPC | Pemanggil | Masukan | Keluaran | Aturan |
|---|---|---|---|---|
| `check_depots(p_lat, p_lng, p_items jsonb)` | anon | titik + `[{variant_id, qty_kg}]` | baris per depo: `id, name, address, distance_km, radius_km, eligible, reason` | `reason` salah satu `closed`, `out_of_range`, `stock:<variant_name>`, atau null. Prioritas closed > out_of_range > stock. Tidak mengembalikan angka stok. Urut: eligible dulu, lalu jarak |
| `track_order(p_code, p_last4)` | anon | kode (trim, upper), 4 digit | jsonb pesanan + items + events + depot name/wa, atau null | Cocok jika `right(customer_phone, 4) = p_last4`. Tidak mengembalikan nomor lengkap |
| `set_order_status(p_order_id, p_expected_status, p_to_status, p_courier_name, p_cancel_reason, p_is_paid)` | authenticated staf | sesuai nama | jsonb pesanan terbaru | Staf harus owner atau admin depo pesanan itu. `update ... where id = p_order_id and status = p_expected_status`; 0 baris -> `ERR_STALE`. Transisi valid: baru->diproses, diproses->dikirim (courier 1-50 karakter), dikirim->selesai, baru->dibatalkan, diproses->dibatalkan (alasan wajib). Pembatalan menambah stok tiap item dalam transaksi yang sama, dengan `updated_by_name = null`. Tulis `order_events` dengan `actor = auth.uid()` |
| `set_stock(p_depot_id, p_variant_id, p_stock_kg)` | authenticated staf | sesuai nama | baris stok | Owner semua depo, admin depo hanya depo sendiri. Validasi BR-16. Isi `updated_by = auth.uid()` dan `updated_by_name` dari `staff.full_name`. Klien membaca `updated_by_name`, bukan UUID |
| `pilot_summary(p_date_from, p_date_to, p_depot_id null)` | owner | periode | jsonb angka bagian 8.13 total dan per depo, plus `avg_price_per_kg` | Tolak jika bukan owner. Filter `delivery_date` |

### 9.7 RLS

```sql
alter table depots enable row level security;
alter table variants enable row level security;
alter table depot_stock enable row level security;
alter table staff enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_events enable row level security;

create policy depots_read on depots for select using (true);
create policy depots_owner_write on depots for update using ((current_staff()).role = 'owner');

create policy variants_read on variants for select
  using (is_active or (current_staff()).role = 'owner');
create policy variants_owner_write on variants for update
  using ((current_staff()).role = 'owner');

create policy stock_staff_read on depot_stock for select
  using ((current_staff()).role = 'owner' or (current_staff()).depot_id = depot_id);

create policy staff_self_read on staff for select
  using (user_id = auth.uid() or (current_staff()).role = 'owner');

create policy orders_staff_read on orders for select
  using ((current_staff()).role = 'owner' or (current_staff()).depot_id = depot_id);
create policy items_staff_read on order_items for select
  using (exists (select 1 from orders o where o.id = order_id));
create policy events_staff_read on order_events for select
  using (exists (select 1 from orders o where o.id = order_id));

-- tidak ada policy insert/update/delete untuk orders, order_items, order_events, depot_stock:
-- semua perubahan lewat RPC security definer

revoke all on function create_order(jsonb) from public;
grant execute on function create_order(jsonb) to anon, authenticated;
-- ulangi grant untuk check_depots, track_order ke anon;
-- set_order_status, set_stock, pilot_summary hanya ke authenticated

alter publication supabase_realtime add table orders;
```

Owner menyalakan validasi "Minimal satu varian harus dijual" (AC-11.05) dengan memeriksa di klien sebelum update dan dengan trigger `before update on variants` yang menolak jika tidak ada lagi baris `is_active`.

---

## 10. Struktur file frontend

```
src/
  main.tsx
  App.tsx                 # router
  config.ts               # baca VITE_* env
  types.ts                # Variant, Depot, DepotCheck, CartItem, Order, OrderItem, OrderEvent, Staff, PilotSummary
  lib/
    format.ts             # formatRupiah, formatKg, formatTanggal
    validate.ts           # aturan BR-01, BR-02, BR-09, batas field
    slots.ts              # MRTM_SLOT, waktu Asia/Jakarta
    whatsapp.ts           # pembuat link wa.me
    errors.ts             # peta kode ERR_* ke teks UI
  services/
    DataService.ts        # interface
    mockService.ts        # localStorage, data contoh bagian 9.3 dengan stok 50 kg
    supabaseService.ts    # supabase-js + RPC bagian 9
    index.ts              # pilih berdasarkan VITE_DATA_MODE
  state/
    cart.ts               # keranjang di localStorage tf_cart
  components/
    Header.tsx  BottomBar.tsx  VariantCard.tsx  QtyStepper.tsx
    DepotCard.tsx  MapPicker.tsx  StatusBadge.tsx  Timeline.tsx  Toast.tsx
  pages/customer/
    Catalog.tsx  Cart.tsx  Location.tsx  Checkout.tsx  OrderStatus.tsx  Track.tsx
  pages/admin/
    Login.tsx  Orders.tsx  OrderDetail.tsx  Stock.tsx  Prices.tsx  Summary.tsx  AdminLayout.tsx
```

Variabel lingkungan: `VITE_DATA_MODE`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OWNER_WA`.

---

## 11. Daftar uji penerimaan (ringkas)

Lulus pilot jika semua AC di bagian 8 lulus di mode `supabase`, ditambah:

| No | Uji | Cara |
|---|---|---|
| T-01 | Dua pembeli bersamaan berebut stok terakhir | Stok Telur pilihan Depo Cilegon 2 kg. Dua ponsel kirim pesanan 2 kg dalam detik yang sama. Tepat satu berhasil, satu mendapat ERR_STOCK, stok akhir 0 |
| T-02 | RLS memblokir tulis langsung | Dari konsol browser anon: `supabase.from('orders').insert(...)` dan `supabase.from('depot_stock').update(...)` ditolak |
| T-03 | Anon tidak bisa membaca pesanan | `supabase.from('orders').select('*')` sebagai anon mengembalikan 0 baris |
| T-04 | Admin depo lain tidak bisa membaca | Admin Serang memanggil `select` pesanan Cilegon: 0 baris |
| T-05 | Ponsel Android kelas menengah, sinyal 3G | Alur P1-P5 selesai di bawah 2 menit, peta tampil |
| T-06 | Harga terkunci | Ubah harga setelah pesanan dibuat, total pesanan lama tetap |
| T-07 | Pembatalan mengembalikan stok sekali | Batalkan dari dua tab bersamaan, stok bertambah sekali |
