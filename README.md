# Cangkang

Codename untuk proyek **TelurFarm**: aplikasi web dan mobile (Android/iOS) untuk peternakan ayam petelur, dari pencatatan kandang sampai pesan-antar telur ke konsumen lewat depo terdekat.

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

## Dokumen sumber

Disimpan di luar repo, `Downloads/TelurFarm/`:

1. `10-14_Rapat_Mingguan_...-Summary.docx` - notulen rapat 14 Oktober 2026
2. `User-Guide-TelurFarm-v3.1.docx` - panduan pengguna v3.1
3. `Mockup-Desain-Web-Mobile-TelurFarm-v3.docx` (+ `.pdf`) - 76 layar (W01-W32, M01-M44)
4. `RAB-TelurFarm-Web-Mobile-v3.xlsx` (+ `.pdf`) - anggaran
5. `TelurFarm-Native-Android-iOS-v3.0.0.zip` - source React Native/Expo

## Status

Lingkup dipilih 2026-10-19: MVP pesan-antar untuk pilot Banten, bukan melanjutkan v3.1. Belum ada kode. Langkah berikutnya: Tahap 0 di plan, konfirmasi asumsi ke pemilik.
