import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/index.ts';
import { config } from '../../config.ts';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent, directEmail?: string, directPass?: string) => {
    if (e) e.preventDefault();
    setError(null);

    const loginEmail = directEmail || email;
    const loginPass = directPass || password;

    if (!loginEmail || !loginPass) {
      setError('Email dan kata sandi wajib diisi');
      return;
    }

    setLoading(true);
    try {
      await dataService.loginStaff(loginEmail, loginPass);
      navigate('/admin');
    } catch (err: any) {
      setError(err?.message || 'Email atau kata sandi salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center px-4 py-8">
      <div className="max-w-[400px] w-full mx-auto flex flex-col gap-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand">TelurFarm</h1>
          <p className="text-sm text-muted mt-1">Masuk petugas</p>
        </div>

        <div className="bg-surface border border-line rounded-lg p-6 flex flex-col gap-4">
          <form onSubmit={(e) => handleLogin(e)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="staff_email" className="text-sm font-semibold text-ink">
                Email
              </label>
              <input
                id="staff_email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@telurfarm.com"
                className="h-11 px-3 rounded-lg border border-edge text-sm text-ink bg-white focus:outline-none focus:border-2 focus:border-brand"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="staff_password" className="text-sm font-semibold text-ink">
                Kata sandi
              </label>
              <input
                id="staff_password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 px-3 rounded-lg border border-edge text-sm text-ink bg-white focus:outline-none focus:border-2 focus:border-brand"
              />
            </div>

            {error && <div className="text-sm text-danger font-medium">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>

          {/* Quick Mock Login buttons requested in Phase 1 */}
          {config.dataMode === 'mock' && (
            <div className="border-t border-line pt-4 flex flex-col gap-2">
              <span className="text-xs text-muted font-medium text-center">
                Pilih peran cepat (Mode Mock):
              </span>
              <button
                type="button"
                onClick={() => handleLogin(undefined, 'owner@telurfarm.com', 'owner123')}
                className="h-11 px-3 rounded-lg border border-edge bg-cream hover:bg-soft text-xs font-semibold text-ink transition-colors"
              >
                Masuk sebagai Owner
              </button>
              <button
                type="button"
                onClick={() =>
                  handleLogin(undefined, 'admin.cilegon@telurfarm.com', 'cilegon123')
                }
                className="h-11 px-3 rounded-lg border border-edge bg-cream hover:bg-soft text-xs font-semibold text-ink transition-colors"
              >
                Masuk sebagai Admin Depo Cilegon
              </button>
              <button
                type="button"
                onClick={() =>
                  handleLogin(undefined, 'admin.serang@telurfarm.com', 'serang123')
                }
                className="h-11 px-3 rounded-lg border border-edge bg-cream hover:bg-soft text-xs font-semibold text-ink transition-colors"
              >
                Masuk sebagai Admin Depo Serang
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
