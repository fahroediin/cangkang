# TelurFarm v3.9 — Filter kategori dan tanggal pengiriman

Web: Batch & varian → Telusuri → Pesanan terkait batch. Pilih kategori pembeli dan tanggal kirim mulai/sampai, lalu Terapkan kategori & tanggal. Mobile: Kelola → Batch → Telusuri asal & cabang → Filter kategori & tanggal kirim. Pilihan kategori: Semua kategori, Perorangan, Wholesale, Hotel/Resort.

Tanggal memakai tanggal pengiriman pesanan (bukan tanggal dibuat, panen, atau batas jual). Batas awal/akhir inklusif. Boleh isi satu batas atau kosongkan keduanya untuk semua tanggal. Tanggal tidak valid (termasuk tanggal kalender yang tidak ada) atau rentang terbalik ditolak tanpa mengubah filter yang sudah berlaku. Saat rentang aktif, pesanan tanpa tanggal kirim valid dikecualikan. Tanpa rentang, pesanan bertanggal kosong tetap dapat muncul sesuai referensi batch dan filter lain.

Filter digabungkan dengan cakupan batch/keluarga dan semua/tanpa dibatalkan. Daftar, ringkasan kategori/status, CSV dan PDF mengikuti filter yang diterapkan. Perubahan kolom web yang belum diterapkan tidak mengubah ekspor. Reset kategori & tanggal mempertahankan cakupan dan filter status. Membuka ulang telusur mengembalikan default. Filter hanya untuk sesi tampilan, tidak disimpan ke database.

CSV menambahkan tiga kolom di akhir (kategori, tanggal mulai, tanggal sampai) sehingga total 18 kolom; 15 kolom sebelumnya tetap pada urutan semula. CSV kosong juga menyimpan metadata filter. PDF menampilkan kategori dan rentang; snapshot preview tetap setelah dibuat. Ekspor baru membaca data terbaru dengan filter yang diterapkan.

Alokasi tercatat bukan jumlah terkirim/saldo stok. Referensi pembatalan dapat tetap ada; retur tidak dikurangkan. Daftar bukan recall terverifikasi atau bukti asal panen. Tidak mengubah stok/status, mengirim pesan, menambah izin atau migrasi schema. Native masih lokal dan belum sinkron dengan web.

UAT: kombinasikan kategori dan rentang dengan cakupan/status. Uji hari yang tepat pada batas awal dan akhir; tanggal kabisat; tanggal kosong; satu batas; rentang terbalik; kategori tidak valid; reset dan buka ulang. Bandingkan daftar/ringkasan/CSV/PDF pada kondisi berisi maupun kosong. Coba ubah kolom tanpa menerapkan lalu ekspor. Pastikan filter gagal tidak mengubah data atau filter lama. Uji browser serta Android/iOS nyata, termasuk share PDF/CSV. UAT browser dan perangkat belum dilakukan pada rilis ini.
