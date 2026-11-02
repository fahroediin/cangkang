# PamanKu Native 6.0.0

Aplikasi React Native untuk Android dan iOS, dengan warna coklat telur, krem, kuning telur, dan putih. Layar memakai komponen native React Native; tidak memakai WebView.

## Filter monitor tersimpan versi 5.6

Filter riwayat mutasi lokal dapat diberi nama, dipakai kembali atau dihapus. Maksimal10 per perangkat, terpisah dari filter portal yang pribadi per akun/workspace. Nama maksimal60 karakter dan unik. Tanggal tetap. Tidak ikut backup transaksi.

## Monitor mutasi sejak versi 5.5

Filter riwayat lokal melalui Kelola → Master kandang → Filter riwayat mutasi. Jenis, kandang, periode dan pencarian; pagination20 baris. Monitor persetujuan dan CSV sesuai scope tersedia di portal online.

## Persetujuan mutasi tim sejak versi 5.4

Portal tim memakai Ajukan → Setujui/Tolak → Jalankan. Pembuat dan pemeriksa harus berbeda. OW/OM menyetujui dan menjalankan; FA dapat mengajukan sesuai cakupan. Saldo native lokal tidak tersambung ke alur tim; buka portal untuk persetujuan server.

## Mutasi populasi lokal sejak versi 5.3

Catat ayam masuk, keluar/afkir, dan pindah kandang beserta tanggal, jumlah dan alasan. Saldo, kapasitas dan kronologi diperiksa. Riwayat tidak dapat dihapus; koreksi menggunakan transaksi pembalik yang valid.

Buka Kelola → Master kandang untuk menambah kode, nama, lokasi, depo hasil panen, kapasitas, populasi awal dan status. Kandang aktif dapat dipilih saat mencatat produksi. Master dan histori ikut backup native schema 2. Mode SQLite tetap pribadi; penugasan operator hanya di portal tim. Lihat docs/FITUR-v6.0.md.

## Akses tim sejak versi 5.1

Menu Kelola menyediakan tombol Buka portal tim online. Portal memakai sesi ChatGPT dan RBAC server. SQLite native tetap data pribadi tanpa login multiuser; data perangkat tidak otomatis sinkron dengan tim. Lihat docs/FITUR-v5.1.md. VersionCode Android 27 dan build iOS 27. APK/AAB/IPA belum dibangun.

## Status hasil

- Source TypeScript, proyek Android (`android/`) dan iOS (`ios/`) lengkap disertakan.
- Penyimpanan SQLite lokal; data bertahan setelah aplikasi ditutup.
- GPS foreground, pemilihan berkas, invoice PDF, dan berbagi berkas memakai modul native.
- Harga dan kategori: Perorangan, Wholesale, Hotel/Resort; pembelian kg atau butir.
- Stok per varian/batch, FEFO berdasarkan tanggal kirim, karantina/blokir, sortir sebagian, transfer depo, koreksi stok opname.
- Produksi kandang, pesanan, hasil timbang, kurir, serah terima, pembayaran manual, piutang, keluhan, retur, kredit, refund, dan biaya.
- Pemesanan ulang dengan harga terbaru; jadwal pembelian 1/2/4 minggu, jeda/aktifkan, pengingat lokal dalam aplikasi, dan pencegahan konfirmasi ganda. Lihat `docs/FITUR-PEMBELIAN-RUTIN.md`.
- Cadangan native schema 2 serta migrasi schema 1 dan impor dengan validasi. Format ini **berbeda dari cadangan web**.

**Belum ada APK/IPA hasil kompilasi.** Pemeriksaan yang dilakukan: TypeScript, 266 tes aturan dan penyimpanan, prebuild Android/iOS, dan ekspor bundle Hermes untuk kedua platform. Belum diuji di emulator atau perangkat fisik. Xcode belum dijalankan; percobaan Gradle sebelumnya belum lulus karena dependency native belum lengkap, sehingga belum ada hasil APK/AAB yang dapat dibagikan.

## Persiapan developer

Gunakan Node.js 22.14+ atau Node.js 24 (versi yang dipakai saat pemeriksaan: 24.22.1), npm, JDK 17, serta Android Studio/SDK untuk Android. iOS harus dibangun pada macOS dengan Xcode dan CocoaPods yang kompatibel Expo SDK 55. Toolchain Xcode dan CocoaPods harus memenuhi dependency proyek Expo SDK 55 dan React Native 0.83.10. Build iOS dengan Xcode 15 pada Mac Anda belum divalidasi untuk proyek ini. Target aplikasi iOS minimum 15.1, sehingga iPhone iOS 17 termasuk target versi OS, tetapi pengujian nyata tetap diperlukan.

```bash
npm ci
npm run typecheck
npm test
```

Dependency terkunci di `package-lock.json`. Jangan menjalankan pembaruan semua paket sebelum build pertama berhasil.

Lihat juga `docs/RILIS-NATIVE.md` dan script build Android preview, iOS Simulator, serta archive iPhone pada folder `scripts/`.

## Jalankan Android native

1. Pasang Android SDK Platform 36, Build Tools yang diminta Gradle, platform-tools, serta NDK/CMake yang diminta dependency React Native melalui Android Studio.
2. Set `ANDROID_HOME` ke SDK dan tambahkan `platform-tools` ke PATH. Aktifkan USB debugging pada perangkat atau jalankan emulator.
3. Jalankan:

```bash
npm run android
```

Perintah ini membangun native debug app, memasangnya, dan memulai Metro. Mode debug membutuhkan Metro untuk menjalankan JavaScript. Ini bukan APK standalone untuk distribusi.

Untuk menghasilkan APK standalone melalui EAS, gunakan akun Expo milik Anda:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile preview
```

`preview` menghasilkan APK internal. `production` menghasilkan Android App Bundle (AAB):

```bash
npx eas-cli@latest build --platform android --profile production
```

Jangan kirim APK hasil signing debug ke Play Store. Proyek Gradle standar hasil prebuild masih memakai signing debug untuk build lokal; gunakan pengelolaan signing EAS atau ubah konfigurasi signing produksi dengan keystore milik usaha. Jangan menyimpan keystore/password pada source.

## Jalankan iOS native pada Mac

```bash
npm ci
npx pod-install
npm run ios
```

Untuk perangkat fisik:

```bash
npx expo run:ios --device
```

Atau buka `ios/TelurFarm.xcworkspace` setelah pemasangan Pods, pilih Signing & Capabilities → Team milik Anda, pilih iPhone, dan Run. Provisioning ditentukan oleh Apple Developer Team, bukan harus sama dengan Apple ID iCloud pada iPhone. Personal Team dapat dipakai untuk skenario uji lokal yang diizinkan Apple; distribusi TestFlight/App Store memerlukan keanggotaan Apple Developer dan konfigurasi App Store Connect.

Untuk build internal IPA melalui EAS:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile preview
```

Daftarkan perangkat yang akan menerima IPA ad hoc. Build TestFlight/App Store:

```bash
npx eas-cli@latest build --platform ios --profile production
```

Profil `simulator` menghasilkan aplikasi simulator iOS, **bukan IPA untuk iPhone**.

Nama package/bundle saat ini `com.telurfarm.mobile`. Pastikan kepemilikan dan ketersediaannya pada akun usaha sebelum membuat identitas store. Tidak ada Team ID, akun cloud, token, provisioning profile, atau keystore produksi yang disertakan.

## Regenerasi proyek native

`app.json` adalah sumber konfigurasi. Setelah mengubah ikon, permission, package ID, atau plugin:

```bash
npx expo prebuild --no-install
```

Direktori Android/iOS sudah disertakan. Jangan memakai `--clean` setelah menambahkan konfigurasi native manual sebelum meninjau dampaknya. Untuk setup baru pada Mac, pasang ulang Pods setelah perubahan plugin native.

## Penggunaan pertama

1. Aplikasi mulai dengan data kosong. Buka Kelola → Pengaturan dan verifikasi koordinat tiga depo contoh.
2. Tambah batch nyata atau catat produksi. Hasil produksi belum diklasifikasikan dan dikarantina.
3. Klasifikasikan/ sortir hasil pemeriksaan menjadi varian aktif. Tanggal panen tidak boleh ditebak; kolom dapat dikosongkan bila tidak diketahui.
4. Pilih kategori, produk, satuan, tanggal kirim, lokasi tujuan dan depo. Tanpa lokasi, aplikasi tidak mengklaim urutan jarak.
5. Buat pesanan lokal, periksa hitungan/berat, isi kurir, kirim, lalu catat penerima.
6. Catat dana yang sudah diterima. Untuk keluhan/retur, pisahkan penerimaan fisik, kredit tagihan, dan refund yang benar-benar dibayar.
7. Dari detail pesanan pilih Pesan lagi atau Buat jadwal pembelian. Buka Aktivitas → Jadwal pembelian untuk konfirmasi pembelian berikutnya; tidak ada pesanan otomatis.
8. Ekspor cadangan secara rutin. Simpan berkas pada tempat yang Anda pilih melalui menu berbagi ponsel.

Data contoh hanya dapat dimuat pada perangkat kosong melalui Pengaturan. Label DATA CONTOH tetap terlihat. Harga contoh dan ongkir Rp0 belum merupakan kebijakan harga operasional. Aplikasi tidak mengirim pesanan ke depo nyata atau melakukan transaksi bank.

## Sinkronisasi dan akses

Versi native ini beroperasi **lokal per perangkat**. Tidak ada login pelanggan/kurir terpisah, RBAC, pengiriman pesanan ke server, push notification, payment gateway, atau sinkronisasi otomatis dengan web. Menu operator dan pemesanan berada dalam aplikasi lokal yang sama; bukan pemisahan wewenang.

Backend web PamanKu saat ini menggunakan identitas privat ChatGPT dari gateway Sites. Jangan menanam token bypass atau meniru header identitas tersebut pada aplikasi mobile. Integrasi berikutnya memerlukan API pelanggan khusus dengan autentikasi mobile, otorisasi per peran, transaksi reservasi stok server, dan penanganan idempotensi. Lihat `docs/INTEGRASI.md`.

## Struktur

- `App.tsx`: layar, navigasi tab, dialog form, GPS, invoice, cadangan.
- `src/domain.ts`: aturan stok, FEFO, transaksi pesanan, pembayaran, retur, dan validasi cadangan.
- `src/storage.ts`: SQLite, pemuatan state, dan simpan revision compare-and-swap.
- `src/theme.ts`: palet dan gaya komponen.
- `tests/domain.test.mjs`: pengujian aturan domain tanpa perangkat.
- `android/`, `ios/`: proyek native yang dihasilkan dari konfigurasi aplikasi.
- `eas.json`: profil APK internal, simulator, AAB, dan iOS.
- `docs/UAT.md`: skenario yang masih harus diperiksa pada perangkat.
- `docs/VERIFIKASI.md`: hasil pemeriksaan dan batas bukti.

## Referensi resmi

- https://docs.expo.dev/versions/v55.0.0/
- https://expo.dev/changelog/sdk-55
- https://docs.expo.dev/guides/local-app-development/
- https://docs.expo.dev/build/setup/
- https://docs.expo.dev/build-reference/apk/
- https://docs.expo.dev/versions/v55.0.0/sdk/location/
- https://docs.expo.dev/versions/v55.0.0/sdk/sqlite/

## Baru di v3.1

Pusat peringatan stok menipis, batas jual, dan batch perlu tinjauan. Buka Kelola → Peringatan stok. Rincian: [docs/FITUR-v3.1.md](docs/FITUR-v3.1.md).

## Baru di v3.2

Ekspor laporan stok CSV/PDF dan kekurangan kg ke ambang, mengikuti filter. Buka Kelola → Peringatan stok. Lihat [docs/FITUR-v3.2.md](docs/FITUR-v3.2.md) untuk langkah dan batas laporan.

## Baru di v3.3

Simulasi transfer antar depo per varian, sumber surplus yang menjaga ambang, sisa kebutuhan, dan ekspor simulasi CSV. Laporan PDF menyertakan simulasi. Tidak ada perubahan stok otomatis. Lihat [docs/FITUR-v3.3.md](docs/FITUR-v3.3.md).

## Baru di v3.4

Kandidat batch transfer FEFO, pembagian kg yang tidak dipakai ganda, ekspor kandidat CSV, dan rincian pada PDF. Snapshot ekspor native konsisten dan stok tidak berubah otomatis. Langkah dan batas: [docs/FITUR-v3.4.md](docs/FITUR-v3.4.md).

## Baru di v3.5

Siapkan transfer langsung dari kandidat batch untuk tanggal hari ini. Usulan kg dan tujuan mengikuti kandidat; isi butir serta catatan fisik sebelum konfirmasi. Draft menolak perubahan saldo/kondisi dan konfirmasi berulang. Lihat [docs/FITUR-v3.5.md](docs/FITUR-v3.5.md).

## v3.6
Penelusuran akar dan seluruh cabang batch, saldo dan kualitas terkini, serta ekspor CSV. Lihat docs/FITUR-v3.6.md.

## v3.7
Pesanan terkait batch dengan cakupan batch/keluarga, filter pembatalan, detail dan CSV. Lihat docs/FITUR-v3.7.md.

## v3.8
Ringkasan status/kategori serta laporan PDF pesanan terkait batch. Lihat docs/FITUR-v3.8.md.

## v3.9
Filter kategori pembeli dan rentang tanggal pengiriman pada daftar, ringkasan, CSV dan PDF pesanan batch. Lihat docs/FITUR-v3.9.md.

## v4.0
Pencarian nomor/nama dan daftar 20 pesanan per halaman; ringkasan/CSV/PDF tetap mencakup seluruh hasil filter. Lihat docs/FITUR-v4.0.md.

## v4.5
Filter depo/status spesifik, pilihan urutan, ringkasan depo, ekspor ringkasan CSV serta reset seluruh filter. Lihat docs/FITUR-v4.5.md.

## v4.6
Pilihan cepat Diproses hari ini, Dalam pengiriman hari ini dan Diproses lewat tanggal pada pesanan terkait batch. Lihat docs/FITUR-v4.6.md.

## v4.7
Ringkasan kategori/status/depo interaktif untuk menyaring pesanan dan membuka kembali satu filter melalui tombol Semua. Lihat docs/FITUR-v4.7.md.

## v4.8
Kembali satu langkah ke filter dan halaman sebelum klik ringkasan, memakai data terkini. Lihat docs/FITUR-v4.8.md.

## v4.9
Ukuran halaman 10/20/50, navigasi pertama/terakhir/lompat halaman dan pemulihan ukuran pada riwayat filter. Lihat docs/FITUR-v4.9.md.

## v5.0
Filter pemeriksaan tersimpan bernama: simpan/pakai/hapus, maksimal 10, lokal terpisah dari transaksi. Lihat docs/FITUR-v5.0.md.

## Perubahan filter versi 5.7

Ubah nama dan perbarui isi dari filter aktif tersedia pada daftar filter mutasi. ID, urutan dan jumlah tetap. Perubahan isi memerlukan konfirmasi dengan ringkasan pilihan. Detail di docs/FITUR-v6.0.md.

## Pergantian nama sejak v5.8

Nama produk berubah dari TelurFarm menjadi PamanKu. Daftar filter mendukung ubah nama, perbarui isi dan duplikasi. Lihat docs/FITUR-v6.0.md. Identitas bundle/package, skema URL, nama SQLite dan tag app backup lama dipertahankan untuk kompatibilitas data.

## Filter favorit sejak v5.9

Tandai/lepas favorit, tampilkan favorit dahulu atau hanya favorit. Preferensi tidak otomatis diterapkan. Duplikasi membuat salinan tanpa tanda favorit. Lihat docs/FITUR-v6.0.md.

## Ringkasan kandang v6.0

Kelola → Master kandang menampilkan ringkasan periode: telur, pakan, mortalitas dan kelengkapan pencatatan, dengan populasi kini dan CSV. Panduan: docs/FITUR-v6.0.md.
