/**
 * API endpoint to fetch relevant tutorials from Help Docs site
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock tutorial data - replace with actual API call to your Help Docs site
const allTutorials = [
  // Getting Started
  {
    id: 'gs-1',
    title: 'Quick Start Guide',
    description: 'Get up and running with Prompt Reviews in 5 minutes',
    url: 'https://docs.promptreviews.app/getting-started',
    category: 'getting-started',
    tags: ['getting-started', 'setup', 'overview', 'dashboard']
  },
  {
    id: 'gs-2',
    title: 'Dashboard Overview',
    description: 'Understanding your dashboard and key metrics',
    url: 'https://docs.promptreviews.app/getting-started/dashboard',
    category: 'getting-started',
    tags: ['dashboard', 'overview', 'navigation', 'metrics']
  },

  // Prompt Pages
  {
    id: 'pp-1',
    title: 'Creating Your First Prompt Page',
    description: 'Step-by-step guide to creating effective prompt pages',
    url: 'https://docs.promptreviews.app/prompt-pages/create',
    category: 'prompt-pages',
    tags: ['prompt-pages', 'create', 'setup', 'new']
  },
  {
    id: 'pp-2',
    title: 'Customizing Prompt Pages',
    description: 'Personalize your prompt pages with branding and custom content',
    url: 'https://docs.promptreviews.app/prompt-pages/customize',
    category: 'prompt-pages',
    tags: ['prompt-pages', 'customize', 'edit', 'branding']
  },
  {
    id: 'pp-3',
    title: 'Prompt Page Types Explained',
    description: 'Choose the right prompt page type for your needs',
    url: 'https://docs.promptreviews.app/prompt-pages/types',
    category: 'prompt-pages',
    tags: ['prompt-pages', 'types', 'service', 'product', 'photo', 'video']
  },

  // Contacts
  {
    id: 'c-1',
    title: 'Managing Your Contacts',
    description: 'Organize and manage your customer contacts effectively',
    url: 'https://docs.promptreviews.app/contacts/management',
    category: 'contacts',
    tags: ['contacts', 'manage', 'organize', 'customers']
  },
  {
    id: 'c-2',
    title: 'Bulk Contact Upload',
    description: 'Import contacts via CSV file upload',
    url: 'https://docs.promptreviews.app/contacts/upload',
    category: 'contacts',
    tags: ['contacts', 'upload', 'import', 'csv', 'bulk']
  },

  // Business Profile
  {
    id: 'bp-1',
    title: 'Setting Up Your Business Profile',
    description: 'Complete your business information and branding',
    url: 'https://docs.promptreviews.app/business/profile',
    category: 'business',
    tags: ['business', 'profile', 'setup', 'company', 'branding']
  },
  {
    id: 'bp-2',
    title: 'Brand Customization',
    description: 'Customize colors, fonts, and styling to match your brand',
    url: 'https://docs.promptreviews.app/business/branding',
    category: 'business',
    tags: ['style', 'branding', 'colors', 'fonts', 'design', 'customize']
  },

  // Widgets
  {
    id: 'w-1',
    title: 'Installing Review Widgets',
    description: 'Add review widgets to your website',
    url: 'https://docs.promptreviews.app/widgets/install',
    category: 'widgets',
    tags: ['widgets', 'embed', 'website', 'install']
  },
  {
    id: 'w-2',
    title: 'Widget Customization',
    description: 'Customize the appearance of your review widgets',
    url: 'https://docs.promptreviews.app/widgets/customize',
    category: 'widgets',
    tags: ['widgets', 'customize', 'design', 'display']
  },

  // Google Business
  {
    id: 'gb-1',
    title: 'Google Business Profile Integration',
    description: 'Connect and sync with Google Business Profile',
    url: 'https://docs.promptreviews.app/integrations/google-business',
    category: 'integrations',
    tags: ['google', 'business-profile', 'integration', 'gmb', 'maps']
  },
  {
    id: 'gb-2',
    title: 'Importing Google Reviews',
    description: 'Import existing reviews from Google Business Profile',
    url: 'https://docs.promptreviews.app/integrations/google-reviews',
    category: 'integrations',
    tags: ['google', 'reviews', 'import', 'sync']
  },

  // Reviews
  {
    id: 'r-1',
    title: 'Managing Customer Reviews',
    description: 'View, moderate, and respond to customer reviews',
    url: 'https://docs.promptreviews.app/reviews/management',
    category: 'reviews',
    tags: ['reviews', 'manage', 'moderate', 'feedback']
  },
  {
    id: 'r-2',
    title: 'Review Verification',
    description: 'Verify and authenticate customer reviews',
    url: 'https://docs.promptreviews.app/reviews/verification',
    category: 'reviews',
    tags: ['reviews', 'verification', 'authenticate', 'trust']
  },

  // Team & Billing
  {
    id: 't-1',
    title: 'Team Collaboration',
    description: 'Invite team members and manage permissions',
    url: 'https://docs.promptreviews.app/team/collaboration',
    category: 'team',
    tags: ['team', 'collaboration', 'invite', 'members', 'roles']
  },
  {
    id: 'b-1',
    title: 'Plans and Billing',
    description: 'Understanding plans, pricing, and billing',
    url: 'https://docs.promptreviews.app/billing/plans',
    category: 'billing',
    tags: ['billing', 'subscription', 'upgrade', 'payment', 'pricing']
  }
];

export async function POST(req: NextRequest) {
  try {
    const { context, pathname } = await req.json();

    // TODO: Replace this with actual API call to your Help Docs site
    // For example:
    // const response = await fetch('https://docs.promptreviews.app/api/search', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ keywords: context, path: pathname })
    // });
    // const data = await response.json();
    // return NextResponse.json({ tutorials: data.results });

    // For now, return filtered mock data based on context
    const relevantTutorials = allTutorials.filter(tutorial => {
      const contextLower = context.map((c: string) => c.toLowerCase());
      const hasMatchingTag = tutorial.tags.some(tag => 
        contextLower.includes(tag.toLowerCase())
      );
      const hasMatchingCategory = contextLower.includes(tutorial.category.toLowerCase());
      
      return hasMatchingTag || hasMatchingCategory;
    });

    // If no relevant tutorials found, return general getting started tutorials
    const tutorials = relevantTutorials.length > 0 
      ? relevantTutorials 
      : allTutorials.filter(t => t.category === 'getting-started');

    // Limit to 6 tutorials
    const limitedTutorials = tutorials.slice(0, 6);

    return NextResponse.json({ 
      tutorials: limitedTutorials,
      total: limitedTutorials.length,
      context: context
    });

  } catch (error) {
    console.error('Error fetching tutorials:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch tutorials',
        tutorials: [] 
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for fetching all tutorials or categories
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  if (category) {
    const categoryTutorials = allTutorials.filter(t => t.category === category);
    return NextResponse.json({ tutorials: categoryTutorials });
  }

  // Return all categories
  const categories = [...new Set(allTutorials.map(t => t.category))];
  return NextResponse.json({ categories, total: allTutorials.length });
}