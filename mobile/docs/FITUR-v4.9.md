# TelurFarm v4.9 — Ukuran halaman dan navigasi langsung

Pada pesanan terkait batch, pilih 10, 20 (default) atau 50 pesanan per halaman. Web menyediakan pilihan Pesanan per halaman; mobile menyediakan tombol Baris per halaman. Perubahan ukuran kembali ke halaman pertama, mempertahankan filter dan riwayat klik ringkasan. Jumlah ukuran lain ditolak tanpa mengubah tampilan.

Gunakan Halaman pertama/terakhir, Sebelumnya/Berikutnya, atau Ke halaman tertentu (web: isi nomor lalu Buka halaman). Nomor harus bilangan bulat positif; spasi tepi dibuang, nol/negatif/desimal/notasi eksponen ditolak. Nomor yang melebihi batas menuju halaman terakhir. Jumlah halaman dihitung ulang dari data terkini. Hasil kosong tetap halaman 1/1, menampilkan 0–0.

Filter manual, pilihan cepat dan klik ringkasan tetap mengembalikan halaman satu sambil mempertahankan ukuran. Reset seluruh filter atau membuka telusur ulang kembali ke default 20. Reset pencarian/kategori/tanggal mempertahankan ukuran. Navigasi dan ukuran hanya untuk sesi ini, tidak disimpan ke database/cadangan.

Riwayat Kembali sebelum klik ringkasan kini menyimpan ukuran halaman beserta nomor halaman. Mengubah ukuran atau menavigasi halaman tidak menghapus riwayat. Kembali memulihkan ukuran/nomor sebelum klik, memakai data terkini; nomor dijepit bila hasil menyusut. Format snapshot lama tanpa ukuran memakai 20. Tidak ada migrasi data transaksi.

Ringkasan, CSV rincian, CSV ringkasan dan PDF tetap mencakup seluruh hasil filter, bukan halaman terpilih. Kolom ekspor tetap 21/16. Mengubah ukuran/halaman tidak mengubah isi laporan selain waktu pembuatan ketika ekspor baru ditekan. Preview PDF tetap snapshot saat dibuat. Tindakan tidak mengubah stok/status, membatalkan transaksi, mengirim pesan atau menambah izin/schema. Native masih lokal tanpa sinkronisasi web.

UAT: buat >50 pesanan, pilih tiap ukuran dan cek pembagian, jumlah halaman dan urutan tanpa duplikasi/hilang. Lompat ke pertama/terakhir dan nomor tertentu; uji invalid, terlalu besar, kosong dan data menyusut. Klik ringkasan dari halaman nonpertama dengan ukuran 10, ganti ukuran ke 50 lalu Kembali; ukuran/nomor awal harus pulih. Periksa reset dan telusur ulang. Bandingkan CSV/PDF untuk seluruh hasil pada ukuran berbeda dan pastikan transaksi tidak berubah. Uji browser serta Android/iOS nyata. Pengujian browser dan perangkat/emulator belum dilakukan pada rilis ini.
