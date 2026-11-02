# Database TelurFarm 5.1
Web pribadi: telurfarm_state per user_id. Tim: telurfarm_teams per ruang kerja, satu payload berisi transaksi serta ACL, revision CAS. Native: SQLite app_state dan app_preferences. Ketiga salinan tidak otomatis sinkron.
DDL tim additive dan juga diinisialisasi IF NOT EXISTS saat API tim dipanggil. Cadangan transaksi OW tidak berisi ACL atau anggota. Untuk pemulihan ruang kerja lengkap gunakan backup D1 yang dikelola pada lingkungan hosting. Tidak ada UI restore tim pada 5.1.
