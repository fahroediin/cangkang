import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Variant } from '../../types.ts';
import { dataService } from '../../services/index.ts';
import { Header } from '../../components/Header.tsx';
import { BottomBar } from '../../components/BottomBar.tsx';
import { QtyStepper } from '../../components/QtyStepper.tsx';
import { formatRupiah, formatKg } from '../../lib/format.ts';
import { validateVariantQty } from '../../lib/validate.ts';
import { addToCart, loadCart } from '../../state/cart.ts';

export const Catalog: React.FC = () => {
  const navigate = useNavigate();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stepperValues, setStepperValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cart summary
  const [cartKg, setCartKg] = useState<number>(0);
  const [cartTotal, setCartTotal] = useState<number>(0);

  const variantsRef = React.useRef<Variant[]>([]);

  const calculateCartSummary = (currentVariants: Variant[]) => {
    const items = loadCart();
    let totalKg = 0;
    let totalPrice = 0;
    const vMap = new Map(currentVariants.map((v) => [v.id, v]));

    for (const item of items) {
      totalKg += item.qty_kg;
      const v = vMap.get(item.variant_id);
      if (v) {
        totalPrice += Math.round(item.qty_kg * v.price_per_kg);
      }
    }

    setCartKg(totalKg);
    setCartTotal(totalPrice);
  };

  useEffect(() => {
    let mounted = true;
    dataService.getVariants().then((vars) => {
      if (!mounted) return;
      const activeVars = vars.filter((v) => v.is_active);
      setVariants(activeVars);
      variantsRef.current = activeVars;
      setLoading(false);

      // Default stepper values (initial 3 kg for first or 1 kg)
      const initialStep: Record<string, string> = {};
      activeVars.forEach((v) => {
        initialStep[v.id] = '3';
      });
      setStepperValues(initialStep);
      calculateCartSummary(activeVars);
    });

    const handleCartUpdated = () => {
      calculateCartSummary(variantsRef.current);
    };
    window.addEventListener('cart-updated', handleCartUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('cart-updated', handleCartUpdated);
    };
  }, []);

  useEffect(() => {
    if (variants.length > 0) {
      calculateCartSummary(variants);
    }
  }, [variants]);

  const handleQtyChange = (variantId: string, val: string) => {
    setStepperValues((prev) => ({ ...prev, [variantId]: val }));
    // Clear error on type
    if (fieldErrors[variantId]) {
      setFieldErrors((prev) => ({ ...prev, [variantId]: '' }));
    }
  };

  const handleAddToCart = (variant: Variant) => {
    const rawVal = stepperValues[variant.id] || '0';
    const validation = validateVariantQty(rawVal);

    if (!validation.valid) {
      setFieldErrors((prev) => ({ ...prev, [variant.id]: validation.error || '' }));
      return;
    }

    const qty = validation.value!;
    const result = addToCart(variant.id, qty);

    if (!result.success) {
      setFieldErrors((prev) => ({ ...prev, [variant.id]: result.error || '' }));
      return;
    }

    // Success notification toast
    setFieldErrors((prev) => ({ ...prev, [variant.id]: '' }));
    setToastMessage(`${variant.name} ${formatKg(qty)} masuk keranjang`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#FAF5EB] flex flex-col pb-24">
      <Header />

      <main className="max-w-[480px] w-full mx-auto px-4 py-4 flex flex-col gap-4">
        {/* Info line per spec 6.1 */}
        <div className="py-2 px-3 bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg text-sm text-[#806D5D] flex items-center">
          Gratis ongkir dalam 5 km dari depo
        </div>

        {/* Variant cards */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-36 rounded-lg bg-[#E7E2DC] border border-[#EBDDCC]"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {variants.map((v) => {
              const currentInput = stepperValues[v.id] || '3';
              const error = fieldErrors[v.id];

              return (
                <div
                  key={v.id}
                  className="bg-[#FFFFFF] rounded-lg border border-[#EBDDCC] p-4 flex flex-col gap-3"
                >
                  <div className="flex flex-col">
                    <h2 className="text-[16px] font-semibold text-[#33251B]">{v.name}</h2>
                    <p className="text-[14px] text-[#806D5D]">{v.description}</p>
                  </div>

                  <div className="text-[20px] font-semibold text-[#33251B] tabular-nums">
                    {formatRupiah(v.price_per_kg)}/kg
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <QtyStepper
                      value={currentInput}
                      onChange={(val) => handleQtyChange(v.id, val)}
                    />
                    <button
                      type="button"
                      aria-label={`Tambah ${v.name} ke keranjang`}
                      onClick={() => handleAddToCart(v)}
                      className="flex-1 h-11 px-4 rounded-lg bg-[#704529] hover:bg-[#5A3720] text-white font-semibold text-sm transition-colors"
                    >
                      Tambah ke keranjang
                    </button>
                  </div>

                  {error && (
                    <div className="text-[14px] text-[#B3261E] font-medium">
                      {error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Toast 3 seconds per spec 6.4 */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#33251B] text-white text-sm px-4 py-2.5 rounded-lg shadow-[0_4px_12px_rgba(51,37,27,0.12)] transition-opacity duration-150">
          {toastMessage}
        </div>
      )}

      {/* Bottom Bar per AC-01.01 */}
      <BottomBar
        summaryText={`Keranjang ${formatKg(cartKg)} - ${formatRupiah(cartTotal)}`}
        buttonText="Lihat keranjang"
        onClick={() => navigate('/keranjang')}
      />
    </div>
  );
};
