import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePhone,
  validateVariantQty,
  validateCartTotal,
  validateStockKg,
  validatePricePerKg,
} from './validate.ts';
import { formatRupiah, formatKg, formatJarak, formatTanggal, formatTanggalPendek, formatPhone } from './format.ts';
import { getErrorMessage, ORDER_NOT_SENT_MESSAGE } from './errors.ts';
import { distanceKm } from './distance.ts';
import { getAvailableDatesAndSlots, validateSlotSelection } from './slots.ts';

test('normalizePhone handles formats strictly per BR-09', () => {
  // AC-04.03: 9 digits -> invalid
  assert.equal(normalizePhone('081234567'), null);
  // AC-04.04: 10 digits -> valid, saves as 62812345678
  assert.equal(normalizePhone('0812345678'), '62812345678');
  // AC-04.05: 14 digits -> invalid
  assert.equal(normalizePhone('08123456789012'), null);
  // AC-04.06: +62 812 3456 7890 -> valid, saves as 6281234567890
  assert.equal(normalizePhone('+62 812 3456 7890'), '6281234567890');
  // Hyphenated
  assert.equal(normalizePhone('0812-3456-7890'), '6281234567890');
});

test('validateVariantQty checks weight boundaries and increments', () => {
  // AC-01.03: 0.5 kg -> below minimum
  const rLow = validateVariantQty('0,5');
  assert.equal(rLow.valid, false);
  assert.equal(rLow.error, 'Berat minimal 1 kg');

  // AC-01.04: 1 kg -> valid boundary
  const rBoundLow = validateVariantQty(1);
  assert.equal(rBoundLow.valid, true);
  assert.equal(rBoundLow.value, 1);

  // AC-01.05: 30 kg -> valid boundary
  const rBoundHigh = validateVariantQty(30);
  assert.equal(rBoundHigh.valid, true);
  assert.equal(rBoundHigh.value, 30);

  // AC-01.06: 30.5 kg -> exceeds
  const rHigh = validateVariantQty('30,5');
  assert.equal(rHigh.valid, false);
  assert.equal(rHigh.error, 'Berat maksimal 30 kg per varian');

  // AC-01.08: 1.25 kg -> not multiple of 0.5
  const rInc = validateVariantQty('1,25');
  assert.equal(rInc.valid, false);
  assert.equal(rInc.error, 'Berat harus kelipatan 0,5 kg');

  // AC-01.09: text -> invalid
  const rText = validateVariantQty('dua');
  assert.equal(rText.valid, false);
  assert.equal(rText.error, 'Isi berat dengan angka');
});

test('validateCartTotal checks total cart boundaries', () => {
  // AC-01.12: 1.5 kg -> below 2 kg
  assert.equal(validateCartTotal(1.5).valid, false);
  assert.equal(validateCartTotal(1.5).error, 'Minimal pesanan 2 kg');

  // AC-01.13: 2 kg -> valid boundary
  assert.equal(validateCartTotal(2).valid, true);

  // AC-01.14: 50.5 kg -> exceeds 50 kg
  assert.equal(validateCartTotal(50.5).valid, false);
  assert.equal(
    validateCartTotal(50.5).error,
    'Maksimal pesanan 50 kg. Untuk jumlah lebih besar, hubungi depo lewat WhatsApp.'
  );
});

test('validateStockKg checks stock limits', () => {
  // Negative
  assert.equal(validateStockKg(-1).valid, false);
  assert.equal(validateStockKg(-1).error, 'Stok tidak boleh kurang dari 0');

  // Zero boundary
  assert.equal(validateStockKg(0).valid, true);

  // Exceeds 10,000 kg
  assert.equal(validateStockKg(10000.5).valid, false);
  assert.equal(validateStockKg(10000.5).error, 'Stok maksimal 10.000 kg');

  // Not multiple of 0.5
  assert.equal(validateStockKg(12.3).valid, false);
  assert.equal(validateStockKg(12.3).error, 'Stok harus kelipatan 0,5 kg');
});

test('validatePricePerKg checks price range', () => {
  assert.equal(validatePricePerKg(999).valid, false);
  assert.equal(validatePricePerKg(100000).valid, true);
  assert.equal(validatePricePerKg(100001).valid, false);
});

test('format utilities return exact Indonesian representation', () => {
  assert.equal(formatRupiah(24000), 'Rp24.000');
  assert.equal(formatRupiah(0), 'Rp0');
  assert.equal(formatKg(3), '3 kg');
  assert.equal(formatKg(3.5), '3,5 kg');
  assert.equal(formatJarak(2.3), '2,3 km');
  assert.equal(formatTanggal('2026-10-19', { shortMonth: true, includeDay: true }), 'Senin, 19 Okt 2026');
});

test('distanceKm calculates accurately', () => {
  // Approx distance between Cilegon (-6.017, 106.056) and Serang (-6.120, 106.150)
  const d = distanceKm(-6.017, 106.056, -6.12, 106.15);
  assert.ok(d > 14 && d < 16);
});

test('slots MRTM_SLOT cutoff rules', () => {
  // TRM_SLOT_001: 06:59 WIB today -> Pagi can be chosen
  const t0659 = new Date('2026-10-19T06:59:00+07:00');
  const res1 = getAvailableDatesAndSlots(t0659);
  const today1 = res1.dates.find((d) => d.key === 'hari_ini')!;
  assert.equal(today1.isAvailable, true);
  assert.equal(today1.slots.find((s) => s.key === 'pagi')!.isAvailable, true);

  // TRM_SLOT_002: 07:00 WIB today -> Pagi closed
  const t0700 = new Date('2026-10-19T07:00:00+07:00');
  const res2 = getAvailableDatesAndSlots(t0700);
  const today2 = res2.dates.find((d) => d.key === 'hari_ini')!;
  assert.equal(today2.isAvailable, true);
  assert.equal(today2.slots.find((s) => s.key === 'pagi')!.isAvailable, false);
  assert.equal(today2.slots.find((s) => s.key === 'pagi')!.disabledReason, 'Sudah tutup');
  assert.equal(today2.slots.find((s) => s.key === 'sore')!.isAvailable, true);

  // TRM_SLOT_004 & TRM_SLOT_005: 12:00 WIB today -> Sore closed, Hari ini closed entirely, Besok default
  const t1200 = new Date('2026-10-19T12:00:00+07:00');
  const res3 = getAvailableDatesAndSlots(t1200);
  const today3 = res3.dates.find((d) => d.key === 'hari_ini')!;
  assert.equal(today3.isAvailable, false);
  assert.equal(res3.defaultDateKey, 'besok');

  // TRM_SLOT_007: Validation failure when submitting for closed slot
  const check = validateSlotSelection('2026-10-19', 'pagi', t0700);
  assert.equal(check.valid, false);
  assert.equal(check.error, 'Jadwal yang dipilih sudah tutup. Pilih jadwal lain.');
});

test('kelipatan 0,5 kg ditolak untuk nilai di antara langkah 0,5', () => {
  // 1,02 kg lolos pembulatan *10 lama, padahal server menolak (ERR_QTY)
  assert.equal(validateVariantQty('1,02').valid, false);
  assert.equal(validateVariantQty('1,02').error, 'Berat harus kelipatan 0,5 kg');
  assert.equal(validateVariantQty('1,5').valid, true);
  assert.equal(validateStockKg('12,02').valid, false);
  assert.equal(validateStockKg('12,02').error, 'Stok harus kelipatan 0,5 kg');
  assert.equal(validateStockKg('12,5').valid, true);
});

test('getErrorMessage memetakan kode server dan menyembunyikan pesan teknis', () => {
  assert.equal(getErrorMessage('ERR_NAME_LONG'), 'Nama maksimal 80 karakter');
  assert.equal(getErrorMessage('ERR_STOCK'), 'Stok berubah saat Anda memesan. Pilih depo lagi atau kurangi berat.');
  // AC-04.12: galat jaringan dari fetch tidak boleh tampil mentah
  assert.equal(getErrorMessage('TypeError: Failed to fetch'), ORDER_NOT_SENT_MESSAGE);
  assert.equal(getErrorMessage(''), ORDER_NOT_SENT_MESSAGE);
  assert.equal(ORDER_NOT_SENT_MESSAGE, 'Pesanan belum terkirim. Periksa koneksi lalu tekan Kirim pesanan lagi.');
});

test('formatTanggalPendek untuk pilihan tanggal antar', () => {
  assert.equal(formatTanggalPendek('2026-10-20'), '20 Okt');
  assert.equal(formatTanggalPendek('2026-01-01'), '1 Jan');
});

test('formatPhone menampilkan nomor 628... sebagai 08xx-xxxx-xxxx', () => {
  assert.equal(formatPhone('6285211993344'), '0852-1199-3344');
  assert.equal(formatPhone('6281234567890'), '0812-3456-7890');
  assert.equal(formatPhone('62812345678'), '0812-3456-78');
  // Bukan format 628: tampilkan apa adanya
  assert.equal(formatPhone('12345'), '12345');
});
