import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Customer Pages
import { Catalog } from './pages/customer/Catalog.tsx';
import { Cart } from './pages/customer/Cart.tsx';
import { LocationPage } from './pages/customer/Location.tsx';
import { Checkout } from './pages/customer/Checkout.tsx';
import { OrderStatusPage } from './pages/customer/OrderStatus.tsx';
import { Track } from './pages/customer/Track.tsx';

// Admin Pages
import { AdminLogin } from './pages/admin/Login.tsx';
import { AdminLayout } from './pages/admin/AdminLayout.tsx';
import { AdminOrders } from './pages/admin/Orders.tsx';
import { AdminOrderDetail } from './pages/admin/OrderDetail.tsx';
import { AdminStock } from './pages/admin/Stock.tsx';
import { AdminPrices } from './pages/admin/Prices.tsx';
import { AdminSummary } from './pages/admin/Summary.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Routes (P1 - P6) */}
        <Route path="/" element={<Catalog />} />
        <Route path="/keranjang" element={<Cart />} />
        <Route path="/lokasi" element={<LocationPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/pesanan/:code" element={<OrderStatusPage />} />
        <Route path="/lacak" element={<Track />} />

        {/* Admin Login (A1) */}
        <Route path="/admin/masuk" element={<AdminLogin />} />

        {/* Admin Protected Layout (A2 - A6) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOrders />} />
          <Route path="pesanan/:id" element={<AdminOrderDetail />} />
          <Route path="stok" element={<AdminStock />} />
          <Route path="harga" element={<AdminPrices />} />
          <Route path="rekap" element={<AdminSummary />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
