import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Variant } from '../../types.ts';
import { dataService } from '../../services/index.ts';
import { Header } from '../../components/Header.tsx';
import { BottomBar } from '../../components/BottomBar.tsx';
import { formatRupiah, formatKg } from '../../lib/format.ts';
import { normalizePhone } from '../../lib/validate.ts';
import { getAvailableDatesAndSlots } from '../../lib/slots.ts';
import { getErrorMessage } from '../../lib/errors.ts';
import {
  loadCart,
  clearCart,
  loadCheckoutState,
  saveLastOrder,
} from '../../state/cart.ts';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [cart] = useState(loadCart());
  const [checkoutState] = useState(loadCheckoutState());
  const [variants, setVariants] = useState<Variant[]>([]);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  // Date and slot options
  const { dates, defaultDateKey, defaultSlotKey } = getAvailableDatesAndSlots();
  const [selectedDateKey, setSelectedDateKey] = useState<'hari_ini' | 'besok' | 'lusa'>(defaultDateKey);
  const [selectedSlotKey, setSelectedSlotKey] = useState<'pagi' | 'sore' | null>(defaultSlotKey);

  // Field errors
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
    slot?: string;
    general?: string;
    stockError?: boolean;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/keranjang');
      return;
    }
    if (!checkoutState.lat || !checkoutState.lng || !checkoutState.depot_id) {
      navigate('/lokasi');
      return;
    }

    dataService.getVariants().then((vars) => {
      setVariants(vars);
    });
  }, [cart, checkoutState, navigate]);

  const variantMap = new Map(variants.map((v) => [v.id, v]));
  const totalKg = cart.reduce((sum, item) => sum + item.qty_kg, 0);
  const totalPrice = cart.reduce((sum, item) => {
    const v = variantMap.get(item.variant_id);
    return sum + (v ? Math.round(item.qty_kg * v.price_per_kg) : 0);
  }, 0);

  const currentDateObj = dates.find((d) => d.key === selectedDateKey) || dates[0];

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent double tap AC-04.10

    const newErrors: {
      name?: string;
      phone?: string;
      address?: string;
      slot?: string;
      general?: string;
    } = {};

    // Validate name AC-04.02, AC-04.07
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Nama wajib diisi';
    } else if (trimmedName.length > 80) {
      newErrors.name = 'Nama maksimal 80 karakter';
    }

    // Validate phone AC-04.02, AC-04.03, AC-04.04, AC-04.05
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      newErrors.phone = 'Nomor WhatsApp wajib diisi';
    } else {
      const normalized = normalizePhone(trimmedPhone);
      if (!normalized) {
        newErrors.phone = 'Nomor WhatsApp tidak valid. Contoh: 0812 3456 7890';
      }
    }

    // Validate address AC-04.02
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      newErrors.address = 'Alamat wajib diisi';
    } else if (trimmedAddress.length < 5) {
      newErrors.address = 'Alamat minimal 5 karakter';
    } else if (trimmedAddress.length > 300) {
      newErrors.address = 'Alamat maksimal 300 karakter';
    }

    // Validate slot AC-04.02
    if (!selectedSlotKey) {
      newErrors.slot = 'Pilih jam antar';
    } else {
      const currentSlot = currentDateObj.slots.find((s) => s.key === selectedSlotKey);
      if (!currentSlot || !currentSlot.isAvailable) {
        newErrors.slot = 'Jadwal yang dipilih sudah tutup. Pilih jadwal lain.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const normalizedPhone = normalizePhone(trimmedPhone)!;
      const res = await dataService.createOrder({
        name: trimmedName,
        phone: normalizedPhone,
        address: trimmedAddress,
        note: note.trim() || undefined,
        depot_id: checkoutState.depot_id!,
        delivery_date: currentDateObj.dateStr,
        delivery_slot: selectedSlotKey!,
        lat: checkoutState.lat!,
        lng: checkoutState.lng!,
        items: cart,
      });

      // Success
      clearCart();
      saveLastOrder(res.code);
      navigate(`/pesanan/${res.code}`);
    } catch (err: any) {
      setIsSubmitting(false);
      const msg = err?.message || '';

      if (msg.includes('ERR_STOCK')) {
        // AC-04.09
        setErrors({
          general: 'Stok berubah saat Anda memesan. Pilih depo lagi atau kurangi berat.',
          stockError: true,
        });
      } else if (msg.includes('ERR_LIMIT')) {
        // AC-04.11
        setErrors({
          general:
            'Nomor ini masih punya 3 pesanan berjalan. Hubungi depo lewat WhatsApp untuk pesanan tambahan.',
        });
      } else if (msg.includes('ERR_SLOT')) {
        setErrors({
          slot: 'Jadwal yang dipilih sudah tutup. Pilih jadwal lain.',
        });
      } else {
        // AC-04.12: Connection error or general
        setErrors({
          general:
            getErrorMessage(msg) ||
            'Pesanan belum terkirim. Periksa koneksi lalu tekan Kirim pesanan lagi.',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF5EB] flex flex-col pb-28">
      <Header />

      <main className="max-w-[480px] w-full mx-auto px-4 py-4 flex flex-col gap-4">
        <h1 className="text-[20px] font-semibold text-[#33251B]">Data pengiriman</h1>

        {/* Ringkasan pesanan & Depo */}
        <div className="bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#EBDDCC]">
            <span className="text-sm font-semibold text-[#33251B]">
              Diantar dari {checkoutState.depot_name || 'Depo'}
            </span>
            <span className="text-xs text-[#2E6B3F] font-semibold">Ongkir Rp0</span>
          </div>

          <div className="flex flex-col gap-1 text-sm text-[#33251B]">
            {cart.map((item) => {
              const v = variantMap.get(item.variant_id);
              const name = v ? v.name : item.variant_id;
              const price = v ? v.price_per_kg : 0;
              return (
                <div key={item.variant_id} className="flex justify-between items-center">
                  <span>
                    {name} ({formatKg(item.qty_kg)})
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatRupiah(Math.round(item.qty_kg * price))}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-[#EBDDCC] pt-2 flex justify-between items-center">
            <span className="text-sm font-semibold text-[#33251B]">Total ({formatKg(totalKg)})</span>
            <span className="text-lg font-semibold text-[#33251B] tabular-nums">
              {formatRupiah(totalPrice)}
            </span>
          </div>
        </div>

        {/* Form fields */}
        <div className="bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg p-4 flex flex-col gap-4">
          {/* General error / Stock error banner */}
          {errors.general && (
            <div className="p-3 bg-[#FAF5EB] border border-[#B3261E] rounded-lg text-sm text-[#B3261E] flex flex-col gap-2">
              <p>{errors.general}</p>
              {errors.stockError && (
                <button
                  type="button"
                  onClick={() => navigate('/lokasi')}
                  className="self-start px-3 py-1 bg-[#FFFFFF] border border-[#94806C] rounded text-xs text-[#33251B] font-semibold"
                >
                  Pilih depo lagi
                </button>
              )}
            </div>
          )}

          {/* Nama penerima */}
          <div className="flex flex-col gap-1">
            <label htmlFor="customer_name" className="text-sm font-semibold text-[#33251B]">
              Nama penerima
            </label>
            <input
              id="customer_name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className={`h-11 px-3 rounded-lg border text-sm text-[#33251B] bg-white focus:outline-none focus:border-2 focus:border-[#704529] ${
                errors.name ? 'border-[#B3261E]' : 'border-[#94806C]'
              }`}
            />
            {errors.name && <span className="text-xs text-[#B3261E] font-medium">{errors.name}</span>}
          </div>

          {/* Nomor WhatsApp */}
          <div className="flex flex-col gap-1">
            <label htmlFor="customer_phone" className="text-sm font-semibold text-[#33251B]">
              Nomor WhatsApp
            </label>
            <input
              id="customer_phone"
              type="tel"
              inputMode="tel"
              placeholder="Contoh: 0812 3456 7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
              className={`h-11 px-3 rounded-lg border text-sm text-[#33251B] bg-white focus:outline-none focus:border-2 focus:border-[#704529] ${
                errors.phone ? 'border-[#B3261E]' : 'border-[#94806C]'
              }`}
            />
            {errors.phone && <span className="text-xs text-[#B3261E] font-medium">{errors.phone}</span>}
          </div>

          {/* Alamat lengkap */}
          <div className="flex flex-col gap-1">
            <label htmlFor="customer_address" className="text-sm font-semibold text-[#33251B]">
              Alamat lengkap
            </label>
            <textarea
              id="customer_address"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isSubmitting}
              placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan"
              className={`p-3 rounded-lg border text-sm text-[#33251B] bg-white focus:outline-none focus:border-2 focus:border-[#704529] ${
                errors.address ? 'border-[#B3261E]' : 'border-[#94806C]'
              }`}
            />
            {errors.address && (
              <span className="text-xs text-[#B3261E] font-medium">{errors.address}</span>
            )}
          </div>

          {/* Patokan (opsional) */}
          <div className="flex flex-col gap-1">
            <label htmlFor="customer_note" className="text-sm font-semibold text-[#33251B]">
              Patokan (opsional)
            </label>
            <input
              id="customer_note"
              type="text"
              placeholder="Contoh: Depan warung Madura, pagar hijau"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting}
              className="h-11 px-3 rounded-lg border border-[#94806C] text-sm text-[#33251B] bg-white focus:outline-none focus:border-2 focus:border-[#704529]"
            />
          </div>

          {/* Tanggal antar */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-sm font-semibold text-[#33251B]">Tanggal antar</span>
            <div className="grid grid-cols-3 gap-2">
              {dates.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  disabled={!d.isAvailable || isSubmitting}
                  onClick={() => {
                    setSelectedDateKey(d.key);
                    // auto pick available slot if current is invalid
                    const avail = d.slots.find((s) => s.isAvailable);
                    setSelectedSlotKey(avail ? avail.key : null);
                  }}
                  className={`p-2.5 rounded-lg border text-center transition-colors flex flex-col items-center justify-center ${
                    !d.isAvailable
                      ? 'bg-[#E7E2DC] text-[#806D5D] border-[#EBDDCC] cursor-not-allowed opacity-60'
                      : selectedDateKey === d.key
                      ? 'bg-[#F3E8D8] border-2 border-[#704529] text-[#33251B] font-semibold'
                      : 'bg-[#FFFFFF] border-[#94806C] text-[#33251B] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <span className="text-xs font-semibold">{d.label}</span>
                  <span className="text-[11px] text-[#806D5D] mt-0.5">
                    {d.dateStr.slice(5).replace('-', '/')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Jam antar */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#33251B]">Jam antar</span>
            <div className="grid grid-cols-2 gap-2">
              {currentDateObj.slots.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  disabled={!s.isAvailable || isSubmitting}
                  onClick={() => setSelectedSlotKey(s.key)}
                  className={`p-3 rounded-lg border text-left transition-colors flex flex-col ${
                    !s.isAvailable
                      ? 'bg-[#E7E2DC] border-[#EBDDCC] text-[#806D5D] cursor-not-allowed opacity-60'
                      : selectedSlotKey === s.key
                      ? 'bg-[#F3E8D8] border-2 border-[#704529] text-[#33251B] font-semibold'
                      : 'bg-[#FFFFFF] border-[#94806C] text-[#33251B] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{s.label}</span>
                    {s.disabledReason && (
                      <span className="text-[11px] font-semibold text-[#B3261E]">
                        {s.disabledReason}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#806D5D] mt-0.5">{s.sublabel}</span>
                </button>
              ))}
            </div>
            {errors.slot && <span className="text-xs text-[#B3261E] font-medium">{errors.slot}</span>}
          </div>

          {/* Fixed payment text */}
          <div className="p-3 bg-[#FAF5EB] border border-[#EBDDCC] rounded-lg text-xs text-[#33251B]">
            Pembayaran: bayar di tempat saat telur diterima (tunai atau QRIS)
          </div>
        </div>
      </main>

      <BottomBar
        buttonText={isSubmitting ? 'Mengirim...' : 'Kirim pesanan'}
        onClick={handleSubmit}
        disabled={isSubmitting}
      />
    </div>
  );
};
