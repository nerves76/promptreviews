/**
 * Navigation helpers for documentation experience.
 */

import { createClient } from '@supabase/supabase-js';

export interface NavigationNode {
  id: string;
  title: string;
  href: string | null;
  icon?: string | null;
  children?: NavigationNode[];
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials for navigation fetch');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getNavigationTree(): Promise<NavigationNode[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('get_navigation_tree');

  if (error) {
    console.error('Error loading navigation tree:', error);
    throw error;
  }

  if (!data) {
    return [];
  }

  return data as NavigationNode[];
}

