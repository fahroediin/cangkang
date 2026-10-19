import {
  Variant,
  Depot,
  DepotCheck,
  DepotStock,
  Order,
  OrderStatus,
  Staff,
  CreateOrderParams,
  CreateOrderResult,
  PilotSummary,
  PilotDepotSummary,
} from '../types.ts';
import { DataService } from './DataService.ts';
import { distanceKm } from '../lib/distance.ts';
import { normalizePhone, validateVariantQty, validateCartTotal } from '../lib/validate.ts';
import { validateSlotSelection } from '../lib/slots.ts';

const STORAGE_KEYS = {
  VARIANTS: 'tf_mock_variants',
  DEPOTS: 'tf_mock_depots',
  STOCK: 'tf_mock_stock',
  ORDERS: 'tf_mock_orders',
  CURRENT_STAFF: 'tf_mock_staff',
};

const INITIAL_DEPOTS: Depot[] = [
  {
    id: 'cilegon',
    name: 'Depo Cilegon',
    address: 'Ruko Cilegon City Square Blok A-3, Jl. Jend. Sudirman, Cilegon',
    lat: -6.017,
    lng: 106.056,
    radius_km: 5,
    wa_number: '6281298765432',
    is_active: true,
    coords_verified: true,
  },
  {
    id: 'serang',
    name: 'Depo Serang',
    address: 'Ruko Serang Raya Blok C-12, Jl. Ahmad Yani, Serang',
    lat: -6.12,
    lng: 106.15,
    radius_km: 5,
    wa_number: '6281298765433',
    is_active: true,
    coords_verified: true,
  },
  {
    id: 'anyer',
    name: 'Depo Anyer',
    address: 'Jl. Raya Anyer-Sirih No. 45, Anyer',
    lat: -6.062,
    lng: 105.923,
    radius_km: 5,
    wa_number: '6281298765431',
    is_active: true,
    coords_verified: true,
  },
];

const INITIAL_VARIANTS: Variant[] = [
  {
    id: 'reguler',
    name: 'Telur reguler',
    description: 'Ukuran campur, untuk masak harian',
    price_per_kg: 24000,
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'pilihan',
    name: 'Telur pilihan',
    description: 'Ukuran besar dan seragam',
    price_per_kg: 27000,
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'ekonomis',
    name: 'Telur ekonomis',
    description: 'Ukuran kecil, harga lebih hemat',
    price_per_kg: 22000,
    is_active: true,
    sort_order: 3,
  },
];

const MOCK_STAFF_USERS: { [email: string]: { staff: Staff; password: string } } = {
  'owner@telurfarm.com': {
    staff: {
      user_id: 'user-owner',
      full_name: 'Haji Mansur',
      role: 'owner',
      depot_id: null,
    },
    password: 'owner123',
  },
  'admin.cilegon@telurfarm.com': {
    staff: {
      user_id: 'user-cilegon',
      full_name: 'Ahmad Fauzi',
      role: 'admin_depo',
      depot_id: 'cilegon',
    },
    password: 'cilegon123',
  },
  'admin.serang@telurfarm.com': {
    staff: {
      user_id: 'user-serang',
      full_name: 'Tubagus Ridwan',
      role: 'admin_depo',
      depot_id: 'serang',
    },
    password: 'serang123',
  },
};

export class MockDataService implements DataService {
  constructor() {
    this.initSeedData();
  }

  private initSeedData(): void {
    if (!localStorage.getItem(STORAGE_KEYS.VARIANTS)) {
      localStorage.setItem(STORAGE_KEYS.VARIANTS, JSON.stringify(INITIAL_VARIANTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEPOTS)) {
      localStorage.setItem(STORAGE_KEYS.DEPOTS, JSON.stringify(INITIAL_DEPOTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STOCK)) {
      // Stock initial: 50 kg for each variant in each depot, EXCEPT 'pilihan' in Anyer is 0 kg
      const stocks: DepotStock[] = [];
      for (const d of INITIAL_DEPOTS) {
        for (const v of INITIAL_VARIANTS) {
          const qty = d.id === 'anyer' && v.id === 'pilihan' ? 0 : 50;
          stocks.push({
            depot_id: d.id,
            variant_id: v.id,
            stock_kg: qty,
            updated_at: '2026-10-19T07:30:00+07:00',
            updated_by: 'system',
          });
        }
      }
      localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stocks));
    }

    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      // 6 realistic Banten orders + 1 main benchmark order TF-261019-A7K2
      const initialOrders: Order[] = [
        // Benchmark order: Siti Aminah
        {
          id: 'ord-benchmark-1',
          code: 'TF-261019-A7K2',
          depot_id: 'cilegon',
          customer_name: 'Siti Aminah',
          customer_phone: '6281234567890',
          address_text: 'Jl. Merdeka No. 12, RT 02/RW 05, Cilegon',
          address_note: 'Pagar hijau dekat masjid Al-Ikhlas',
          lat: -6.02,
          lng: 106.052,
          distance_km: 0.6,
          delivery_date: '2026-10-20',
          delivery_slot: 'pagi',
          subtotal: 72000,
          delivery_fee: 0,
          total: 72000,
          payment_method: 'bayar_di_tempat',
          is_paid: false,
          status: 'diproses',
          created_at: '2026-10-19T08:30:00+07:00',
          updated_at: '2026-10-19T08:45:00+07:00',
          items: [
            {
              order_id: 'ord-benchmark-1',
              variant_id: 'reguler',
              variant_name: 'Telur reguler',
              qty_kg: 3,
              price_per_kg: 24000,
              line_total: 72000,
            },
          ],
          events: [
            {
              id: 'ev-1',
              order_id: 'ord-benchmark-1',
              from_status: null,
              to_status: 'baru',
              note: 'Pesanan dibuat pelanggan',
              created_at: '2026-10-19T08:30:00+07:00',
            },
            {
              id: 'ev-2',
              order_id: 'ord-benchmark-1',
              from_status: 'baru',
              to_status: 'diproses',
              note: 'Pesanan diproses depo',
              created_at: '2026-10-19T08:45:00+07:00',
            },
          ],
        },
        // Order 2: Baru in Cilegon
        {
          id: 'ord-clg-2',
          code: 'TF-261019-B4M1',
          depot_id: 'cilegon',
          customer_name: 'Ibu Ratna Juwita',
          customer_phone: '6281311223344',
          address_text: 'Perum Krakatau Steel Blok D-8, Cilegon',
          address_note: 'Rumah cat krem',
          lat: -6.025,
          lng: 106.048,
          distance_km: 1.2,
          delivery_date: '2026-10-19',
          delivery_slot: 'sore',
          subtotal: 108000,
          delivery_fee: 0,
          total: 108000,
          payment_method: 'bayar_di_tempat',
          is_paid: false,
          status: 'baru',
          created_at: '2026-10-19T08:40:00+07:00',
          updated_at: '2026-10-19T08:40:00+07:00',
          items: [
            {
              order_id: 'ord-clg-2',
              variant_id: 'pilihan',
              variant_name: 'Telur pilihan',
              qty_kg: 4,
              price_per_kg: 27000,
              line_total: 108000,
            },
          ],
          events: [
            {
              id: 'ev-clg-2',
              order_id: 'ord-clg-2',
              from_status: null,
              to_status: 'baru',
              note: 'Pesanan dibuat pelanggan',
              created_at: '2026-10-19T08:40:00+07:00',
            },
          ],
        },
        // Order 3: Dalam pengiriman in Cilegon
        {
          id: 'ord-clg-3',
          code: 'TF-261019-C8P9',
          depot_id: 'cilegon',
          customer_name: 'Bapak Hendra',
          customer_phone: '6287766554433',
          address_text: 'Jl. Pangeran Antasari No. 88, Jombang, Cilegon',
          address_note: 'Toko kelontong Berkah',
          lat: -6.012,
          lng: 106.061,
          distance_km: 0.8,
          delivery_date: '2026-10-19',
          delivery_slot: 'pagi',
          subtotal: 120000,
          delivery_fee: 0,
          total: 120000,
          payment_method: 'bayar_di_tempat',
          is_paid: false,
          status: 'dikirim',
          courier_name: 'Budi Santoso',
          created_at: '2026-10-19T07:15:00+07:00',
          updated_at: '2026-10-19T08:15:00+07:00',
          items: [
            {
              order_id: 'ord-clg-3',
              variant_id: 'reguler',
              variant_name: 'Telur reguler',
              qty_kg: 5,
              price_per_kg: 24000,
              line_total: 120000,
            },
          ],
          events: [
            {
              id: 'ev-clg-3a',
              order_id: 'ord-clg-3',
              from_status: null,
              to_status: 'baru',
              note: 'Pesanan dibuat pelanggan',
              created_at: '2026-10-19T07:15:00+07:00',
            },
            {
              id: 'ev-clg-3b',
              order_id: 'ord-clg-3',
              from_status: 'baru',
              to_status: 'diproses',
              note: 'Pesanan diproses depo',
              created_at: '2026-10-19T07:30:00+07:00',
            },
            {
              id: 'ev-clg-3c',
              order_id: 'ord-clg-3',
              from_status: 'diproses',
              to_status: 'dikirim',
              note: 'Dalam pengiriman oleh kurir Budi Santoso',
              created_at: '2026-10-19T08:15:00+07:00',
            },
          ],
        },
        // Order 4: Selesai in Cilegon (Siti Aminah repeat order test)
        {
          id: 'ord-clg-4',
          code: 'TF-261017-X2Y1',
          depot_id: 'cilegon',
          customer_name: 'Siti Aminah',
          customer_phone: '6281234567890',
          address_text: 'Jl. Merdeka No. 12, RT 02/RW 05, Cilegon',
          lat: -6.02,
          lng: 106.052,
          distance_km: 0.6,
          delivery_date: '2026-10-17',
          delivery_slot: 'pagi',
          subtotal: 96000,
          delivery_fee: 0,
          total: 96000,
          payment_method: 'bayar_di_tempat',
          is_paid: true,
          status: 'selesai',
          courier_name: 'Budi Santoso',
          created_at: '2026-10-17T08:00:00+07:00',
          updated_at: '2026-10-17T10:30:00+07:00',
          items: [
            {
              order_id: 'ord-clg-4',
              variant_id: 'reguler',
              variant_name: 'Telur reguler',
              qty_kg: 4,
              price_per_kg: 24000,
              line_total: 96000,
            },
          ],
          events: [
            {
              id: 'ev-clg-4',
              order_id: 'ord-clg-4',
              from_status: 'dikirim',
              to_status: 'selesai',
              note: 'Pesanan selesai dan pembayaran diterima',
              created_at: '2026-10-17T10:30:00+07:00',
            },
          ],
        },
        // Order 5: Selesai in Serang
        {
          id: 'ord-ser-1',
          code: 'TF-261018-S3K9',
          depot_id: 'serang',
          customer_name: 'Ibu Nuraeni',
          customer_phone: '6281988776655',
          address_text: 'Komplek Ciceri Indah Blok F-2, Serang',
          lat: -6.124,
          lng: 106.155,
          distance_km: 0.7,
          delivery_date: '2026-10-18',
          delivery_slot: 'pagi',
          subtotal: 81000,
          delivery_fee: 0,
          total: 81000,
          payment_method: 'bayar_di_tempat',
          is_paid: true,
          status: 'selesai',
          courier_name: 'Hadi',
          created_at: '2026-10-18T07:45:00+07:00',
          updated_at: '2026-10-18T11:00:00+07:00',
          items: [
            {
              order_id: 'ord-ser-1',
              variant_id: 'pilihan',
              variant_name: 'Telur pilihan',
              qty_kg: 3,
              price_per_kg: 27000,
              line_total: 81000,
            },
          ],
          events: [
            {
              id: 'ev-ser-1',
              order_id: 'ord-ser-1',
              from_status: 'dikirim',
              to_status: 'selesai',
              note: 'Pesanan selesai dan pembayaran diterima',
              created_at: '2026-10-18T11:00:00+07:00',
            },
          ],
        },
        // Order 6: Baru in Serang
        {
          id: 'ord-ser-2',
          code: 'TF-261019-S9Q2',
          depot_id: 'serang',
          customer_name: 'Bapak Mulyadi',
          customer_phone: '6285211993344',
          address_text: 'Jl. Ki Masjong No. 25, Kotabaru, Serang',
          lat: -6.115,
          lng: 106.145,
          distance_km: 0.8,
          delivery_date: '2026-10-19',
          delivery_slot: 'sore',
          subtotal: 66000,
          delivery_fee: 0,
          total: 66000,
          payment_method: 'bayar_di_tempat',
          is_paid: false,
          status: 'baru',
          created_at: '2026-10-19T08:50:00+07:00',
          updated_at: '2026-10-19T08:50:00+07:00',
          items: [
            {
              order_id: 'ord-ser-2',
              variant_id: 'ekonomis',
              variant_name: 'Telur ekonomis',
              qty_kg: 3,
              price_per_kg: 22000,
              line_total: 66000,
            },
          ],
          events: [
            {
              id: 'ev-ser-2',
              order_id: 'ord-ser-2',
              from_status: null,
              to_status: 'baru',
              note: 'Pesanan dibuat pelanggan',
              created_at: '2026-10-19T08:50:00+07:00',
            },
          ],
        },
        // Order 7: Dibatalkan in Anyer
        {
          id: 'ord-any-1',
          code: 'TF-261018-A1B2',
          depot_id: 'anyer',
          customer_name: 'Pak Sutarman',
          customer_phone: '6287899887711',
          address_text: 'Jl. Raya Bandulu No. 14, Anyer',
          lat: -6.07,
          lng: 105.93,
          distance_km: 1.1,
          delivery_date: '2026-10-18',
          delivery_slot: 'sore',
          subtotal: 72000,
          delivery_fee: 0,
          total: 72000,
          payment_method: 'bayar_di_tempat',
          is_paid: false,
          status: 'dibatalkan',
          cancel_reason: 'Stok tidak cukup',
          created_at: '2026-10-18T13:00:00+07:00',
          updated_at: '2026-10-18T13:30:00+07:00',
          items: [
            {
              order_id: 'ord-any-1',
              variant_id: 'reguler',
              variant_name: 'Telur reguler',
              qty_kg: 3,
              price_per_kg: 24000,
              line_total: 72000,
            },
          ],
          events: [
            {
              id: 'ev-any-1a',
              order_id: 'ord-any-1',
              from_status: null,
              to_status: 'baru',
              note: 'Pesanan dibuat pelanggan',
              created_at: '2026-10-18T13:00:00+07:00',
            },
            {
              id: 'ev-any-1b',
              order_id: 'ord-any-1',
              from_status: 'baru',
              to_status: 'dibatalkan',
              note: 'Dibatalkan: Stok tidak cukup',
              created_at: '2026-10-18T13:30:00+07:00',
            },
          ],
        },
      ];
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(initialOrders));
    }
  }

  // --- Variants ---
  async getVariants(): Promise<Variant[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.VARIANTS);
    if (!raw) return INITIAL_VARIANTS;
    return JSON.parse(raw);
  }

  async updateVariant(variantId: string, pricePerKg: number, isActive: boolean): Promise<void> {
    const variants = await this.getVariants();
    const index = variants.findIndex((v) => v.id === variantId);
    if (index === -1) throw new Error('ERR_VARIANT');

    // Rule AC-11.05: Minimal satu varian harus dijual
    const willActiveCount = variants.filter((v, idx) => (idx === index ? isActive : v.is_active)).length;
    if (willActiveCount === 0) {
      throw new Error('Minimal satu varian harus dijual');
    }

    variants[index].price_per_kg = pricePerKg;
    variants[index].is_active = isActive;
    localStorage.setItem(STORAGE_KEYS.VARIANTS, JSON.stringify(variants));
  }

  // --- Depots & Stock ---
  async getDepots(): Promise<Depot[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPOTS);
    if (!raw) return INITIAL_DEPOTS;
    return JSON.parse(raw);
  }

  async getDepotStock(depotId?: string): Promise<DepotStock[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK);
    const stocks: DepotStock[] = raw ? JSON.parse(raw) : [];
    if (depotId) {
      return stocks.filter((s) => s.depot_id === depotId);
    }
    return stocks;
  }

  async setStock(depotId: string, variantId: string, stockKg: number): Promise<void> {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK);
    const stocks: DepotStock[] = raw ? JSON.parse(raw) : [];
    const staff = await this.getCurrentStaff();

    const index = stocks.findIndex((s) => s.depot_id === depotId && s.variant_id === variantId);
    const nowIso = new Date().toISOString();
    if (index >= 0) {
      stocks[index].stock_kg = stockKg;
      stocks[index].updated_at = nowIso;
      stocks[index].updated_by = staff ? staff.full_name : 'Staff';
    } else {
      stocks.push({
        depot_id: depotId,
        variant_id: variantId,
        stock_kg: stockKg,
        updated_at: nowIso,
        updated_by: staff ? staff.full_name : 'Staff',
      });
    }

    localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stocks));
  }

  // --- Depot Eligibility Check (MRTM_DEPO) ---
  async checkDepots(
    lat: number,
    lng: number,
    items: { variant_id: string; qty_kg: number }[]
  ): Promise<DepotCheck[]> {
    const depots = await this.getDepots();
    const stocks = await this.getDepotStock();
    const variants = await this.getVariants();
    const variantMap = new Map(variants.map((v) => [v.id, v.name]));

    const results: DepotCheck[] = [];

    for (const depot of depots) {
      const dist = distanceKm(lat, lng, depot.lat, depot.lng);
      let eligible = true;
      let reason: string | null = null;

      // Priority order: closed > out_of_range > stock (TRM_DEPO_006)
      if (!depot.is_active) {
        eligible = false;
        reason = 'closed';
      } else if (dist > depot.radius_km) {
        eligible = false;
        reason = 'out_of_range';
      } else {
        // Check stock
        for (const item of items) {
          const matchStock = stocks.find((s) => s.depot_id === depot.id && s.variant_id === item.variant_id);
          const availableStock = matchStock ? matchStock.stock_kg : 0;
          if (availableStock < item.qty_kg) {
            eligible = false;
            const vName = variantMap.get(item.variant_id) || item.variant_id;
            reason = `stock:${vName}`;
            break;
          }
        }
      }

      results.push({
        id: depot.id,
        name: depot.name,
        address: depot.address,
        distance_km: dist,
        radius_km: depot.radius_km,
        eligible,
        reason,
      });
    }

    // Sort: eligible first, then by distance ascending
    results.sort((a, b) => {
      if (a.eligible && !b.eligible) return -1;
      if (!a.eligible && b.eligible) return 1;
      return a.distance_km - b.distance_km;
    });

    return results;
  }

  // --- Create Order (RPC create_order) ---
  async createOrder(p: CreateOrderParams): Promise<CreateOrderResult> {
    const name = (p.name || '').trim();
    if (name.length < 1 || name.length > 80) {
      throw new Error(name.length > 80 ? 'ERR_NAME_LONG' : 'ERR_NAME');
    }

    const phone = normalizePhone(p.phone);
    if (!phone) {
      throw new Error('ERR_PHONE');
    }

    const address = (p.address || '').trim();
    if (address.length < 5 || address.length > 300) {
      throw new Error('ERR_ADDRESS');
    }

    const slotVal = validateSlotSelection(p.delivery_date, p.delivery_slot);
    if (!slotVal.valid) {
      throw new Error('ERR_SLOT');
    }

    // Check limit BR-11: max 3 active orders (baru, diproses, dikirim)
    const allOrders = await this.getAllOrdersRaw();
    const activeCount = allOrders.filter(
      (o) => o.customer_phone === phone && ['baru', 'diproses', 'dikirim'].includes(o.status)
    ).length;
    if (activeCount >= 3) {
      throw new Error('ERR_LIMIT');
    }

    // Check depot exists and eligible
    const depots = await this.getDepots();
    const depot = depots.find((d) => d.id === p.depot_id && d.is_active);
    if (!depot) {
      throw new Error('ERR_DEPOT');
    }

    const dist = distanceKm(p.lat, p.lng, depot.lat, depot.lng);
    if (dist > depot.radius_km) {
      throw new Error('ERR_DEPOT');
    }

    if (!p.items || p.items.length === 0) {
      throw new Error('ERR_EMPTY');
    }

    // Validate quantities & active variants
    const variants = await this.getVariants();
    let totalKg = 0;
    let subtotal = 0;
    const orderItems = [];

    const stocks = await this.getDepotStock();

    for (const item of p.items) {
      const vCheck = validateVariantQty(item.qty_kg);
      if (!vCheck.valid) {
        throw new Error('ERR_QTY');
      }

      const variant = variants.find((v) => v.id === item.variant_id && v.is_active);
      if (!variant) {
        throw new Error('ERR_VARIANT');
      }

      // Check stock
      const stockRow = stocks.find((s) => s.depot_id === depot.id && s.variant_id === variant.id);
      if (!stockRow || stockRow.stock_kg < item.qty_kg) {
        throw new Error('ERR_STOCK');
      }

      const lineTotal = Math.round(item.qty_kg * variant.price_per_kg);
      totalKg += item.qty_kg;
      subtotal += lineTotal;

      orderItems.push({
        order_id: '', // filled below
        variant_id: variant.id,
        variant_name: variant.name,
        qty_kg: item.qty_kg,
        price_per_kg: variant.price_per_kg,
        line_total: lineTotal,
      });
    }

    const cartVal = validateCartTotal(totalKg);
    if (!cartVal.valid) {
      if (totalKg < 2) throw new Error('ERR_MIN_TOTAL');
      if (totalKg > 50) throw new Error('ERR_MAX_TOTAL');
    }

    // Deduct stock in depot_stock
    for (const item of p.items) {
      const stockRow = stocks.find((s) => s.depot_id === depot.id && s.variant_id === item.variant_id);
      if (stockRow) {
        stockRow.stock_kg -= item.qty_kg;
        stockRow.updated_at = new Date().toISOString();
      }
    }
    localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stocks));

    // Generate unique code TF-YYMMDD-XXXX
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const orderCode = `TF-${yy}${mm}${dd}-${rand}`;

    const newOrderId = 'ord-' + Date.now();
    for (const oi of orderItems) {
      oi.order_id = newOrderId;
    }

    const nowIso = now.toISOString();
    const newOrder: Order = {
      id: newOrderId,
      code: orderCode,
      depot_id: depot.id,
      customer_name: name,
      customer_phone: phone,
      address_text: address,
      address_note: p.note ? p.note.slice(0, 200) : null,
      lat: p.lat,
      lng: p.lng,
      distance_km: Math.round(dist * 10) / 10,
      delivery_date: p.delivery_date,
      delivery_slot: p.delivery_slot,
      subtotal,
      delivery_fee: 0,
      total: subtotal,
      payment_method: 'bayar_di_tempat',
      is_paid: false,
      status: 'baru',
      created_at: nowIso,
      updated_at: nowIso,
      items: orderItems,
      events: [
        {
          id: 'ev-' + Date.now(),
          order_id: newOrderId,
          from_status: null,
          to_status: 'baru',
          note: 'Pesanan dibuat pelanggan',
          created_at: nowIso,
        },
      ],
      depot_name: depot.name,
      depot_wa: depot.wa_number,
    };

    allOrders.unshift(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(allOrders));

    // Dispatch realtime event for local listeners
    window.dispatchEvent(new CustomEvent('new-order', { detail: newOrder }));

    return {
      code: orderCode,
      depot_name: depot.name,
      depot_wa: depot.wa_number,
      total: subtotal,
    };
  }

  // --- Order Tracking (US-05) ---
  async trackOrder(code: string, last4: string): Promise<Order | null> {
    const cleanCode = (code || '').trim().toUpperCase();
    const cleanLast4 = (last4 || '').trim();
    if (!cleanCode || cleanLast4.length !== 4) return null;

    const orders = await this.getAllOrdersRaw();
    const found = orders.find((o) => o.code.toUpperCase() === cleanCode);
    if (!found) return null;

    // Verify last 4 digits of phone
    if (!found.customer_phone.endsWith(cleanLast4)) {
      return null;
    }

    // Attach depot name & wa
    const depots = await this.getDepots();
    const depot = depots.find((d) => d.id === found.depot_id);
    return {
      ...found,
      depot_name: depot ? depot.name : undefined,
      depot_wa: depot ? depot.wa_number : undefined,
    };
  }

  async getOrder(code: string): Promise<Order | null> {
    const cleanCode = (code || '').trim().toUpperCase();
    const orders = await this.getAllOrdersRaw();
    const found = orders.find((o) => o.code.toUpperCase() === cleanCode);
    if (!found) return null;

    const depots = await this.getDepots();
    const depot = depots.find((d) => d.id === found.depot_id);
    return {
      ...found,
      depot_name: depot ? depot.name : undefined,
      depot_wa: depot ? depot.wa_number : undefined,
    };
  }

  // --- Staff Auth ---
  async loginStaff(email: string, password: string): Promise<Staff> {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const user = MOCK_STAFF_USERS[normalizedEmail];
    if (!user) {
      // Permission check AC-07.03 if unlisted user
      if (normalizedEmail.includes('@') && password) {
        throw new Error('Akun ini belum terdaftar sebagai petugas. Hubungi owner.');
      }
      throw new Error('Email atau kata sandi salah');
    }
    if (user.password !== password) {
      throw new Error('Email atau kata sandi salah');
    }

    localStorage.setItem(STORAGE_KEYS.CURRENT_STAFF, JSON.stringify(user.staff));
    return user.staff;
  }

  async getCurrentStaff(): Promise<Staff | null> {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_STAFF);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async logoutStaff(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STAFF);
  }

  // --- Orders Admin (US-08, US-09) ---
  private async getAllOrdersRaw(): Promise<Order[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return raw ? JSON.parse(raw) : [];
  }

  async getOrders(depotId?: string, status?: OrderStatus): Promise<Order[]> {
    let orders = await this.getAllOrdersRaw();
    const staff = await this.getCurrentStaff();

    // Permission check BR-15: admin_depo only sees their own depot
    if (staff && staff.role === 'admin_depo' && staff.depot_id) {
      orders = orders.filter((o) => o.depot_id === staff.depot_id);
    } else if (depotId) {
      orders = orders.filter((o) => o.depot_id === depotId);
    }

    if (status) {
      orders = orders.filter((o) => o.status === status);
    }

    // Attach depot info
    const depots = await this.getDepots();
    const depotMap = new Map(depots.map((d) => [d.id, d]));

    return orders.map((o) => ({
      ...o,
      depot_name: depotMap.get(o.depot_id)?.name,
      depot_wa: depotMap.get(o.depot_id)?.wa_number,
    }));
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    const orders = await this.getAllOrdersRaw();
    const found = orders.find((o) => o.id === orderId);
    if (!found) return null;

    // Check staff permissions
    const staff = await this.getCurrentStaff();
    if (staff && staff.role === 'admin_depo' && staff.depot_id && found.depot_id !== staff.depot_id) {
      // TRM_STATUS_009: Admin depo Serang buka order Cilegon -> null ("Pesanan tidak ditemukan")
      return null;
    }

    const depots = await this.getDepots();
    const depot = depots.find((d) => d.id === found.depot_id);
    return {
      ...found,
      depot_name: depot ? depot.name : undefined,
      depot_wa: depot ? depot.wa_number : undefined,
    };
  }

  async setOrderStatus(p: {
    order_id: string;
    expected_status: OrderStatus;
    to_status: OrderStatus;
    courier_name?: string;
    cancel_reason?: string;
    is_paid?: boolean;
  }): Promise<Order> {
    const orders = await this.getAllOrdersRaw();
    const index = orders.findIndex((o) => o.id === p.order_id);
    if (index === -1) throw new Error('ERR_STALE');

    const order = orders[index];
    if (order.status !== p.expected_status) {
      throw new Error('ERR_STALE');
    }

    const staff = await this.getCurrentStaff();
    const nowIso = new Date().toISOString();

    // Validate courier name if status moving to 'dikirim' (MRTM TRM_STATUS_002, 003, AC-08.04)
    if (p.to_status === 'dikirim') {
      const courier = (p.courier_name || '').trim();
      if (!courier) {
        throw new Error('Nama kurir wajib diisi');
      }
      if (courier.length > 50) {
        throw new Error('Nama kurir maksimal 50 karakter');
      }
      order.courier_name = courier;
    }

    // Cancel order logic (US-09)
    if (p.to_status === 'dibatalkan') {
      if (!['baru', 'diproses'].includes(order.status)) {
        throw new Error('Pesanan yang sudah diantar tidak bisa dibatalkan');
      }
      if (!p.cancel_reason) {
        throw new Error('Pilih alasan pembatalan');
      }
      order.cancel_reason = p.cancel_reason;

      // BR-08: Restore stock exactly once
      const stocks = await this.getDepotStock();
      if (order.items) {
        for (const item of order.items) {
          const sRow = stocks.find((s) => s.depot_id === order.depot_id && s.variant_id === item.variant_id);
          if (sRow) {
            sRow.stock_kg += item.qty_kg;
            sRow.updated_at = nowIso;
            sRow.updated_by = staff ? staff.full_name : 'System';
          }
        }
        localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stocks));
      }
    }

    if (p.to_status === 'selesai') {
      if (typeof p.is_paid === 'boolean') {
        order.is_paid = p.is_paid;
      }
    }

    const oldStatus = order.status;
    order.status = p.to_status;
    order.updated_at = nowIso;

    let eventNote = `Status diubah ke ${p.to_status}`;
    if (p.to_status === 'dikirim' && order.courier_name) {
      eventNote = `Dalam pengiriman oleh kurir ${order.courier_name}`;
    } else if (p.to_status === 'dibatalkan' && order.cancel_reason) {
      eventNote = `Dibatalkan: ${order.cancel_reason}`;
    } else if (p.to_status === 'selesai') {
      eventNote = 'Pesanan selesai';
      if (order.is_paid) eventNote += ' dan pembayaran diterima';
    }

    const event = {
      id: 'ev-' + Date.now(),
      order_id: order.id,
      from_status: oldStatus,
      to_status: p.to_status,
      note: eventNote,
      actor: staff ? staff.full_name : undefined,
      created_at: nowIso,
    };

    if (!order.events) order.events = [];
    order.events.push(event);

    orders[index] = order;
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    return order;
  }

  // --- Pilot Summary (US-12) ---
  async getPilotSummary(dateFrom: string, dateTo: string, depotId?: string): Promise<PilotSummary> {
    const orders = await this.getAllOrdersRaw();
    const depots = await this.getDepots();

    // Filter by period delivery_date
    const periodOrders = orders.filter((o) => {
      if (depotId && o.depot_id !== depotId) return false;
      return o.delivery_date >= dateFrom && o.delivery_date <= dateTo;
    });

    const selesaiOrders = periodOrders.filter((o) => o.status === 'selesai');
    const dibatalkanOrders = periodOrders.filter((o) => o.status === 'dibatalkan');

    const pesanan_selesai = selesaiOrders.length;
    let kg_terjual = 0;
    let pendapatan_diterima = 0;
    const customerOrderCount: Record<string, number> = {};

    for (const o of selesaiOrders) {
      if (o.items) {
        for (const item of o.items) {
          kg_terjual += item.qty_kg;
        }
      }
      if (o.is_paid) {
        pendapatan_diterima += o.total;
      }
      customerOrderCount[o.customer_phone] = (customerOrderCount[o.customer_phone] || 0) + 1;
    }

    const avg_kg_per_pesanan = pesanan_selesai > 0 ? Math.round((kg_terjual / pesanan_selesai) * 10) / 10 : null;
    const pelanggan = Object.keys(customerOrderCount).length;
    const repeatCustomers = Object.values(customerOrderCount).filter((c) => c >= 2).length;
    const pelanggan_pesan_ulang_pct = pelanggan > 0 ? Math.round((repeatCustomers / pelanggan) * 100) : 0;

    const totalOrdersCreated = periodOrders.length;
    const pembatalan_pct =
      totalOrdersCreated > 0 ? Math.round((dibatalkanOrders.length / totalOrdersCreated) * 100) : 0;

    const avg_price_per_kg = kg_terjual > 0 ? Math.round(pendapatan_diterima / kg_terjual) : 24000;

    // Per depot breakdown
    const depots_summary: Record<string, PilotDepotSummary> = {};
    for (const d of depots) {
      const dOrders = orders.filter(
        (o) => o.depot_id === d.id && o.delivery_date >= dateFrom && o.delivery_date <= dateTo
      );
      const dSelesai = dOrders.filter((o) => o.status === 'selesai');
      const dBatal = dOrders.filter((o) => o.status === 'dibatalkan');

      let dKg = 0;
      let dPendapatan = 0;
      const dCust: Record<string, number> = {};
      for (const o of dSelesai) {
        if (o.items) {
          for (const item of o.items) dKg += item.qty_kg;
        }
        if (o.is_paid) dPendapatan += o.total;
        dCust[o.customer_phone] = (dCust[o.customer_phone] || 0) + 1;
      }

      const dCustCount = Object.keys(dCust).length;
      const dRepeat = Object.values(dCust).filter((c) => c >= 2).length;

      depots_summary[d.id] = {
        depot_name: d.name,
        pesanan_selesai: dSelesai.length,
        kg_terjual: dKg,
        avg_kg_per_pesanan: dSelesai.length > 0 ? Math.round((dKg / dSelesai.length) * 10) / 10 : null,
        pendapatan_diterima: dPendapatan,
        pelanggan: dCustCount,
        pelanggan_pesan_ulang: dRepeat,
        pelanggan_pesan_ulang_pct: dCustCount > 0 ? Math.round((dRepeat / dCustCount) * 100) : 0,
        pembatalan_pct: dOrders.length > 0 ? Math.round((dBatal.length / dOrders.length) * 100) : 0,
      };
    }

    return {
      pesanan_selesai,
      kg_terjual,
      avg_kg_per_pesanan,
      pendapatan_diterima,
      pelanggan,
      pelanggan_pesan_ulang: repeatCustomers,
      pelanggan_pesan_ulang_pct,
      pembatalan_pct,
      avg_price_per_kg,
      depots_summary,
    };
  }

  // --- Realtime subscription ---
  subscribeToOrders(depotId: string | null, onNewOrder: (order: Order) => void): () => void {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<Order>;
      if (customEvent.detail) {
        if (!depotId || customEvent.detail.depot_id === depotId) {
          onNewOrder(customEvent.detail);
        }
      }
    };
    window.addEventListener('new-order', handler);
    return () => {
      window.removeEventListener('new-order', handler);
    };
  }
}
