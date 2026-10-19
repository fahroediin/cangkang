/**
 * Utility functions for Indonesian locale formatting
 */

export function formatRupiah(amount: number): string {
  const rounded = Math.round(amount);
  return 'Rp' + rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatKg(qty: number): string {
  // Format with Indonesian decimal comma, e.g. 3 kg or 3,5 kg
  const str = qty.toString().replace('.', ',');
  return `${str} kg`;
}

export function formatJarak(km: number): string {
  const fixed = km.toFixed(1).replace('.', ',');
  return `${fixed} km`;
}

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const INDO_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

export function formatTanggal(dateStr: string, options?: { shortMonth?: boolean; includeDay?: boolean }): string {
  if (!dateStr) return '';
  // dateStr is YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);

  const dayName = INDO_DAYS[date.getDay()];
  const monthName = options?.shortMonth ? INDO_MONTHS_SHORT[month] : INDO_MONTHS[month];

  if (options?.includeDay) {
    return `${dayName}, ${day} ${monthName} ${year}`;
  }
  return `${day} ${monthName} ${year}`;
}
