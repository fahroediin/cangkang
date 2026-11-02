# TelurFarm Panduan Sistem dan Source Code
Versi 5.0 - 27 Oktober 2026

## 1 Cakupan dan status rilis

TelurFarm 5.0 mendukung pencatatan peternakan ayam petelur, persediaan per batch, penjualan telur dan pemeriksaan distribusi. Paket ini ditujukan kepada pemilik produk, operator farm dan depo, developer, tester serta pengelola infrastruktur. Gunakan dokumentasi bersama source yang disertakan untuk menjalankan lingkungan development, memeriksa perilaku dan menyiapkan serah terima.

Web telah diterbitkan pada https://telurfarm-banten.tangwanan.chatgpt.site. Web memakai HTML, CSS dan JavaScript dengan backend Worker ESM serta D1. Mobile memakai React Native dengan komponen Android dan iOS, bukan WebView. Source proyek native disertakan, tetapi APK, AAB dan IPA belum dibangun pada rilis ini.

| Aspek | Status versi 5.0 |
| --- | --- |
| Pengujian domain dan penyimpanan | 254 tes lulus pada Node 24.22.1 |
| TypeScript dan Worker | TypeScript, build web dan validasi ESM lulus |
| Bundle Android dan iOS | Metro dan Hermes berhasil diekspor; bukan binary instalasi |
| Pengujian browser dan perangkat | Belum dilakukan pada browser, emulator atau perangkat fisik |
| Data native | SQLite lokal per perangkat; belum terhubung ke backend web |
| Akses dan transaksi eksternal | Native belum memiliki login multiuser atau RBAC; pembayaran dicatat manual |

Paket memuat seluruh source aplikasi yang dikembangkan untuk rilis ini beserta konfigurasi dan pengujian. Dependency pihak ketiga dipasang melalui package manager. node_modules, Pods, cache build, data transaksi pengguna dan kredensial produksi tidak disertakan. Kunci debug Android standar disertakan untuk development dan tidak boleh dipakai sebagai identitas signing produksi.

Dokumen ini merupakan baseline fungsi yang tersedia, bukan pernyataan bahwa aplikasi telah lulus UAT atau siap digunakan untuk operasi produksi tanpa konfigurasi, pengujian perangkat dan persetujuan pemilik proses.

## 2 Daftar isi paket source

| Folder atau berkas | Isi dan kegunaan |
| --- | --- |
| web/web | HTML, CSS, JavaScript aplikasi dan service worker |
| web/worker | Handler API dan Worker yang memuat aset web |
| web/drizzle | DDL D1 untuk snapshot data per identitas pengguna |
| web/tests | Simulasi operasi dan pengujian API menggunakan SQLite |
| web/scripts | Embed aset, build Worker dan validasi artefak |
| mobile | Source React Native, package-lock, konfigurasi Expo dan proyek Android serta iOS |
| mobile/src | Aturan domain, alokasi stok, laporan, penelusuran dan penyimpanan |
| mobile/tests | Tes domain, laporan, filter, preferensi dan fixture silang web |
| database | DDL web D1 dan SQLite native beserta penjelasan penyimpanan JSON |
| documentation | Dokumentasi Word, Markdown, data isi dan skrip pembentuk dokumen |
| scripts dan README.md | Pemeriksaan paket dan langkah mulai development |
| SOURCE_MANIFEST.json dan CHECKSUMS.sha256 | Identitas source, versi dan hash berkas untuk pemeriksaan integritas |

Manifest hosting pada salinan development tidak memuat project_id produksi. Binding DB tetap bernama DB. Sebelum deployment ke lingkungan baru, buat Site atau konfigurasi hosting milik lingkungan tersebut dan isi identitas proyek yang benar. Source asli web ditandai dengan commit ebaf5acdae4ff7b3ac5c3e04c2fced1828351176 dalam manifest paket.

Berkas worker/index.js dihasilkan dari aset frontend dan handler. Sesudah mengubah web/web atau handler, jalankan embed-worker.py sebelum build. Jangan mengedit hanya file hasil build karena perubahan tersebut hilang saat regenerasi.

Source native memuat lisensi yang sudah ada pada mobile/LICENSE. Periksa lisensi dependency masing-masing sebelum redistribusi. Tidak ada keystore produksi, provisioning profile, Team ID Apple atau token layanan yang ditanam di paket.

## 3 Fungsi bisnis yang tersedia

| Kelompok | Fungsi |
| --- | --- |
| Farm | Produksi telur, berat hasil, telur rusak, konsumsi pakan dan kematian; web juga menyediakan kandang, pakan serta catatan kesehatan |
| Persediaan | Batch, varian reguler/pilihan/ekonomis, karantina, blokir, sortir sebagian, transfer depo dan koreksi fisik |
| Penjualan | Kategori Perorangan, Wholesale dan Hotel/Resort; pembelian kg atau butir, harga per kategori dan pesanan campuran |
| Depo | Pemilihan depo dengan cakupan dan persediaan varian yang sesuai; rekomendasi jarak bila koordinat tujuan tersedia |
| Distribusi | Jadwal kirim, hitung dan timbang fisik, penugasan kurir serta pencatatan penerima |
| Keuangan | Pembayaran manual, saldo piutang, kredit tagihan, refund dan biaya; web menyediakan estimasi HPP |
| Layanan pelanggan | Keluhan, penerimaan retur, karantina retur, koreksi tagihan dan pengembalian dana |
| Pembelian rutin | Pesan lagi dan jadwal pembelian yang perlu dikonfirmasi operator; tidak membuat pesanan diam-diam |
| Analisis stok | Stok menipis, mendekati batas jual, batch perlu tinjauan, laporan serta simulasi transfer FEFO |
| Penelusuran | Akar dan cabang batch, pesanan terkait, filter, ringkasan interaktif, navigasi daftar dan ekspor |
| Filter tersimpan 5.0 | Simpan, pakai dan hapus pengaturan bernama; maksimum 10 pengaturan lokal |

Fungsi web dan mobile tidak sepenuhnya sama. Mobile mengutamakan operasi lokal dengan menu Kelola dan komponen native. Harga, koordinat depo, nama kandang dan data contoh harus ditinjau sebelum dipakai operasional. Web saat ini memvalidasi tiga depo bawaan; pengembangan master depo bebas belum merupakan fasilitas multi-cabang yang umum.

Belum tersedia: sinkronisasi native ke web, login pelanggan atau kurir terpisah pada mobile, RBAC menyeluruh, payment gateway, pemindahan uang bank otomatis, push notification, pelacakan kurir di latar belakang, integrasi timbangan IoT dan akuntansi buku besar lengkap. Perlakukan hal-hal tersebut sebagai pekerjaan lanjutan yang memerlukan desain dan pengujian tersendiri.

## 4 Peran operasional dan alur utama

Pembagian tugas berikut adalah panduan operasional. Menu operator dan pemesanan pada native berada dalam aplikasi lokal yang sama; pembagian ini belum menjadi kontrol akses berbasis peran di dalam aplikasi.

| Peran | Tanggung jawab utama |
| --- | --- |
| Pemilik farm | Meninjau produksi, stok, biaya, piutang dan kesiapan serah terima |
| Operator farm | Mencatat produksi, pakan dan kondisi kandang berdasarkan hasil aktual |
| Operator depo | Memeriksa batch, varian, kualitas, berat, butir, transfer dan retur |
| Penjualan dan keuangan | Memeriksa kategori pembeli, harga, pesanan, pembayaran, kredit dan refund |
| Petugas distribusi | Memeriksa packing, kurir, pengantaran dan bukti penerimaan |
| Developer dan administrator | Menyiapkan lingkungan, backup, deployment, pemantauan dan pemulihan |

Produksi ke stok. Operator mencatat tanggal, kandang, telur baik, berat, kerusakan, pakan dan kematian. Batch hasil produksi yang belum diklasifikasikan perlu ditinjau. Operator menentukan varian, kualitas dan tanggal yang benar-benar diketahui, lalu menyetujui stok yang layak untuk pesanan baru.

Pesanan ke pengiriman. Pilih kategori pembeli, varian, satuan dan jumlah. Tentukan tanggal kirim, alamat serta lokasi bila tersedia. Aplikasi memeriksa ketersediaan varian di depo dan mengalokasikan batch yang layak. Operator menghitung dan menimbang fisik, menetapkan kurir, memulai pengiriman dan mencatat penerima saat serah terima.

Penyelesaian tagihan. Keuangan mencatat dana yang benar-benar diterima. Pengiriman selesai tidak otomatis melunasi tagihan. Untuk keluhan, bedakan keputusan menerima retur, penerimaan fisik ke karantina, kredit pengurang tagihan dan refund yang benar-benar dibayar. Setiap tahap harus diperiksa terhadap transaksi asal.

Pembatalan sebelum pengiriman mengembalikan alokasi stok sekali. Retur setelah barang dikirim mengikuti penerimaan fisik dan batas kuantitas dari pengiriman. Jangan menambah stok atau mengurangi tagihan hanya berdasarkan percakapan pelanggan tanpa pencatatan proses yang sesuai.

## 5 Aturan stok penjualan dan keuangan

Kg dan butir dicatat sebagai dua ukuran fisik. Angka perkiraan seperti 16 butir per kg tidak menggantikan timbang dan hitung aktual. Jumlah butir harus bilangan bulat; pembulatan berat pada perhitungan stok memakai enam angka desimal. Simpan jumlah hasil packing dan alasan koreksi dengan benar.

Batch layak untuk alokasi baru harus memiliki varian yang sesuai, status Aktif, persetujuan yang diperlukan pada web, serta tanggal yang tidak membuatnya belum dipanen atau lewat batas jual pada tanggal pengiriman. Batch karantina, diblokir atau belum diklasifikasikan tetap memiliki saldo fisik tetapi tidak otomatis menjadi stok siap jual.

FEFO mendahulukan batas jual terdekat, kemudian tanggal panen dan ID sebagai pemecah urutan. Tanggal yang tidak diketahui tetap ditandai kosong. Persetujuan kualitas bukan sertifikat mutu dan batas jual merupakan ketentuan operasional yang dicatat usaha, bukan hasil perhitungan laboratorium otomatis.

Rekomendasi depo mempertimbangkan lokasi, cakupan layanan dan ketersediaan varian. Jarak adalah garis lurus dari koordinat, bukan jarak jalan atau estimasi waktu berkendara. Tanpa koordinat tujuan yang valid, hasil tidak boleh dinyatakan sebagai depo terdekat berdasarkan jarak. Verifikasi koordinat dan cakupan depo bawaan sebelum digunakan.

Transfer memecah saldo menjadi batch anak dengan parentId, tanpa menambah total persediaan. Form transfer dari kandidat memeriksa ulang saldo dan kondisi serta menolak konfirmasi berulang. Membuka atau membatalkan form tidak memindahkan stok. Perubahan data sejak simulasi mengharuskan pemeriksaan atau simulasi ulang.

| Perhitungan web | Makna |
| --- | --- |
| Tagihan bersih | Nol untuk pesanan dibatalkan; selain itu maksimum nol atau nilai pesanan dikurangi kredit |
| Dana bersih | Total pembayaran tercatat dikurangi refund |
| Saldo tagihan | Maksimum nol atau tagihan bersih dikurangi dana bersih |
| Refund tertunda | Maksimum nol atau dana bersih dikurangi tagihan bersih |
| Estimasi HPP web | Biaya pakan dan biaya produksi tercatat dibagi produksi baik; distribusi dicatat terpisah |

Selisih harga jual terhadap estimasi HPP belum merupakan laba bersih. Biaya yang belum dicatat, alokasi distribusi dan kelengkapan harga pakan memengaruhi hasil. Source domain dan validasi adalah acuan terakhir untuk batas jumlah, status serta dokumen yang dapat diproses.

## 6 Arsitektur dan batas kepercayaan

| Lapisan | Komponen dan hubungan |
| --- | --- |
| Web frontend | web/index.html memuat batch-core.js, stock-alerts.js, traceability.js dan app.js; state lokal memakai localStorage |
| Web API | Worker melayani aset dan GET atau POST pada /api/state; binding DB mengarah ke D1 |
| Identitas hosted | Gateway Sites menetapkan identitas pengguna yang diteruskan ke Worker; data server dipisah menurut user_id |
| Native antarmuka | App.tsx memakai React Native, modul lokasi foreground, file picker, berbagi dan PDF |
| Native aturan | src/domain.ts menangani transaksi; stock-alerts.ts dan traceability.ts menangani laporan serta filter |
| Native persistensi | src/storage.ts membuka SQLite, menyimpan snapshot transaksi dengan revisi dan preferensi secara terpisah |

Backend merupakan satu Worker dengan penyimpanan snapshot, bukan kumpulan microservices terpisah. Tidak ada PostgreSQL, ClickHouse, Redis atau Kafka yang diperlukan oleh source ini. Infrastruktur tersebut dapat dirancang pada pengembangan berikutnya tetapi belum menjadi dependency runtime paket.

Header oai-authenticated-user-id dipercaya karena jalur hosted berada di belakang gateway Sites. Jika handler dipindahkan ke hosting umum, jangan mempercayai header yang dapat dikirim langsung oleh client. Sediakan autentikasi yang memvalidasi identitas dan membuang atau menetapkan header tepercaya sebelum handler dapat diakses. Mengganti host tanpa lapisan tersebut dapat menghilangkan pemisahan data pengguna.

Mobile tidak memakai header identitas tersebut dan tidak membawa token bypass. Backend hosted bukan endpoint autentikasi mobile yang siap dipakai. Integrasi mobile membutuhkan kontrak login, otorisasi, API transaksi, sinkronisasi, konflik dan mode offline yang belum diimplementasikan.

Izin mobile dipakai sesuai tindakan pengguna: lokasi foreground saat meminta rekomendasi depo, pemilihan berkas dan menu berbagi. Tidak ada kebutuhan lokasi background, kamera atau rekam audio pada konfigurasi saat ini.

## 7 Penyimpanan dan hubungan data

Tabel fisik utama menyimpan payload JSON, bukan tabel SQL terpisah untuk setiap objek bisnis. Hubungan di bawah adalah hubungan logis dalam payload. Jangan menjalankan DDL entitas bisnis terpisah yang tidak digunakan oleh source.

| Database fisik | Kolom dan fungsi |
| --- | --- |
| Web D1 telurfarm_state | user_id sebagai primary key; revision; data_json; updated_at. Satu snapshot data web per identitas gateway |
| Native SQLite app_state | id dibatasi 1; revision; payload. Satu snapshot transaksi lokal dengan schema domain 2 |
| Native SQLite app_preferences | key sebagai primary key; revision; payload. Key trace_saved_filters menyimpan preferensi schema 1 |
| Browser localStorage | telurfarm-v1 dan metadata sinkron; filter tersimpan memakai prefix telurfarm-trace-saved-v1 dengan pemisahan key akun aktif atau perangkat |

Native state memiliki koleksi depots, lots, orders, plans, payments, cases, production, expenses, prices dan audit, beserta schema, app, revision serta penanda demo. Web memakai model yang lebih luas termasuk pelanggan, kurir, biaya, harga pakan, jurnal stok, piutang dan rincian penanganan kasus. Nama field kedua platform tidak selalu sama.

| Hubungan logis | Field penting |
| --- | --- |
| Batch ke induk dan depo | lots.id, parentId; native depotId dan web depot |
| Pesanan ke batch | native orders.allocations berisi lotId dan line; web lotAllocations memakai lotId dan itemIndex |
| Pembayaran ke pesanan | payments.orderId dan jumlah pembayaran; status tetap diperiksa |
| Keluhan dan retur ke pesanan | cases.orderId, penerimaan fisik, kredit dan refund sesuai model platform |
| Jadwal ke sumber pembelian | Native plans.sourceOrderId dan pengaturan interval; perlu konfirmasi pesanan baru |
| Filter tersimpan ke batch | items.view.lotId; snapshot cakupan, status, filter dan pageSize; page disimpan satu |

Web mengirim seluruh snapshot data dalam /api/state, dengan expectedRevision untuk mendeteksi konflik. Native menyimpan transaksi melalui UPDATE yang mensyaratkan revisi lama. Preferensi native juga menggunakan revisi, tetapi terpisah dari transaksi. Kegagalan preferensi tidak boleh dianggap sebagai kegagalan transaksi yang sudah tersimpan.

DDL rujukan tersedia pada database/web-d1.sql dan database/native-sqlite.sql. Aplikasi native membuat tabelnya otomatis. Cadangan native schema 2 dan cadangan web schema 1 tidak dapat saling dipertukarkan. Filter tersimpan tidak ikut kedua cadangan transaksi tersebut.

## 8 Kontrak API web

API yang tersedia saat ini adalah GET dan POST /api/state. Akses memakai identitas gateway hosted, origin yang sesuai, payload JSON serta binding DB. Data bukan API granular untuk membuat satu pesanan; seluruh state divalidasi dan disimpan sebagai snapshot.

| Operasi | Permintaan dan respons |
| --- | --- |
| GET /api/state | Tanpa body. Respons memuat userId, email, revision, updatedAt dan data atau null bila belum ada |
| POST /api/state | Body expectedRevision dan data. Untuk data baru expectedRevision 0; berikutnya gunakan revision dari server |
| Respons simpan | revision baru dan updatedAt; POST tidak otomatis menggabungkan perubahan dua snapshot |

```
const current = await fetch('/api/state', {
  credentials: 'same-origin', cache: 'no-store'
}).then(r => r.json());
// data harus state web lengkap yang lolos validateBackup
const response = await fetch('/api/state', {
  method: 'POST', credentials: 'same-origin',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    expectedRevision: current.revision, data: webState
  })
});
```

| Status | Makna penanganan |
| --- | --- |
| 200 | Baca atau simpan berhasil |
| 400 | JSON atau expectedRevision tidak valid |
| 401 | Identitas tepercaya tidak tersedia; perbarui sesi |
| 403 | Origin atau sumber permintaan tidak diizinkan |
| 405 | Metode tidak didukung |
| 409 | Konflik revisi; baca dan tinjau data server sebelum mencoba lagi |
| 413 | Payload melampaui batas sekitar 1,5 MB |
| 415 | Content-Type bukan application/json |
| 422 | Snapshot gagal validasi bisnis |
| 503 | Binding DB belum tersedia |

Jangan menghapus expectedRevision atau mengirim ulang snapshot lama secara paksa untuk mengatasi 409. UI web menyediakan pemeriksaan konflik. API native dan login pelanggan belum tersedia. Dokumentasi integrasi pada mobile/docs/INTEGRASI.md menjelaskan batas ini lebih lanjut.

## 9 Instalasi dan pemeriksaan web

Gunakan lingkungan development terpisah dari Site operasional. Source web tidak memerlukan framework atau instalasi node_modules untuk build yang tersedia. Pemeriksaan paket dilakukan pada Node 24.22.1, npm 11.9.0 dan Python 3. Tes server memakai node:sqlite dan membutuhkan Node yang menyediakannya.

```
cd web
python3 scripts/embed-worker.py
npm run build
node tests/v3-operations.cjs
node tests/v3-server.mjs
npm run validate
```

Tes operasi membuat fixture sementara /tmp/telurfarm3-state.json yang dipakai tes server, sehingga urutannya penting. Hasil build berada pada dist/server/index.js dan harus mengekspor default.fetch. Aset berasal dari web/ dan handler berasal dari worker/handler.js.

Untuk melihat antarmuka secara statis di komputer development, jalankan perintah berikut dan buka localhost. Mode ini hanya melayani frontend; /api/state dan identitas gateway hosted tidak tersedia pada server file statis.

```
python3 -m http.server 8080 --directory web
```

Untuk hosting Sites, daftarkan lingkungan development dan isi project_id baru dalam .openai/hosting.json melalui workflow Sites. Pertahankan binding DB dan jalankan DDL D1 pada lingkungan yang dituju sebelum pengujian API. Salinan manifest dalam paket sengaja tidak membawa project_id produksi.

Jangan memperbarui worker/index.js secara manual tanpa memperbarui sumber aset. Setelah perubahan frontend, ulangi embed, build dan pemeriksaan yang relevan. Tidak perlu mengubah isi data produksi hanya untuk menguji perubahan tampilan.

## 10 Instalasi dan build mobile

Dependency terkunci pada mobile/package-lock.json. Paket memakai Expo sekitar 55.0.31, React 19.2.0 dan React Native 0.83.10. Proyek Android dan iOS sudah disertakan. CocoaPods, Android SDK/NDK dan toolchain native harus dipasang sesuai dependency proyek; build native final belum diverifikasi pada mesin target.

```
cd mobile
npm ci
npm run typecheck
npm test
npm run android
```

Android memerlukan JDK 17 dan Android SDK yang diminta proyek. Gradle wrapper yang disertakan memakai Gradle 9.0.0. Konfigurasi package adalah com.telurfarm.mobile, versionName 5.0.0 dan versionCode 17. npm run android membangun serta memasang aplikasi development dan menjalankan Metro.

```
export ANDROID_HOME=/lokasi/android-sdk
bash scripts/build-android-preview.sh
bash scripts/smoke-android.sh
```

Script preview menargetkan arm64-v8a dan menggunakan signing debug standar dari konfigurasi lokal. Hasil yang diharapkan adalah artifacts/apk/TelurFarm-v5.0.0-preview-arm64.apk. Perintah ini belum dijalankan sampai menghasilkan APK pada rilis ini. Untuk distribusi produksi gunakan signing milik usaha; jangan mengganti namanya lalu menganggapnya sebagai APK produksi.

```
cd mobile
npm ci
npx pod-install
npm run ios
# Untuk perangkat yang terhubung pada Mac
npx expo run:ios --device
```

iOS harus dibangun pada macOS dengan Xcode dan CocoaPods yang kompatibel dependency proyek. Minimum deployment target dalam source adalah iOS 15.1; build number 17 dan bundle identifier com.telurfarm.mobile. Xcode 15 pada Mac pengguna belum divalidasi untuk proyek ini. Pilih Team yang benar pada Signing and Capabilities. Jangan memasukkan sertifikat atau private key ke source.

```
export TELURFARM_APPLE_TEAM_ID=TEAM_MILIK_USAHA
bash scripts/build-ios-archive.sh
```

Archive Xcode belum menjadi IPA siap instal. Ekspor, provisioning serta jenis distribusi perlu diselesaikan melalui konfigurasi Apple milik usaha. eas.json menyediakan profil preview, simulator dan production bila tim memilih layanan EAS; akun, project dan signing harus disiapkan sendiri. Profil simulator bukan IPA iPhone.

## 11 User guide operasi harian

Persiapan pertama. Buka Pengaturan atau Stok dan depo, lalu periksa koordinat serta cakupan tiga depo bawaan. Tinjau harga tiap kategori dan varian. Bedakan data contoh dari data aktual. Pada native data awal dapat kosong; muat contoh hanya pada perangkat kosong bila diperlukan untuk pelatihan.

Mencatat produksi. Pilih tanggal dan kandang, isi telur baik, berat, rusak, pakan serta kematian berdasarkan catatan fisik. Simpan dan periksa batch hasilnya. Catatan produksi bukan persetujuan otomatis bahwa semua telur sudah layak dijual.

Memeriksa batch. Buka Batch dan varian atau Kelola lalu Batch. Tetapkan varian, tanggal yang diketahui serta status kualitas. Gunakan sortir sebagian bila satu batch mengandung beberapa varian. Catatan alasan diperlukan untuk pemeriksaan atau koreksi. Jangan mengisi tanggal yang tidak diketahui dengan perkiraan tanpa dasar.

Memesan telur. Pilih Perorangan, Wholesale atau Hotel/Resort, lalu produk dan satuan kg atau butir. Isi tanggal pengiriman, kontak dan alamat. Gunakan lokasi tujuan untuk rekomendasi jarak; pilih depo yang mencukupi varian. Tinjau harga, jumlah dan alokasi sebelum konfirmasi.

Packing dan pengiriman. Hitung butir serta timbang fisik, periksa batch asal dan isi kurir. Mulai pengiriman hanya setelah kondisi dan packing sesuai. Saat barang diterima, catat nama penerima serta keterangan yang diperlukan. Pisahkan proses pengiriman dari pembayaran.

Pembayaran dan piutang. Catat tanggal, jumlah, metode atau referensi pembayaran yang benar-benar diterima. Periksa saldo setelah pencatatan. Untuk koreksi tagihan gunakan proses kredit yang terkait dengan kasus; jangan mengubah jumlah pembayaran agar saldo tampak cocok.

Keluhan dan retur. Buka transaksi asal, buat kasus dan catat alasan. Terima fisik sesuai batas jumlah yang dikirim; stok retur masuk karantina sampai diperiksa. Catat kredit bila disetujui dan refund hanya ketika dana benar-benar dibayar. Periksa agar retur atau refund tidak dicatat dua kali.

Pembelian rutin. Gunakan Pesan lagi untuk draft berdasarkan transaksi sebelumnya dan harga saat ini. Jadwal pembelian memerlukan konfirmasi pada setiap kejadian; pengingat yang terlihat dalam aplikasi bukan pesanan otomatis atau notifikasi push.

Penutupan harian. Bandingkan jumlah produksi, saldo fisik batch, alokasi pesanan, barang dalam pengiriman, pembayaran dan kasus terbuka. Simpan cadangan transaksi pada lokasi yang dikelola usaha. Preferensi filter bukan cadangan transaksi.

## 12 User guide stok dan penelusuran

Peringatan stok. Buka Peringatan stok dan terapkan tanggal acuan, depo, ambang kg serta rentang hari. Saldo layak jual adalah saldo bebas setelah alokasi. Tanggal acuan bukan rekonstruksi historis stok. Kekurangan ke ambang adalah selisih stok, bukan ramalan atau purchase order otomatis.

Simulasi dan kandidat transfer. Pilih semua depo untuk meninjau usulan antar depo. Kandidat FEFO merinci batch sumber. Pada tanggal acuan hari ini, Siapkan transfer mengisi batch, tujuan dan usulan berat. Timbang serta hitung butir, isi catatan, lalu konfirmasi. Jika saldo atau kondisi berubah, batalkan dan buat ulang simulasi.

Asal batch. Pada daftar Batch pilih Telusuri atau Telusuri asal dan cabang. Rantai menunjukkan akar sampai batch terpilih. Keluarga memuat akar, saudara dan seluruh cabang lintas depo termasuk batch kosong. Saldo adalah saldo saat ini, bukan berat transfer awal. Hubungan induk dapat berasal dari transfer, sortir atau retur; bukan bukti asal panen.

Pesanan terkait. Pilih batch ini saja atau seluruh keluarga, lalu status, depo, kategori, pencarian dan tanggal kirim. Tanggal awal dan akhir inklusif. Rentang aktif mengecualikan pesanan tanpa tanggal valid. Pencarian berlaku pada nomor atau nama pelanggan sebagai teks biasa, mengabaikan kapital dan menyamakan spasi serta Unicode.

Urutan dan halaman. Pilih tanggal terlama/terbaru, nama atau nomor. Daftar mendukung 10, 20 atau 50 baris. Gunakan pertama, terakhir atau nomor halaman. Ringkasan dan laporan mencakup seluruh hasil filter, bukan hanya halaman yang terlihat.

Pilihan cepat. Diproses hari ini dan Dalam pengiriman hari ini memakai tanggal perangkat saat ditekan. Diproses lewat tanggal memakai status Diproses sampai kemarin; bukan perhitungan SLA slot jam. Pilihan ini mengosongkan pencarian/kategori, mempertahankan cakupan/depo/urutan dan kembali halaman pertama. Tekan ulang setelah hari berganti.

Ringkasan interaktif. Ketuk kategori, status atau depo untuk mengganti satu filter. Tombol Semua hanya membuka filter kelompok tersebut. Angka berasal dari hasil filter saat ini; memilih angka nol dapat menghasilkan daftar kosong. Kembali sebelum klik ringkasan memulihkan satu langkah filter, ukuran dan halaman dengan data terkini.

Riwayat kembali habis setelah dipakai. Filter manual yang berhasil, pilihan cepat, reset dan telusur ulang menghapus riwayat. Navigasi halaman atau perubahan ukuran tidak menghapusnya. Riwayat tidak membatalkan transaksi dan tidak menyimpan data lama.

Ekspor. CSV rincian memiliki 21 kolom dan CSV ringkasan 16 kolom. PDF disimpan melalui cetak browser atau berbagi native. Preview PDF tetap snapshot saat dibuka. Alokasi dalam laporan bukan volume terkirim atau saldo stok; retur tidak dikurangkan dan referensi batal dapat tetap ada. Laporan bukan daftar recall terverifikasi.

## 13 User guide filter tersimpan versi 5

Terapkan pengaturan yang diinginkan terlebih dahulu. Tekan Simpan filter yang diterapkan dan isi nama unik untuk batch tersebut. Aplikasi menyimpan cakupan, status, kategori, pencarian, tanggal, depo, urutan dan ukuran halaman. Nomor halaman disimpan satu agar pemanggilan tidak melewati hasil baru.

Maksimal 10 filter tersedia pada seluruh penyimpanan lokal, termasuk filter batch lama. Nama harus berisi 1 sampai 60 karakter setelah spasi disamakan. Nama yang sama boleh dipakai pada batch berbeda. Untuk mengubah pengaturan tersimpan, simpan sebagai nama baru atau hapus pengaturan lama lalu simpan kembali.

Pakai filter hanya pada batch yang sama. Pemanggilan memakai data terkini dan mengosongkan riwayat Kembali. Depo yang sudah tidak tersedia ditolak sebelum tampilan berubah. Bila tidak ada pesanan yang cocok, daftar kosong adalah hasil yang sah; periksa tanggal, kategori dan pencarian.

Tanggal tersimpan tetap berupa tanggal konkret. Filter yang disimpan setelah menekan Diproses hari ini tidak otomatis berpindah ke hari berikutnya. Untuk hari baru, tekan pilihan cepat lagi dan simpan filter baru bila diperlukan.

Pada web, pengaturan berada di localStorage browser dengan key akun sinkron aktif, atau area perangkat saat sinkron tidak aktif. Data tidak dikirim ke server dan tidak tersedia di browser lain. Gunakan Kelola seluruh filter untuk menghapus pengaturan batch lama. Menghapus data browser dapat menghapus preferensi.

Pada mobile, pengaturan disimpan di tabel app_preferences SQLite. Semua pengaturan ditampilkan bersama ID batch; pengaturan batch lain tidak bisa dipakai pada batch aktif tetapi bisa dihapus agar slot tersedia. Konflik revisi atau gagal tulis mempertahankan data lama. Gunakan Muat ulang filter tersimpan setelah memperbaiki masalah.

Filter tersimpan tidak ikut cadangan transaksi dan belum memiliki fasilitas transfer antar perangkat. Reset atau impor transaksi tidak menimpa preferensi native; pengaturan batch lama dapat tersisa. Penghapusan filter tidak mengubah pesanan, saldo, pembayaran maupun audit transaksi.

Nama duplikat, batas jumlah, data preferensi rusak atau versi tak dikenal ditolak. Preferensi yang rusak tidak ditimpa otomatis. Tetap gunakan filter manual dan cadangan transaksi untuk operasi; pemulihan preferensi perlu ditangani terpisah oleh administrator development.

## 14 Pengujian dan UAT

Pemeriksaan yang telah dijalankan meliputi 254 tes domain dan penyimpanan, TypeScript, simulasi operasi web, pengujian API D1 melalui SQLite, build Worker, validasi ESM serta ekspor Metro/Hermes Android dan iOS. Tes preferensi native menguji adapter melalui SQLite dalam memori; ini bukan bukti integrasi perangkat fisik.

Pemeriksaan otomatis tidak menggantikan pengujian UI browser, perangkat, printer atau menu berbagi. APK/AAB/IPA belum dikompilasi. Laporan PDF aktual dan semua jalur perangkat perlu diuji sebelum persetujuan operasional.

| Skenario UAT | Hasil yang harus diperiksa |
| --- | --- |
| Stok dan FEFO | Batch tidak layak ditolak, urutan FEFO sesuai dan alokasi tidak melampaui saldo |
| Penjualan kg dan butir | Harga kategori, konversi alokasi dan packing fisik sesuai data uji |
| Transfer dan sortir | Jumlah total tetap, parentId tercatat dan konfirmasi berulang ditolak |
| Pengiriman dan pembayaran | Status tidak meloncat, penerima tercatat dan saldo keuangan benar |
| Retur kredit refund | Batas jumlah dan nilai dipatuhi, retur masuk karantina dan tidak ganda |
| Penelusuran dan laporan | Cakupan batch/keluarga, filter dan seluruh halaman konsisten pada CSV/PDF |
| Riwayat filter | Satu langkah, batch yang sama, ukuran/halaman pulih dan data tetap terkini |
| Filter tersimpan | Tetap sesudah reload, nama unik, maksimum 10, apply/hapus serta gagal tulis tidak merusak transaksi |
| Sinkron web | Identitas terpisah, konflik 409 ditangani dan snapshot tidak ditimpa paksa |
| Backup dan pemulihan | Uji format yang benar pada lingkungan terpisah dan bandingkan saldo |

Catat ID skenario, versi source, perangkat/OS, langkah, data masukan, hasil aktual, bukti dan keputusan lulus atau gagal. Gunakan data uji terpisah. Pemilik proses harus menyetujui aturan harga, pembatalan, retur, batas jual, perhitungan biaya serta prosedur backup sebelum operasi nyata.

Daftar UAT native tambahan berada di mobile/docs/UAT.md. Pemeriksaan otomatis gabungan dapat dijalankan dengan bash scripts/check-all.sh dari akar paket. Hasil build native akhir harus diperiksa kembali dengan signing serta provisioning milik lingkungan tujuan.

## 15 Deployment operasi dan pemulihan

Siapkan tiga lingkungan yang jelas: development untuk perubahan source, staging untuk UAT dan produksi untuk transaksi nyata. Identitas proyek, database, domain, akun signing dan cadangan harus sesuai lingkungan. Paket development tidak membawa project_id produksi, data transaksi, token atau kunci produksi.

Deployment web. Tinjau perubahan, jalankan embed, build dan tes. Siapkan DB serta tabel telurfarm_state, verifikasi gateway identitas dan origin, kemudian publish melalui workflow hosting yang dipilih. Setelah publish, lakukan smoke test menggunakan akun uji dan periksa log serta konflik revisi. Memindahkan handler dari Sites memerlukan implementasi autentikasi yang sesuai.

Deployment mobile. Bangun pada toolchain yang memenuhi dependency, gunakan package/bundle ID milik usaha, signing yang benar dan profil distribusi yang dipilih. Uji perangkat nyata, GPS foreground, pemilihan berkas, cetak/share, backup dan alur stok. Jangan mendistribusikan source ZIP atau bundle Hermes sebagai aplikasi yang sudah dapat diinstal.

Cadangan. Web dan native memiliki format berbeda; simpan label versi, tanggal, lingkungan dan penanggung jawab pada arsip. Filter tersimpan berada di penyimpanan preferensi terpisah dan tidak ikut backup transaksi. Lakukan uji pemulihan pada lingkungan terpisah sebelum mengandalkan prosedur tersebut.

Insiden. Bila terjadi konflik data server, hentikan penyimpanan snapshot yang berulang, periksa data lokal dan server lalu pilih sumber yang benar. Bila preferensi gagal, jangan mereset transaksi sebagai cara memperbaikinya. Bila terjadi perbedaan stok, lakukan hitung/timbang dan pencatatan koreksi yang disetujui; jangan mengedit database langsung tanpa prosedur audit.

Rollback aplikasi harus memakai source dan artefak versi yang diketahui, dengan evaluasi kompatibilitas data. Penurunan versi kode tidak otomatis menurunkan schema atau memulihkan data lama. Cadangan dan hash paket diperlukan untuk mengidentifikasi source yang benar.

## 16 Daftar serah terima

| Butir | Tindakan penerima |
| --- | --- |
| Source dan integritas | Ekstrak ZIP, periksa CHECKSUMS dan SOURCE_MANIFEST, simpan versi acuan |
| Build development | Jalankan pemeriksaan web/native dengan dependency terkunci |
| Database | Tinjau DDL D1 dan SQLite serta uji pembuatan pada lingkungan uji |
| Konfigurasi | Isi identitas proyek development; periksa binding DB, lokasi, harga dan area layanan |
| Identitas dan signing | Siapkan autentikasi untuk hosting tujuan serta akun signing Android/Apple milik usaha |
| UAT | Lengkapi bukti browser, emulator/perangkat dan menu cetak/share |
| Data dan migrasi | Tentukan data awal nyata, bedakan demo, periksa format backup web/native |
| Prosedur operasional | Tetapkan petugas stok, distribusi, pembayaran, retur, backup dan insiden |
| Keamanan source | Pastikan tidak ada token/kunci produksi yang dimasukkan ke repositori |
| Kesenjangan fungsional | Setujui backlog native-web sync, RBAC, pembayaran eksternal dan integrasi lain bila diperlukan |

Kriteria serah terima source: paket dapat diekstrak, hash cocok, struktur source lengkap, dependency dapat dipasang pada lingkungan tujuan dan pemeriksaan yang relevan dapat dijalankan. Kriteria penerimaan produksi berbeda: build instalasi, UAT perangkat, konfigurasi, backup, autentikasi dan persetujuan pemilik proses masih harus diselesaikan.

Berkas rujukan utama: web/worker/handler.js untuk API; web/web/batch-core.js untuk stok web; mobile/src/domain.ts untuk transaksi native; mobile/src/storage.ts untuk persistensi; stock-alerts dan traceability untuk laporan serta penelusuran. Dokumen versi fitur pada folder docs dan RELEASE melengkapi riwayat perubahan.

Rilis ini tidak membawa komitmen tanggal integrasi eksternal, biaya cloud, lisensi komersial atau jadwal go-live. Penetapan hal tersebut memerlukan cakupan implementasi dan lingkungan yang disepakati secara terpisah.
