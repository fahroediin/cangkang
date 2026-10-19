import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Clock } from 'lucide-react';
import { Order } from '../../types.ts';
import { dataService } from '../../services/index.ts';
import { Header } from '../../components/Header.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { formatRupiah, formatKg, formatTanggal } from '../../lib/format.ts';
import { buildDepotWhatsAppLink } from '../../lib/whatsapp.ts';
import { findLastOrder, saveLastOrder } from '../../state/cart.ts';

export const OrderStatusPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [last4Input, setLast4Input] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const cleanCode = (code || '').trim().toUpperCase();
  const [last4, setLast4] = useState<string | null>(() => findLastOrder(cleanCode)?.last4 ?? null);

  // Selalu lewat trackOrder: di mode supabase tabel orders tidak bisa dibaca anon (RLS).
  const fetchOrder = useCallback(async () => {
    if (!cleanCode || !last4) return;
    try {
      const data = await dataService.trackOrder(cleanCode, last4);
      if (data) {
        setOrder(data);
      }
    } catch {
      // Biarkan data terakhir tetap tampil; coba lagi di interval berikutnya
    } finally {
      setLoading(false);
    }
  }, [cleanCode, last4]);

  useEffect(() => {
    if (!last4) {
      setNeedsVerification(true);
      setLoading(false);
      return;
    }

    setNeedsVerification(false);
    fetchOrder();

    // Muat ulang tiap 30 detik (AC-05.04)
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [last4, fetchOrder]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    const trimmed = last4Input.trim();
    if (trimmed.length !== 4) {
      setVerifyError('Isi 4 digit terakhir nomor WhatsApp.');
      return;
    }

    try {
      const tracked = await dataService.trackOrder(cleanCode, trimmed);
      if (!tracked) {
        setVerifyError('Pesanan tidak ditemukan. Periksa kode dan 4 digit terakhir nomor WhatsApp.');
      } else {
        setOrder(tracked);
        saveLastOrder(cleanCode, trimmed);
        setLast4(trimmed);
      }
    } catch {
      setVerifyError('Pesanan tidak ditemukan. Periksa kode dan 4 digit terakhir nomor WhatsApp.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header />
        <div className="max-w-[480px] w-full mx-auto px-4 py-8 text-center text-sm text-muted">
          Memuat status pesanan...
        </div>
      </div>
    );
  }

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header />
        <main className="max-w-[480px] w-full mx-auto px-4 py-6 flex flex-col gap-4">
          <h1 className="text-[20px] font-semibold text-ink">Verifikasi pesanan</h1>
          <div className="bg-surface border border-line rounded-lg p-5 flex flex-col gap-4">
            <p className="text-sm text-ink">
              Untuk melihat pesanan <span className="font-semibold">{cleanCode}</span>, masukkan 4
              digit terakhir nomor WhatsApp pemesan.
            </p>

            <form onSubmit={handleVerify} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="verify_last4" className="text-sm font-semibold text-ink">
                  4 digit terakhir nomor WhatsApp
                </label>
                <input
                  id="verify_last4"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Contoh: 7890"
                  value={last4Input}
                  onChange={(e) => setLast4Input(e.target.value)}
                  className="h-11 px-3 rounded-lg border border-edge text-sm text-ink bg-white focus:outline-none focus:border-2 focus:border-brand"
                />
              </div>

              {verifyError && (
                <div className="text-sm text-danger font-medium">{verifyError}</div>
              )}

              <button
                type="submit"
                className="h-11 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold text-sm transition-colors"
              >
                Lihat pesanan
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header />
        <main className="max-w-[480px] w-full mx-auto px-4 py-8 flex flex-col items-center gap-4 text-center">
          <p className="text-base text-muted">Pesanan tidak ditemukan</p>
          <Link
            to="/lacak"
            className="h-11 px-6 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold text-sm flex items-center justify-center transition-colors"
          >
            Lacak pesanan lain
          </Link>
        </main>
      </div>
    );
  }

  const slotLabel = order.delivery_slot === 'pagi' ? 'Pagi 08.00-12.00' : 'Sore 13.00-17.00';
  const dateFormatted = formatTanggal(order.delivery_date, { shortMonth: true, includeDay: true });
  const waUrl = buildDepotWhatsAppLink(order, order.depot_name || 'Depo', order.depot_wa || '');

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-16">
      <Header />

      <main className="max-w-[480px] w-full mx-auto px-4 py-4 flex flex-col gap-4">
        {/* Status card */}
        <div className="bg-surface border border-line rounded-lg p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-muted block">Kode pesanan</span>
              <span className="text-lg font-bold text-ink tabular-nums tracking-wide">
                {order.code}
              </span>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <p className="text-sm text-ink">
            Pesanan <span className="font-semibold">{order.code}</span> terkirim ke{' '}
            <span className="font-semibold">{order.depot_name || 'Depo'}</span>
          </p>

          {/* Cancel reason if cancelled AC-05.05 */}
          {order.status === 'dibatalkan' && order.cancel_reason && (
            <div className="p-3 bg-cream border border-line rounded-lg text-sm text-ink">
              <span className="font-semibold">Alasan: </span>
              {order.cancel_reason}
            </div>
          )}

          {/* WhatsApp Chat button US-06 */}
          {order.depot_wa && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 h-11 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Chat depo di WhatsApp
            </a>
          )}
        </div>

        {/* Pengiriman & Jadwal */}
        <div className="bg-surface border border-line rounded-lg p-5 flex flex-col gap-3">
          <h2 className="text-[16px] font-semibold text-ink">Jadwal dan alamat antar</h2>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted">Waktu antar</span>
            <span className="font-medium text-ink">
              {dateFormatted}, {slotLabel}
            </span>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted">Penerima</span>
            <span className="font-medium text-ink">{order.customer_name}</span>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted">Alamat</span>
            <span className="font-medium text-ink whitespace-pre-wrap">
              {order.address_text}
            </span>
            {order.address_note && (
              <span className="text-xs text-muted mt-0.5">
                Patokan: {order.address_note}
              </span>
            )}
          </div>
        </div>

        {/* Rincian belanja */}
        <div className="bg-surface border border-line rounded-lg p-5 flex flex-col gap-3">
          <h2 className="text-[16px] font-semibold text-ink">Rincian barang</h2>

          <div className="flex flex-col gap-2 text-sm">
            {(order.items || []).map((item) => (
              <div key={item.variant_id} className="flex justify-between items-center">
                <div>
                  <span className="font-medium text-ink">{item.variant_name}</span>
                  <span className="text-xs text-muted ml-2 tabular-nums">
                    {formatKg(item.qty_kg)} x {formatRupiah(item.price_per_kg)}
                  </span>
                </div>
                <span className="font-medium text-ink tabular-nums">
                  {formatRupiah(item.line_total)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-line pt-3 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium text-ink">
                {formatRupiah(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Ongkos kirim</span>
              <span className="font-medium text-ok">Gratis</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-ink pt-1 border-t border-line">
              <span>Total bayar</span>
              <span className="text-[20px] tabular-nums">{formatRupiah(order.total)}</span>
            </div>
            <span className="text-xs text-muted mt-1">
              Metode pembayaran: Bayar di tempat (tunai atau QRIS)
            </span>
          </div>
        </div>

        {/* Timeline / Riwayat status */}
        {order.events && order.events.length > 0 && (
          <div className="bg-surface border border-line rounded-lg p-5 flex flex-col gap-3">
            <h2 className="text-[16px] font-semibold text-ink flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand" />
              Riwayat status
            </h2>

            <div className="flex flex-col gap-3 pl-2 border-l-2 border-line ml-2">
              {order.events.map((ev) => {
                const dateObj = new Date(ev.created_at);
                const timeStr = dateObj.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Jakarta',
                });
                return (
                  <div key={ev.id} className="relative pl-3 flex flex-col">
                    <span className="text-sm font-semibold text-ink capitalize">
                      {ev.to_status === 'dikirim' ? 'Dalam pengiriman' : ev.to_status}
                    </span>
                    <span className="text-xs text-muted">{ev.note}</span>
                    <span className="text-xs text-muted mt-0.5 tabular-nums">
                      {timeStr} WIB
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
