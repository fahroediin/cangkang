import { config } from '../config.ts';
import type { DataService } from './DataService.ts';
import { MockDataService } from './mockService.ts';
import { SupabaseDataService } from './supabaseService.ts';

let serviceInstance: DataService;

if (config.dataMode === 'supabase' && config.supabaseUrl && config.supabaseAnonKey) {
  serviceInstance = new SupabaseDataService();
} else {
  serviceInstance = new MockDataService();
}

export const dataService = serviceInstance;
export type { DataService };
