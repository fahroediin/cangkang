# TelurFarm v5.0 — Filter pemeriksaan tersimpan

Buka pesanan terkait batch. Terapkan filter, lalu Simpan filter yang diterapkan dan beri nama. Nama unik per batch, 1–60 karakter setelah spasi disamakan; maksimal 10 filter total per penyimpanan lokal. Dua batch boleh memakai nama sama. Untuk memperbarui pengaturan, simpan dengan nama baru atau hapus yang lama lalu simpan kembali.

Pakai filter memulihkan cakupan batch/keluarga, status, kategori, pencarian, tanggal, depo, urutan dan ukuran halaman. Mulai halaman pertama dan riwayat Kembali dikosongkan. Data selalu dihitung dari kondisi terkini. Filter hanya berlaku pada batch yang sama; depo yang sudah tidak tersedia ditolak sebelum tampilan berubah. Hapus hanya menghapus pengaturan filter, bukan transaksi atau data batch.

Tanggal disimpan sebagai tanggal konkret, bukan 'hari ini' bergerak. Pilihan cepat harian perlu ditekan ulang untuk tanggal terbaru. Ekspor CSV/PDF tetap mengikuti filter yang diterapkan dan mencakup seluruh hasil. Nama filter tidak menambah kolom ekspor (rincian/ringkasan tetap 21/16).

Web: disimpan di localStorage browser, dipisah menurut akun sinkron aktif; saat sinkron tidak aktif memakai area perangkat. Tidak dikirim ke server dan tidak tersedia di browser/perangkat lain. Penghapusan data browser dapat menghapusnya. Jangan menganggap penyimpanan preferensi sebagai sinkronisasi transaksi.

Native: disimpan terpisah dalam tabel app_preferences pada SQLite perangkat. Penyimpanan memakai pemeriksaan revisi; konflik/gagal tulis mempertahankan pengaturan sebelumnya. Muat ulang filter tersimpan untuk membaca ulang. Pengaturan tidak ikut cadangan JSON transaksi atau sinkronisasi web. Reset/impor transaksi tidak menimpa preferensi; filter untuk batch lama hanya terlihat bila batch ID itu kembali tersedia. Maksimum 10 termasuk batch lama.

Data preferensi rusak/versi tidak dikenal ditolak dan tidak ditimpa otomatis; transaksi tetap tersedia. Tidak ada perubahan schema domain transaksi (tetap 2), izin, status, stok atau pesan keluar. Ada tabel preferensi baru yang dibuat otomatis tanpa migrasi transaksi. Alokasi bukan volume terkirim/saldo stok atau recall terverifikasi.

UAT: simpan filter lengkap dengan ukuran 10; ubah tampilan, pakai kembali dan pastikan halaman pertama serta riwayat kosong. Tutup/buka aplikasi atau reload browser dan cek filter tetap ada. Uji nama duplikat, kosong, Unicode/spasi, 60/61 karakter, batas 10, hapus dan simpan ulang. Uji batch lain, depo hilang, data browser penuh, preferensi rusak dan konflik revisi native; transaksi tidak boleh berubah. Uji akun sinkron berbeda pada web, serta Android/iOS nyata. Pengujian browser dan perangkat/emulator belum dilakukan pada rilis ini.

Kelola seluruh filter: web menyediakan bagian Kelola seluruh filter; mobile menampilkan semua pengaturan beserta ID batch. Filter batch lain tidak dapat dipakai pada batch aktif, tetapi boleh dihapus agar slot yang sudah tidak digunakan tersedia kembali.
