# Plan MVP Cangkang: Pesan-Antar Telur Pilot Banten

Pasangan dari `01-spec-mvp-pilot-banten.md`. Tingkat fitur, bukan langkah kode. Generate kode di Google AI Studio; Claude dipakai untuk review dan perbaikan spec.

## Tahap 0. Konfirmasi ke pemilik (sebelum generate)

Kirim tabel asumsi spec bagian 3 ke pemilik. Minimal yang harus dijawab:

| No | Pertanyaan | Mengubah |
|---|---|---|
| 1 | Setuju web lewat link dulu, aplikasi Play Store menyusul setelah pilot? | A-01 |
| 2 | Berapa biaya antar per pesanan (bensin + waktu kurir)? Harga jual ke tengkulak hari ini? | A-04 minimal pesanan, lewat rumus spec 1.2 |
| 3 | Titik GPS dan alamat tiap ruko, nomor WhatsApp tiap depo, siapa admin tiap depo | Data awal 9.3, akun staf |
| 4 | Harga per kg tiga varian. Apakah penamaan reguler/pilihan/ekonomis cocok dengan bahasa pembeli? | A-12, katalog |
| 5 | Radius antar per depo | A-07 |
| 6 | Target pesanan per minggu untuk dianggap berhasil | Kriteria spec 1.2 |

Selesai jika: semua 6 terjawab dan nilai di spec diperbarui.

## Tahap 1. Prototipe mode mock di AI Studio

**Masukan:** tempel seluruh `01-spec-mvp-pilot-banten.md`. Lampirkan gambar mockup M02, M03, M04, M05, M06, M08 dari `Mockup-Desain-Web-Mobile-TelurFarm-v3.pdf` sebagai acuan visual.

**Prompt pembuka:**
> Bangun aplikasi sesuai dokumen ini. Mulai dengan mode `VITE_DATA_MODE=mock`. Kerjakan alur pelanggan dulu (P1-P6, US-01 sampai US-06). Abaikan bagian 9 kecuali untuk bentuk data dan kode error.

**Lanjutan (prompt kedua, setelah alur pelanggan jalan):**
> Tambahkan panel petugas A1-A6 (US-07 sampai US-12) di mode mock. Di layar masuk mock, sediakan tombol "Masuk sebagai Owner", "Masuk sebagai Admin Depo Cilegon", "Masuk sebagai Admin Depo Serang".

**Verifikasi manual (oleh Fahrudin):** jalankan AC kategori Happy dan Negative US-01 sampai US-12 di pratinjau AI Studio, layar ponsel 360 px. Catat AC yang gagal, perbaiki dengan prompt yang menyebut AC-ID.

Selesai jika: alur pesan dari katalog sampai status Selesai bisa dijalankan di mock, dan teks error sesuai AC.

## Tahap 2. Backend Supabase

Dikerjakan manual di Supabase, bukan oleh AI Studio.

1. Buat project Supabase region Singapore.
2. Jalankan SQL spec 9.2, 9.3 (dengan data dari Tahap 0), 9.4, 9.5, 9.7.
3. Tulis RPC kontrak 9.6 (`check_depots`, `track_order`, `set_order_status`, `set_stock`, `pilot_summary`) dan trigger minimal satu varian aktif. Bisa minta Claude atau AI Studio menulis SQL-nya dari tabel kontrak, lalu review.
4. Buat akun Auth untuk owner dan admin tiap depo, isi tabel `staff`. Matikan pendaftaran publik (Auth -> Providers -> Email -> Disable signup).
5. Isi stok awal tiap depo.

**Verifikasi:** jalankan T-01 sampai T-04 dan T-07 dari spec bagian 11 lewat SQL Editor dan konsol browser.

Selesai jika: kelima uji lulus.

## Tahap 3. Sambungkan ke Supabase

**Prompt AI Studio:**
> Lengkapi `supabaseService.ts` sesuai bagian 9.5-9.7. Semua tulis data lewat RPC. Petakan pesan exception `ERR_*` ke teks di tabel 9.5. Pakai Supabase Auth untuk A1 dan Supabase Realtime untuk A2.

Ekspor project dari AI Studio ke repo ini (`WEB/cangkang`), isi `.env.local`, jalankan lokal.

**Verifikasi:** ulangi semua AC bagian 8 di mode `supabase`, termasuk Boundary dan Edge. Uji T-05 di ponsel Android nyata.

Selesai jika: semua AC dan T-01 sampai T-07 lulus.

## Tahap 4. Rilis pilot

1. Deploy statis (Vercel, Netlify, atau Cloudflare Pages; build `npm run build`), isi env di dashboard hosting.
2. Domain atau subdomain pendek yang mudah diketik dan disebar lewat WhatsApp.
3. Uji coba internal 3 hari: keluarga dan karyawan memesan sungguhan dari tiap depo.
4. Briefing admin depo 1 jam: cek pesanan Baru tiap pagi dan siang, timbang ulang stok tiap pagi lalu isi A4, batalkan dengan alasan jika tidak sanggup.
5. Sebar link ke grup WhatsApp warga sekitar tiap depo, dengan pesan "Gratis ongkir".

## Tahap 5. Evaluasi minggu ke-4

Buka A6 untuk periode pilot. Isi kalkulator titik impas dengan biaya antar nyata. Putuskan memakai tabel kriteria spec 1.2: lanjut, ubah aturan (minimal pesanan, radius, ongkir), atau berhenti.

Jika lanjut, kandidat fitur berikutnya diambil dari TelurFarm v3.1 sesuai keluhan pilot, bukan sekaligus: akun pelanggan dan pesan ulang, harga Hotel/Resort, satuan butir, batch dan batas jual.

## Yang sengaja tidak dikerjakan Claude

Sesuai cara kerja proyek ini: Claude tidak menulis kode aplikasi. Peran Claude: merevisi spec saat asumsi berubah, mereview SQL RPC yang di-generate, dan membantu mendiagnosis AC yang gagal.
