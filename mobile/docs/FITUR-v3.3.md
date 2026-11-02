# TelurFarm v3.3 — Simulasi transfer antar depo

Tanggal: 27 Oktober 2026. Termasuk ekspor stok CSV/PDF dari v3.2.

## Cara memakai

1. Buka Peringatan stok · v3.3, melalui Kelola pada native.
2. Pilih Semua depo, tanggal acuan, ambang kg dan rentang hari, lalu terapkan filter. Filter satu depo hanya menampilkan cakupan itu, sehingga tidak mencari donor di luar cakupan.
3. Tinjau Simulasi transfer: depo sumber, depo tujuan, varian dan usulan kg. Lihat kebutuhan yang belum tertutup jika surplus tidak cukup.
4. Ekspor simulasi CSV untuk ditinjau operator. Laporan stok cetak/PDF juga memuat simulasi dan sisa kebutuhan. CSV stok biasa tetap berisi saldo dan peringatan stok.
5. Periksa batch sumber, kondisi, tanggal transfer nyata, serta kemampuan pengiriman. Hitung butir dan timbang fisik. Gunakan menu Batch untuk mencatat transfer sebenarnya dengan kg dan butir; simulasi tidak mengisikan atau menyimpan transfer otomatis.
6. Buat ulang simulasi setelah perubahan stok atau transfer. Berkas ekspor yang sudah dibuat adalah snapshot lama.

## Aturan simulasi

- Sumber surplus dan penerima kekurangan dihitung per varian dari saldo bebas layak jual pada tanggal acuan. Alokasi pesanan, batch karantina/blokir, panen setelah tanggal acuan dan batch melewati batas jual tidak masuk saldo layak.
- Sumber hanya menawarkan selisih di atas ambang. Simulasi tidak menurunkan sumber di bawah ambang yang sama.
- Penerima hanya menerima sampai kekurangannya tertutup. Tidak ada transfer antarvarian atau ke depo sendiri.
- Penerima dengan kekurangan terbesar ditinjau dahulu, lalu sumber dengan surplus terbesar; urutan identitas depo memecah nilai yang sama secara konsisten.
- Simulasi hanya dalam kg; tidak memilih batch tertentu, menetapkan butir fisik, menghitung ongkos, memilih rute terpendek, membuat PO atau memindahkan barang.
- Tanggal acuan bukan rekonstruksi historis. Batas jual kosong masih perlu diperiksa melalui daftar tinjauan batch.

## Contoh

Ambang 20 kg reguler. Sumber A memiliki 50 kg, B memiliki 5 kg dan C memiliki 10 kg. Usulan A ke B 15 kg dan A ke C 10 kg; A masih 25 kg. Jika A hanya memiliki 25 kg, usulan yang dapat ditutup hanya 5 kg dan kebutuhan tersisa ditampilkan. Stok di aplikasi belum berubah.

## Pemeriksaan lanjutan

Uji tombol ekspor, simpan/batal menu berbagi, hasil cetak/PDF, layar kecil, nama panjang, data banyak dan perubahan stok setelah ekspor. APK/IPA dan UAT perangkat belum selesai. Simulasi tidak memerlukan migrasi schema cadangan, izin baru atau koneksi native-web.
