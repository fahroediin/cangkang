# Publish /demo PamanKu ke Cloudflare

Panduan Demo (panel ringkas: tombol langkah, Sebelumnya/Berikutnya, Catatan) bisa dibuka lewat internet oleh peserta yang diizinkan. Ini Worker dan database **terpisah** dari PamanKu yang asli (`pamanku-demo`), berisi data contoh saja.

Kenapa terpisah: di `/demo` siapa pun bisa berganti menjadi Pemilik tanpa login. Karena itu Worker ini menolak berjalan pada database yang tidak disiapkan khusus untuk demo, dan perintah reset di bawah hanya bisa menyentuh database `pamanku-demo`.

Semua perintah dijalankan dari folder `web`.

## 1. Buat database dan isi datanya

```bash
npx wrangler@4 login
```
```bash
npx wrangler@4 d1 create pamanku-demo
```

Salin `database_id` yang muncul ke `wrangler.demo.toml`, menggantikan `ISI-DATABASE-ID-DEMO`.

```bash
npm run cf:demo:test
```
```bash
npm run cf:demo:reset
```

## 2. Deploy pertama

```bash
npm run cf:demo:deploy
```

Alamatnya seperti `https://pamanku-demo.<subdomain-anda>.workers.dev`. Saat dibuka masih muncul **Belum dikonfigurasi**. Itu benar.

## 3. Pasang Cloudflare Access

1. **Workers & Pages › pamanku-demo › Settings › Domains & Routes**, pada baris `workers.dev` klik **Enable Cloudflare Access**.
2. Atur policy aplikasinya: Action **Allow**, Include **Emails** berisi email peserta. Aplikasi Access ini terpisah dari milik PamanKu asli.
3. Salin **Application Audience (AUD) Tag** aplikasi ini. Domain tim sama dengan yang dipakai PamanKu asli.

Di `wrangler.demo.toml`, bagian `[vars]`:

```toml
ACCESS_TEAM_DOMAIN = "<tim-anda>.cloudflareaccess.com"
ACCESS_AUD = "<AUD tag aplikasi pamanku-demo>"
```

```bash
npm run cf:demo:deploy
```

## 4. Bagikan

Bagikan `https://pamanku-demo.<subdomain-anda>.workers.dev/demo`. Peserta memasukkan email yang diizinkan, lalu kode dari email, lalu klik **Mulai Panduan Demo**.

## Sebelum setiap sesi

```bash
npm run cf:demo:reset
```

Wajib dijalankan menjelang sesi, karena pesanan contoh bertanggal hari reset. Data yang tertinggal hari bisa ditolak aturan tanggal kirim. Reset juga membuang semua perubahan peserta sebelumnya.

Catatan peserta **tidak** ikut terhapus. Unduh dulu dari halaman `/demo`, lalu kosongkan bila sesi berikutnya untuk klien lain:

```bash
npm run cf:demo:reset -- --clear-notes
```

## Yang perlu diketahui

- **Semua peserta berbagi data dan catatan.** Perubahan satu orang terlihat oleh yang lain, dan catatan bisa dibaca semua orang yang masuk. Untuk dua klien berbeda, jangan buka bersamaan.
- **Identitas Access hanya untuk masuk.** Di dalam aplikasi, peserta memakai peran contoh yang dipilih, bukan email aslinya.
- **Hanya format Demo.** Panduan FGD tetap dari laptop (`npm run fgd`). Naskah pembawa (tujuan, poin bicara, instruksi klik) tidak dikirim ke browser; pegangannya `documentation/Rundown-Demo-PamanKu-v6.0.md`.
- **Tautan "Area pribadi lama" dan tombol Keluar** kembali ke `/demo`, jadi peserta tidak tersesat ke data contoh lama.
- Lubang tampilan lain (kotak peringatan di Ringkasan, ID akun di halaman Aktivitas, tombol pada pesanan selesai, pesan error umum) tetap terlihat, sama seperti demo di laptop.
