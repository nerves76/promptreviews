/**
 * API endpoint to fetch relevant tutorials from Help Docs site
 * Connects to the docs site to get real article data
 */

import { NextRequest, NextResponse } from 'next/server';

// Fallback tutorial data if docs site is unavailable
const fallbackTutorials = [
  {
    id: 'gs-1',
    title: 'Quick Start Guide',
    description: 'Get up and running with Prompt Reviews in 5 minutes',
    url: 'https://docs.promptreviews.app/getting-started',
    category: 'getting-started',
    tags: ['getting-started', 'setup', 'overview', 'dashboard'],
    plans: ['grower', 'builder', 'maven', 'enterprise']
  },
  {
    id: 'pp-1',
    title: 'Creating Your First Prompt Page',
    description: 'Step-by-step guide to creating effective prompt pages',
    url: 'https://docs.promptreviews.app/prompt-pages/create',
    category: 'prompt-pages',
    tags: ['prompt-pages', 'create', 'setup', 'new'],
    plans: ['grower', 'builder', 'maven', 'enterprise']
  },
  {
    id: 'c-1',
    title: 'Managing Your Contacts',
    description: 'Organize and manage your customer contacts effectively',
    url: 'https://docs.promptreviews.app/contacts/management',
    category: 'contacts',
    tags: ['contacts', 'manage', 'organize', 'customers'],
    plans: ['builder', 'maven', 'enterprise'] // Builder+ only
  },
  {
    id: 'ai-1',
    title: 'AI Search & LLM Visibility',
    description: 'Track how your business appears in AI search results from ChatGPT, Perplexity, and other LLMs',
    url: 'https://docs.promptreviews.app/ai-search',
    category: 'ai',
    tags: ['ai', 'search', 'llm', 'visibility', 'chatgpt', 'perplexity'],
    plans: ['builder', 'maven', 'enterprise']
  },
  {
    id: 'comp-1',
    title: 'Competitor Comparisons & Tables',
    description: 'Compare your business against competitors with feature tables and tracking',
    url: 'https://docs.promptreviews.app/comparisons',
    category: 'comparisons',
    tags: ['comparisons', 'competitors', 'tables', 'features', 'benchmark'],
    plans: ['builder', 'maven', 'enterprise']
  },
  {
    id: 'seo-1',
    title: 'Rank Tracking & PAA Questions',
    description: 'Monitor your keyword rankings and People Also Ask positions in search results',
    url: 'https://docs.promptreviews.app/rank-tracking',
    category: 'seo',
    tags: ['rank', 'tracking', 'seo', 'keywords', 'paa', 'serp', 'positions'],
    plans: ['builder', 'maven', 'enterprise']
  },
  {
    id: 'seo-2',
    title: 'Local Ranking Grids',
    description: 'Visualize your local search rankings across geographic areas with geo-grids',
    url: 'https://docs.promptreviews.app/local-ranking-grids',
    category: 'seo',
    tags: ['local', 'ranking', 'grid', 'geo', 'map', 'location'],
    plans: ['builder', 'maven', 'enterprise']
  },
  {
    id: 'social-1',
    title: 'Social Posting',
    description: 'Create and schedule posts for Google Business Profile and social channels',
    url: 'https://docs.promptreviews.app/social-posting',
    category: 'social',
    tags: ['social', 'posting', 'schedule', 'google', 'posts', 'publish'],
    plans: ['builder', 'maven', 'enterprise']
  },
  {
    id: 'research-1',
    title: 'Backlinks & Domain Research',
    description: 'Analyze backlink profiles, domain authority, and competitor link strategies',
    url: 'https://docs.promptreviews.app/backlinks',
    category: 'research',
    tags: ['backlinks', 'domains', 'research', 'seo', 'authority', 'link-building'],
    plans: ['builder', 'maven', 'enterprise']
  },
  {
    id: 'reviews-1',
    title: 'Testimonials & Review Widgets',
    description: 'Collect testimonials and display review widgets on your website',
    url: 'https://docs.promptreviews.app/testimonials',
    category: 'reviews',
    tags: ['testimonials', 'reviews', 'widgets', 'showcase', 'social-proof'],
    plans: ['grower', 'builder', 'maven', 'enterprise']
  },
  {
    id: 'int-1',
    title: 'Integrations',
    description: 'Connect Prompt Reviews with your existing tools and platforms',
    url: 'https://docs.promptreviews.app/integrations',
    category: 'integrations',
    tags: ['integrations', 'connect', 'api', 'zapier', 'tools'],
    plans: ['builder', 'maven', 'enterprise']
  },
  {
    id: 'reviews-2',
    title: 'Sentiment Analysis',
    description: 'Analyze review sentiment to identify trends and areas for improvement',
    url: 'https://docs.promptreviews.app/sentiment-analyzer',
    category: 'reviews',
    tags: ['sentiment', 'analysis', 'reviews', 'trends', 'positive', 'negative'],
    plans: ['builder', 'maven', 'enterprise']
  },
  {
    id: 'billing-1',
    title: 'Credits & Billing',
    description: 'Understand how credits work, view your balance, and manage billing',
    url: 'https://docs.promptreviews.app/credits',
    category: 'analytics',
    tags: ['credits', 'billing', 'usage', 'balance', 'purchase', 'transactions'],
    plans: ['grower', 'builder', 'maven', 'enterprise']
  }
];

/**
 * Fetch tutorials from the docs site API
 */
async function fetchDocsTutorials(context: string[], pathname: string) {
  try {
    const docsApiUrl = process.env.DOCS_API_URL || 'https://docs.promptreviews.app/api/search';
    
    const response = await fetch(docsApiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'PromptReviews-App/1.0'
      },
      body: JSON.stringify({ 
        keywords: context, 
        path: pathname,
        limit: 6,
        includeMetadata: true
      }),
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`Docs API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.tutorials || data.articles || [];
  } catch (error) {
    console.error('Error fetching from docs API:', error);
    return null;
  }
}

/**
 * Filter and rank tutorials based on context relevance
 */
function filterAndRankTutorials(tutorials: any[], context: string[]) {
  return tutorials
    .map(tutorial => {
      // Calculate relevance score
      const contextLower = context.map(c => c.toLowerCase());
      let score = 0;
      
      // Check tag matches
      if (tutorial.tags) {
        tutorial.tags.forEach((tag: string) => {
          if (contextLower.includes(tag.toLowerCase())) {
            score += 20;
          }
        });
      }
      
      // Check category match
      if (tutorial.category && contextLower.includes(tutorial.category.toLowerCase())) {
        score += 30;
      }
      
      // Check title/description matches
      const searchText = `${tutorial.title} ${tutorial.description}`.toLowerCase();
      context.forEach(keyword => {
        if (searchText.includes(keyword.toLowerCase())) {
          score += 10;
        }
      });
      
      // Give a baseline score to ensure we always show some tutorials
      const finalScore = score > 0 ? score : 10;
      return { ...tutorial, relevanceScore: Math.min(finalScore, 100) };
    })
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, 6);
}

/**
 * Filter tutorials based on user's plan
 */
function filterTutorialsByPlan(tutorials: any[], userPlan: string = 'grower') {
  return tutorials.filter(tutorial => {
    // If no plans specified, available to all
    if (!tutorial.plans || tutorial.plans.length === 0) return true;
    
    // Check if user's plan is in the tutorial's allowed plans
    return tutorial.plans.includes(userPlan);
  });
}

export async function POST(req: NextRequest) {
  try {
    const { context, pathname, userPlan } = await req.json();

    // Try to fetch from docs site first
    const docsTutorials = await fetchDocsTutorials(context, pathname);
    
    let tutorials;
    if (docsTutorials && docsTutorials.length > 0) {
      // Use real docs data
      tutorials = filterAndRankTutorials(docsTutorials, context);
    } else {
      // Fallback to mock data
      tutorials = filterAndRankTutorials(fallbackTutorials, context);
    }

    // Filter by user's plan
    tutorials = filterTutorialsByPlan(tutorials, userPlan);

    // If no relevant tutorials found, return general getting started that match plan
    if (tutorials.length === 0) {
      const gettingStartedTutorials = fallbackTutorials
        .filter(t => t.category === 'getting-started')
        .map(t => ({ ...t, relevanceScore: 50 }));
      tutorials = filterTutorialsByPlan(gettingStartedTutorials, userPlan);
    }

    return NextResponse.json({ 
      tutorials,
      total: tutorials.length,
      context,
      source: docsTutorials ? 'docs-api' : 'fallback'
    });

  } catch (error) {
    console.error('Error in tutorials API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch tutorials',
        tutorials: fallbackTutorials.slice(0, 3),
        source: 'error-fallback'
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for fetching all tutorials or categories
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const userPlan = searchParams.get('userPlan') || 'grower';

  if (category) {
    const categoryTutorials = fallbackTutorials.filter(t => t.category === category);
    const planFilteredTutorials = filterTutorialsByPlan(categoryTutorials, userPlan);
    return NextResponse.json({ tutorials: planFilteredTutorials });
  }

  // Return all categories from fallback tutorials
  const categories = [...new Set(fallbackTutorials.map(t => t.category))];
  return NextResponse.json({ categories, total: fallbackTutorials.length });
}