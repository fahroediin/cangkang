# Pemesanan ulang dan jadwal pembelian

Pembaruan fitur native, 15 Oktober 2026. Warna dan aturan harga kategori mengikuti aplikasi sebelumnya.

## Pemesanan ulang

1. Buka Aktivitas, pilih pesanan, lalu **Pesan lagi**. Pesanan yang dibatalkan juga dapat menjadi dasar pembelian baru.
2. Konfirmasi penggantian keranjang. Produk, satuan, jumlah, kategori dan kontak disalin. Harga selalu diambil dari daftar harga terbaru; pembayaran, tagihan, alokasi batch dan status lama tidak disalin.
3. Tanggal awal adalah hari ini. Lokasi dan pilihan depot dikosongkan agar lokasi tujuan diperiksa kembali. Isi GPS/koordinat tujuan untuk menentukan depot terdekat.
4. Sesuaikan keranjang dan tanggal, periksa stok depot, lalu alamat, slot dan jatuh tempo. Hanya tombol konfirmasi checkout yang membuat pesanan lokal dan mereservasi stok.

## Jadwal pembelian

- Dari detail pesanan pilih **Buat jadwal pembelian**, beri nama, tanggal berikutnya, interval 1/2/4 minggu, nama pelanggan, telepon dan alamat.
- Jadwal memakai produk, satuan, jumlah dan kategori pesanan asal. Jadwal tidak mengunci harga atau stok. Jumlah dapat diubah pada keranjang saat checkout.
- Buka Aktivitas → Jadwal pembelian atau Kelola → Pembelian rutin. Jadwal yang sudah jatuh tempo muncul di atas; pengingat juga muncul di Beranda saat aplikasi dibuka/digunakan.
- **Siapkan pesanan** mengisi keranjang untuk diperiksa. Jadwal masa lalu memakai tanggal kirim hari ini. Tidak ada penumpukan order otomatis untuk tanggal yang terlewat.
- Tanggal kirim dari jadwal tidak boleh sebelum tanggal berikutnya. Setelah checkout sukses, tanggal maju pada kelipatan interval asal hingga sesudah tanggal kirim. Contoh: jadwal 1 Januari setiap 7 hari, kirim 22 Januari → berikutnya 29 Januari.
- Konfirmasi berulang dari jadwal yang sudah maju ditolak. Jika stok tidak cukup atau penyimpanan gagal, jadwal dan stok tidak ikut maju.
- **Jeda jadwal** menghentikan penyiapan dan checkout jadwal tersebut. Pengaktifan kembali mempertahankan tanggal; jadwal yang lewat tetap perlu dikonfirmasi.
- Jika pesanan dibatalkan setelah checkout, jadwal tidak dimundurkan otomatis. Operator dapat mengubah tanggal melalui menu jadwal.
- Tombol **Lepas data pesanan asal** membuat keranjang menjadi pembelian biasa, tanpa mengubah tanggal jadwal.

## Cadangan dan migrasi

State native sekarang `schema: 2`, dengan koleksi `plans`. SQLite yang berisi schema 1 dimigrasikan saat dimuat; seluruh order, stok, pembayaran dan revisi tetap dipertahankan. Jadwal awal kosong. Migrasi disimpan sebagai schema 2 pada transaksi berikutnya atau ekspor cadangan. Cadangan schema 1 tanpa kolom plans masih diterima. Schema 1 dengan kolom plans ditolak agar data jadwal tidak hilang diam-diam.

Cadangan schema 2 memvalidasi ID unik, pesanan asal, interval, tanggal, kontak, kategori serta jumlah kg/butir. Aplikasi versi lama tidak mendukung cadangan schema 2. Cadangan native tetap terpisah dari cadangan web. Pemulihan cadangan mengosongkan draft keranjang dan konteks jadwal yang sedang dibuka.

## Batas implementasi

Fitur ini di source Android/iOS; aplikasi web belum diubah. Jadwal lokal per perangkat, tanpa pengiriman pesanan otomatis, notifikasi sistem/latar belakang, sinkronisasi server, penagihan berulang atau pemotongan rekening. Tidak ada data bank atau token bypass yang ditambahkan.

## UAT yang masih harus dijalankan pada perangkat

| Skenario | Hasil yang diharapkan |
|---|---|
| Pesan ulang saat keranjang berisi produk | Dialog penggantian; pembatalan dialog mempertahankan keranjang |
| Harga kategori berubah | Keranjang memakai harga baru; invoice lama tidak berubah |
| Pesan ulang dari pelanggan berbeda | Kontak terisi dari sumber; GPS/depot harus diperiksa kembali |
| Jadwal mingguan untuk hotel | Tampil di Aktivitas/Kelola dan tersimpan setelah restart |
| Jadwal jatuh tempo | Pengingat di Beranda; tanggal tidak maju hanya karena dilihat |
| Stok habis saat checkout | Tidak ada order baru, stok/reservasi atau kemajuan jadwal parsial |
| Konfirmasi checkout berhasil | Satu order baru dan jadwal maju sekali setelah SQLite berhasil |
| Jeda, aktifkan, ubah tanggal/alamat | Perubahan bertahan setelah restart; jadwal dijeda tidak dapat dipesan |
| Cadangan schema 1/2 | Data lama terbuka; jadwal schema 2 ikut ekspor/impor; draft lama dibersihkan |

Pengujian domain otomatis dijalankan terpisah. Tabel ini adalah kriteria UAT, bukan catatan hasil pengujian perangkat.
