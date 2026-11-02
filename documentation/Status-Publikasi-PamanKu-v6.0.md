# Status publikasi PamanKu v6.0

29 Oktober 2026. Implementasi source, pengujian dan bundle Expo selesai. Publikasi web v6.0 belum berhasil.

Source helper gagal mengirim commit 714c33b5eb2ae7cd30bc559937c03b95dfe4460b: artifacts_git_receive_pack_failed, kemudian HTTP500 Internal Server Error setelah pembukaan ulang/rekonsiliasi dan build/validasi ulang. Tidak ada deploy v6.0 yang dijalankan karena sumber belum berhasil dipush dan arsip publikasi belum terverifikasi. Aplikasi online terakhir yang terverifikasi tetap v5.9, commit fd2bf6f006442fe172fd81b9ae7dd3153b2b3662.

Source lokal dan paket lengkap v6.0 tersedia. Lanjutkan publikasi setelah layanan repositori pulih dengan identitas Site dan audience yang sama; buka kembali source melalui workflow yang didukung, rekonsiliasi remote, build/validasi, push/archive, kemudian simpan dan deploy commit yang terverifikasi. Jangan memakai commit lama atau arsip v5.9 untuk mengklaim rilis v6.0.
