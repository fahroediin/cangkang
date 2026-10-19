/**
 * Delivery slot and cutoff rules according to MRTM_SLOT (Asia/Jakarta / WIB)
 */

export interface SlotOption {
  key: 'pagi' | 'sore';
  label: string;
  sublabel: string;
  isAvailable: boolean;
  disabledReason?: string;
}

export interface DateOption {
  key: 'hari_ini' | 'besok' | 'lusa';
  label: string;
  dateStr: string; // YYYY-MM-DD
  isAvailable: boolean;
  slots: SlotOption[];
}

// Default mock time: Monday, 19 Oct 2026, 09:00 WIB
export const MOCK_NOW_WIB = new Date('2026-10-19T09:00:00+07:00');

export function getWIBDate(overrideNow?: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dateObj: Date;
} {
  const d = overrideNow || (import.meta.env?.VITE_DATA_MODE === 'supabase' ? new Date() : MOCK_NOW_WIB);

  // Convert to Asia/Jakarta time parts
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(d);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10);
  const day = parseInt(partMap.day, 10);
  const hour = parseInt(partMap.hour, 10);
  const minute = parseInt(partMap.minute, 10);

  return { year, month, day, hour, minute, dateObj: d };
}

function formatDateStr(year: number, month: number, day: number): string {
  const m = month < 10 ? `0${month}` : `${month}`;
  const d = day < 10 ? `0${day}` : `${day}`;
  return `${year}-${m}-${d}`;
}

export function getAvailableDatesAndSlots(overrideNow?: Date): {
  dates: DateOption[];
  defaultDateKey: 'hari_ini' | 'besok' | 'lusa';
  defaultSlotKey: 'pagi' | 'sore';
} {
  const { year, month, day, hour, minute } = getWIBDate(overrideNow);
  const currentMinutes = hour * 60 + minute;

  // Cutoff constants in minutes:
  // 07:00 = 7 * 60 = 420
  // 12:00 = 12 * 60 = 720
  const pagiClosedToday = currentMinutes >= 420;
  const soreClosedToday = currentMinutes >= 720;
  const hariIniClosed = soreClosedToday; // After 12:00 today is completely disabled

  const todayStr = formatDateStr(year, month, day);

  // Besok
  const tmrwDate = new Date(Date.UTC(year, month - 1, day + 1));
  const tmrwStr = formatDateStr(tmrwDate.getUTCFullYear(), tmrwDate.getUTCMonth() + 1, tmrwDate.getUTCDate());

  // Lusa
  const lusaDate = new Date(Date.UTC(year, month - 1, day + 2));
  const lusaStr = formatDateStr(lusaDate.getUTCFullYear(), lusaDate.getUTCMonth() + 1, lusaDate.getUTCDate());

  const dates: DateOption[] = [
    {
      key: 'hari_ini',
      label: 'Hari ini',
      dateStr: todayStr,
      isAvailable: !hariIniClosed,
      slots: [
        {
          key: 'pagi',
          label: 'Pagi',
          sublabel: '08.00-12.00',
          isAvailable: !pagiClosedToday,
          disabledReason: pagiClosedToday ? 'Sudah tutup' : undefined,
        },
        {
          key: 'sore',
          label: 'Sore',
          sublabel: '13.00-17.00',
          isAvailable: !soreClosedToday,
          disabledReason: soreClosedToday ? 'Sudah tutup' : undefined,
        },
      ],
    },
    {
      key: 'besok',
      label: 'Besok',
      dateStr: tmrwStr,
      isAvailable: true,
      slots: [
        {
          key: 'pagi',
          label: 'Pagi',
          sublabel: '08.00-12.00',
          isAvailable: true,
        },
        {
          key: 'sore',
          label: 'Sore',
          sublabel: '13.00-17.00',
          isAvailable: true,
        },
      ],
    },
    {
      key: 'lusa',
      label: 'Lusa',
      dateStr: lusaStr,
      isAvailable: true,
      slots: [
        {
          key: 'pagi',
          label: 'Pagi',
          sublabel: '08.00-12.00',
          isAvailable: true,
        },
        {
          key: 'sore',
          label: 'Sore',
          sublabel: '13.00-17.00',
          isAvailable: true,
        },
      ],
    },
  ];

  const defaultDateKey = hariIniClosed ? 'besok' : 'hari_ini';
  let defaultSlotKey: 'pagi' | 'sore' = 'pagi';
  if (!hariIniClosed && pagiClosedToday) {
    defaultSlotKey = 'sore';
  }

  return { dates, defaultDateKey, defaultSlotKey };
}

export function validateSlotSelection(
  deliveryDateStr: string,
  slot: 'pagi' | 'sore',
  overrideNow?: Date
): { valid: boolean; error?: string } {
  const { dates } = getAvailableDatesAndSlots(overrideNow);
  const foundDate = dates.find((d) => d.dateStr === deliveryDateStr);

  if (!foundDate || !foundDate.isAvailable) {
    return { valid: false, error: 'Jadwal yang dipilih sudah tutup. Pilih jadwal lain.' };
  }

  const foundSlot = foundDate.slots.find((s) => s.key === slot);
  if (!foundSlot || !foundSlot.isAvailable) {
    return { valid: false, error: 'Jadwal yang dipilih sudah tutup. Pilih jadwal lain.' };
  }

  return { valid: true };
}
