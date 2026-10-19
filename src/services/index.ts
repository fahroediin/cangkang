import { config } from '../config.ts';
import type { DataService } from './DataService.ts';
import { MockDataService } from './mockService.ts';
import { SupabaseDataService } from './supabaseService.ts';

function createService(): DataService {
  if (config.dataMode !== 'supabase') return new MockDataService();

  // Jangan diam-diam jatuh ke mock: pesanan pelanggan akan tersimpan di browser dan tidak pernah sampai ke depo.
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('VITE_DATA_MODE=supabase tetapi VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY kosong.');
  }
  return new SupabaseDataService();
}

export const dataService = createService();
export type { DataService };
