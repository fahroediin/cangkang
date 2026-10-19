import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Clock } from 'lucide-react';
import { Order } from '../../types.ts';
import { dataService } from '../../services/index.ts';
import { Header } from '../../components/Header.tsx';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { formatRupiah, formatKg, formatTanggal } from '../../lib/format.ts';
import { buildDepotWhatsAppLink } from '../../lib/whatsapp.ts';
import { loadLastOrders, saveLastOrder } from '../../state/cart.ts';

export const OrderStatusPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [last4Input, setLast4Input] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const cleanCode = (code || '').trim().toUpperCase();

  const fetchOrder = useCallback(async () => {
    if (!cleanCode) return;
    try {
      const data = await dataService.getOrder(cleanCode);
      if (data) {
        setOrder(data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [cleanCode]);

  useEffect(() => {
    const knownCodes = loadLastOrders();
    const isKnown = knownCodes.includes(cleanCode);

    if (!isKnown) {
      setNeedsVerification(true);
      setLoading(false);
    } else {
      fetchOrder();
    }

    // Auto reload every 30s (AC-05.04)
    const interval = setInterval(() => {
      if (!needsVerification) {
        fetchOrder();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [cleanCode, fetchOrder, needsVerification]);

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
        setNeedsVerification(false);
        saveLastOrder(cleanCode);
      }
    } catch {
      setVerifyError('Pesanan tidak ditemukan. Periksa kode dan 4 digit terakhir nomor WhatsApp.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF5EB] flex flex-col">
        <Header />
        <div className="max-w-[480px] w-full mx-auto px-4 py-8 text-center text-sm text-[#806D5D]">
          Memuat status pesanan...
        </div>
      </div>
    );
  }

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-[#FAF5EB] flex flex-col">
        <Header />
        <main className="max-w-[480px] w-full mx-auto px-4 py-6 flex flex-col gap-4">
          <h1 className="text-[20px] font-semibold text-[#33251B]">Verifikasi pesanan</h1>
          <div className="bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg p-5 flex flex-col gap-4">
            <p className="text-sm text-[#33251B]">
              Untuk melihat pesanan <span className="font-semibold">{cleanCode}</span>, masukkan 4
              digit terakhir nomor WhatsApp pemesan.
            </p>

            <form onSubmit={handleVerify} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="verify_last4" className="text-sm font-semibold text-[#33251B]">
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
                  className="h-11 px-3 rounded-lg border border-[#94806C] text-sm text-[#33251B] bg-white focus:outline-none focus:border-2 focus:border-[#704529]"
                />
              </div>

              {verifyError && (
                <div className="text-sm text-[#B3261E] font-medium">{verifyError}</div>
              )}

              <button
                type="submit"
                className="h-11 rounded-lg bg-[#704529] hover:bg-[#5A3720] text-white font-semibold text-sm transition-colors"
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
      <div className="min-h-screen bg-[#FAF5EB] flex flex-col">
        <Header />
        <main className="max-w-[480px] w-full mx-auto px-4 py-8 flex flex-col items-center gap-4 text-center">
          <p className="text-base text-[#806D5D]">Pesanan tidak ditemukan</p>
          <Link
            to="/lacak"
            className="h-11 px-6 rounded-lg bg-[#704529] hover:bg-[#5A3720] text-white font-semibold text-sm flex items-center justify-center transition-colors"
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
    <div className="min-h-screen bg-[#FAF5EB] flex flex-col pb-16">
      <Header />

      <main className="max-w-[480px] w-full mx-auto px-4 py-4 flex flex-col gap-4">
        {/* Status card */}
        <div className="bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-[#806D5D] block">Kode pesanan</span>
              <span className="text-lg font-bold text-[#33251B] tabular-nums tracking-wide">
                {order.code}
              </span>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <p className="text-sm text-[#33251B]">
            Pesanan <span className="font-semibold">{order.code}</span> terkirim ke{' '}
            <span className="font-semibold">{order.depot_name || 'Depo'}</span>
          </p>

          {/* Cancel reason if cancelled AC-05.05 */}
          {order.status === 'dibatalkan' && order.cancel_reason && (
            <div className="p-3 bg-[#FAF5EB] border border-[#EBDDCC] rounded-lg text-sm text-[#33251B]">
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
              className="mt-1 h-11 px-4 rounded-lg bg-[#2E6B3F] hover:bg-[#255733] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Chat depo di WhatsApp
            </a>
          )}
        </div>

        {/* Pengiriman & Jadwal */}
        <div className="bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg p-5 flex flex-col gap-3">
          <h2 className="text-[16px] font-semibold text-[#33251B]">Jadwal dan alamat antar</h2>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-[#806D5D]">Waktu antar</span>
            <span className="font-medium text-[#33251B]">
              {dateFormatted}, {slotLabel}
            </span>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-[#806D5D]">Penerima</span>
            <span className="font-medium text-[#33251B]">{order.customer_name}</span>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-[#806D5D]">Alamat</span>
            <span className="font-medium text-[#33251B] whitespace-pre-wrap">
              {order.address_text}
            </span>
            {order.address_note && (
              <span className="text-xs text-[#806D5D] mt-0.5">
                Patokan: {order.address_note}
              </span>
            )}
          </div>
        </div>

        {/* Rincian belanja */}
        <div className="bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg p-5 flex flex-col gap-3">
          <h2 className="text-[16px] font-semibold text-[#33251B]">Rincian barang</h2>

          <div className="flex flex-col gap-2 text-sm">
            {(order.items || []).map((item) => (
              <div key={item.variant_id} className="flex justify-between items-center">
                <div>
                  <span className="font-medium text-[#33251B]">{item.variant_name}</span>
                  <span className="text-xs text-[#806D5D] ml-2 tabular-nums">
                    {formatKg(item.qty_kg)} x {formatRupiah(item.price_per_kg)}
                  </span>
                </div>
                <span className="font-medium text-[#33251B] tabular-nums">
                  {formatRupiah(item.line_total)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#EBDDCC] pt-3 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-[#806D5D]">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium text-[#33251B]">
                {formatRupiah(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-[#806D5D]">
              <span>Ongkos kirim</span>
              <span className="font-medium text-[#2E6B3F]">Gratis</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-[#33251B] pt-1 border-t border-[#EBDDCC]">
              <span>Total bayar</span>
              <span className="text-[20px] tabular-nums">{formatRupiah(order.total)}</span>
            </div>
            <span className="text-xs text-[#806D5D] mt-1">
              Metode pembayaran: Bayar di tempat (tunai atau QRIS)
            </span>
          </div>
        </div>

        {/* Timeline / Riwayat status */}
        {order.events && order.events.length > 0 && (
          <div className="bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg p-5 flex flex-col gap-3">
            <h2 className="text-[16px] font-semibold text-[#33251B] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#704529]" />
              Riwayat status
            </h2>

            <div className="flex flex-col gap-3 pl-2 border-l-2 border-[#EBDDCC] ml-2">
              {order.events.map((ev) => {
                const dateObj = new Date(ev.created_at);
                const timeStr = dateObj.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Jakarta',
                });
                return (
                  <div key={ev.id} className="relative pl-3 flex flex-col">
                    <span className="text-sm font-semibold text-[#33251B] capitalize">
                      {ev.to_status === 'dikirim' ? 'Dalam pengiriman' : ev.to_status}
                    </span>
                    <span className="text-xs text-[#806D5D]">{ev.note}</span>
                    <span className="text-[11px] text-[#806D5D] mt-0.5 tabular-nums">
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
