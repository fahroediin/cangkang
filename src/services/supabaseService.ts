import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
} from '../types.ts';
import { DataService } from './DataService.ts';
import { config } from '../config.ts';

export class SupabaseDataService implements DataService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(config.supabaseUrl, config.supabaseAnonKey);
  }

  async getVariants(): Promise<Variant[]> {
    const { data, error } = await this.client
      .from('variants')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async updateVariant(variantId: string, pricePerKg: number, isActive: boolean): Promise<void> {
    const { error } = await this.client
      .from('variants')
      .update({ price_per_kg: pricePerKg, is_active: isActive })
      .eq('id', variantId);
    if (error) throw new Error(error.message);
  }

  async getDepots(): Promise<Depot[]> {
    const { data, error } = await this.client
      .from('depots')
      .select('*')
      .eq('is_active', true);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getDepotStock(depotId?: string): Promise<DepotStock[]> {
    let query = this.client.from('depot_stock').select('*');
    if (depotId) {
      query = query.eq('depot_id', depotId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async setStock(depotId: string, variantId: string, stockKg: number): Promise<void> {
    const { error } = await this.client.rpc('set_stock', {
      p_depot_id: depotId,
      p_variant_id: variantId,
      p_stock_kg: stockKg,
    });
    if (error) throw new Error(error.message);
  }

  async checkDepots(
    lat: number,
    lng: number,
    items: { variant_id: string; qty_kg: number }[]
  ): Promise<DepotCheck[]> {
    const { data, error } = await this.client.rpc('check_depots', {
      p_lat: lat,
      p_lng: lng,
      p_items: items,
    });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const { data, error } = await this.client.rpc('create_order', {
      p: {
        name: params.name,
        phone: params.phone,
        address: params.address,
        note: params.note || '',
        depot_id: params.depot_id,
        delivery_date: params.delivery_date,
        delivery_slot: params.delivery_slot,
        lat: params.lat,
        lng: params.lng,
        items: params.items,
      },
    });
    if (error) {
      throw new Error(error.message);
    }
    return data as CreateOrderResult;
  }

  async trackOrder(code: string, last4: string): Promise<Order | null> {
    const { data, error } = await this.client.rpc('track_order', {
      p_code: code.trim().toUpperCase(),
      p_last4: last4.trim(),
    });
    if (error || !data) return null;
    return data as Order;
  }


  async loginStaff(email: string, password: string): Promise<Staff> {
    const { data: authData, error: authError } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    if (authError || !authData.user) {
      throw new Error('Email atau kata sandi salah');
    }

    const { data: staffData, error: staffError } = await this.client
      .from('staff')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (staffError || !staffData) {
      await this.client.auth.signOut();
      throw new Error('Akun ini belum terdaftar sebagai petugas. Hubungi owner.');
    }

    return staffData as Staff;
  }

  async getCurrentStaff(): Promise<Staff | null> {
    const { data: sessionData } = await this.client.auth.getSession();
    if (!sessionData?.session?.user) return null;

    const { data: staffData } = await this.client
      .from('staff')
      .select('*')
      .eq('user_id', sessionData.session.user.id)
      .single();

    return (staffData as Staff) || null;
  }

  async logoutStaff(): Promise<void> {
    await this.client.auth.signOut();
  }

  async getOrders(depotId?: string, status?: OrderStatus): Promise<Order[]> {
    let query = this.client
      .from('orders')
      .select('*, items:order_items(*), events:order_events(*), depots:depot_id(name, wa_number)')
      .order('created_at', { ascending: true });

    if (depotId) {
      query = query.eq('depot_id', depotId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data || []).map((o: any) => ({
      ...o,
      depot_name: o.depots?.name,
      depot_wa: o.depots?.wa_number,
    }));
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await this.client
      .from('orders')
      .select('*, items:order_items(*), events:order_events(*), depots:depot_id(name, wa_number)')
      .eq('id', orderId)
      .single();

    if (error || !data) return null;

    return {
      ...data,
      depot_name: (data as any).depots?.name,
      depot_wa: (data as any).depots?.wa_number,
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
    const { data, error } = await this.client.rpc('set_order_status', {
      p_order_id: p.order_id,
      p_expected_status: p.expected_status,
      p_to_status: p.to_status,
      p_courier_name: p.courier_name || null,
      p_cancel_reason: p.cancel_reason || null,
      p_is_paid: p.is_paid ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as Order;
  }

  async getPilotSummary(dateFrom: string, dateTo: string, depotId?: string): Promise<PilotSummary> {
    const { data, error } = await this.client.rpc('pilot_summary', {
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_depot_id: depotId || null,
    });
    if (error) throw new Error(error.message);
    return data as PilotSummary;
  }

  subscribeToOrders(depotId: string | null, onNewOrder: (order: Order) => void): () => void {
    const channel = this.client
      .channel('public:orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          ...(depotId ? { filter: `depot_id=eq.${depotId}` } : {}),
        },
        async (payload) => {
          if (payload.new && payload.new.id) {
            const order = await this.getOrderById(payload.new.id);
            if (order) onNewOrder(order);
          }
        }
      )
      .subscribe();

    return () => {
      this.client.removeChannel(channel);
    };
  }
}
