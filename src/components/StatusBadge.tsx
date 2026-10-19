import React from 'react';
import { OrderStatus } from '../types.ts';

interface StatusBadgeProps {
  status: OrderStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'baru':
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yolk text-ink">
          Baru
        </span>
      );
    case 'diproses':
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-shell text-ink">
          Diproses
        </span>
      );
    case 'dikirim':
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand text-white">
          Dalam pengiriman
        </span>
      );
    case 'selesai':
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ok text-white">
          Selesai
        </span>
      );
    case 'dibatalkan':
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray text-ink">
          Dibatalkan
        </span>
      );
    default:
      return null;
  }
};
