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

