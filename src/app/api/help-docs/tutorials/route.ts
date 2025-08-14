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
      console.log('Using fallback tutorial data');
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