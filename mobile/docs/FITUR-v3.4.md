# TelurFarm v3.4 — Kandidat batch transfer FEFO

Tanggal: 27 Oktober 2026. Termasuk laporan dan simulasi dari v3.2/v3.3.

## Cara memakai

1. Buka Peringatan stok · v3.4. Pada native, buka melalui Kelola.
2. Pilih Semua depo untuk mencari sumber antar depo, tentukan tanggal acuan dan ambang kg, lalu terapkan filter.
3. Periksa usulan antar depo dan kebutuhan yang belum tertutup. Bagian Kandidat batch transfer FEFO merinci sumber, tujuan, varian, ID/kode batch, usulan kg, tanggal panen dan batas jual.
4. Prioritas kandidat: batas jual yang diketahui paling dekat, kemudian tanggal panen paling awal, lalu ID batch. Tanggal kosong berada setelah tanggal yang diketahui pada tingkat urutan yang sama. Batas jual kosong tetap perlu pemeriksaan.
5. Pilih Ekspor kandidat batch CSV (native) atau Kandidat batch CSV (web). Laporan stok cetak/PDF juga menyertakan kandidat batch. CSV stok dan simulasi agregat sebelumnya tetap tersedia.
6. Periksa ulang sumber dan tanggal transfer sebenarnya. Timbang barang dan hitung butir fisik. Gunakan menu Batch untuk mencatat transfer sesungguhnya beserta kg, butir dan catatan; tidak ada transfer atau reservasi otomatis.
7. Buat ulang laporan setelah ada perubahan stok. Jika saldo atau kelayakan berubah, usulan yang tidak dapat dirinci ditampilkan terpisah, bukan diambil dari batch yang tidak layak.

## Aturan dan batas

- Hanya saldo bebas aktif, disetujui pada web, memiliki varian, panen tidak setelah tanggal acuan dan belum melewati batas jual yang menjadi kandidat. Batch karantina, diblokir, tanpa varian atau tanpa butir bebas tidak digunakan.
- Satu pool saldo batch dipakai bersama untuk semua usulan. Kg pada batch yang sama tidak dihitung ulang untuk beberapa tujuan. Kandidat menjaga sumber tetap minimal pada ambang dan tidak melebihi kekurangan tujuan, termasuk bila laporan agregat dan saldo batch berbeda.
- Saldo dan rincian kg dipertahankan sampai enam desimal sesuai model batch. Rincian bukan hasil timbang dan tidak menetapkan jumlah butir untuk dipindahkan.
- Tanggal acuan bukan rekonstruksi historis atau tanggal pengiriman otomatis. Kandidat bukan reservasi, jaminan mutu, pilihan rute, atau perintah pembelian.
- Pada native, laporan dihitung ulang dari satu snapshot ketika ekspor dimulai; perubahan data selama menu berbagi terbuka tidak dicampurkan ke file itu. Metadata waktu pembuatan menggunakan UTC.
- File laporan bukan cadangan pemulihan. Schema cadangan tetap 2 pada native. Data native tetap lokal dan belum tersambung ke web.

## Contoh

A memiliki 60 kg reguler dan ambang 20 kg; B membutuhkan 20 kg dan C membutuhkan 15 kg. Kandidat membagi 35 kg dari batch A menurut FEFO dan tidak memakai kg yang sama dua kali. Jika salah satu batch A dikarantina setelah laporan dibuat, buat ulang laporan sebelum transfer. Kg yang tidak lagi dapat dipenuhi tidak diganti otomatis dengan barang karantina.

## Pengujian pengguna lanjutan

Periksa tampilan pada layar kecil, data banyak, nama panjang, angka enam desimal, simpan/batal CSV dan PDF, perubahan stok setelah ekspor, serta pencatatan transfer fisik melalui menu Batch. Source dan bundle native bukan APK/IPA. Browser/perangkat fisik dan UAT belum selesai.
