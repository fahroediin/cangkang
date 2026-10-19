import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Order, OrderStatus, Staff, Depot } from '../../types.ts';
import { dataService } from '../../services/index.ts';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { formatRupiah, formatKg, formatTanggal, formatJarak } from '../../lib/format.ts';

const STATUS_TABS: { key: OrderStatus | 'semua'; label: string }[] = [
  { key: 'baru', label: 'Baru' },
  { key: 'diproses', label: 'Diproses' },
  { key: 'dikirim', label: 'Dalam pengiriman' },
  { key: 'selesai', label: 'Selesai' },
  { key: 'dibatalkan', label: 'Dibatalkan' },
  { key: 'semua', label: 'Semua' },
];

export const AdminOrders: React.FC = () => {
  const navigate = useNavigate();
  const { staff } = useOutletContext<{ staff: Staff }>();

  const [orders, setOrders] = useState<Order[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepotId, setSelectedDepotId] = useState<string>(staff.depot_id || 'semua');
  const [activeTab, setActiveTab] = useState<OrderStatus | 'semua'>('baru');
  const [newOrderToast, setNewOrderToast] = useState<string | null>(null);

  const isOwner = staff.role === 'owner';

  const loadData = useCallback(async () => {
    const depotFilter = isOwner && selectedDepotId !== 'semua' ? selectedDepotId : staff.depot_id || undefined;
    const allOrders = await dataService.getOrders(depotFilter);
    setOrders(allOrders);

    if (isOwner) {
      const dList = await dataService.getDepots();
      setDepots(dList);
    }
  }, [isOwner, selectedDepotId, staff.depot_id]);

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates AC-08.02
    const currentDepotFilter = isOwner ? null : staff.depot_id;
    const unsubscribe = dataService.subscribeToOrders(currentDepotFilter, (newOrder) => {
      // Play audio beep AC-08.02
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch {
        // Audio might fail without gesture
      }

      setNewOrderToast(`Pesanan baru ${newOrder.code}`);
      setTimeout(() => setNewOrderToast(null), 4000);
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, [loadData, isOwner, staff.depot_id]);

  // Tab counts
  const getTabCount = (tabKey: OrderStatus | 'semua') => {
    if (tabKey === 'semua') return orders.length;
    return orders.filter((o) => o.status === tabKey).length;
  };

  const filteredOrders =
    activeTab === 'semua' ? orders : orders.filter((o) => o.status === activeTab);

  // Sorting: Pesanan Baru diurutkan paling lama dulu (Spec Section 8.9)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (activeTab === 'baru') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getPageTitle = () => {
    if (!isOwner) {
      const depotName =
        staff.depot_id === 'cilegon'
          ? 'Depo Cilegon'
          : staff.depot_id === 'serang'
          ? 'Depo Serang'
          : `Depo ${staff.depot_id || ''}`;
      return `Pesanan ${depotName}`;
    }
    return 'Pesanan';
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Realtime Toast notification AC-08.02 */}
      {newOrderToast && (
        <div className="fixed top-16 right-4 z-50 bg-[#33251B] text-white text-sm px-4 py-3 rounded-lg shadow-lg border border-[#EBDDCC]">
          {newOrderToast}
        </div>
      )}

      {/* Top Header & Owner Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-[20px] font-semibold text-[#33251B]">{getPageTitle()}</h1>

        {isOwner && (
          <div className="flex items-center gap-2">
            <label htmlFor="depot_filter" className="text-sm text-[#806D5D]">
              Depo:
            </label>
            <select
              id="depot_filter"
              value={selectedDepotId}
              onChange={(e) => setSelectedDepotId(e.target.value)}
              className="h-10 px-3 rounded-lg border border-[#94806C] text-sm text-[#33251B] bg-white focus:outline-none focus:border-2 focus:border-[#704529]"
            >
              <option value="semua">Semua depo</option>
              {depots.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Status Filter Tabs (US-08) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-[#EBDDCC]">
        {STATUS_TABS.map((tab) => {
          const count = getTabCount(tab.key);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-t-lg text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors border-b-2 ${
                isActive
                  ? 'border-[#704529] text-[#704529] bg-[#FAF5EB]'
                  : 'border-transparent text-[#806D5D] hover:text-[#33251B]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full tabular-nums ${
                  isActive ? 'bg-[#704529] text-white' : 'bg-[#E7E2DC] text-[#33251B]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders List / Table */}
      {sortedOrders.length === 0 ? (
        <div className="p-8 bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg text-center text-sm text-[#806D5D]">
          Tidak ada pesanan dengan status ini.
        </div>
      ) : (
        <>
          {/* Mobile Card List (<768px per spec 6.3) */}
          <div className="flex flex-col gap-3 md:hidden">
            {sortedOrders.map((order) => {
              const totalWeight = (order.items || []).reduce((sum, item) => sum + item.qty_kg, 0);
              const slotLabel = order.delivery_slot === 'pagi' ? 'Pagi' : 'Sore';

              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/admin/pesanan/${order.id}`)}
                  className="bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg p-4 flex flex-col gap-2 cursor-pointer hover:bg-[#FAF5EB] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-bold text-[#33251B] tabular-nums">
                        {order.code}
                      </span>
                      <span className="text-xs text-[#806D5D] block">{order.customer_name}</span>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#806D5D] pt-1 border-t border-[#EBDDCC]">
                    <span>
                      {formatTanggal(order.delivery_date, { shortMonth: true })} ({slotLabel})
                    </span>
                    <span>{formatJarak(order.distance_km)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm font-semibold text-[#33251B] tabular-nums pt-1">
                    <span>{formatKg(totalWeight)}</span>
                    <span className="text-base">{formatRupiah(order.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (>=768px per spec 6.3) */}
          <div className="hidden md:block bg-[#FFFFFF] border border-[#EBDDCC] rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#FAF5EB] border-b border-[#EBDDCC] sticky top-0">
                <tr className="h-12 text-xs font-semibold text-[#806D5D]">
                  <th className="px-4 text-left">Kode</th>
                  <th className="px-4 text-left">Penerima</th>
                  {isOwner && <th className="px-4 text-left">Depo</th>}
                  <th className="px-4 text-left">Jadwal Antar</th>
                  <th className="px-4 text-right">Berat</th>
                  <th className="px-4 text-right">Total</th>
                  <th className="px-4 text-right">Jarak</th>
                  <th className="px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBDDCC] text-sm text-[#33251B]">
                {sortedOrders.map((order) => {
                  const totalWeight = (order.items || []).reduce(
                    (sum, item) => sum + item.qty_kg,
                    0
                  );
                  const slotLabel = order.delivery_slot === 'pagi' ? 'Pagi' : 'Sore';

                  return (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/admin/pesanan/${order.id}`)}
                      className="h-12 hover:bg-[#F3E8D8] cursor-pointer transition-colors"
                    >
                      <td className="px-4 font-semibold tabular-nums">{order.code}</td>
                      <td className="px-4">{order.customer_name}</td>
                      {isOwner && (
                        <td className="px-4 text-xs text-[#806D5D]">{order.depot_name}</td>
                      )}
                      <td className="px-4 text-xs">
                        {formatTanggal(order.delivery_date, { shortMonth: true })}, {slotLabel}
                      </td>
                      <td className="px-4 text-right tabular-nums">{formatKg(totalWeight)}</td>
                      <td className="px-4 text-right font-semibold tabular-nums">
                        {formatRupiah(order.total)}
                      </td>
                      <td className="px-4 text-right tabular-nums text-xs text-[#806D5D]">
                        {formatJarak(order.distance_km)}
                      </td>
                      <td className="px-4">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
