# TelurFarm v3.7 — Pesanan terkait batch

Web: Batch & varian → Telusuri → Pesanan terkait batch. Mobile: Kelola → Batch → Telusuri asal & cabang. Default seluruh keluarga dan semua status. Ubah cakupan menjadi batch ini saja untuk hanya referensi langsung, atau seluruh keluarga untuk akar, cabang dan saudara lintas depo/varian. Pilih tanpa dibatalkan untuk mengecualikan pembatalan.

Satu baris per pesanan, urut tanggal kirim lalu ID. Tampilkan pelanggan, kategori (Perorangan, Wholesale, Hotel/Resort), status, tanggal/depo pesanan, ID batch cocok serta kg/butir alokasi cocok. Hanya alokasi yang termasuk cakupan dijumlahkan, termasuk beberapa baris pembelian yang merujuk batch yang sama. Batch lain di pesanan campuran tidak ikut dijumlahkan. Klik detail pesanan untuk tindak lanjut. Ekspor pesanan batch CSV menyimpan snapshot data terkini dengan filter yang dipilih dan waktu UTC; CSV kosong tetap memuat metadata.

Alokasi tercatat bukan volume terkirim, saldo stok atau daftar recall terverifikasi. Jumlah pada pesanan batal adalah referensi arsip (stok sudah dikembalikan); retur tidak dikurangkan. Pesanan lama tanpa referensi batch tidak dapat ditemukan. Cakupan keluarga mencakup cabang saudara dan bukan pernyataan semua pesanan terdampak masalah kualitas. Ekspor memuat nama pelanggan; bagikan sesuai kebutuhan operasional. Formula CSV dinetralkan dan koma/kutip/baris baru di-escape.

Tidak mengubah stok/status, mengirim pesan, melakukan recall atau migrasi schema. Native masih lokal dan belum sinkron dengan web. Filter hanya untuk sesi tampilan; membuka batch lain mengembalikan default. Ekspor menghitung ulang snapshot saat tombol ditekan sehingga perubahan data sesudah tampilan terbuka dapat muncul dalam ekspor.

UAT: buat order campuran dari dua keluarga; pastikan jumlah hanya alokasi yang cocok. Transfer/sortir lalu pesan dari cabang, pastikan mode batch dan keluarga berbeda. Batalkan order dan uji kedua filter status. Buka detail, kembali, lalu ekspor CSV dan bandingkan metadata/jumlah. Uji kondisi kosong, nama mengandung kutip/koma dan menu berbagi Android/iOS. Browser dan perangkat/emulator belum diuji pada rilis ini.
