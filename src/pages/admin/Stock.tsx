import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Staff, Depot, Variant, DepotStock } from '../../types.ts';
import { dataService } from '../../services/index.ts';
import { formatKg } from '../../lib/format.ts';
import { validateStockKg } from '../../lib/validate.ts';
import { staffErrorMessage } from '../../lib/errors.ts';

export const AdminStock: React.FC = () => {
  const { staff } = useOutletContext<{ staff: Staff }>();
  const isOwner = staff.role === 'owner';

  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepotId, setSelectedDepotId] = useState<string>(staff.depot_id || 'cilegon');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [stocks, setStocks] = useState<DepotStock[]>([]);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const dList = await dataService.getDepots();
    setDepots(dList);

    const vList = await dataService.getVariants();
    setVariants(vList);

    const depotToFetch = isOwner ? selectedDepotId : staff.depot_id || 'cilegon';
    const sList = await dataService.getDepotStock(depotToFetch);
    setStocks(sList);

    // Populate inputs with current stock values
    const initInputs: Record<string, string> = {};
    vList.forEach((v) => {
      const match = sList.find((s) => s.variant_id === v.id);
      initInputs[v.id] = match ? match.stock_kg.toString().replace('.', ',') : '0';
    });
    setInputValues(initInputs);
  }, [isOwner, selectedDepotId, staff.depot_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInputChange = (variantId: string, val: string) => {
    setInputValues((prev) => ({ ...prev, [variantId]: val }));
    if (rowErrors[variantId]) {
      setRowErrors((prev) => ({ ...prev, [variantId]: '' }));
    }
  };

  const handleSaveStock = async (variant: Variant) => {
    const rawVal = inputValues[variant.id] || '0';
    const valCheck = validateStockKg(rawVal);

    if (!valCheck.valid) {
      setRowErrors((prev) => ({ ...prev, [variant.id]: valCheck.error || '' }));
      return;
    }

    const targetDepot = isOwner ? selectedDepotId : staff.depot_id!;
    const stockKg = valCheck.value!;

    try {
      await dataService.setStock(targetDepot, variant.id, stockKg);
      // Reload stock data
      const updatedList = await dataService.getDepotStock(targetDepot);
      setStocks(updatedList);
      setRowErrors((prev) => ({ ...prev, [variant.id]: '' }));

      // AC-10.01: Toast "Stok disimpan"
      setToastMessage('Stok disimpan');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [variant.id]: staffErrorMessage(err, 'Gagal menyimpan stok') }));
    }
  };

  const currentDepot = depots.find((d) => d.id === (isOwner ? selectedDepotId : staff.depot_id));

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-ink text-white text-sm px-4 py-3 rounded-lg shadow-[0_4px_12px_rgb(51_37_27/0.12)] border border-line">
          {toastMessage}
        </div>
      )}

      {/* Header & Depo Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold text-ink">Stok depo</h1>
          <p className="text-xs text-muted">
            {currentDepot ? currentDepot.name : 'Depo'} ({currentDepot?.address})
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <label htmlFor="stock_depot_select" className="text-sm text-muted">
              Depo:
            </label>
            <select
              id="stock_depot_select"
              value={selectedDepotId}
              onChange={(e) => setSelectedDepotId(e.target.value)}
              className="h-11 px-3 rounded-lg border border-edge text-sm text-ink bg-white focus:outline-none focus:border-2 focus:border-brand"
            >
              {depots.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Informative Banner per spec 8.11 */}
      <div className="p-3 bg-cream border border-line rounded-lg text-xs text-muted">
        Stok berkurang otomatis saat pesanan masuk dan kembali saat pesanan dibatalkan. Isi angka
        hasil timbang terbaru.
      </div>

      {/* Stock Management Table */}
      <div className="bg-surface border border-line rounded-lg overflow-hidden">
        <div className="divide-y divide-line">
          {variants.map((v) => {
            const stockRow = stocks.find((s) => s.variant_id === v.id);
            const currentStockKg = stockRow ? stockRow.stock_kg : 0;
            const updatedTime = stockRow?.updated_at
              ? new Date(stockRow.updated_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Jakarta',
                }) + ' WIB'
              : '-';
            const updatedBy = stockRow?.updated_by || '';

            const error = rowErrors[v.id];

            return (
              <div key={v.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-ink">{v.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted mt-1">
                    <span>
                      Stok saat ini: <strong className="text-ink tabular-nums">{formatKg(currentStockKg)}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Diperbarui: {updatedTime} {updatedBy ? `(${updatedBy})` : ''}
                    </span>
                  </div>
                  {error && <span className="text-xs text-danger font-medium block mt-1">{error}</span>}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-edge rounded-lg px-2 bg-white">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inputValues[v.id] ?? '0'}
                      onChange={(e) => handleInputChange(v.id, e.target.value)}
                      className="w-20 h-11 text-center font-semibold text-sm text-ink tabular-nums bg-transparent focus:outline-none"
                    />
                    <span className="text-xs text-muted">kg</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveStock(v)}
                    className="h-11 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold text-xs transition-colors shrink-0"
                  >
                    Simpan stok
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
