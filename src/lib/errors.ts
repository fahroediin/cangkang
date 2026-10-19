/**
 * Maps RPC error codes to UI display text according to Section 9.5 of the Spec
 */
export const ERROR_MESSAGES: Record<string, string> = {
  ERR_NAME: 'Nama wajib diisi',
  ERR_NAME_LONG: 'Nama maksimal 80 karakter',
  ERR_PHONE: 'Nomor WhatsApp tidak valid. Contoh: 0812 3456 7890',
  ERR_ADDRESS: 'Alamat wajib diisi',
  ERR_SLOT: 'Jadwal yang dipilih sudah tutup. Pilih jadwal lain.',
  ERR_LIMIT: 'Nomor ini masih punya 3 pesanan berjalan. Hubungi depo lewat WhatsApp untuk pesanan tambahan.',
  ERR_DEPOT: 'Depo yang dipilih tidak bisa mengantar ke lokasi ini. Pilih depo lagi.',
  ERR_EMPTY: 'Keranjang masih kosong',
  ERR_QTY: 'Berat tidak valid. Periksa keranjang.',
  ERR_VARIANT: 'Ada telur yang sedang tidak dijual. Periksa keranjang.',
  ERR_STOCK: 'Stok berubah saat Anda memesan. Pilih depo lagi atau kurangi berat.',
  ERR_MIN_TOTAL: 'Minimal pesanan 2 kg',
  ERR_MAX_TOTAL: 'Maksimal pesanan 50 kg. Untuk jumlah lebih besar, hubungi depo lewat WhatsApp.',
  ERR_STALE: 'Status pesanan sudah diubah petugas lain. Muat ulang halaman.',
};

export function getErrorMessage(codeOrMessage: string): string {
  if (ERROR_MESSAGES[codeOrMessage]) {
    return ERROR_MESSAGES[codeOrMessage];
  }
  // If the message contains an error code e.g. "ERR_STOCK"
  for (const [key, msg] of Object.entries(ERROR_MESSAGES)) {
    if (codeOrMessage.includes(key)) {
      return msg;
    }
  }
  return codeOrMessage;
}
