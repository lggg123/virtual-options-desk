import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables');
}

export const supabase = createBrowserClient<Database>(
  supabaseUrl, 
  supabaseAnonKey
);

// Export types for use in components
export type { Database } from '../types';