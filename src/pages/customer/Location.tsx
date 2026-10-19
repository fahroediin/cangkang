import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Depot, DepotCheck } from '../../types.ts';
import { dataService } from '../../services/index.ts';
import { config } from '../../config.ts';
import { Header } from '../../components/Header.tsx';
import { BottomBar } from '../../components/BottomBar.tsx';
import { MapPicker } from '../../components/MapPicker.tsx';
import { formatJarak } from '../../lib/format.ts';
import { buildOwnerOutOfRangeWhatsAppLink } from '../../lib/whatsapp.ts';
import {
  loadCart,
  loadCheckoutState,
  saveCheckoutState,
} from '../../state/cart.ts';

export const LocationPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart] = useState(loadCart());
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [depotChecks, setDepotChecks] = useState<DepotCheck[]>([]);
  const [selectedDepotId, setSelectedDepotId] = useState<string | null>(null);
  const [loadingDepots, setLoadingDepots] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize from session checkout state or previous pin
  useEffect(() => {
    if (cart.length === 0) {
      navigate('/keranjang');
      return;
    }

    const saved = loadCheckoutState();
    dataService.getDepots().then((depotList) => {
      setDepots(depotList);
      if (saved.lat && saved.lng) {
        setSelectedLat(saved.lat);
        setSelectedLng(saved.lng);
        setSelectedDepotId(saved.depot_id);
        runCheckDepots(saved.lat, saved.lng, saved.depot_id);
      }
    });
  }, []);

  const runCheckDepots = useCallback(
    async (lat: number, lng: number, preferDepotId?: string | null) => {
      setLoadingDepots(true);
      setFetchError(false);
      setValidationError(null);

      try {
        const checks = await dataService.checkDepots(lat, lng, cart);
        setDepotChecks(checks);

        // AC-03.02: auto-select closest eligible depot if current selection is invalid
        const eligibleDepots = checks.filter((c) => c.eligible);
        if (eligibleDepots.length > 0) {
          if (preferDepotId && eligibleDepots.some((d) => d.id === preferDepotId)) {
            setSelectedDepotId(preferDepotId);
          } else {
            setSelectedDepotId(eligibleDepots[0].id);
          }
        } else {
          setSelectedDepotId(null);
        }
      } catch {
        setFetchError(true);
      } finally {
        setLoadingDepots(false);
      }
    },
    [cart]
  );

  const handleLocationChange = (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    setValidationError(null);
    runCheckDepots(lat, lng, selectedDepotId);
  };

  const handleDepotSelect = (depotCheck: DepotCheck) => {
    if (!depotCheck.eligible) return;
    setSelectedDepotId(depotCheck.id);
  };

  const handleProceed = () => {
    // AC-02.04: Lanjut tanpa pernah menentukan titik
    if (!selectedLat || !selectedLng) {
      setValidationError('Tentukan titik antar dulu: pakai lokasi Anda atau geser pin.');
      return;
    }

    if (!selectedDepotId) {
      setValidationError('Pilih depo pengantar yang layak terlebih dahulu.');
      return;
    }

    const chosen = depotChecks.find((d) => d.id === selectedDepotId);
    if (!chosen) return;

    saveCheckoutState({
      lat: selectedLat,
      lng: selectedLng,
      depot_id: chosen.id,
      depot_name: chosen.name,
      depot_address: chosen.address,
      distance_km: chosen.distance_km,
    });

    navigate('/checkout');
  };

  const eligibleCount = depotChecks.filter((d) => d.eligible).length;

  const renderReason = (reason: string | null) => {
    if (!reason) return '';
    if (reason === 'closed') return 'Depo sedang tutup';
    if (reason === 'out_of_range') return 'Di luar jangkauan antar (5 km)';
    if (reason.startsWith('stock:')) {
      const vName = reason.replace('stock:', '');
      return `Stok ${vName} tidak cukup`;
    }
    return reason;
  };

  return (
    <div className="min-h-screen bg-[#FAF5EB] flex flex-col pb-28">
      <Header />

      <main className="max-w-[480px] w-full mx-auto px-4 py-4 flex flex-col gap-4">
        <h1 className="text-[20px] font-semibold text-[#33251B]">Lokasi antar dan pilih depo</h1>

        {/* Map Picker (US-02) */}
        <MapPicker
          initialLat={selectedLat}
          initialLng={selectedLng}
          depots={depots}
          onLocationChange={handleLocationChange}
        />

        {/* Depots list (US-03) */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#33251B]">Pilih depo terdekat</h2>
            {loadingDepots && <span className="text-xs text-[#806D5D]">Mencari depo...</span>}
          </div>

          {fetchError && (
            <div className="p-3 bg-[#FFFFFF] border border-[#B3261E] rounded-lg text-sm text-[#B3261E] flex flex-col gap-2">
              <p>Gagal memuat depo. Periksa koneksi lalu coba lagi.</p>
              <button
                type="button"
                onClick={() => {
                  if (selectedLat !== null && selectedLng !== null) {
                    runCheckDepots(selectedLat, selectedLng, selectedDepotId);
                  }
                }}
                className="self-start px-3 py-1 bg-[#FAF5EB] border border-[#94806C] rounded text-xs text-[#33251B] font-semibold"
              >
                Coba lagi
              </button>
            </div>
          )}

          {!selectedLat && !fetchError && (
            <div className="p-4 bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg text-sm text-[#806D5D] text-center">
              Tentukan titik antar di peta untuk melihat depo yang menjangkau lokasi Anda.
            </div>
          )}

          {selectedLat !== null && selectedLng !== null && !loadingDepots && !fetchError && depotChecks.length > 0 && eligibleCount === 0 && (
            <div className="p-4 bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg flex flex-col gap-3 text-center">
              <p className="text-sm text-[#33251B]">
                Belum ada depo yang bisa mengantar ke lokasi ini dengan isi keranjang sekarang.
              </p>
              <a
                href={buildOwnerOutOfRangeWhatsAppLink(config.ownerWa, selectedLat, selectedLng)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg border border-[#94806C] text-sm font-semibold text-[#33251B] hover:bg-[#FAF5EB]"
              >
                <MessageCircle className="w-4 h-4 text-[#2E6B3F]" />
                Tanya lewat WhatsApp
              </a>
            </div>
          )}

          {depotChecks.map((depot) => {
            const isSelected = selectedDepotId === depot.id;

            if (depot.eligible) {
              return (
                <div
                  key={depot.id}
                  onClick={() => handleDepotSelect(depot)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors flex items-start gap-3 ${
                    isSelected
                      ? 'bg-[#F3E8D8] border-2 border-[#704529]'
                      : 'bg-[#FFFFFF] border border-[#EBDDCC] hover:bg-[#FAF5EB]'
                  }`}
                >
                  <input
                    type="radio"
                    name="selected_depot"
                    checked={isSelected}
                    onChange={() => handleDepotSelect(depot)}
                    className="mt-1 w-4 h-4 accent-[#704529]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#33251B]">{depot.name}</h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#FAF5EB] text-[#2E6B3F] border border-[#EBDDCC]">
                        Gratis ongkir
                      </span>
                    </div>
                    <p className="text-xs text-[#806D5D] mt-0.5">{depot.address}</p>
                    <div className="flex items-center justify-between mt-2 text-xs font-medium text-[#33251B] tabular-nums">
                      <span>{formatJarak(depot.distance_km)}</span>
                      {isSelected && (
                        <span className="text-xs font-semibold text-[#704529]">Dipilih</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Ineligible card (Section 6.3 & US-03)
            return (
              <div
                key={depot.id}
                className="p-4 rounded-lg bg-[#FAF5EB] border border-[#EBDDCC] flex items-start gap-3 opacity-90"
              >
                <input
                  type="radio"
                  disabled
                  checked={false}
                  className="mt-1 w-4 h-4 accent-[#94806C] cursor-not-allowed"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-[#806D5D]">{depot.name}</h3>
                    <span className="text-xs text-[#806D5D] tabular-nums">
                      {formatJarak(depot.distance_km)}
                    </span>
                  </div>
                  <p className="text-xs text-[#806D5D] mt-0.5">{depot.address}</p>
                  <p className="text-xs text-[#B3261E] font-medium mt-1">
                    {renderReason(depot.reason)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <BottomBar
        buttonText="Isi data pengiriman"
        onClick={handleProceed}
        disabled={!selectedLat || eligibleCount === 0 || !selectedDepotId}
        errorText={validationError || undefined}
      />
    </div>
  );
};
