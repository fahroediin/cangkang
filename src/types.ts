export interface Variant {
  id: string;
  name: string;
  description: string;
  price_per_kg: number;
  is_active: boolean;
  sort_order: number;
}

export interface Depot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  radius_km: number;
  wa_number: string;
  is_active: boolean;
  coords_verified: boolean;
}

export interface DepotStock {
  depot_id: string;
  variant_id: string;
  stock_kg: number;
  updated_at: string;
  updated_by?: string | null;
}

export interface DepotCheck {
  id: string;
  name: string;
  address: string;
  distance_km: number;
  radius_km: number;
  eligible: boolean;
  reason: 'closed' | 'out_of_range' | string | null;
}

export interface CartItem {
  variant_id: string;
  qty_kg: number;
}

export type OrderStatus = 'baru' | 'diproses' | 'dikirim' | 'selesai' | 'dibatalkan';

export interface OrderItem {
  order_id: string;
  variant_id: string;
  variant_name: string;
  qty_kg: number;
  price_per_kg: number;
  line_total: number;
}

export interface OrderEvent {
  id: number | string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  note?: string | null;
  actor?: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  code: string;
  depot_id: string;
  customer_name: string;
  customer_phone: string;
  address_text: string;
  address_note?: string | null;
  lat: number;
  lng: number;
  distance_km: number;
  delivery_date: string; // YYYY-MM-DD
  delivery_slot: 'pagi' | 'sore';
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  is_paid: boolean;
  status: OrderStatus;
  courier_name?: string | null;
  cancel_reason?: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  events?: OrderEvent[];
  depot_name?: string;
  depot_wa?: string;
}

export interface Staff {
  user_id: string;
  full_name: string;
  role: 'owner' | 'admin_depo';
  depot_id: string | null;
}

export interface CreateOrderParams {
  name: string;
  phone: string;
  address: string;
  note?: string;
  depot_id: string;
  delivery_date: string;
  delivery_slot: 'pagi' | 'sore';
  lat: number;
  lng: number;
  items: { variant_id: string; qty_kg: number }[];
}

export interface CreateOrderResult {
  code: string;
  depot_name: string;
  depot_wa: string;
  total: number;
}

export interface PilotDepotSummary {
  depot_name: string;
  pesanan_selesai: number;
  kg_terjual: number;
  avg_kg_per_pesanan: number | null;
  pendapatan_diterima: number;
  pelanggan: number;
  pelanggan_pesan_ulang: number;
  pelanggan_pesan_ulang_pct: number;
  pembatalan_pct: number;
}

export interface PilotSummary {
  pesanan_selesai: number;
  kg_terjual: number;
  avg_kg_per_pesanan: number | null;
  pendapatan_diterima: number;
  pelanggan: number;
  pelanggan_pesan_ulang: number;
  pelanggan_pesan_ulang_pct: number;
  pembatalan_pct: number;
  avg_price_per_kg: number;
  depots_summary: Record<string, PilotDepotSummary>;
}
