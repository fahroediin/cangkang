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

export interface DataService {
  // Catalog & Customer
  getVariants(): Promise<Variant[]>;
  checkDepots(lat: number, lng: number, items: { variant_id: string; qty_kg: number }[]): Promise<DepotCheck[]>;
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  trackOrder(code: string, last4: string): Promise<Order | null>;
  getOrder(code: string): Promise<Order | null>;

  // Staff & Auth
  loginStaff(email: string, password: string): Promise<Staff>;
  getCurrentStaff(): Promise<Staff | null>;
  logoutStaff(): Promise<void>;

  // Orders Admin
  getOrders(depotId?: string, status?: OrderStatus): Promise<Order[]>;
  getOrderById(orderId: string): Promise<Order | null>;
  setOrderStatus(params: {
    order_id: string;
    expected_status: OrderStatus;
    to_status: OrderStatus;
    courier_name?: string;
    cancel_reason?: string;
    is_paid?: boolean;
  }): Promise<Order>;

  // Depot & Stock Admin
  getDepots(): Promise<Depot[]>;
  getDepotStock(depotId?: string): Promise<DepotStock[]>;
  setStock(depotId: string, variantId: string, stockKg: number): Promise<void>;

  // Owner Variant Management
  updateVariant(variantId: string, pricePerKg: number, isActive: boolean): Promise<void>;

  // Owner Pilot Summary
  getPilotSummary(dateFrom: string, dateTo: string, depotId?: string): Promise<PilotSummary>;

  // Realtime subscription
  subscribeToOrders(depotId: string | null, onNewOrder: (order: Order) => void): () => void;
}
