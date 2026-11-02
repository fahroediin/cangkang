# TelurFarm v3.2 — Ekspor laporan stok

Tanggal rilis source: 27 Oktober 2026.

## Fitur

- Ekspor CSV UTF-8 dengan saldo layak jual per depo/varian dan daftar stok menipis, batas jual, serta tinjauan batch.
- Laporan cetak/PDF di web; berbagi PDF native melalui menu sistem Android/iOS.
- Kekurangan kg terhadap ambang yang dipilih, tanpa membuat order pembelian atau mengubah stok.
- Semua laporan mencantumkan tanggal acuan, akhir rentang, ambang, cakupan depo dan waktu pembuatan UTC.
- Filter tetap berlaku selama sesi. Laporan memakai saldo bebas saat ini, bukan rekonstruksi historis.

## Cara menggunakan

1. Web: buka Peringatan stok · v3.2. Native: Kelola → Peringatan stok · v3.2.
2. Pilih tanggal, depo, ambang kg dan rentang hari. Terapkan filter terlebih dahulu; perubahan field yang belum diterapkan belum menjadi filter laporan.
3. Tinjau kekurangan kg. Nilai ini hanya selisih saldo layak terhadap ambang, bukan prediksi penjualan atau rekomendasi pembelian otomatis.
4. Web: pilih Ekspor stok CSV untuk mengunduh, atau Laporan cetak / PDF untuk membuka pratinjau. Setelah pratinjau selesai, gunakan Cetak / Simpan PDF melalui dialog browser.
5. Native: pilih Ekspor stok CSV atau Bagikan laporan PDF, kemudian pilih penyimpanan/aplikasi tujuan melalui menu berbagi. Membuka menu berbagi belum membuktikan pengguna sudah menyimpan berkas.
6. Cocokkan metadata laporan sebelum dibagikan. File yang sudah dibuat merupakan snapshot; perubahan stok berikutnya tidak mengubah file lama.

CSV memakai koma sebagai pemisah kolom, angka desimal bertitik dan BOM UTF-8. Saat Excel tidak memisahkan kolom otomatis, impor sebagai UTF-8 dengan delimiter koma. Nilai teks yang menyerupai formula diberi awalan apostrof. HTML/PDF mengamankan teks nama depo dan batch sebelum ditampilkan.

Satu batch dapat muncul di beberapa kategori peringatan. Jangan menjumlahkan semua baris sebagai total stok. Gunakan kategori Saldo layak jual untuk saldo per varian. Laporan kosong tetap menyimpan metadata filter.

## Batas rilis dan pengujian lanjutan

Laporan bukan cadangan pemulihan. Cadangan JSON tetap tersedia melalui pengaturan. Tidak ada migrasi schema, izin native baru, notifikasi latar belakang, atau sinkronisasi native-web. Peringatan dan ekspor tidak mengubah stok, mutu, pesanan, atau pembayaran.

Paket ini source native, bukan APK/IPA. Uji perangkat yang perlu dilakukan: simpan/batalkan berbagi CSV dan PDF, akses file dari aplikasi Files, nama depo panjang, dataset besar, orientasi layar, ekspor berulang, serta penanganan kegagalan cetak/berbagi. Pemeriksaan browser produksi dan UAT perangkat tetap perlu dilakukan.
