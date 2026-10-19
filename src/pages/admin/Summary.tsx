import React, { useEffect, useState, useCallback } from 'react';
import { PilotSummary, Depot } from '../../types.ts';
import { dataService } from '../../services/index.ts';
import { formatRupiah, formatKg } from '../../lib/format.ts';
import { getWIBDate } from '../../lib/slots.ts';

// Hari ini WIB: di mock mengikuti waktu contoh 19 Okt 2026, di supabase mengikuti jam sungguhan
function todayWIB(): string {
  const { year, month, day } = getWIBDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function presetRange(preset: '7d' | '30d'): { from: string; to: string } {
  const to = todayWIB();
  return { from: shiftDate(to, preset === '7d' ? -6 : -29), to };
}

export const AdminSummary: React.FC = () => {
  const [periodType, setPeriodType] = useState<'7d' | '30d' | 'custom'>('7d');
  const [dateFrom, setDateFrom] = useState<string>(() => presetRange('7d').from);
  const [dateTo, setDateTo] = useState<string>(() => presetRange('7d').to);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepotId, setSelectedDepotId] = useState<string>('semua');
  const [summary, setSummary] = useState<PilotSummary | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  // Kalkulator titik impas state
  const [deliveryCostInput, setDeliveryCostInput] = useState<string>('8000');
  const [tengkulakPriceInput, setTengkulakPriceInput] = useState<string>('22000');

  // Compute dates based on periodType
  const updateDatesForPreset = (preset: '7d' | '30d') => {
    const { from, to } = presetRange(preset);
    setDateFrom(from);
    setDateTo(to);
    return { from, to };
  };

  const loadSummary = useCallback(async (from: string, to: string, depotId?: string) => {
    if (to < from) {
      setDateError('Tanggal sampai harus sama atau setelah tanggal dari');
      return;
    }
    setDateError(null);

    const filterDepot = depotId && depotId !== 'semua' ? depotId : undefined;
    const data = await dataService.getPilotSummary(from, to, filterDepot);
    setSummary(data);
  }, []);

  useEffect(() => {
    dataService.getDepots().then(setDepots);
    const { from, to } = updateDatesForPreset('7d');
    loadSummary(from, to, 'semua');
  }, [loadSummary]);

  const handlePeriodChange = (type: '7d' | '30d' | 'custom') => {
    setPeriodType(type);
    if (type === '7d' || type === '30d') {
      const { from, to } = updateDatesForPreset(type);
      loadSummary(from, to, selectedDepotId);
    }
  };

  const handleCustomDateSubmit = () => {
    loadSummary(dateFrom, dateTo, selectedDepotId);
  };

  const handleDepotChange = (depotId: string) => {
    setSelectedDepotId(depotId);
    loadSummary(dateFrom, dateTo, depotId);
  };

  // Titik Impas Calculation (Spec Section 1.2 & 8.13)
  const deliveryCost = parseFloat(deliveryCostInput) || 0;
  const tengkulakPrice = parseFloat(tengkulakPriceInput) || 0;
  const avgSellingPrice = summary ? summary.avg_price_per_kg : 24000;
  const actualAvgKg = summary && summary.avg_kg_per_pesanan !== null ? summary.avg_kg_per_pesanan : 0;

  let breakEvenResult: {
    status: 'ok' | 'loss';
    text: string;
    subtext?: string;
  };

  if (tengkulakPrice >= avgSellingPrice) {
    breakEvenResult = {
      status: 'loss',
      text: 'Harga jual langsung tidak lebih tinggi dari harga tengkulak. Antar gratis selalu rugi.',
    };
  } else {
    const marginPerKg = avgSellingPrice - tengkulakPrice;
    const breakEvenKg = Math.round((deliveryCost / marginPerKg) * 10) / 10;
    const isAbove = actualAvgKg >= breakEvenKg;

    breakEvenResult = {
      status: 'ok',
      text: `Titik impas: ${breakEvenKg.toFixed(1).replace('.', ',')} kg per pesanan`,
      subtext: isAbove ? 'Di atas titik impas' : 'Di bawah titik impas',
    };
  }

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div>
        <h1 className="text-[20px] font-semibold text-ink">Rekap pilot</h1>
        <p className="text-xs text-muted">Evaluasi penjualan langsung dan titik impas antar gratis</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface border border-line rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Preset buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handlePeriodChange('7d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              periodType === '7d'
                ? 'bg-brand text-white border-brand'
                : 'border-edge text-ink bg-white hover:bg-cream'
            }`}
          >
            7 hari terakhir
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange('30d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              periodType === '30d'
                ? 'bg-brand text-white border-brand'
                : 'border-edge text-ink bg-white hover:bg-cream'
            }`}
          >
            30 hari terakhir
          </button>
          <button
            type="button"
            onClick={() => setPeriodType('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              periodType === 'custom'
                ? 'bg-brand text-white border-brand'
                : 'border-edge text-ink bg-white hover:bg-cream'
            }`}
          >
            Pilih tanggal
          </button>
        </div>

        {/* Depo Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="summary_depot" className="text-xs text-muted">
            Depo:
          </label>
          <select
            id="summary_depot"
            value={selectedDepotId}
            onChange={(e) => handleDepotChange(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-edge text-xs text-ink bg-white focus:outline-none focus:border-2 focus:border-brand"
          >
            <option value="semua">Semua depo</option>
            {depots.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {periodType === 'custom' && (
        <div className="bg-surface border border-line rounded-lg p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="date_from" className="text-xs text-muted">
              Dari:
            </label>
            <input
              id="date_from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 px-2 rounded-lg border border-edge text-xs text-ink bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="date_to" className="text-xs text-muted">
              Sampai:
            </label>
            <input
              id="date_to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 px-2 rounded-lg border border-edge text-xs text-ink bg-white"
            />
          </div>

          <button
            type="button"
            onClick={handleCustomDateSubmit}
            className="h-9 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold"
          >
            Terapkan
          </button>
        </div>
      )}

      {dateError && (
        <div className="p-3 bg-cream border border-danger rounded-lg text-xs text-danger font-medium">
          {dateError}
        </div>
      )}

      {/* Zero State Notice AC-12.04 */}
      {summary && summary.pesanan_selesai === 0 && (
        <div className="p-3 bg-cream border border-line rounded-lg text-sm text-muted text-center">
          Belum ada pesanan selesai di periode ini
        </div>
      )}

      {/* Stat Cards - Plain Numbers, no arrows/percentages per 6.1 */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-surface border border-line rounded-lg p-4 flex flex-col">
            <span className="text-xs text-muted">Pesanan selesai</span>
            <span className="text-2xl font-bold text-ink tabular-nums mt-1">
              {summary.pesanan_selesai}
            </span>
          </div>

          <div className="bg-surface border border-line rounded-lg p-4 flex flex-col">
            <span className="text-xs text-muted">Kg terjual</span>
            <span className="text-2xl font-bold text-ink tabular-nums mt-1">
              {formatKg(summary.kg_terjual)}
            </span>
          </div>

          <div className="bg-surface border border-line rounded-lg p-4 flex flex-col">
            <span className="text-xs text-muted">Rata-rata kg per pesanan</span>
            <span className="text-2xl font-bold text-ink tabular-nums mt-1">
              {summary.avg_kg_per_pesanan !== null ? formatKg(summary.avg_kg_per_pesanan) : '-'}
            </span>
          </div>

          <div className="bg-surface border border-line rounded-lg p-4 flex flex-col">
            <span className="text-xs text-muted">Pendapatan diterima</span>
            <span className="text-2xl font-bold text-ink tabular-nums mt-1">
              {formatRupiah(summary.pendapatan_diterima)}
            </span>
          </div>

          <div className="bg-surface border border-line rounded-lg p-4 flex flex-col">
            <span className="text-xs text-muted">Pelanggan</span>
            <span className="text-2xl font-bold text-ink tabular-nums mt-1">
              {summary.pelanggan}
            </span>
          </div>

          <div className="bg-surface border border-line rounded-lg p-4 flex flex-col">
            <span className="text-xs text-muted">Pelanggan pesan ulang</span>
            <span className="text-2xl font-bold text-ink tabular-nums mt-1">
              {`${summary.pelanggan_pesan_ulang} (${summary.pelanggan_pesan_ulang_pct}%)`}
            </span>
          </div>

          <div className="bg-surface border border-line rounded-lg p-4 flex flex-col col-span-2 md:col-span-2">
            <span className="text-xs text-muted">Pembatalan</span>
            <span className="text-2xl font-bold text-ink tabular-nums mt-1">
              {summary.pembatalan_pct}%
            </span>
          </div>
        </div>
      )}

      {/* Tabel per Depo */}
      {summary && (
        <div className="bg-surface border border-line rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-cream border-b border-line">
            <h2 className="text-sm font-semibold text-ink">Rincian per depo</h2>
          </div>
          {/* Ponsel: kartu per depo supaya semua angka terlihat tanpa geser ke samping */}
          <div className="md:hidden divide-y divide-line">
            {Object.entries(summary.depots_summary).map(([depotId, dSum]) => (
              <div key={depotId} className="p-4 flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-ink">{dSum.depot_name}</h3>
                <dl className="flex flex-col gap-1 text-sm tabular-nums">
                  {[
                    ['Selesai', String(dSum.pesanan_selesai)],
                    ['Kg terjual', formatKg(dSum.kg_terjual)],
                    ['Rata-rata per pesanan', dSum.avg_kg_per_pesanan !== null ? formatKg(dSum.avg_kg_per_pesanan) : '-'],
                    ['Pendapatan', formatRupiah(dSum.pendapatan_diterima)],
                    ['Pelanggan', String(dSum.pelanggan)],
                    ['Pesan ulang', `${dSum.pelanggan_pesan_ulang} (${dSum.pelanggan_pesan_ulang_pct}%)`],
                    ['Batal', `${dSum.pembatalan_pct}%`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-2">
                      <dt className="text-muted">{label}</dt>
                      <dd className="text-ink font-semibold text-right whitespace-nowrap">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="border-b border-line text-muted">
                <tr className="h-10">
                  <th className="px-4 text-left">Depo</th>
                  <th className="px-4 text-right">Selesai</th>
                  <th className="px-4 text-right">Kg terjual</th>
                  <th className="px-4 text-right">Rata-rata per pesanan</th>
                  <th className="px-4 text-right">Pendapatan</th>
                  <th className="px-4 text-right">Pelanggan</th>
                  <th className="px-4 text-right">Pesan ulang</th>
                  <th className="px-4 text-right">Batal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-ink">
                {Object.entries(summary.depots_summary).map(([depotId, dSum]) => (
                  <tr key={depotId} className="h-10">
                    <td className="px-4 font-semibold">{dSum.depot_name}</td>
                    <td className="px-4 text-right tabular-nums">{dSum.pesanan_selesai}</td>
                    <td className="px-4 text-right tabular-nums">{formatKg(dSum.kg_terjual)}</td>
                    <td className="px-4 text-right tabular-nums">
                      {dSum.avg_kg_per_pesanan !== null ? formatKg(dSum.avg_kg_per_pesanan) : '-'}
                    </td>
                    <td className="px-4 text-right tabular-nums font-semibold">
                      {formatRupiah(dSum.pendapatan_diterima)}
                    </td>
                    <td className="px-4 text-right tabular-nums">{dSum.pelanggan}</td>
                    <td className="px-4 text-right tabular-nums">
                      {dSum.pelanggan_pesan_ulang} ({dSum.pelanggan_pesan_ulang_pct}%)
                    </td>
                    <td className="px-4 text-right tabular-nums">{dSum.pembatalan_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kalkulator titik impas (US-12, AC-12.02, AC-12.03) */}
      <div className="bg-surface border border-line rounded-lg p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Kalkulator titik impas</h2>
          <p className="text-xs text-muted">
            Simulasi kelayakan biaya antar gratis dibandingkan penjualan ke tengkulak
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="delivery_cost" className="text-xs font-semibold text-ink">
              Biaya antar per pesanan (Rp)
            </label>
            <input
              id="delivery_cost"
              type="number"
              value={deliveryCostInput}
              onChange={(e) => setDeliveryCostInput(e.target.value)}
              className="h-11 px-3 rounded-lg border border-edge text-sm text-ink bg-white tabular-nums focus:outline-none focus:border-2 focus:border-brand"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="tengkulak_price" className="text-xs font-semibold text-ink">
              Harga jual ke tengkulak per kg (Rp)
            </label>
            <input
              id="tengkulak_price"
              type="number"
              value={tengkulakPriceInput}
              onChange={(e) => setTengkulakPriceInput(e.target.value)}
              className="h-11 px-3 rounded-lg border border-edge text-sm text-ink bg-white tabular-nums focus:outline-none focus:border-2 focus:border-brand"
            />
          </div>
        </div>

        <div className="p-4 bg-cream rounded-lg border border-line flex flex-col gap-1">
          <span className="text-xs text-muted">Hasil perhitungan</span>
          <span
            className={`text-base font-bold ${
              breakEvenResult.status === 'loss' ? 'text-danger' : 'text-ink'
            }`}
          >
            {breakEvenResult.text}
          </span>
          {breakEvenResult.subtext && (
            <span
              className={`text-xs font-semibold ${
                breakEvenResult.subtext === 'Di atas titik impas'
                  ? 'text-ok'
                  : 'text-danger'
              }`}
            >
              {breakEvenResult.subtext} (Rata-rata pesanan: {formatKg(actualAvgKg)})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
