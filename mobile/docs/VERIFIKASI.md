# Verifikasi TelurFarm Native 5.0.0

Tanggal: 27 Oktober 2026.

- 254/254 tes domain dan laporan lulus; TypeScript tsc --noEmit lulus.
- Android Metro/Hermes 654 modul dan iOS 656 modul berhasil diekspor.
- Versi Android/iOS 5.0.0, Android versionCode 17, iOS build 17.
- Tes web operasional termasuk simpan/pakai/hapus filter, nama duplikat, label di-escape, pembatasan batch, kegagalan quota, preferensi rusak, pemisahan key akun dan transaksi tidak berubah, serta persistensi SQLite, isolasi akun dan konflik revisi lulus. Build Worker ESM dan validasi default.fetch lulus.
- Dua puluh satu tes baru mencakup simpan/pakai/hapus filter bernama, snapshot halaman satu, nama unik per batch dan Unicode, batas 10, format/revisi tidak valid, JSON roundtrip, tanggal tetap, kesetaraan web-native, SQLite preferensi persisten, konflik revisi, gagal tulis dan data rusak tanpa menimpa transaksi.
- HTML laporan diuji melalui generator dan simulasi DOM; layout cetak/PDF aktual belum diverifikasi di browser atau perangkat.
- APK/AAB/IPA belum dibangun. UAT browser dan perangkat/emulator belum dilakukan.
- Native masih menyimpan data lokal; sinkronisasi native-web belum dihubungkan. Schema transaksi tetap 2; tabel preferensi app_preferences baru dibuat otomatis. Tidak ada izin baru.
- Ekspor bundle bukan kompilasi APK/IPA atau bukti menu berbagi sudah diuji pada perangkat.
- Lihat docs/FITUR-v5.0.md untuk panduan dan UAT.

## Bundle yang diperiksa

- android: `index-6f87a6b0658217e9a610d84c94b48681.hbc` — SHA-256 `f79cd9a9985e7913b1bffcd5edd778948c156fb21b853ad5baad86f02b27aa2a`
- ios: `index-c139aaae80a8f713105092b39750e5dd.hbc` — SHA-256 `a08b8609064ab1d41aa789df4e6036db6a91abc0f0e34e1f2eabc665d5cc0580`
