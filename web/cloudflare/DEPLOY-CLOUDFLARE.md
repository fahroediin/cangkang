# Deploy PamanKu v6.0 ke Cloudflare

PamanKu berjalan sebagai Cloudflare Worker dengan database D1. Login memakai **Cloudflare Access**: pengguna masuk dengan email (kode sekali pakai) atau Google, lalu `cloudflare/access-gate.mjs` memverifikasi token Access dan meneruskan identitasnya ke aplikasi. Header identitas yang dikirim dari luar selalu dibuang, jadi tidak bisa dipalsukan.

Selama Access belum diatur, aplikasi menolak semua akses ("Belum dikonfigurasi"). Deploy pertama tetap aman.

Semua perintah dijalankan dari folder `web`. Perlu Node 20 atau lebih baru dan akun Cloudflare (paket gratis cukup).

## 1. Login dan buat database

```bash
npx wrangler@4 login
```
```bash
npx wrangler@4 d1 create pamanku
```

Salin `database_id` yang muncul ke `wrangler.toml`, menggantikan `ISI-DATABASE-ID`.

## 2. Buat tabel dan deploy pertama

```bash
npm run cf:test
```
```bash
npm run cf:migrate
```
```bash
npm run cf:deploy
```

Wrangler menampilkan alamat seperti `https://pamanku.<subdomain-anda>.workers.dev`. Saat dibuka, halaman masih bertuliskan **Belum dikonfigurasi**. Itu benar.

## 3. Pasang Cloudflare Access

1. Buka dashboard Cloudflare › **Zero Trust**. Kalau baru pertama kali, pilih nama tim (mis. `peternakan`), sehingga domain tim menjadi `peternakan.cloudflareaccess.com`, lalu pilih paket Free.
2. Cara paling cepat: **Workers & Pages › pamanku › Settings › Domains & Routes**, pada baris `workers.dev` klik **Enable Cloudflare Access**. Cloudflare membuat aplikasi Access untuk alamat itu.
   Bila memakai domain sendiri: **Zero Trust › Access › Applications › Add an application › Self-hosted**, isi domain aplikasi.
3. Atur **policy** aplikasi itu: Action **Allow**, Include **Emails** (daftar email pengguna) atau **Emails ending in** (mis. `@peternakan.co.id`). Hanya email di sini yang bisa masuk.
4. Metode login: **Zero Trust › Settings › Authentication**. One-time PIN (kode ke email) sudah aktif secara bawaan; Google bisa ditambahkan.
5. Buka aplikasi Access tadi dan salin **Application Audience (AUD) Tag**.

## 4. Isi konfigurasi dan deploy ulang

Di `wrangler.toml`, bagian `[vars]`:

```toml
ACCESS_TEAM_DOMAIN = "peternakan.cloudflareaccess.com"
ACCESS_AUD = "<AUD tag dari langkah 3.5>"
```

```bash
npm run cf:deploy
```

## 5. Coba

1. Buka alamat aplikasi. Muncul halaman login Cloudflare; masukkan email yang diizinkan, lalu kode dari email.
2. Orang pertama membuat ruang kerja dan otomatis menjadi **Pemilik**.
3. Undang anggota dari menu tim. Email yang diundang **juga harus ada di policy Access** (langkah 3.3), kalau tidak mereka tertahan di halaman login.
4. **Keluar** di aplikasi mengakhiri sesi Access.

## Perawatan

| Kebutuhan | Perintah / tempat |
|---|---|
| Cadangan database | `npx wrangler@4 d1 export pamanku --remote --output cadangan.sql` |
| Kembali ke versi sebelumnya | `npx wrangler@4 rollback` |
| Log langsung | `npx wrangler@4 tail` |
| Tambah/hapus pengguna | Zero Trust › Access › Applications › policy (dan undang/keluarkan di menu tim) |

Biaya pada paket gratis: Workers 100.000 permintaan/hari, D1 5 GB, Access sampai 50 pengguna.

## Yang perlu diketahui

- **Database mulai kosong.** Data contoh (`npm run demo`) hanya untuk laptop.
- **Panduan Demo dan FGD tidak ikut ke Cloudflare.** Proxy-nya berbasis Node; presentasi tetap memakai `npm run demo` / `npm run fgd` di laptop.
- **Identitas Cloudflare berbeda dari ChatGPT Sites.** ID pengguna diberi awalan `cf-`, jadi data dari hosting ChatGPT (v5.9) tidak otomatis tersambung ke akun di sini.
- **Aplikasi HP** belum sinkron dengan web, sama seperti di hosting lama.
- `CHECKSUMS.sha256` belum memuat file baru di folder `cloudflare/` dan `wrangler.toml`.
