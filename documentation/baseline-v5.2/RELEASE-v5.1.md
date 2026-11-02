# TelurFarm 5.1 Ruang kerja tim dan RBAC

Tanggal rilis 27 Oktober 2026. Endpoint dan peran berikut benar-benar diperiksa di Worker. Rancangan matriks 5.0 tidak otomatis berarti seluruh target sudah aktif.

## Yang tersedia

- Portal responsif `/team.html` dengan login gateway ChatGPT, satu ruang kerja milik setiap pembuat dan keanggotaan melalui undangan terikat email.
- 13 peran: OW pemilik, SA administrator, OM manajer operasional, FA farm, QC mutu, DP depo, SL penjualan, FN keuangan, DS distribusi, DR kurir, CS layanan pelanggan, AU auditor, CU pelanggan.
- Satu role per keanggotaan. Scope depo dan kandang diperiksa server. Kategori Perorangan/Wholesale/Hotel-Resort merupakan atribut komersial CU, bukan tingkat kewenangan.
- OW mengundang dan mencabut anggota; tidak dapat mencabut diri sendiri atau memberikan OW lewat undangan. Token acak disimpan sebagai SHA-256, berlaku 72 jam, sekali pakai dan terikat email. Tidak mengirim email otomatis.
- Produksi menghasilkan karantina; QC yang berbeda dari pencatat produksi melepas batch. Penjualan kg atau butir campuran memakai harga server dan alokasi FEFO. Pencarian depo memakai GPS tujuan dengan jarak garis lurus dan scope anggota.
- Packing fisik, penugasan kurir terdaftar, pengiriman dan penerimaan. DR hanya mengakses kiriman yang ditugaskan; harga dan piutang disembunyikan server. Pelanggan hanya melihat pesanan sendiri; harga kategori ditetapkan oleh anggota yang mengundangnya.
- Pembayaran manual dan kasus; hak FN, CS serta auditor dibatasi field dan scope. Tidak ada payment gateway.
- Permintaan transfer, koreksi, batal, harga, biaya, kredit, refund, retur serta lokasi depo. Pembuat berbeda dari penyetuju. Pelaksana memakai parameter yang disetujui; sumber berubah, anggota dicabut atau konfirmasi ganda ditolak.
- Revisi CAS dan kunci idempotensi untuk command; audit operasional hingga 1.000 tindakan berhasil. Fingerprint sumber internal tidak dikirim dalam respons.

## Batas rilis

- Ruang kerja tim dimulai kosong di tabel `telurfarm_teams`, terpisah dari snapshot pribadi web 5.0 dan SQLite native. Tidak ada migrasi atau sinkronisasi otomatis ketiga penyimpanan ini.
- Native 5.1.0 menambahkan tombol Kelola menuju portal online lewat browser sistem. Mode SQLite native tetap pribadi tanpa login multiuser. Bukan RBAC native offline; bukan integrasi API native langsung.
- Hosted Site tetap owner-private. Undangan aplikasi tidak memperluas audience hosting. Pemilik perlu mengizinkan orang yang memang akan menggunakan Site lewat pengaturan akses hosting; rilis ini tidak mengubah audience atau mengundang orang sungguhan.
- SA hanya dapat meninjau anggota dan aktivitas teknis; pemberian role dilakukan OW. Multi-role, delegasi OW, MFA aplikasi sendiri, restore melalui UI, audit eksternal permanen dan SSO native belum tersedia.
- Menu peringatan, penelusuran dan filter tersimpan v5.0 tetap berada di area pribadi; belum seluruhnya dipindahkan ke portal tim. Portal tim memuat operasi inti yang disebut di atas, bukan seluruh menu pribadi.
- Struktur awal tiga depo serta Kandang A/B/C; master farm umum, hierarki tenant dan pertukaran stok lintas usaha belum tersedia.
- Backup dari portal OW adalah transaksi schema native 2 tanpa anggota, undangan, persetujuan dan scope. Laporan AU adalah JSON sesuai cakupan, bukan backup restore. Untuk pemulihan lengkap ruang kerja, administrator memerlukan cadangan D1 yang dikelola secara terpisah.
- Kapasitas payload tim maksimal 1,4 MB, 100 anggota, 30 undangan aktif dan 100 permintaan terbuka. Belum ada benchmark beban atau SLA produksi.

## Instalasi dan pengujian

```
python3 scripts/embed-worker.py
npm run build
node tests/v3-operations.cjs
node tests/v3-server.mjs
node tests/v51-rbac.mjs
npm run validate
```

`npm run dev` memakai SQLite in-memory dan identitas development tetap. Server ini hanya untuk development, menolak NODE_ENV production, tidak dipakai artefak Worker yang diterbitkan dan tidak mempunyai identitas pengguna nyata. Jangan mengeksposnya sebagai server produksi. Gateway hosted menetapkan header identitas; pindah hosting memerlukan lapisan identitas yang tepercaya.

DDL additive `drizzle/0001_team_rbac.sql` juga diinisialisasi dengan CREATE TABLE IF NOT EXISTS pada akses tim. Seluruh perubahan snapshot dan ACL satu ruang kerja memakai satu CAS atomik. Header role dari client tidak dipercaya. `/api/state` tetap data pribadi per identitas, tidak menerima teamId untuk mengakses data tim.

Jalankan UAT perangkat dan restore rehearsal sebelum transaksi nyata. Bundle Hermes bukan APK/AAB/IPA.
