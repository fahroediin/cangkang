# TelurFarm v3.6 — Penelusuran asal dan cabang batch

Buka Batch & varian → Telusuri (web) atau Kelola → Batch → Telusuri asal & cabang (mobile). Rantai asal menampilkan akar sampai batch terpilih; keluarga menampilkan seluruh cabang, induk, tingkat, depo, varian, kualitas, tanggal dan saldo bebas saat ini. Cabang saudara dan batch kosong tetap tampil, tanpa filter depo. Pilih Ekspor telusur CSV / Bagikan telusur CSV untuk menyimpan snapshot saat tombol ekspor ditekan.

Saldo adalah saldo saat ini sesudah alokasi, bukan volume transfer awal. Hubungan induk dapat berasal dari transfer, sortir, atau retur; tidak diklaim sebagai jenis kejadian tertentu. Keluarga bukan bukti asal panen. Kolom ID membedakan batch meski kode label sama. CSV bukan cadangan pemulihan. Tidak ada perubahan stok, schema, izin atau sinkronisasi native-web.

Pengaman menolak batch hilang, induk hilang, ID ganda, rantai berulang dan keluarga di atas 10.000 batch. Ekspor menetralkan formula CSV dan mengutip koma, kutip serta baris baru.

UAT: transfer sebagian lalu telusuri anak; pastikan akar dan saudara terlihat. Sortir dengan varian berbeda, pindah lintas depo dan kosongkan batch sumber; pastikan seluruh cabang tetap tampil. Bandingkan CSV dengan saldo saat ekspor. Batalkan tampilan dan pastikan stok tidak berubah. Uji berbagi CSV Android/iOS pada perangkat nyata. UAT perangkat dan browser belum dilakukan pada rilis ini.
