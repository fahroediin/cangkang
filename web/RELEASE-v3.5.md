# TelurFarm v3.5 — Transfer dari kandidat batch

Tanggal: 27 Oktober 2026. Mencakup kandidat FEFO dan laporan v3.4.

## Cara memakai

1. Buka Peringatan stok · v3.5. Native: melalui Kelola.
2. Pilih Semua depo dan tanggal acuan hari ini, atur ambang serta rentang, lalu terapkan filter. Kandidat bertanggal lain tetap dapat ditinjau sebagai rencana, tetapi tombol transfernya tidak aktif.
3. Web: pada bagian Transfer dari kandidat pilih Siapkan transfer. Native: pada kartu kandidat batch pilih Siapkan transfer kandidat.
4. Periksa batch sumber, sumber/tujuan dan usulan kg. Batch dan tujuan mengikuti kandidat dan tidak dapat diubah pada formulir ini. Kg terisi usulan; boleh dikurangi sesuai berat aktual dan tidak boleh ditambah melebihi usulan.
5. Timbang dan hitung barang. Isi butir fisik bilangan bulat positif, lalu catatan pemeriksaan/serah terima maksimal 300 karakter. Butir tidak dikonversi otomatis dari kg.
6. Periksa sisa kg dan butir pada sumber. Keduanya harus sama-sama kosong atau sama-sama positif. Jangan meninggalkan catatan kg tanpa butir atau butir tanpa kg; lakukan pemeriksaan/opname jika hasil tidak cocok.
7. Pilih Konfirmasi transfer fisik setelah barang benar-benar dipindahkan. Batal atau menutup formulir tidak mengubah stok.
8. Periksa saldo asal/tujuan, batch anak beserta asalnya, serta jurnal/aktivitas. Buat ulang simulasi setelah transfer sebelum menindaklanjuti kandidat lain.

## Pemeriksaan ulang

- Membuka formulir hanya membuat draft sesi, tanpa reservasi stok atau penyimpanan transfer.
- Saat konfirmasi, aplikasi memeriksa tanggal hari ini, kandidat, saldo kg/butir, varian, sumber, tujuan, tanggal panen/batas jual, status dan persetujuan batch pada salinan data yang sedang digunakan.
- Perubahan saldo atau kondisi pada depo dalam cakupan setelah formulir dibuka menghentikan konfirmasi. Batalkan dan buat ulang simulasi; jangan memaksa memakai usulan lama.
- Urutan array atau perubahan pada depo di luar cakupan tidak mengubah hasil pemeriksaan. Draft tidak disimpan ke cadangan JSON.
- Konfirmasi yang berhasil hanya dapat dipakai sekali dari formulir tersebut. Native menyimpan melalui transaksi SQLite yang sudah ada; kegagalan penyimpanan tidak dinyatakan sebagai sukses.
- Web tetap memakai mekanisme salinan lokal dan konflik sinkronisasi yang ada. Pemeriksaan draft ini bukan otorisasi per peran atau pengganti transaksi stok server khusus. Periksa status sinkronisasi setelah perubahan.

## Batas penggunaan

Transfer manual umum melalui menu Batch tetap tersedia. Alur kandidat lebih ketat karena bersumber dari perhitungan kebutuhan saat ini. Alur ini tidak membuat pengiriman otomatis, tidak memeriksa mutu fisik, tidak memilih rute, tidak mengirim pemberitahuan, dan tidak menyinkronkan native dengan web. Tidak ada schema cadangan baru atau izin native baru.

## UAT lanjutan

Uji pada perangkat dan browser: siapkan/batalkan, tutup melalui tombol kembali/ESC, hitung butir kosong/pecahan, berat melebihi usulan, sisa kg/butir tidak berpasangan, sumber diblokir saat formulir terbuka, perubahan saldo penerima, pergantian tanggal, simpan gagal, konfirmasi ganda, serta urutan transfer dua kandidat. APK/IPA dan UAT antarmuka belum selesai.
