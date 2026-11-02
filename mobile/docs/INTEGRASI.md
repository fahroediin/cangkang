# Integrasi mobile dengan layanan TelurFarm

Dokumen ini adalah rancangan pekerjaan berikutnya. Endpoint di bawah **belum diimplementasikan**, dan aplikasi native ini tidak memanggilnya. Web existing tetap terpisah.

## Identitas

Gunakan OAuth/OIDC Authorization Code + PKCE melalui system browser, token akses berumur pendek, dan refresh token yang disimpan di SecureStore/Keychain. Pisahkan pembeli, operator depo, kurir, dan admin. Server menurunkan hak akses dari token terverifikasi, bukan role atau user ID yang dikirim aplikasi. Jangan gunakan token bypass Sites atau header identitas ChatGPT sebagai credential mobile.

## Kontrak API yang diusulkan

| Metode dan endpoint | Kebutuhan | Otorisasi |
|---|---|---|
| GET /v1/catalog?category=... | Harga resmi sesuai profil pembeli | Kategori diverifikasi server |
| GET /v1/depots/availability?lat=...&lng=...&date=... | Ketersediaan aktual dan rekomendasi depo | Pembeli |
| POST /v1/orders | Validasi harga, reservasi batch FEFO, nomor order | Pembeli, Idempotency-Key wajib |
| GET /v1/orders | Pesanan milik pengguna atau lingkup operator | Berdasarkan kepemilikan/depo |
| POST /v1/orders/{id}/cancel | Pelepasan reservasi sekali | Pemilik/operator sesuai status |
| POST /v1/orders/{id}/packing | Hasil fisik dan batch aktual | Operator depo |
| POST /v1/orders/{id}/dispatch | Validasi ulang kualitas, tanggal, kurir | Operator depo |
| POST /v1/orders/{id}/receipt | Bukti serah terima | Kurir yang ditugaskan |
| POST /v1/payments | Catatan pembayaran diverifikasi | Operator keuangan |
| POST /v1/cases | Keluhan terkait pesanan milik pengguna | Pembeli |
| POST /v1/cases/{id}/return-receipt | Retur fisik ke karantina | Operator depo |
| POST /v1/cases/{id}/credit | Persetujuan nota kredit | Keuangan dengan wewenang |
| POST /v1/cases/{id}/refund-record | Bukti dana benar-benar dikembalikan | Keuangan |

Setiap mutasi stok dan status harus atomik di database server. Sertakan revision/ETag untuk pengubahan, Idempotency-Key untuk transaksi baru, audit actor dan waktu server, serta penolakan lintas depo/pelanggan. Server adalah sumber stok dan harga resmi. Aplikasi tidak boleh mengurangi stok server berdasarkan salinan SQLite tanpa transaksi reservasi.

## Offline dan migrasi

Catatan aplikasi sekarang adalah lokal, bukan antrean transaksi server. Pada integrasi, tambahkan outbox persisten dengan operation UUID dan status pending/acknowledged/rejected. Pesanan offline harus disebut draf dan belum dijanjikan stok sampai server mengonfirmasi. Jangan mengunggah snapshot lokal sebagai pengganti database seluruh usaha. Konflik stok ditinjau pengguna, bukan last-write-wins.

Migrasikan data native schema 1/2 secara eksplisit melalui import staging tervalidasi, pemetaan depot ID, penghapusan data contoh, dan rekonsiliasi stok fisik. Backup web dan native memiliki skema berbeda; tidak boleh saling dipulihkan langsung.

## Kriteria siap integrasi

Uji dua pelanggan berebut stok terakhir, pengiriman ulang request setelah timeout, kadaluarsa token, akses order orang lain, pencabutan kualitas setelah reservasi, pembatalan ganda, retur parsial berulang, serta refund lintas kasus. Catat notifikasi hanya setelah commit, dengan retry idempotent. Tidak ada SMS/email/push dikirim oleh versi source saat ini.
