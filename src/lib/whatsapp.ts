import { Order } from '../types.ts';
import { formatKg, formatTanggal } from './format.ts';

/**
 * Builds WhatsApp chat link for customer contacting depot (US-06)
 */
export function buildDepotWhatsAppLink(order: Order, depotName: string, depotWaNumber: string): string {
  // Format items lines
  const itemsText = (order.items || [])
    .map((item) => `${item.variant_name} ${formatKg(item.qty_kg)}`)
    .join('\n');

  // Format delivery time, e.g. "Besok, 20 Okt 2026, Pagi 08.00-12.00"
  const slotText = order.delivery_slot === 'pagi' ? 'Pagi 08.00-12.00' : 'Sore 13.00-17.00';
  const dateFormatted = formatTanggal(order.delivery_date, { shortMonth: true, includeDay: true });
  const antarText = `${dateFormatted}, ${slotText}`;

  const cleanDepotName = depotName.startsWith('Depo ') ? depotName : `Depo ${depotName}`;

  const message = `Halo ${cleanDepotName}, saya ${order.customer_name} dengan pesanan ${order.code}.
${itemsText}
Antar ${antarText}
Alamat: ${order.address_text}`;

  const cleanPhone = depotWaNumber.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds WhatsApp link when customer is out of range to ask Owner (US-03, AC-03.04)
 */
export function buildOwnerOutOfRangeWhatsAppLink(ownerPhone: string, lat: number, lng: number): string {
  const message = `Halo TelurFarm, saya mau pesan telur tapi lokasi saya belum terjangkau depo. Lokasi saya: https://maps.google.com/?q=${lat},${lng}`;
  const cleanPhone = ownerPhone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds WhatsApp chat link for admin contacting customer
 */
export function buildCustomerWhatsAppLink(customerPhone: string, customerName: string, orderCode: string): string {
  const message = `Halo ${customerName}, kami dari Depo TelurFarm mengenai pesanan ${orderCode}.`;
  const cleanPhone = customerPhone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
