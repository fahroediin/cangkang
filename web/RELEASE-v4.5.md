# TelurFarm v4.5 — Pemeriksaan operasional pesanan batch

Rilis gabungan lanjutan v4.0. Buka Batch & varian → Telusuri → Pesanan terkait batch (web), atau Kelola → Batch → Telusuri asal & cabang → Cari & filter pesanan batch (native).

Pilih depo pesanan, status spesifik (Diproses, Dalam pengiriman, Selesai, Dibatalkan), atau Semua status/Tanpa dibatalkan. Depo mengikuti catatan pesanan, bukan lokasi stok batch atau alamat pelanggan. Kombinasikan dengan cakupan batch/keluarga, pencarian nomor/nama, kategori dan tanggal pengiriman inklusif. Pilihan depo native memakai ID, web memakai nama depo sesuai model data masing-masing. Pilihan yang tidak lagi ada ditolak pada form.

Urutan daftar: tanggal kirim terlama (default), tanggal kirim terbaru, nama pelanggan A–Z, nomor pesanan A–Z. Nama dinormalisasi seperti pencarian; ID ascending menjadi pemecah urutan. Tanggal kosong berada di awal untuk urutan terlama, akhir untuk terbaru. Tidak menafsirkan tanggal kosong sebagai waktu pengiriman sebenarnya. Sorting berlaku pada daftar serta rincian CSV/PDF. Daftar tetap 20 per halaman; ringkasan dan ekspor mencakup semua hasil filter.

Ringkasan baru per depo pesanan. Ekspor ringkasan CSV (native: Bagikan ringkasan CSV) memuat total pesanan, jumlah ID batch cocok, jumlah pesanan per kategori/status/depo, semua filter, urutan dan waktu UTC. Satuan jelas (pesanan atau batch). Pengelompokan menghitung pesanan yang sama; jangan jumlahkan kategori/status/depo sebagai total baru. Ringkasan CSV selalu memuat total dan kelompok nol meskipun tidak ada hasil. Laporan PDF juga menampilkan ringkasan depo.

Reset pencarian, kategori & tanggal hanya mereset tiga hal tersebut, mempertahankan cakupan, status, depo dan urutan. Reset seluruh filter mengembalikan default keluarga, semua status/depo, pencarian/kategori/tanggal kosong, urutan tanggal terlama dan halaman satu. Membuka ulang telusur juga kembali default. Filter validasi gagal tidak mengubah filter yang sudah diterapkan. Form web harus diterapkan agar ekspor berubah.

CSV rincian menjadi 21 kolom, dengan Filter depo pesanan dan Urutan ditambahkan di akhir; 19 kolom sebelumnya tetap pada posisi semula. CSV ringkasan adalah format baru 16 kolom dan tidak bisa dipakai memulihkan data. PDF memakai snapshot saat dibuka; ekspor baru membaca snapshot terkini. Nama dan teks di-escape, formula CSV dinetralkan.

Alokasi bukan volume terkirim/saldo stok; retur tidak dikurangkan dan referensi batal dapat tetap ada. Daftar bukan recall terverifikasi. Tidak mengubah stok/status, mengirim pesan, menambah izin, sinkronisasi atau migrasi schema. Native tetap menyimpan data lokal dan belum sinkron dengan web.

UAT: gabungkan semua filter; uji status batal secara eksplisit; ubah depo; cek urutan tie dengan ID dan tanggal kosong. Pastikan pagination tidak menduplikasi/menghilangkan pesanan. Cocokkan ringkasan depo dengan rincian dan CSV/PDF. Uji reset sebagian/semua, form gagal, filter belum diterapkan, hasil kosong dan snapshot tetap. Uji browser serta Android/iOS nyata termasuk menu berbagi CSV/PDF. Browser dan perangkat/emulator belum diuji pada rilis ini.
