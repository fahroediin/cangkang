# Verifikasi PamanKu v5.9

## Pengujian dan batas verifikasi

- 158 assertion server v5.9 lulus: field lama tanpa favorit, tipe boolean ketat, isolasi akun/ruang kerja, scope/redaksi, hak auditor, batas daftar, replay/CAS, penghapusan favorit dan sumber persetujuan yang tetap valid.
- Regresi lulus: 117 assertion v5.8, 172 v5.7, 128 v5.6, 100 monitor, 269 persetujuan, 147 ledger, 116 master kandang dan 206 RBAC; operasi web sebelumnya, SQLite server serta validasi Worker ESM.
- TypeScript dan 296 tes native lulus, termasuk urutan stabil tanpa mutasi, favorit pada kapasitas penuh, rename/update/copy, persistensi SQLite dan penolakan konflik revisi. Ekspor bundle Android/iOS berhasil.
- Browser preview dengan identitas dan data dummy memverifikasi simpan filter, tandai favorit, mode hanya favorit, lepas tanda sampai daftar kosong, kembali ke semua entri dan favorit tetap ada setelah reload. Tampilan diperiksa secara visual. Pengujian ini hanya pada lingkungan lokal dan peran pemilik dummy.
- UAT hosting seluruh peran, emulator/perangkat nyata, APK/AAB/IPA, upgrade instalasi lama, GPS dan restore perangkat belum dilakukan. Keberhasilan bundle/deployment bukan bukti pengujian tersebut.
