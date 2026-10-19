import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { loadCart } from '../state/cart.ts';
import { formatKg } from '../lib/format.ts';

export const Header: React.FC = () => {
  const [cartKg, setCartKg] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const location = useLocation();

  const updateCartTotal = () => {
    const items = loadCart();
    const total = items.reduce((sum, item) => sum + item.qty_kg, 0);
    setCartKg(total);
  };

  useEffect(() => {
    updateCartTotal();
    const handleCartUpdate = () => updateCartTotal();
    window.addEventListener('cart-updated', handleCartUpdate);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-line">
      {!isOnline && (
        <div className="bg-ink text-white text-xs py-1 px-4 text-center">
          Tidak ada koneksi. Pesanan belum bisa dikirim.
        </div>
      )}
      <div className="max-w-[480px] mx-auto h-14 px-4 flex items-center justify-between">
        <Link
          to="/"
          className="text-[20px] font-bold text-brand tracking-tight hover:opacity-90"
        >
          TelurFarm
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/lacak"
            className="text-sm font-medium text-ink hover:text-brand underline-offset-4"
          >
            Lacak pesanan
          </Link>

          <Link
            to="/keranjang"
            aria-label={`Keranjang, ${formatKg(cartKg)}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-line hover:bg-cream text-ink"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-brand" />
              {cartKg > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yolk rounded-full border border-white" />
              )}
            </div>
            <span className="text-sm font-medium tabular-nums">{formatKg(cartKg)}</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
