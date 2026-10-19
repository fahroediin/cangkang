import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Package, Layers, Tag, BarChart2, LogOut } from 'lucide-react';
import { Staff } from '../../types.ts';
import { dataService } from '../../services/index.ts';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerOnlyNotice, setOwnerOnlyNotice] = useState<string | null>(null);

  useEffect(() => {
    dataService.getCurrentStaff().then((current) => {
      if (!current) {
        navigate('/admin/masuk');
        return;
      }
      setStaff(current);
      setLoading(false);

      // Check owner-only paths AC-07.04
      const path = location.pathname;
      if (current.role !== 'owner' && (path.includes('/harga') || path.includes('/rekap'))) {
        setOwnerOnlyNotice('Halaman ini khusus owner');
        navigate('/admin');
      }
    });
  }, [location.pathname, navigate]);

  const handleLogout = async () => {
    await dataService.logoutStaff();
    navigate('/admin/masuk');
  };

  if (loading || !staff) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center text-sm text-muted">
        Memuat data petugas...
      </div>
    );
  }

  const isOwner = staff.role === 'owner';

  const navItems = [
    { label: 'Pesanan', path: '/admin', icon: Package },
    { label: 'Stok', path: '/admin/stok', icon: Layers },
    ...(isOwner
      ? [
          { label: 'Harga', path: '/admin/harga', icon: Tag },
          { label: 'Rekap', path: '/admin/rekap', icon: BarChart2 },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col md:flex-row">
      {/* Desktop Sidebar (220px per Section 6.3) */}
      <aside className="hidden md:flex flex-col w-[220px] bg-surface border-r border-line p-4 min-h-screen justify-between shrink-0">
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-[20px] font-bold text-brand tracking-tight block">
              TelurFarm
            </span>
            <span className="text-xs text-muted">Panel petugas</span>
          </div>

          <div className="p-3 bg-cream border border-line rounded-lg flex flex-col">
            <span className="text-sm font-semibold text-ink">{staff.full_name}</span>
            <span className="text-xs text-brand capitalize font-medium">
              {staff.role === 'owner' ? 'Owner' : `Admin Depo ${staff.depot_id || ''}`}
            </span>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path);

              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand text-white'
                      : 'text-ink hover:bg-cream'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-danger rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen pb-16 md:pb-8">
        {/* Mobile Header (56px) */}
        <header className="md:hidden sticky top-0 z-30 bg-surface border-b border-line px-4 h-14 flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-brand">TelurFarm</span>
            <span className="text-xs text-muted ml-2">
              {staff.role === 'owner' ? 'Owner' : `Depo ${staff.depot_id || ''}`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-semibold text-muted hover:text-danger px-2 py-1 border border-edge rounded"
          >
            Keluar
          </button>
        </header>

        {/* Owner-only notification banner if redirected */}
        {ownerOnlyNotice && (
          <div className="p-3 bg-cream border-b border-danger text-sm text-danger font-medium text-center">
            {ownerOnlyNotice}
          </div>
        )}

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6">
          <Outlet context={{ staff }} />
        </main>

        {/* Mobile Bottom Navigation (tabs per spec 6.3) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-line flex items-center justify-around h-14 px-2">
          {navItems.map((item) => {
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);

            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-semibold ${
                  isActive ? 'text-brand' : 'text-muted'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
