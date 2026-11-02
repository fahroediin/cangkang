# TelurFarm 5.2 Master Kandang

27 Oktober 2026. Master kandang dinamis tersedia pada portal tim dan pada aplikasi React Native lokal.

## Cara menambah di portal tim

1. Masuk sebagai Pemilik (OW) atau Manajer Operasional (OM).
2. Buka **Master kandang → + Tambah kandang**.
3. Isi kode unik, nama, lokasi farm, depo hasil panen, kapasitas ekor dan populasi awal.
4. Simpan. Kandang baru otomatis aktif dan tersedia untuk produksi bagi operator yang mempunyai cakupan kandang serta depo tersebut.
5. Sebagai OW, pilih **Tugaskan operator**, pilih anggota FA dan kandang yang ditugaskan. Form mengganti penugasan kandang sebelumnya, bukan menambah tanpa batas. Pilihan Semua kandang mencakup kandang mendatang, tetap dibatasi cakupan depo operator.
6. Sebagai FA, buka **Produksi → Catat produksi**, pilih kandang aktif, lalu isi hasil aktual. Depo mengikuti master dan tetap diperiksa ulang oleh server.

OM hanya mengelola kandang dalam cakupannya. Menambah kandang baru memerlukan cakupan Semua kandang dan depo tujuan yang diperbolehkan. Kandang lama yang deponya belum ditetapkan hanya dapat dikonfigurasi oleh pengelola dengan cakupan Semua depo. Penugasan operator hanya OW; SA, FA, CU, auditor dan role lain tidak mendapat hak mengubah master.

## Cara menambah pada native lokal

Buka **Kelola → Master kandang → + Tambah kandang**. Isi field yang sama, lalu simpan. Gunakan **Kelola → Produksi kandang** untuk memilih kandang yang aktif. Master native tersimpan dalam SQLite dan ikut backup transaksi schema 2. Mode ini tetap pribadi, tidak mempunyai login multiuser dan tidak sinkron ke ruang kerja tim. Penugasan operator hanya tersedia di portal tim.

## Data dan validasi

- Kode 1–30 karakter A–Z, angka, tanda minus atau underscore; huruf dinormalisasi ke kapital. Kode dan nama harus unik, termasuk kandang nonaktif. Nama dinormalisasi Unicode dan spasi untuk pemeriksaan duplikat.
- Nama maksimal 100 karakter; lokasi farm maksimal 300. Lokasi farm merupakan keterangan lokasi, bukan hierarki master farm baru.
- Kapasitas wajib bilangan bulat positif, populasi awal bilangan bulat nol atau positif, dan populasi awal tidak melebihi kapasitas. Batas maksimal masing-masing 10 juta ekor; maksimal 500 master kandang.
- Perkiraan populasi = populasi awal dikurangi seluruh mortalitas yang tercatat untuk ID kandang itu. Belum mencakup pembelian, perpindahan atau penggantian kelompok ayam. Bukan hasil sensus fisik otomatis.
- Populasi awal dan depo yang sudah diketahui terkunci setelah ada produksi. Metadata lama yang masih kosong dapat dilengkapi satu kali. Perubahan nama memakai ID tetap dan tidak mengganti nama snapshot pada riwayat produksi lama.
- Produksi duplikat untuk kandang dan tanggal yang sama ditolak, termasuk setelah nama diganti. Mortalitas baru tidak boleh melebihi perkiraan populasi bila populasi awal diketahui.
- Kandang nonaktif tidak tersedia untuk produksi baru dan tetap dapat dibaca dalam histori. Tidak ada hapus permanen. Mengaktifkan kembali dapat dilakukan dari daftar master.
- Status kandang tidak otomatis mengubah mutu batch, stok atau pesanan telur yang sudah ada.

## Migrasi dan RBAC

Cadangan native schema 2 tetap dipakai dengan field houses dan houseId tambahan. Bila master belum ada, migrasi menyiapkan Kandang A/B/C dan mengenali nama kandang lain dari riwayat. Kapasitas, populasi dan depo lama yang belum diketahui ditandai kosong, bukan diisi angka perkiraan. Nilai produksi lama dipertahankan.

Portal mengonversi scope nama kandang versi 5.1 ke ID stabil; undangan lama juga dikonversi. Produksi tetap menyimpan snapshot nama asli. GET tidak menulis ulang payload database; migrasi disimpan bersama command berikutnya dengan CAS revisi yang sama. ID kandang divalidasi terhadap master di server, termasuk untuk anggota dengan scope Semua kandang.

Peran baru: house.read untuk OW/OM/FA/AU, house.manage untuk OW/OM, dan house.assign untuk OW. Scope kandang dan depo diperiksa pada baca, perubahan master, assignment dan pencatatan produksi. Data pribadi web lama pada index.html tetap terpisah; Master Kandang baru untuk web berada di portal tim.

## Verifikasi

- 116 assertion baru pada tests/v52-houses.mjs: create/edit/status, validasi, scope, assignment, histori, ID stabil, migrasi, mortalitas dan konflik CAS.
- 206 assertion RBAC 5.1 tetap lulus.
- 259 tes native serta TypeScript lulus, termasuk lima tes domain Master Kandang baru.
- Ekspor Android 654 modul dan iOS 656 modul berhasil; versi native 5.2.0, Android versionCode 19, iOS build 19.
- Browser preview lokal: pembuatan ruang kerja, tambah Kandang D dengan metadata, penyimpanan, daftar master dan formulir status diverifikasi. Seluruh role UI, perangkat nyata, GPS dan restore masih memerlukan UAT.
- APK/AAB/IPA belum dibuat. Audience hosting tetap privat; undangan aplikasi tidak otomatis mengubah audience hosting.

## Pemeriksaan source

```
python3 scripts/embed-worker.py
npm run build
node tests/v3-operations.cjs
node tests/v3-server.mjs
node tests/v51-rbac.mjs
node tests/v52-houses.mjs
npm run validate
```

Aturan master bersama berasal dari shared/native-domain.ts, identik dengan mobile/src/domain.ts. Untuk mengubah domain, regenerasi worker/team-domain.js melalui scripts/build-team-domain.cjs, lalu embed dan build. Tidak ada tabel SQL baru; metadata master tersimpan dalam snapshot yang sudah ada. Cadangan transaksi tim tetap tidak mencakup anggota, scope dan histori persetujuan; pemulihan lengkap tim memerlukan backup D1.
