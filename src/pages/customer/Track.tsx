import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/index.ts';
import { Header } from '../../components/Header.tsx';
import { loadLastOrders, saveLastOrder } from '../../state/cart.ts';

export const Track: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [last4, setLast4] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lastOrders = loadLastOrders();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    const cleanLast4 = last4.trim();

    if (!cleanCode) {
      setError('Kode pesanan wajib diisi');
      return;
    }
    if (cleanLast4.length !== 4) {
      setError('Isi 4 digit terakhir nomor WhatsApp');
      return;
    }

    setLoading(true);
    try {
      const order = await dataService.trackOrder(cleanCode, cleanLast4);
      if (!order) {
        // AC-05.02 exact UI text
        setError('Pesanan tidak ditemukan. Periksa kode dan 4 digit terakhir nomor WhatsApp.');
      } else {
        saveLastOrder(order.code, cleanLast4);
        navigate(`/pesanan/${order.code}`);
      }
    } catch {
      setError('Pesanan tidak ditemukan. Periksa kode dan 4 digit terakhir nomor WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />

      <main className="max-w-[480px] w-full mx-auto px-4 py-4 flex flex-col gap-4">
        <h1 className="text-[20px] font-semibold text-ink">Lacak pesanan</h1>

        <div className="bg-surface border border-line rounded-lg p-5 flex flex-col gap-4">
          <form onSubmit={handleTrack} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="track_code" className="text-sm font-semibold text-ink">
                Kode pesanan
              </label>
              <input
                id="track_code"
                type="text"
                placeholder="Contoh: TF-261019-A7K2"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-11 px-3 rounded-lg border border-edge text-sm text-ink bg-white uppercase focus:outline-none focus:border-2 focus:border-brand"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="track_last4" className="text-sm font-semibold text-ink">
                4 digit terakhir nomor WhatsApp
              </label>
              <input
                id="track_last4"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="Contoh: 7890"
                value={last4}
                onChange={(e) => setLast4(e.target.value)}
                className="h-11 px-3 rounded-lg border border-edge text-sm text-ink bg-white focus:outline-none focus:border-2 focus:border-brand"
              />
            </div>

            {error && <div className="text-sm text-danger font-medium">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {loading ? 'Mencari...' : 'Lacak'}
            </button>
          </form>
        </div>

        {/* Pesanan terakhir di perangkat ini */}
        {lastOrders.length > 0 && (
          <div className="bg-surface border border-line rounded-lg p-5 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-ink">
              Pesanan terakhir di perangkat ini
            </h2>
            <div className="flex flex-col divide-y divide-line">
              {lastOrders.map(({ code: lastCode }) => (
                <button
                  key={lastCode}
                  type="button"
                  onClick={() => navigate(`/pesanan/${lastCode}`)}
                  className="py-2.5 flex items-center justify-between text-left hover:text-brand"
                >
                  <span className="text-sm font-semibold text-ink tabular-nums">
                    {lastCode}
                  </span>
                  <span className="text-xs text-brand font-medium">Buka pesanan</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
