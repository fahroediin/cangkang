# Cangkang

Codename untuk proyek **Telur Farm**: aplikasi web dan mobile (Android/iOS) untuk peternakan ayam petelur, dari pencatatan kandang sampai pesan-antar telur ke konsumen lewat depo terdekat.

Nama diambil dari identitas visual di dokumen mockup: palet "cangkang telur coklat, krem, kuning telur, dan putih", dengan coklat telur `#704529` sebagai warna utama. Cangkang juga yang melindungi isi, sama seperti aplikasi ini menjaga alur stok dari kandang sampai ke tangan pembeli.

## Konteks singkat

- Pemilik: peternak dengan 10.000 ekor ayam petelur di Banten, menyuplai hotel di Anyer.
- Masalah: harga ditekan tengkulak (beli Rp21.000-23.000/kg, di bawah HPP proyeksi Rp26.000/kg).
- Jawaban yang dipilih rapat 2026-10-14: jual langsung ke konsumen dan hotel lewat aplikasi pesan-antar, ruko milik sendiri jadi depo, ongkir gratis 1 tahun.
- Pilot: skala kecil di Banten, depo Anyer, Cilegon, Serang.

## Isi repo

| Path | Isi |
|---|---|
| `docs/00-ringkasan-sumber.md` | Rangkuman semua dokumen sumber, status aplikasi v3.1, dan celah yang perlu diputuskan |
| `docs/01-spec-mvp-pilot-banten.md` | Spec mandiri MVP pesan-antar untuk ditempel ke Google AI Studio: US/AC, aturan bisnis, skema dan RPC Supabase |
| `docs/02-plan-mvp-pilot-banten.md` | Plan tahap 0-5: konfirmasi pemilik, prototipe mock, Supabase, sambung, rilis, evaluasi |
| `docs/sumber/` | Tempat dokumen asli (diabaikan git, lihat `.gitignore`) |
| `src/` | Aplikasi web MVP: React 19 + Vite + TypeScript + Tailwind 4, peta Leaflet, Supabase |
| `src/services/` | `DataService` dengan dua implementasi: `mockService` (localStorage) dan `supabaseService` (RPC) |
| `src/lib/` | Logika murni (validasi, jadwal antar, format, pemetaan error) beserta tesnya |

## Dokumen sumber

Disimpan di luar repo, `Downloads/TelurFarm/`:

1. `10-14_Rapat_Mingguan_...-Summary.docx` - notulen rapat 14 Oktober 2026
2. `User-Guide-TelurFarm-v3.1.docx` - panduan pengguna v3.1
3. `Mockup-Desain-Web-Mobile-TelurFarm-v3.docx` (+ `.pdf`) - 76 layar (W01-W32, M01-M44)
4. `RAB-TelurFarm-Web-Mobile-v3.xlsx` (+ `.pdf`) - anggaran
5. `TelurFarm-Native-Android-iOS-v3.0.0.zip` - source React Native/Expo

## Menjalankan lokal

Butuh [Bun](https://bun.sh) (atau Node 20+ dengan npm).

```bash
bun install
cp .env.example .env.local
bun run dev
```

Buka http://localhost:3000. Tanpa mengubah `.env.local`, aplikasi berjalan di mode `mock`: data contoh tersimpan di localStorage browser dan waktu "sekarang" dipatok Senin 19 Oktober 2026 pukul 09.00 WIB. Panel petugas ada di `/admin`.

| Perintah | Fungsi |
|---|---|
| `bun run dev` | Server pengembangan di port 3000 |
| `bun run test` | Tes logika murni di `src/lib/logic.test.ts` |
| `bun run lint` | Cek tipe TypeScript |
| `bun run build` | Build produksi ke `dist/` |

### Mode Supabase (pilot)

1. Jalankan SQL di spec bagian 9.2 sampai 9.7 di Supabase SQL Editor, lalu tulis RPC kontrak 9.6. Nama parameter RPC memakai awalan `p_`.
2. Isi `.env.local`: `VITE_DATA_MODE=supabase`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OWNER_WA`.
3. Jangan pernah mengisi service role key di klien.

Jika `VITE_DATA_MODE=supabase` tetapi URL atau anon key kosong, aplikasi berhenti dengan pesan galat. Aplikasi tidak diam-diam memakai mock, supaya pesanan pelanggan tidak tersimpan di browser saja.

## Status

- 2026-10-19: lingkup dipilih, MVP pesan-antar untuk pilot Banten (bukan melanjutkan v3.1).
- Kode awal di-generate Google AI Studio dari `docs/01-spec-mvp-pilot-banten.md`, lalu direview dan diperbaiki: build, pembacaan status pesanan di mode Supabase, nama parameter RPC, validasi kelipatan 0,5 kg, pesan galat, tanggal rekap, dan token desain.
- Mode mock sudah diuji manual untuk alur pelanggan (katalog sampai status pesanan). Mode Supabase belum diuji karena RPC 9.6 belum ditulis.
- Langkah berikutnya: Tahap 0 di plan (konfirmasi asumsi ke pemilik), lalu Tahap 2 (Supabase).
