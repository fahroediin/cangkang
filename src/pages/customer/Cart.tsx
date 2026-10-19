import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Variant } from '../../types.ts';
import { dataService } from '../../services/index.ts';
import { Header } from '../../components/Header.tsx';
import { BottomBar } from '../../components/BottomBar.tsx';
import { QtyStepper } from '../../components/QtyStepper.tsx';
import { formatRupiah, formatKg } from '../../lib/format.ts';
import { validateCartTotal } from '../../lib/validate.ts';
import {
  loadCart,
  updateCartItemQty,
  removeCartItem,
  syncCartWithActiveVariants,
} from '../../state/cart.ts';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [cartItems, setCartItems] = useState(loadCart());
  const [notice, setNotice] = useState<string | null>(null);
  const [bottomError, setBottomError] = useState<string | null>(null);

  useEffect(() => {
    dataService.getVariants().then((allVars) => {
      setVariants(allVars);
      // Sync active variants (AC-01.15)
      const { cart, removedVariantNames } = syncCartWithActiveVariants(allVars);
      setCartItems(cart);
      if (removedVariantNames.length > 0) {
        setNotice(
          `${removedVariantNames.join(', ')} sedang tidak dijual dan dihapus dari keranjang`
        );
      }
    });
  }, []);

  const variantMap = new Map(variants.map((v) => [v.id, v]));

  const totalKg = cartItems.reduce((sum, item) => sum + item.qty_kg, 0);
  const totalPrice = cartItems.reduce((sum, item) => {
    const v = variantMap.get(item.variant_id);
    return sum + (v ? Math.round(item.qty_kg * v.price_per_kg) : 0);
  }, 0);

  const handleQtyChange = (variantId: string, valStr: string) => {
    const num = parseFloat(valStr.replace(',', '.')) || 0;
    const res = updateCartItemQty(variantId, num);
    if (res.success && res.updatedCart) {
      setCartItems(res.updatedCart);
      setBottomError(null);
    }
  };

  const handleIncrement = (variantId: string, currentQty: number) => {
    const next = currentQty + 0.5;
    const res = updateCartItemQty(variantId, next);
    if (res.success && res.updatedCart) {
      setCartItems(res.updatedCart);
      setBottomError(null);
    }
  };

  const handleDecrement = (variantId: string, currentQty: number) => {
    const next = currentQty - 0.5;
    if (next < 1) {
      // Prompt removal or just stay at min 1
      return;
    }
    const res = updateCartItemQty(variantId, next);
    if (res.success && res.updatedCart) {
      setCartItems(res.updatedCart);
      setBottomError(null);
    }
  };

  const handleRemove = (variantId: string) => {
    const updated = removeCartItem(variantId);
    setCartItems(updated);
    setBottomError(null);
  };

  const handleProceed = () => {
    const check = validateCartTotal(totalKg);
    if (!check.valid) {
      setBottomError(check.error || null);
      return;
    }
    setBottomError(null);
    navigate('/lokasi');
  };

  return (
    <div className="min-h-screen bg-[#FAF5EB] flex flex-col pb-28">
      <Header />

      <main className="max-w-[480px] w-full mx-auto px-4 py-4 flex flex-col gap-4">
        <h1 className="text-[20px] font-semibold text-[#33251B]">Keranjang</h1>

        {notice && (
          <div className="p-3 bg-[#F3E8D8] border border-[#EBDDCC] rounded-lg text-sm text-[#33251B]">
            {notice}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg p-8 flex flex-col items-center justify-center gap-4 text-center my-8">
            <p className="text-base text-[#806D5D]">Keranjang masih kosong</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="h-11 px-6 rounded-lg bg-[#704529] hover:bg-[#5A3720] text-white font-semibold text-sm transition-colors"
            >
              Pilih telur
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {cartItems.map((item) => {
                const v = variantMap.get(item.variant_id);
                const name = v ? v.name : item.variant_id;
                const pricePerKg = v ? v.price_per_kg : 0;
                const lineTotal = Math.round(item.qty_kg * pricePerKg);

                return (
                  <div
                    key={item.variant_id}
                    className="bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-[16px] font-semibold text-[#33251B]">{name}</h2>
                        <p className="text-xs text-[#806D5D] tabular-nums">
                          {formatRupiah(pricePerKg)}/kg
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.variant_id)}
                        className="text-xs text-[#806D5D] hover:text-[#B3261E] flex items-center gap-1 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Hapus</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <QtyStepper
                        value={item.qty_kg.toString().replace('.', ',')}
                        onChange={(val) => handleQtyChange(item.variant_id, val)}
                        onIncrement={() => handleIncrement(item.variant_id, item.qty_kg)}
                        onDecrement={() => handleDecrement(item.variant_id, item.qty_kg)}
                      />
                      <div className="text-right">
                        <div className="text-[16px] font-semibold text-[#33251B] tabular-nums">
                          {formatRupiah(lineTotal)}
                        </div>
                        <div className="text-xs text-[#806D5D] tabular-nums">
                          {formatKg(item.qty_kg)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price breakdown */}
            <div className="bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg p-4 flex flex-col gap-2">
              <div className="flex justify-between text-sm text-[#806D5D]">
                <span>Total berat</span>
                <span className="font-semibold text-[#33251B] tabular-nums">
                  {formatKg(totalKg)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-[#806D5D]">
                <span>Ongkos kirim</span>
                <span className="font-semibold text-[#2E6B3F]">Gratis</span>
              </div>
              <div className="border-t border-[#EBDDCC] pt-2 flex justify-between text-base font-semibold text-[#33251B]">
                <span>Total</span>
                <span className="text-[20px] tabular-nums">{formatRupiah(totalPrice)}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {cartItems.length > 0 && (
        <BottomBar
          summaryText={`Total: ${formatKg(totalKg)} - ${formatRupiah(totalPrice)}`}
          buttonText="Pilih lokasi antar"
          onClick={handleProceed}
          errorText={bottomError || undefined}
        />
      )}
    </div>
  );
};
