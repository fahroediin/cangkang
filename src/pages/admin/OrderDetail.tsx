import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, MapPin, MessageCircle, Clock } from 'lucide-react';
import { Order, Staff, OrderStatus } from '../../types.ts';
import { dataService } from '../../services/index.ts';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { formatRupiah, formatKg, formatTanggal, formatJarak } from '../../lib/format.ts';
import { buildCustomerWhatsAppLink } from '../../lib/whatsapp.ts';

export const AdminOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { staff } = useOutletContext<{ staff: Staff }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mulai Antar Dialog state
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [courierError, setCourierError] = useState<string | null>(null);

  // Tandai Selesai Dialog state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isPaidChecked, setIsPaidChecked] = useState(true);

  // Cancel Dialog state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonOption, setCancelReasonOption] = useState<string>('Stok tidak cukup');
  const [cancelNote, setCancelNote] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await dataService.getOrderById(id);
      setOrder(data);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- TRM_STATUS_001: Proses pesanan (Baru -> Diproses) ---
  const handleProcessOrder = async () => {
    if (!order) return;
    setActionError(null);
    try {
      const updated = await dataService.setOrderStatus({
        order_id: order.id,
        expected_status: 'baru',
        to_status: 'diproses',
      });
      setOrder(updated);
      showToast('Status pesanan diubah ke Diproses');
    } catch (err: any) {
      setActionError(err?.message || 'Status pesanan sudah diubah petugas lain. Muat ulang halaman.');
    }
  };

  // --- TRM_STATUS_002: Mulai antar (Diproses -> Dikirim) ---
  const handleStartDelivery = async () => {
    if (!order) return;
    setCourierError(null);
    const trimmed = courierName.trim();
    if (!trimmed) {
      setCourierError('Nama kurir wajib diisi');
      return;
    }
    if (trimmed.length > 50) {
      setCourierError('Nama kurir maksimal 50 karakter');
      return;
    }

    try {
      const updated = await dataService.setOrderStatus({
        order_id: order.id,
        expected_status: 'diproses',
        to_status: 'dikirim',
        courier_name: trimmed,
      });
      setOrder(updated);
      setShowCourierModal(false);
      showToast('Status pesanan diubah ke Dalam pengiriman');
    } catch (err: any) {
      setCourierError(err?.message || 'Status pesanan sudah diubah petugas lain. Muat ulang halaman.');
    }
  };

  // --- TRM_STATUS_004: Tandai selesai (Dikirim -> Selesai) ---
  const handleCompleteOrder = async () => {
    if (!order) return;
    try {
      const updated = await dataService.setOrderStatus({
        order_id: order.id,
        expected_status: 'dikirim',
        to_status: 'selesai',
        is_paid: isPaidChecked,
      });
      setOrder(updated);
      setShowCompleteModal(false);
      showToast('Status pesanan diubah ke Selesai');
    } catch (err: any) {
      setActionError(err?.message || 'Status pesanan sudah diubah petugas lain. Muat ulang halaman.');
    }
  };

  // --- US-09: Batalkan pesanan (Baru / Diproses -> Dibatalkan) ---
  const handleCancelOrder = async () => {
    if (!order) return;
    setCancelError(null);

    let finalReason = cancelReasonOption;
    if (cancelReasonOption === 'Lainnya') {
      const trimmedNote = cancelNote.trim();
      if (!trimmedNote) {
        setCancelError('Keterangan wajib diisi');
        return;
      }
      if (trimmedNote.length > 200) {
        setCancelError('Keterangan maksimal 200 karakter');
        return;
      }
      finalReason = trimmedNote;
    }

    try {
      const updated = await dataService.setOrderStatus({
        order_id: order.id,
        expected_status: order.status,
        to_status: 'dibatalkan',
        cancel_reason: finalReason,
      });
      setOrder(updated);
      setShowCancelModal(false);
      showToast('Pesanan dibatalkan. Stok dikembalikan.');
    } catch (err: any) {
      setCancelError(err?.message || 'Status pesanan sudah diubah petugas lain. Muat ulang halaman.');
    }
  };

  if (loading) {
    return <div className="text-sm text-[#806D5D]">Memuat rincian pesanan...</div>;
  }

  // TRM_STATUS_009: Admin depo Serang buka pesanan Cilegon -> "Pesanan tidak ditemukan"
  if (!order) {
    return (
      <div className="bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg p-8 text-center flex flex-col items-center gap-3">
        <p className="text-base text-[#806D5D]">Pesanan tidak ditemukan</p>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="px-4 py-2 bg-[#704529] text-white font-semibold text-sm rounded-lg"
        >
          Kembali ke daftar pesanan
        </button>
      </div>
    );
  }

  const slotLabel = order.delivery_slot === 'pagi' ? 'Pagi 08.00-12.00' : 'Sore 13.00-17.00';
  const mapsUrl = `https://maps.google.com/?q=${order.lat},${order.lng}`;
  const waUrl = buildCustomerWhatsAppLink(order.customer_phone, order.customer_name, order.code);

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-[#33251B] text-white text-sm px-4 py-3 rounded-lg shadow-lg border border-[#EBDDCC]">
          {toastMessage}
        </div>
      )}

      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="p-2 rounded-lg border border-[#94806C] text-[#33251B] hover:bg-[#FAF5EB]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-xs text-[#806D5D]">Rincian Pesanan</span>
          <h1 className="text-[20px] font-semibold text-[#33251B] tabular-nums">{order.code}</h1>
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-[#FAF5EB] border border-[#B3261E] rounded-lg text-sm text-[#B3261E] font-medium">
          {actionError}
        </div>
      )}

      {/* Main Order Card */}
      <div className="bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between pb-3 border-b border-[#EBDDCC]">
          <div>
            <span className="text-xs text-[#806D5D]">Depo</span>
            <div className="text-sm font-semibold text-[#33251B]">{order.depot_name}</div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {order.status === 'dibatalkan' && order.cancel_reason && (
          <div className="p-3 bg-[#FAF5EB] border border-[#EBDDCC] rounded-lg text-sm text-[#33251B]">
            <span className="font-semibold">Alasan pembatalan: </span>
            {order.cancel_reason}
          </div>
        )}

        {/* Customer & Address Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-[#806D5D]">Penerima</span>
            <span className="font-semibold text-[#33251B]">{order.customer_name}</span>
            <span className="text-[#806D5D] tabular-nums">{order.customer_phone}</span>

            <div className="mt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#94806C] text-xs font-semibold text-[#33251B] hover:bg-[#FAF5EB]"
              >
                <MessageCircle className="w-4 h-4 text-[#2E6B3F]" />
                Chat pelanggan
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-[#806D5D]">Alamat & Jarak</span>
            <span className="font-medium text-[#33251B] whitespace-pre-wrap">
              {order.address_text}
            </span>
            {order.address_note && (
              <span className="text-xs text-[#806D5D]">Patokan: {order.address_note}</span>
            )}
            <span className="text-xs text-[#806D5D] tabular-nums mt-0.5">
              Jarak garis lurus: {formatJarak(order.distance_km)}
            </span>

            <div className="mt-2">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#94806C] text-xs font-semibold text-[#33251B] hover:bg-[#FAF5EB]"
              >
                <MapPin className="w-4 h-4 text-[#704529]" />
                Buka di Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* Jadwal Antar */}
        <div className="p-3 bg-[#FAF5EB] rounded-lg border border-[#EBDDCC] flex justify-between items-center text-sm">
          <span className="text-xs text-[#806D5D]">Jadwal Antar</span>
          <span className="font-semibold text-[#33251B]">
            {formatTanggal(order.delivery_date, { includeDay: true })}, {slotLabel}
          </span>
        </div>

        {order.courier_name && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-xs text-[#806D5D]">Kurir pengantar</span>
            <span className="font-semibold text-[#33251B]">{order.courier_name}</span>
          </div>
        )}

        {/* Barang Belanja */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#EBDDCC]">
          <span className="text-xs text-[#806D5D] font-semibold">Barang yang dipesan</span>
          <div className="flex flex-col divide-y divide-[#EBDDCC] text-sm">
            {(order.items || []).map((item) => (
              <div key={item.variant_id} className="py-2 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-[#33251B]">{item.variant_name}</span>
                  <span className="text-xs text-[#806D5D] ml-2 tabular-nums">
                    {formatKg(item.qty_kg)} @ {formatRupiah(item.price_per_kg)}
                  </span>
                </div>
                <span className="font-semibold text-[#33251B] tabular-nums">
                  {formatRupiah(item.line_total)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#EBDDCC] pt-2 flex justify-between items-center text-base font-semibold text-[#33251B]">
            <span>Total Tagihan (Bayar di Tempat)</span>
            <span className="text-[20px] tabular-nums">{formatRupiah(order.total)}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-[#806D5D]">
            <span>Status Pembayaran</span>
            <span className={`font-semibold ${order.is_paid ? 'text-[#2E6B3F]' : 'text-[#806D5D]'}`}>
              {order.is_paid ? 'Sudah diterima' : 'Belum dibayar'}
            </span>
          </div>
        </div>

        {/* Action Buttons strictly following TRM_STATUS rules */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-[#EBDDCC]">
          {order.status === 'baru' && (
            <>
              <button
                type="button"
                onClick={handleProcessOrder}
                className="h-11 px-5 rounded-lg bg-[#704529] hover:bg-[#5A3720] text-white font-semibold text-sm transition-colors"
              >
                Proses pesanan
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="h-11 px-4 rounded-lg border border-[#B3261E] text-[#B3261E] font-semibold text-sm hover:bg-[#FAF5EB] transition-colors"
              >
                Batalkan pesanan
              </button>
            </>
          )}

          {order.status === 'diproses' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setCourierName('');
                  setCourierError(null);
                  setShowCourierModal(true);
                }}
                className="h-11 px-5 rounded-lg bg-[#704529] hover:bg-[#5A3720] text-white font-semibold text-sm transition-colors"
              >
                Mulai antar
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="h-11 px-4 rounded-lg border border-[#B3261E] text-[#B3261E] font-semibold text-sm hover:bg-[#FAF5EB] transition-colors"
              >
                Batalkan pesanan
              </button>
            </>
          )}

          {order.status === 'dikirim' && (
            <button
              type="button"
              onClick={() => setShowCompleteModal(true)}
              className="h-11 px-5 rounded-lg bg-[#2E6B3F] hover:bg-[#255733] text-white font-semibold text-sm transition-colors"
            >
              Tandai selesai
            </button>
          )}

          {/* Selesai / Dibatalkan: no action buttons per TRM_STATUS_006, 007 */}
        </div>
      </div>

      {/* Timeline Riwayat Status */}
      {order.events && order.events.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg p-5 flex flex-col gap-3">
          <h2 className="text-[16px] font-semibold text-[#33251B] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#704529]" />
            Riwayat Status
          </h2>

          <div className="flex flex-col gap-3 pl-2 border-l-2 border-[#EBDDCC] ml-2">
            {order.events.map((ev) => {
              const d = new Date(ev.created_at);
              const timeFormatted = d.toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'Asia/Jakarta',
              });
              return (
                <div key={ev.id} className="relative pl-3 flex flex-col">
                  <span className="text-sm font-semibold text-[#33251B] capitalize">
                    {ev.to_status === 'dikirim' ? 'Dalam pengiriman' : ev.to_status}
                  </span>
                  <span className="text-xs text-[#806D5D]">{ev.note}</span>
                  <div className="text-[11px] text-[#806D5D] mt-0.5 tabular-nums">
                    <span>{timeFormatted} WIB</span>
                    {ev.actor && <span className="ml-2 font-medium">oleh {ev.actor}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Courier Modal (Mulai Antar) */}
      {showCourierModal && (
        <div className="fixed inset-0 z-50 bg-[#33251B]/40 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg max-w-sm w-full p-5 flex flex-col gap-4 shadow-lg">
            <h3 className="text-base font-semibold text-[#33251B]">Mulai Pengantaran</h3>
            <div className="flex flex-col gap-1">
              <label htmlFor="modal_courier_name" className="text-xs font-semibold text-[#33251B]">
                Nama kurir
              </label>
              <input
                id="modal_courier_name"
                type="text"
                maxLength={51}
                placeholder="Contoh: Budi Santoso"
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                className="h-11 px-3 rounded-lg border border-[#94806C] text-sm text-[#33251B] bg-white focus:outline-none focus:border-2 focus:border-[#704529]"
              />
              {courierError && (
                <span className="text-xs text-[#B3261E] font-medium">{courierError}</span>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCourierModal(false)}
                className="h-10 px-4 rounded-lg border border-[#94806C] text-sm text-[#33251B] font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleStartDelivery}
                className="h-10 px-4 rounded-lg bg-[#704529] hover:bg-[#5A3720] text-sm text-white font-semibold"
              >
                Mulai antar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal (Tandai Selesai) */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 bg-[#33251B]/40 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg max-w-sm w-full p-5 flex flex-col gap-4 shadow-lg">
            <h3 className="text-base font-semibold text-[#33251B]">Selesaikan Pesanan</h3>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[#33251B]">
              <input
                type="checkbox"
                checked={isPaidChecked}
                onChange={(e) => setIsPaidChecked(e.target.checked)}
                className="w-4 h-4 accent-[#704529]"
              />
              <span>Pembayaran sudah diterima</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="h-10 px-4 rounded-lg border border-[#94806C] text-sm text-[#33251B] font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCompleteOrder}
                className="h-10 px-4 rounded-lg bg-[#2E6B3F] hover:bg-[#255733] text-sm text-white font-semibold"
              >
                Tandai selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal (US-09) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-[#33251B]/40 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg max-w-md w-full p-5 flex flex-col gap-4 shadow-lg">
            <h3 className="text-base font-semibold text-[#33251B]">Batalkan Pesanan</h3>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#33251B]">Pilih alasan pembatalan:</span>
              {[
                'Stok tidak cukup',
                'Pelanggan membatalkan',
                'Alamat tidak terjangkau',
                'Lainnya',
              ].map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm text-[#33251B] cursor-pointer">
                  <input
                    type="radio"
                    name="cancel_reason"
                    checked={cancelReasonOption === opt}
                    onChange={() => setCancelReasonOption(opt)}
                    className="w-4 h-4 accent-[#704529]"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {cancelReasonOption === 'Lainnya' && (
              <div className="flex flex-col gap-1">
                <label htmlFor="cancel_keterangan" className="text-xs font-semibold text-[#33251B]">
                  Keterangan
                </label>
                <input
                  id="cancel_keterangan"
                  type="text"
                  maxLength={200}
                  placeholder="Tuliskan alasan pembatalan..."
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  className="h-11 px-3 rounded-lg border border-[#94806C] text-sm text-[#33251B] bg-white focus:outline-none focus:border-2 focus:border-[#704529]"
                />
              </div>
            )}

            {cancelError && (
              <span className="text-xs text-[#B3261E] font-medium">{cancelError}</span>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="h-10 px-4 rounded-lg border border-[#94806C] text-sm text-[#33251B] font-semibold"
              >
                Jangan batalkan
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                className="h-10 px-4 rounded-lg bg-[#B3261E] hover:bg-[#8F1E18] text-sm text-white font-semibold"
              >
                Batalkan pesanan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
