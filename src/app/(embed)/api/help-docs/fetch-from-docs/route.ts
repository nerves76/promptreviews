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
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      fetchUrl = `${DOCS_BASE_URL}${normalizedPath}`;
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
        // Google Biz Optimizer articles on docs site
        'google-biz-optimizer/metrics/total-reviews': '/google-biz-optimizer/metrics/total-reviews',
        'google-biz-optimizer/metrics/average-rating': '/google-biz-optimizer/metrics/average-rating',
        'google-biz-optimizer/metrics/review-trends': '/google-biz-optimizer/metrics/review-trends',
        'google-biz-optimizer/metrics/monthly-patterns': '/google-biz-optimizer/metrics/monthly-patterns',
        'google-biz-optimizer/optimization/seo-score': '/google-biz-optimizer/optimization/seo-score',
        'google-biz-optimizer/optimization/categories': '/google-biz-optimizer/optimization/categories',
        'google-biz-optimizer/optimization/services': '/google-biz-optimizer/optimization/services',
        'google-biz-optimizer/optimization/photos': '/google-biz-optimizer/optimization/photos',
        'google-biz-optimizer/optimization/quick-wins': '/google-biz-optimizer/optimization/quick-wins',
        'google-biz-optimizer/engagement/review-responses': '/google-biz-optimizer/engagement/review-responses',
        'google-biz-optimizer/engagement/questions-answers': '/google-biz-optimizer/engagement/questions-answers',
        'google-biz-optimizer/engagement/posts': '/google-biz-optimizer/engagement/posts',
        'google-biz-optimizer/performance/customer-actions': '/google-biz-optimizer/performance/customer-actions',
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

    // Try to fetch HTML version first for better formatting
    const htmlResponse = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'PromptReviews-HelpModal/1.0',
      },
    });

    if (htmlResponse.ok) {
      const html = await htmlResponse.text();
      
      // Extract content from the main section
      // Look for the article content within the HTML
      let content = '';
      
      // Try to extract the main content area
      const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
      if (mainMatch) {
        content = mainMatch[1];
      } else {
        // Try article tag
        const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
        if (articleMatch) {
          content = articleMatch[1];
        } else {
          // Try content div
          const contentMatch = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
          if (contentMatch) {
            content = contentMatch[1];
          } else {
            // Fallback to body content
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
            content = bodyMatch ? bodyMatch[1] : html;
          }
        }
      }
      
      // Clean up the content - remove scripts, styles, nav, footer, etc.
      content = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
        .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
        .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '');
      
      // Remove navigation sections (Previous/Next buttons)
      content = content
        // Remove divs with navigation classes
        .replace(/<div[^>]*class="[^"]*navigation[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="[^"]*nav-links[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="[^"]*pagination[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="[^"]*post-navigation[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="[^"]*article-navigation[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        // Remove Previous/Next link patterns
        .replace(/<a[^>]*>[\s]*(?:Previous|Next|←|→|‹|›|«|»)[\s]*<\/a>/gi, '')
        // Remove divs that contain only navigation links
        .replace(/<div[^>]*>[\s]*<a[^>]*>[\s]*(?:Previous|←|‹|«)[\s\S]*?<\/a>[\s\S]*?<a[^>]*>[\s]*(?:Next|→|›|»)[\s\S]*?<\/a>[\s]*<\/div>/gi, '');
      
      // Remove FAQ sections
      content = content
        // Remove FAQ headings and their content
        .replace(/<h[1-6][^>]*>[\s]*(?:Frequently Asked Questions|FAQs?|Common Questions)[\s]*<\/h[1-6]>[\s\S]*?(?=<h[1-6]|$)/gi, '')
        // Remove divs with FAQ classes
        .replace(/<div[^>]*class="[^"]*faq[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<section[^>]*class="[^"]*faq[^"]*"[^>]*>[\s\S]*?<\/section>/gi, '')
        // Remove accordion/collapsible FAQ elements
        .replace(/<details[^>]*>[\s\S]*?<\/details>/gi, '');
      
      // Remove feedback and rating sections
      content = content
        // Remove "Was this helpful?" sections
        .replace(/<div[^>]*>[\s\S]*?(?:Was this helpful|Rate this|Did this help|Found this useful)[\s\S]*?<\/div>/gi, '')
        // Remove feedback forms
        .replace(/<form[^>]*class="[^"]*feedback[^"]*"[^>]*>[\s\S]*?<\/form>/gi, '')
        // Remove rating widgets
        .replace(/<div[^>]*class="[^"]*rating[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
      
      // Remove related articles and see also sections  
      content = content
        // Remove Related Articles/See Also headings and their content
        .replace(/<h[1-6][^>]*>[\s]*(?:Related Articles?|See Also|Learn More|Additional Resources?)[\s]*<\/h[1-6]>[\s\S]*?(?=<h[1-6]|$)/gi, '')
        // Remove divs with related/see-also classes
        .replace(/<div[^>]*class="[^"]*(?:related|see-also)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
      
      // Fix relative links to point to docs site but keep them internal
      content = content.replace(
        /href="([^"]+)"/gi,
        (match, url) => {
          // If it's a relative URL (doesn't start with http)
          if (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('#')) {
            // Convert to absolute URL pointing to docs site for consistency
            const absoluteUrl = url.startsWith('/') 
              ? `${DOCS_BASE_URL}${url}`
              : `${DOCS_BASE_URL}/${url}`;
            return `href="${absoluteUrl}"`;
          }
          // For external links (non-docs), add target="_blank"
          if (url.startsWith('http') && !url.includes('promptreviews.app/docs')) {
            return `href="${url}" target="_blank" rel="noopener noreferrer"`;
          }
          return match;
        }
      );
      
      return NextResponse.json({
        content,
        source: 'docs-site-html',
        url: fetchUrl,
      });
    }

    // Fallback to plain text version
    const txtResponse = await fetch(`${fetchUrl}/index.txt`, {
      headers: {
        'User-Agent': 'PromptReviews-HelpModal/1.0',
      },
    });

    if (txtResponse.ok) {
      const content = await txtResponse.text();
      return NextResponse.json({
        content,
        source: 'docs-site',
        url: fetchUrl,
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch content from docs site' },
      { status: 404 }
    );

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
