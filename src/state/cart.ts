import { CartItem, Variant } from '../types.ts';

const CART_KEY = 'tf_cart';
const CHECKOUT_KEY = 'tf_checkout';
const LAST_ORDERS_KEY = 'tf_last_orders';

export interface CheckoutState {
  lat: number | null;
  lng: number | null;
  depot_id: string | null;
  depot_name: string | null;
  depot_address: string | null;
  distance_km: number | null;
}

export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item.variant_id && item.qty_kg > 0);
    }
    return [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('cart-updated'));
  } catch {
    // Ignore localStorage errors
  }
}

export function clearCart(): void {
  try {
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new Event('cart-updated'));
  } catch {
    // Ignore
  }
}

export function addToCart(
  variantId: string,
  qtyKg: number
): { success: boolean; error?: string; updatedCart?: CartItem[] } {
  const current = loadCart();
  const existingIndex = current.findIndex((item) => item.variant_id === variantId);

  let newQty = qtyKg;
  if (existingIndex >= 0) {
    newQty = current[existingIndex].qty_kg + qtyKg;
  }

  if (newQty > 30) {
    return { success: false, error: 'Berat maksimal 30 kg per varian' };
  }

  const updated = [...current];
  if (existingIndex >= 0) {
    updated[existingIndex] = { variant_id: variantId, qty_kg: newQty };
  } else {
    updated.push({ variant_id: variantId, qty_kg: newQty });
  }

  saveCart(updated);
  return { success: true, updatedCart: updated };
}

export function updateCartItemQty(
  variantId: string,
  newQty: number
): { success: boolean; error?: string; updatedCart?: CartItem[] } {
  if (newQty < 1) {
    return { success: false, error: 'Berat minimal 1 kg' };
  }
  if (newQty > 30) {
    return { success: false, error: 'Berat maksimal 30 kg per varian' };
  }
  if (Math.round(newQty * 10) % 5 !== 0) {
    return { success: false, error: 'Berat harus kelipatan 0,5 kg' };
  }

  const current = loadCart();
  const index = current.findIndex((item) => item.variant_id === variantId);
  if (index === -1) return { success: false, error: 'Item tidak ditemukan' };

  const updated = [...current];
  updated[index] = { variant_id: variantId, qty_kg: newQty };
  saveCart(updated);
  return { success: true, updatedCart: updated };
}

export function removeCartItem(variantId: string): CartItem[] {
  const current = loadCart();
  const updated = current.filter((item) => item.variant_id !== variantId);
  saveCart(updated);
  return updated;
}

export function syncCartWithActiveVariants(
  activeVariants: Variant[]
): { cart: CartItem[]; removedVariantNames: string[] } {
  const current = loadCart();
  const activeIds = new Set(activeVariants.filter((v) => v.is_active).map((v) => v.id));
  const removedNames: string[] = [];

  const updated = current.filter((item) => {
    if (!activeIds.has(item.variant_id)) {
      const v = activeVariants.find((varItem) => varItem.id === item.variant_id);
      removedNames.push(v ? v.name : item.variant_id);
      return false;
    }
    return true;
  });

  if (removedNames.length > 0) {
    saveCart(updated);
  }

  return { cart: updated, removedVariantNames: removedNames };
}

// Session Checkout helpers
export function loadCheckoutState(): CheckoutState {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_KEY);
    if (!raw) {
      return {
        lat: null,
        lng: null,
        depot_id: null,
        depot_name: null,
        depot_address: null,
        distance_km: null,
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      lat: null,
      lng: null,
      depot_id: null,
      depot_name: null,
      depot_address: null,
      distance_km: null,
    };
  }
}

export function saveCheckoutState(state: Partial<CheckoutState>): void {
  try {
    const current = loadCheckoutState();
    const updated = { ...current, ...state };
    sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}

export function clearCheckoutState(): void {
  try {
    sessionStorage.removeItem(CHECKOUT_KEY);
  } catch {
    // Ignore
  }
}

// Last Orders helpers (P6: max 5)
export function loadLastOrders(): string[] {
  try {
    const raw = localStorage.getItem(LAST_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLastOrder(code: string): void {
  try {
    const current = loadLastOrders().filter((c) => c !== code);
    const updated = [code, ...current].slice(0, 5);
    localStorage.setItem(LAST_ORDERS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}
