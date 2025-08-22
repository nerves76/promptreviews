/**
 * API endpoint that fetches content from the docs site
 * This ensures all help content comes from the single source of truth
 */

import { NextRequest, NextResponse } from 'next/server';

const DOCS_BASE_URL = process.env.DOCS_URL || 'https://docs.promptreviews.app';

export async function POST(req: NextRequest) {
  try {
    const { path, articleId } = await req.json();
    
    if (!path && !articleId) {
      return NextResponse.json(
        { error: 'Path or articleId is required' },
        { status: 400 }
      );
    }

    // Construct the URL to fetch from
    let fetchUrl = DOCS_BASE_URL;
    if (path) {
      fetchUrl = `${DOCS_BASE_URL}${path}`;
    } else if (articleId) {
      // Map article IDs to docs paths
      const pathMap: Record<string, string> = {
        'getting-started': '/getting-started',
        'quickstart-overview': '/getting-started',
        'quickstart-business-setup': '/getting-started/account-setup',
        'quickstart-prompt-page': '/getting-started/first-prompt-page',
        'quickstart-share': '/getting-started/first-review-request',
        'quickstart-widgets': '/getting-started/review-widget',
        'quickstart-manage-reviews': '/reviews',
        'universal-prompt-page': '/prompt-pages/types/universal',
        'service-prompt-pages': '/prompt-pages/types/service',
        'individual-requests': '/prompt-pages',
        'contacts': '/contacts',
        'reviews-dashboard': '/reviews',
        'widgets': '/widgets',
        'business-profile': '/business-profile',
        'faq': '/faq',
        'faq-comprehensive': '/faq-comprehensive',
      };
      
      const mappedPath = pathMap[articleId];
      if (!mappedPath) {
        return NextResponse.json(
          { error: `Unknown article ID: ${articleId}` },
          { status: 404 }
        );
      }
      
      fetchUrl = `${DOCS_BASE_URL}${mappedPath}`;
    }

    // Fetch the content from the docs site
    // Append .txt to get plain text version
    const response = await fetch(`${fetchUrl}/index.txt`, {
      headers: {
        'User-Agent': 'PromptReviews-HelpModal/1.0',
      },
    });

    if (!response.ok) {
      // Fallback to HTML if txt not available
      const htmlResponse = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'PromptReviews-HelpModal/1.0',
        },
      });
      
      if (!htmlResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch content from docs site' },
          { status: response.status }
        );
      }
      
      const html = await htmlResponse.text();
      // Extract content from HTML (you may need to parse this better)
      const contentMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
      const content = contentMatch ? contentMatch[1] : html;
      
      return NextResponse.json({
        content,
        source: 'docs-site-html',
        url: fetchUrl,
      });
    }

    const content = await response.text();

    return NextResponse.json({
      content,
      source: 'docs-site',
      url: fetchUrl,
    });

  } catch (error) {
    console.error('Error fetching from docs site:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// GET endpoint to list available articles
export async function GET() {
  // Return a list of available articles with their IDs and paths
  const articles = [
    {
      category: 'Getting Started',
      items: [
        { id: 'quickstart-overview', title: 'Overview', path: '/getting-started' },
        { id: 'quickstart-business-setup', title: 'Set Up Your Business', path: '/getting-started/account-setup' },
        { id: 'quickstart-prompt-page', title: 'Create Your Prompt Page', path: '/getting-started/first-prompt-page' },
        { id: 'quickstart-share', title: 'Share Your Page', path: '/getting-started/first-review-request' },
        { id: 'quickstart-widgets', title: 'Display Reviews', path: '/getting-started/review-widget' },
        { id: 'quickstart-manage-reviews', title: 'Manage Reviews', path: '/reviews' },
      ]
    },
    {
      category: 'Get Reviews',
      items: [
        { id: 'universal-prompt-page', title: 'Universal Prompt Page', path: '/prompt-pages/types/universal' },
        { id: 'service-prompt-pages', title: 'Service Prompt Pages', path: '/prompt-pages/types/service' },
        { id: 'contacts', title: 'Contacts', path: '/contacts' },
      ]
    },
    {
      category: 'Showcase Reviews',
      items: [
        { id: 'reviews-dashboard', title: 'Reviews', path: '/reviews' },
        { id: 'widgets', title: 'Widgets', path: '/widgets' },
      ]
    },
    {
      category: 'Settings',
      items: [
        { id: 'business-profile', title: 'Business Profile', path: '/business-profile' },
      ]
    },
    {
      category: 'Help',
      items: [
        { id: 'faq', title: 'FAQs', path: '/faq' },
        { id: 'faq-comprehensive', title: 'Comprehensive FAQs', path: '/faq-comprehensive' },
      ]
    }
  ];

  return NextResponse.json({ articles });
}