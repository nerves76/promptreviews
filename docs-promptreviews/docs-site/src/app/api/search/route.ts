/**
 * Search API endpoint for docs site
 * Provides article search functionality for the main app's help system
 */

import { NextRequest, NextResponse } from 'next/server';

// Article metadata for search functionality
const articlesMetadata = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Quick start guide for new users',
    url: '/getting-started',
    category: 'getting-started',
    tags: ['getting-started', 'setup', 'overview', 'dashboard'],
    priority: 'high'
  },
  {
    id: 'prompt-pages',
    title: 'Prompt Pages',
    description: 'Create and customize prompt pages for review collection',
    url: '/prompt-pages',
    category: 'prompt-pages',
    tags: ['prompt-pages', 'create', 'customize', 'edit'],
    priority: 'high'
  },
  {
    id: 'prompt-page-types',
    title: 'Prompt Page Types',
    description: 'Complete guide to Service, Product, Photo, Video, and Universal prompt page types',
    url: '/prompt-pages/types',
    category: 'prompt-pages',
    tags: ['prompt-page-types', 'service', 'product', 'photo', 'video', 'universal', 'types'],
    priority: 'high'
  },
  {
    id: 'prompt-page-features',
    title: 'Prompt Page Features',
    description: 'Explore all features: Emoji Sentiment Flow, AI-powered content, QR codes, and more',
    url: '/prompt-pages/features',
    category: 'prompt-pages',
    tags: ['prompt-page-features', 'emoji-sentiment-flow', 'ai-powered', 'qr-codes', 'features'],
    priority: 'high'
  },
  {
    id: 'service-prompt-pages',
    title: 'Service Prompt Pages',
    description: 'Complete guide to creating effective Service prompt pages for restaurants, salons, and service businesses',
    url: '/prompt-pages/types/service',
    category: 'prompt-pages',
    tags: ['service-prompt-pages', 'restaurants', 'salons', 'professional-services', 'service-business'],
    priority: 'medium'
  },
  {
    id: 'ai-reviews',
    title: 'AI-Powered Reviews',
    description: 'AI-powered review generation and optimization',
    url: '/ai-reviews',
    category: 'ai',
    tags: ['ai', 'ai-powered', 'reviews', 'generation', 'optimization'],
    priority: 'medium'
  },
  {
    id: 'contacts',
    title: 'Contact Management',
    description: 'Import, organize, and manage your customer contacts',
    url: '/contacts',
    category: 'contacts',
    tags: ['contacts', 'import', 'manage', 'csv', 'upload'],
    priority: 'high'
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting Guide',
    description: 'Common issues and solutions',
    url: '/troubleshooting',
    category: 'support',
    tags: ['troubleshooting', 'help', 'issues', 'support'],
    priority: 'medium'
  },
  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    description: 'Answers to common questions',
    url: '/faq',
    category: 'support',
    tags: ['faq', 'questions', 'help', 'support'],
    priority: 'medium'
  }
];

/**
 * Search articles based on keywords and context
 */
function searchArticles(keywords: string[], path?: string, limit: number = 6) {
  const keywordLower = keywords.map(k => k.toLowerCase());
  
  return articlesMetadata
    .map(article => {
      let score = 0;
      
      // Check tag matches
      article.tags.forEach(tag => {
        if (keywordLower.includes(tag.toLowerCase())) {
          score += 20;
        }
      });
      
      // Check category match
      if (keywordLower.includes(article.category.toLowerCase())) {
        score += 30;
      }
      
      // Check title/description matches
      const searchText = `${article.title} ${article.description}`.toLowerCase();
      keywords.forEach(keyword => {
        if (searchText.includes(keyword.toLowerCase())) {
          score += 10;
        }
      });
      
      // Priority bonus
      if (article.priority === 'high') score += 15;
      if (article.priority === 'medium') score += 10;
      
      return { ...article, relevanceScore: Math.min(score, 100) };
    })
    .filter(article => article.relevanceScore > 0)
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, limit);
}

export async function POST(req: NextRequest) {
  try {
    const { keywords, path, limit = 6, includeMetadata = false } = await req.json();
    
    if (!keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: 'Keywords array is required' },
        { status: 400 }
      );
    }
    
    const results = searchArticles(keywords, path, limit);
    
    return NextResponse.json({
      tutorials: results,
      articles: results, // Alias for compatibility
      total: results.length,
      keywords,
      path,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const category = searchParams.get('category');
  
  if (q) {
    const keywords = q.split(' ').filter(k => k.length > 0);
    const results = searchArticles(keywords);
    return NextResponse.json({ results });
  }
  
  if (category) {
    const results = articlesMetadata.filter(a => a.category === category);
    return NextResponse.json({ results });
  }
  
  // Return all articles
  return NextResponse.json({ 
    articles: articlesMetadata,
    total: articlesMetadata.length 
  });
}
