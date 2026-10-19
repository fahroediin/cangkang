export const config = {
  dataMode: (import.meta.env.VITE_DATA_MODE as 'mock' | 'supabase') || 'mock',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  ownerWa: import.meta.env.VITE_OWNER_WA || '6281234567890',
};
