import React, { useEffect, useState, useCallback } from 'react';
import { Variant } from '../../types.ts';
import { dataService } from '../../services/index.ts';
import { formatRupiah } from '../../lib/format.ts';
import { validatePricePerKg } from '../../lib/validate.ts';
import { staffErrorMessage } from '../../lib/errors.ts';

export const AdminPrices: React.FC = () => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [pricesInput, setPricesInput] = useState<Record<string, string>>({});
  const [activeToggles, setActiveToggles] = useState<Record<string, boolean>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadVariants = useCallback(async () => {
    const list = await dataService.getVariants();
    setVariants(list);

    const initPrices: Record<string, string> = {};
    const initToggles: Record<string, boolean> = {};
    list.forEach((v) => {
      initPrices[v.id] = v.price_per_kg.toString();
      initToggles[v.id] = v.is_active;
    });
    setPricesInput(initPrices);
    setActiveToggles(initToggles);
  }, []);

  useEffect(() => {
    loadVariants();
  }, [loadVariants]);

  const handlePriceChange = (variantId: string, val: string) => {
    setPricesInput((prev) => ({ ...prev, [variantId]: val }));
    if (rowErrors[variantId]) {
      setRowErrors((prev) => ({ ...prev, [variantId]: '' }));
    }
  };

  const handleToggleActive = (variantId: string) => {
    setActiveToggles((prev) => ({ ...prev, [variantId]: !prev[variantId] }));
    if (rowErrors[variantId]) {
      setRowErrors((prev) => ({ ...prev, [variantId]: '' }));
    }
  };

  const handleSaveVariant = async (variant: Variant) => {
    const rawPrice = pricesInput[variant.id] || '0';
    const check = validatePricePerKg(rawPrice);

    if (!check.valid) {
      setRowErrors((prev) => ({ ...prev, [variant.id]: check.error || '' }));
      return;
    }

    const isActive = activeToggles[variant.id] ?? variant.is_active;

    // AC-11.05 Check: Minimal satu varian harus dijual
    const willActiveCount = variants.filter((v) =>
      v.id === variant.id ? isActive : activeToggles[v.id]
    ).length;

    if (willActiveCount === 0) {
      setRowErrors((prev) => ({ ...prev, [variant.id]: 'Minimal satu varian harus dijual' }));
      // Revert toggle
      setActiveToggles((prev) => ({ ...prev, [variant.id]: true }));
      return;
    }

    try {
      await dataService.updateVariant(variant.id, check.value!, isActive);
      await loadVariants();
      setRowErrors((prev) => ({ ...prev, [variant.id]: '' }));

      // AC-11.01: Toast "Harga disimpan"
      setToastMessage('Harga disimpan');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [variant.id]: staffErrorMessage(err, 'Gagal menyimpan harga') }));
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-ink text-white text-sm px-4 py-3 rounded-lg shadow-[0_4px_12px_rgb(51_37_27/0.12)] border border-line">
          {toastMessage}
        </div>
      )}

      <div>
        <h1 className="text-[20px] font-semibold text-ink">Harga varian</h1>
        <p className="text-xs text-muted">Pengaturan harga jual per kg dan status aktif varian</p>
      </div>

      {/* Info text per spec 8.12 */}
      <div className="p-3 bg-cream border border-line rounded-lg text-xs text-muted">
        Harga baru berlaku untuk pesanan berikutnya. Pesanan yang sudah masuk memakai harga lama.
      </div>

      <div className="bg-surface border border-line rounded-lg overflow-hidden divide-y divide-line">
        {variants.map((v) => {
          const isActive = activeToggles[v.id] ?? v.is_active;
          const currentInput = pricesInput[v.id] ?? v.price_per_kg.toString();
          const error = rowErrors[v.id];

          return (
            <div key={v.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-ink">{v.name}</h3>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      isActive ? 'bg-cream text-ok border border-line' : 'bg-gray text-muted'
                    }`}
                  >
                    {isActive ? 'Dijual' : 'Nonaktif'}
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">{v.description}</p>
                <div className="text-xs text-muted mt-1 tabular-nums">
                  Harga saat ini: <strong className="text-ink">{formatRupiah(v.price_per_kg)}/kg</strong>
                </div>
                {error && <span className="text-xs text-danger font-medium block mt-1">{error}</span>}
              </div>

              <div className="flex items-center gap-3">
                {/* Toggle Dijual */}
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => handleToggleActive(v.id)}
                    className="w-4 h-4 accent-brand"
                  />
                  <span>Dijual</span>
                </label>

                {/* Price input */}
                <div className="flex items-center border border-edge rounded-lg px-2 bg-white">
                  <span className="text-xs text-muted mr-1">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={currentInput}
                    onChange={(e) => handlePriceChange(v.id, e.target.value)}
                    className="w-24 h-11 text-right font-semibold text-sm text-ink tabular-nums bg-transparent focus:outline-none"
                  />
                  <span className="text-xs text-muted ml-1">/kg</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveVariant(v)}
                  className="h-11 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold text-xs transition-colors shrink-0"
                >
                  Simpan harga
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
