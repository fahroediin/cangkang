# TelurFarm v3.1 — Peringatan stok

Buka Peringatan stok pada navigasi web atau Kelola → Peringatan stok pada mobile.

- Stok menipis: setiap kombinasi depo dan tiga varian, termasuk saldo nol, dengan berat bebas di bawah ambang (default 20 kg). Saldo butir ditampilkan bersamaan.
- Mendekati batas jual: batch layak jual yang batasnya dari tanggal acuan sampai akhir rentang, inklusif (default 3 hari). Batas hari ini masih ditampilkan; batas yang sudah lewat masuk tinjauan.
- Perlu tinjauan: batch bersaldo yang dikarantina, diblokir, belum diklasifikasikan/disetujui (web), belum memiliki batas jual, sudah lewat batas jual, atau saldo kg/butir tidak lengkap.
- Filter tanggal, depo, ambang 0–1.000.000 kg, dan rentang 0–365 hari. Filter hanya bertahan selama sesi aplikasi ini, tidak disimpan dalam cadangan.

Saldo yang ditampilkan adalah saldo bebas saat ini setelah reservasi. Tanggal acuan mengevaluasi kelayakan batch; tidak merekonstruksi saldo masa lalu atau meramalkan penjualan. Batch dengan panen di masa depan tidak masuk saldo layak jual. Pemeriksaan tidak mengubah stok, kualitas, atau batas jual; tidak mengirim notifikasi latar belakang.

Web dan native memakai algoritme peringatan yang sama, dengan adapter struktur data masing-masing. Penyimpanan web dan native tetap terpisah. Menyimpan filter bukan sinkronisasi mobile-web.

## Pemeriksaan perangkat yang perlu dilakukan

1. Buka menu; periksa depo kosong, varian tanpa saldo, dan batch karantina.
2. Ubah tanggal, depo, ambang 0/desimal, serta rentang 0/365; coba tanggal dan angka tidak valid.
3. Buat pesanan dan lihat saldo bebas berkurang; batalkan sesuai aturan dan lihat saldo kembali.
4. Tinjau batch yang batas jualnya hari ini, besok, dan kemarin; pastikan tidak ada perubahan kualitas otomatis.
5. Periksa gulir, keyboard, kembali/batal filter, teks panjang, serta orientasi layar Android/iOS.

Verifikasi: uji operasi web dan server lulus. QA browser belum dilakukan karena kapabilitas browser yang disyaratkan lingkungan tidak tersedia.
