import { createClient } from '@supabase/supabase-js';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  plans: string[];
  order_index: number;
  article_id: string | null;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials for FAQs fetch');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export interface FetchFaqsOptions {
  plan?: string;
  category?: string;
  search?: string;
  limit?: number;
  contextKeywords?: string[];
  route?: string;
}

export interface FAQWithScore extends FAQ {
  relevanceScore: number;
}

export async function getFaqs(options: FetchFaqsOptions = {}): Promise<FAQWithScore[]> {
  const supabase = getSupabaseClient();
  const { plan, category, search, limit = 25 } = options;

  let query = supabase
    .from('faqs')
    .select('id, question, answer, category, plans, order_index, article_id')
    .order('category')
    .order('order_index');

  if (plan) {
    query = query.contains('plans', [plan]);
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.or(
      `question.ilike.%${search}%,answer.ilike.%${search}%`
    );
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching FAQs:', error);
    throw error;
  }

  const faqs = data || [];

  return faqs.map((faq) => ({
    ...faq,
    relevanceScore: calculateRelevanceScore(faq, options.contextKeywords ?? [], search ?? ''),
  }));
}

/**
 * Get contextual FAQs for a specific route
 * Uses the faq_contexts table to fetch FAQs mapped to specific pages
 */
export async function getContextualFaqs(route: string, limit: number = 3, userPlan: string = 'grower'): Promise<FAQWithScore[]> {
  const supabase = getSupabaseClient();

  try {
    // Call the database function for contextual FAQs
    const { data, error } = await supabase.rpc('get_contextual_faqs', {
      route,
      limit_count: limit,
      user_plan: userPlan,
    });

    if (error) {
      console.error('Error fetching contextual FAQs:', error);
      return [];
    }

    // Transform the response to match FAQWithScore interface
    return (data || []).map((faq: any) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      plans: faq.plans,
      order_index: faq.order_index,
      article_id: faq.article_id,
      relevanceScore: faq.relevance_score || 50,
    }));
  } catch (error) {
    console.error('Error in getContextualFaqs:', error);
    return [];
  }
}

function calculateRelevanceScore(faq: FAQ, keywords: string[], search: string): number {
  let score = 0;
  const lowerKeywords = keywords.map((item) => item.toLowerCase());

  if (lowerKeywords.length > 0) {
    for (const keyword of lowerKeywords) {
      if (faq.category.toLowerCase() === keyword) {
        score += 30;
      }

      if (faq.question.toLowerCase().includes(keyword) || faq.answer.toLowerCase().includes(keyword)) {
        score += 15;
      }
    }
  }

  if (search) {
    const lowerSearch = search.toLowerCase();
    if (faq.question.toLowerCase().includes(lowerSearch)) {
      score += 25;
    } else if (faq.answer.toLowerCase().includes(lowerSearch)) {
      score += 10;
    }
  }

  return Math.min(score, 100);
}

