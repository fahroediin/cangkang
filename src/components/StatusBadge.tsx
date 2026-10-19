import React from 'react';
import { OrderStatus } from '../types.ts';

interface StatusBadgeProps {
  status: OrderStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'baru':
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3BF38] text-[#33251B]">
          Baru
        </span>
      );
    case 'diproses':
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E4CCAC] text-[#33251B]">
          Diproses
        </span>
      );
    case 'dikirim':
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#704529] text-white">
          Dalam pengiriman
        </span>
      );
    case 'selesai':
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2E6B3F] text-white">
          Selesai
        </span>
      );
    case 'dibatalkan':
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E7E2DC] text-[#33251B]">
          Dibatalkan
        </span>
      );
    default:
      return null;
  }
};
