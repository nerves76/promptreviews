/**
 * Server-side utilities for fetching documentation articles
 *
 * Used by both the main app (help modal) and docs site.
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
  metadata: {
    description?: string;
    keywords?: string[];
    canonical_url?: string;
    category?: string;
    tags?: string[];
    category_label?: string;
    category_icon?: string;
    category_color?: string;
    available_plans?: string[];
    seo_title?: string;
    seo_description?: string;
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
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleContext {
  route_pattern: string;
  keywords: string[];
  priority: number;
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      fetch: (url, options = {}) => {
        // Configure Next.js fetch cache for ISR
        return fetch(url, {
          ...options,
          next: { revalidate: 60, tags: ['articles'] }
        })
      }
    }
  });
}

// ============================================================================
// ARTICLE FETCHING
// ============================================================================

/**
 * Get a single article by slug
 */
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
      // Not found
      return null;
    }
    console.error('Error fetching article:', error);
    throw error;
  }

  return data as Article;
}

/**
 * Get all published articles (for sitemap, etc.)
 */
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

/**
 * Get articles by category
 */
export async function getArticlesByCategory(category: string): Promise<Article[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .eq('metadata->>category', category)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles by category:', error);
    throw error;
  }

  return data as Article[];
}

/**
 * Search articles by text query
 */
export async function searchArticles(query: string, limit = 10): Promise<Article[]> {
  const supabase = getSupabaseClient();

  // Use the search_articles function defined in the schema
  const { data, error } = await supabase
    .rpc('search_articles', {
      search_query: query,
      limit_count: limit
    });

  if (error) {
    console.error('Error searching articles:', error);
    throw error;
  }

  return data as Article[];
}

/**
 * Get contextual articles for a route
 */
export async function getContextualArticles(route: string, limit = 6): Promise<Article[]> {
  const supabase = getSupabaseClient();

  // Use the get_contextual_articles function defined in the schema
  const { data, error } = await supabase
    .rpc('get_contextual_articles', {
      route,
      limit_count: limit
    });

  if (error) {
    console.error('Error fetching contextual articles:', error);
    throw error;
  }

  return data as Article[];
}

// ============================================================================
// DRAFT PREVIEW (for admin)
// ============================================================================

/**
 * Get article by slug including drafts (for preview mode)
 * Requires service role key
 */
export async function getArticleBySlugWithDrafts(slug: string): Promise<Article | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching article with drafts:', error);
    throw error;
  }

  return data as Article;
}

// ============================================================================
// CACHE HELPERS
// ============================================================================

/**
 * Cache configuration for Next.js ISR
 */
export const ARTICLE_REVALIDATE_TIME = 300; // 5 minutes

/**
 * Get cache tags for an article (for Next.js revalidateTag)
 */
export function getArticleCacheTags(article: Article): string[] {
  return [
    'articles',
    `article:${article.slug}`,
    `category:${article.metadata.category}`,
  ];
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Filter articles by user's plan
 */
export function filterArticlesByPlan(articles: Article[], userPlan?: string): Article[] {
  if (!userPlan) return articles;

  return articles.filter(article => {
    const availablePlans = article.metadata.available_plans || [];
    if (availablePlans.length === 0) return true; // Available to all
    return availablePlans.includes(userPlan);
  });
}

/**
 * Get article excerpt from content
 */
export function getArticleExcerpt(article: Article, maxLength = 200): string {
  // Remove markdown formatting
  const plainText = article.content
    .replace(/^#+ .+$/gm, '') // Remove headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .trim();

  if (plainText.length <= maxLength) return plainText;

  return plainText.substring(0, maxLength).trim() + '...';
}
