# UAT perangkat TelurFarm Native

Status seluruh skenario berikut: **belum dijalankan pada perangkat fisik**. Isi hasil, perangkat/OS, tanggal, tester, bukti, dan defect sebelum persetujuan operasional.

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| M01 | Instal debug Android dan iOS | Aplikasi native terbuka tanpa layar kosong |
| M02 | Tutup paksa setelah menyimpan | Produksi/pesanan tetap ada setelah dibuka |
| M03 | Tolak izin lokasi | Pesan tetap bisa memakai koordinat manual |
| M04 | GPS dimatikan/timeout | Ada pesan masalah tanpa membuat order |
| M05 | GPS di alamat tujuan | Peringkat depo layak mengikuti jarak garis lurus |
| M06 | Edit radius depo | Depo di luar radius tidak dapat dipilih |
| M07 | Keranjang kg + butir satu varian | Alokasi berbagi stok tanpa stok negatif |
| M08 | Ubah kategori pembeli | Harga sesuai kategori, invoice lama tetap |
| M09 | Tanggal kirim setelah batas jual | Batch tersebut dikecualikan |
| M10 | Batch karantina/diblokir | Tidak tersedia untuk pesanan baru |
| M11 | Cabut kualitas setelah reservasi | Pengiriman ditolak sampai diperiksa |
| M12 | Hitung & timbang | Satuan pembelian tetap tepat, invoice tetap |
| M13 | Batalkan dua kali | Stok dikembalikan satu kali |
| M14 | Pesanan sudah dibayar | Pembatalan biasa ditolak |
| M15 | Mulai antar tanpa kurir/timbang | Ditolak dengan keterangan |
| M16 | Serah terima tanpa nama | Ditolak; nama tersimpan saat diisi |
| M17 | Pembayaran parsial/melebihi saldo | Parsial diterima; kelebihan ditolak |
| M18 | Retur fisik sebagian | Masuk karantina, tagihan belum berubah |
| M19 | Retur kedua melebihi kiriman | Ditolak, stok tetap |
| M20 | Nota kredit setelah lunas | Muncul refund tertunda sebesar haknya |
| M21 | Refund melampaui hak | Ditolak; dana tidak dikirim aplikasi |
| M22 | Produksi telur baik | Batch belum diklasifikasikan tercipta |
| M23 | Sortir/transfer batch | Total kg/butir tetap; asal tercatat |
| M24 | Koreksi stok opname | Saldo bebas berubah dengan alasan audit |
| M25 | Invoice dengan &, <, tanda kutip | PDF aman terbaca, tidak mengeksekusi markup |
| M26 | Bagikan PDF/JSON | Native share sheet dan berkas bisa dibuka |
| M27 | Impor JSON salah skema/rusak | Ditolak tanpa menimpa data saat ini |
| M28 | Impor JSON native valid | Tinjau konfirmasi, state diganti atomik |
| M29 | Tombol Back Android & keyboard | Form/navigasi tidak menutup tanpa kendali |
| M30 | Rotasi, tablet, font besar, VoiceOver/TalkBack | Kontrol terbaca, bisa diskrol dan dipilih |
| M31 | Tap tombol simpan berulang | Tidak mencatat pembayaran/order ganda |
| M32 | Ruang penyimpanan habis | Error terlihat; state UI tidak mendahului penyimpanan |
| M33 | Data contoh | Label tetap terlihat pada seluruh tab |
| M34 | Airplane mode | Pencatatan lokal tetap berfungsi; tidak mengklaim server sync |

Persetujuan UAT mencatat defect yang ditutup dan risiko yang diterima. Source/bundle yang berhasil dibuat bukan pengganti bukti UAT ini.
