/**
 * Fetch articles from Supabase database
 */

import { createClient } from '@supabase/supabase-js';

export interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
  metadata: {
    description?: string;
    keywords?: string[];
    category?: string;
    category_label?: string;
    category_icon?: string;
    category_color?: string;
    key_features?: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
    how_it_works?: Array<{
      number: number;
      icon: string;
      title: string;
      description: string;
    }>;
    best_practices?: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  status: 'draft' | 'published' | 'archived';
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials for docs-site');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching article:', error);
    throw error;
  }

  return data as Article;
}

export async function getAllArticles(): Promise<Article[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }

  return data as Article[];
}
