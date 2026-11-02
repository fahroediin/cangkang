# TelurFarm v4.6 — Pilihan cepat pemeriksaan harian

Buka Batch & varian → Telusuri → Pesanan terkait batch (web), atau Kelola → Batch → Telusuri asal & cabang (native).

- Diproses hari ini: status Diproses, tanggal kirim mulai = sampai = tanggal perangkat saat ditekan.
- Dalam pengiriman hari ini: status Dalam pengiriman, tanggal kirim mulai = sampai = tanggal perangkat saat ditekan.
- Diproses lewat tanggal: status Diproses, tanpa batas awal, tanggal kirim sampai = kemarin.

Cakupan batch/keluarga, depo pesanan dan urutan tetap. Pencarian nomor/nama serta kategori pembeli dikosongkan; halaman kembali satu. Pilihan cepat mengganti status dan rentang tanggal yang diterapkan sebelumnya. Semua nilai diterapkan sekaligus setelah validasi. Gagal validasi tidak mengubah filter lama. Depo yang sudah tidak ada ditolak pada UI.

Tanggal mengikuti kalender lokal perangkat/browser saat tombol ditekan, bukan jam server. Pastikan tanggal perangkat benar. Setelah diterapkan, rentang tetap (tidak otomatis mengikuti pergantian hari); tekan ulang untuk memperbarui ke hari terbaru. Tidak ada timer/pengingat latar belakang. Lewat tanggal bukan perhitungan SLA atau keterlambatan slot jam: hanya Diproses dengan tanggal pengiriman sebelum hari ini. Tanggal kosong/tidak valid dikecualikan saat rentang aktif, seperti filter manual.

Daftar, ringkasan, CSV rincian, CSV ringkasan dan PDF mengikuti status/tanggal/depo yang diterapkan. Metadata tetap memuat tanggal konkret, bukan label relatif yang berubah. Jumlah kolom tetap 21 (rincian) dan 16 (ringkasan). Preview PDF menyimpan snapshot saat dibuat; ekspor baru mengambil data terkini dengan filter tetap. Hasil dapat kosong bila tidak ada alokasi yang cocok pada batch/depo/cakupan.

Pilihan cepat hanya mengubah tampilan sesi, tidak mengubah stok/status, mengirim pesan, menjalankan recall atau menambah izin/schema. Alokasi tercatat bukan volume terkirim atau saldo stok; referensi batal dapat tetap ada, retur tidak dikurangkan. Native masih lokal tanpa sinkronisasi web.

UAT: pilih depo/urutan/cakupan, masukkan pencarian/kategori lama, lalu tekan setiap pilihan cepat. Pastikan tiga pilihan menerapkan status/rentang, mengosongkan pencarian/kategori, mempertahankan depo/cakupan/urutan dan kembali halaman satu. Uji hari pertama bulan/tahun, 1 Maret tahun kabisat, tanggal kosong, serta pesanan sudah Selesai/Dibatalkan. Bandingkan CSV/PDF dengan daftar/ringkasan. Ubah tanggal perangkat hanya pada lingkungan uji; pastikan filter lama tetap sampai tombol ditekan ulang. Uji browser dan perangkat Android/iOS nyata, termasuk share PDF/CSV. Pengujian browser dan perangkat/emulator belum dilakukan pada rilis ini.
