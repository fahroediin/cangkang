/**
 * Validation rules and normalization conforming strictly to TelurFarm Spec
 */

// Kelipatan 0,5 kg: num * 2 harus bilangan bulat (toleransi galat floating point)
export function isHalfKgStep(num: number): boolean {
  return Math.abs(num * 2 - Math.round(num * 2)) < 1e-9;
}

export function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (/^08\d{8,11}$/.test(digits)) {
    return '62' + digits.slice(1);
  }
  if (/^628\d{8,11}$/.test(digits)) {
    return digits;
  }
  return null;
}

export function validateVariantQty(qtyInput: string | number): { valid: boolean; error?: string; value?: number } {
  const str = typeof qtyInput === 'string' ? qtyInput.trim().replace(',', '.') : String(qtyInput);
  if (!str || isNaN(Number(str))) {
    return { valid: false, error: 'Isi berat dengan angka' };
  }

  const num = Number(str);
  if (num < 1) {
    return { valid: false, error: 'Berat minimal 1 kg' };
  }
  if (num > 30) {
    return { valid: false, error: 'Berat maksimal 30 kg per varian' };
  }
  if (!isHalfKgStep(num)) {
    return { valid: false, error: 'Berat harus kelipatan 0,5 kg' };
  }

  return { valid: true, value: num };
}

export function validateCartTotal(totalKg: number): { valid: boolean; error?: string } {
  if (totalKg < 2) {
    return { valid: false, error: 'Minimal pesanan 2 kg' };
  }
  if (totalKg > 50) {
    return {
      valid: false,
      error: 'Maksimal pesanan 50 kg. Untuk jumlah lebih besar, hubungi depo lewat WhatsApp.',
    };
  }
  return { valid: true };
}

export function validateStockKg(stockInput: string | number): { valid: boolean; error?: string; value?: number } {
  const str = typeof stockInput === 'string' ? stockInput.trim().replace(',', '.') : String(stockInput);
  if (!str || isNaN(Number(str))) {
    return { valid: false, error: 'Isi stok dengan angka' };
  }

  const num = Number(str);
  if (num < 0) {
    return { valid: false, error: 'Stok tidak boleh kurang dari 0' };
  }
  if (num > 10000) {
    return { valid: false, error: 'Stok maksimal 10.000 kg' };
  }
  if (!isHalfKgStep(num)) {
    return { valid: false, error: 'Stok harus kelipatan 0,5 kg' };
  }

  return { valid: true, value: num };
}

export function validatePricePerKg(priceInput: string | number): { valid: boolean; error?: string; value?: number } {
  const str = typeof priceInput === 'string' ? priceInput.trim() : String(priceInput);
  if (!str || isNaN(Number(str))) {
    return { valid: false, error: 'Harga harus antara Rp1.000 dan Rp100.000' };
  }

  const num = Number(str);
  if (!Number.isInteger(num) || num < 1000 || num > 100000) {
    return { valid: false, error: 'Harga harus antara Rp1.000 dan Rp100.000' };
  }

  return { valid: true, value: num };
}
