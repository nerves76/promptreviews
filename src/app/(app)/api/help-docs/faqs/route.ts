/**
 * FAQ API endpoint for the help system
 * Provides frequently asked questions with plan-based filtering
 */

import { NextRequest, NextResponse } from 'next/server';

// FAQ data - in production this could come from a database or CMS
const faqData = [
  {
    id: 'faq-1',
    question: 'What is Prompt Reviews?',
    answer: 'Prompt Reviews is a comprehensive platform designed to help businesses manage their online reputation through intelligent review collection, management, and display tools.',
    category: 'getting-started',
    tags: ['basics', 'overview', 'platform'],
    plans: ['grower', 'builder', 'maven', 'enterprise']
  },
  {
    id: 'faq-2',
    question: 'How do I create my first prompt page?',
    answer: 'Creating a prompt page is simple: 1) Navigate to Dashboard → Prompt Pages, 2) Click "Create New Page", 3) Choose from our templates or start from scratch, 4) Customize the content, branding, and review platforms, 5) Share the unique link with your customers.',
    category: 'prompt-pages',
    tags: ['prompt-pages', 'create', 'setup'],
    plans: ['grower', 'builder', 'maven', 'enterprise']
  },
  {
    id: 'faq-3',
    question: 'Can I have multiple businesses under one account?',
    answer: 'Yes! Our platform supports multi-business management. You can add additional businesses from Settings → Business Management.',
    category: 'account',
    tags: ['business', 'multi-business', 'account'],
    plans: ['grower', 'builder', 'maven', 'enterprise']
  },
  {
    id: 'faq-4',
    question: 'How do I manage my customer contacts?',
    answer: 'You can manage contacts through the Contacts section in your dashboard. Upload contacts via CSV, add them manually, or import from integrated CRM systems. You can organize contacts with tags and create smart lists for targeted campaigns.',
    category: 'contacts',
    tags: ['contacts', 'management', 'upload', 'crm'],
    plans: ['builder', 'maven', 'enterprise'] // Builder+ feature
  },
  {
    id: 'faq-5',
    question: 'What review platforms do you support?',
    answer: 'We currently support Google Business Profile, Facebook, Yelp, TripAdvisor, and custom review collection. Higher-tier plans include additional integrations and advanced features.',
    category: 'integrations',
    tags: ['platforms', 'google', 'facebook', 'yelp', 'integrations'],
    plans: ['grower', 'builder', 'maven', 'enterprise']
  },
  {
    id: 'faq-6',
    question: 'How do I connect my Google Business Profile?',
    answer: 'To connect your Google Business Profile: 1) Go to Settings → Integrations, 2) Click "Connect Google Business", 3) Sign in with your Google account, 4) Grant necessary permissions, 5) Select your business location(s). This feature requires a Builder plan or higher.',
    category: 'integrations',
    tags: ['google', 'business-profile', 'connection', 'setup'],
    plans: ['builder', 'maven', 'enterprise'] // Builder+ feature
  },
  {
    id: 'faq-7',
    question: 'Can I customize the appearance of my review pages?',
    answer: 'Absolutely! You can customize colors, fonts, logos, and messaging to match your brand identity. All customization options are available in the page editor.',
    category: 'customization',
    tags: ['branding', 'customization', 'design'],
    plans: ['grower', 'builder', 'maven', 'enterprise']
  },
  {
    id: 'faq-8',
    question: 'How do review widgets work?',
    answer: 'Review widgets are embeddable components that display your best reviews on your website. Simply copy the embed code from the Widgets section and paste it into your website\'s HTML. Widgets are available with Builder plans and above.',
    category: 'widgets',
    tags: ['widgets', 'embed', 'website', 'display'],
    plans: ['builder', 'maven', 'enterprise'] // Builder+ feature
  },
  {
    id: 'faq-9',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover) through our secure payment processor, Stripe.',
    category: 'billing',
    tags: ['payment', 'billing', 'credit-cards'],
    plans: ['grower', 'builder', 'maven', 'enterprise']
  },
  {
    id: 'faq-10',
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time from Account Settings → Billing. Your access will continue until the end of your current billing period.',
    category: 'billing',
    tags: ['cancellation', 'billing', 'subscription'],
    plans: ['grower', 'builder', 'maven', 'enterprise']
  },
  {
    id: 'faq-11',
    question: 'Do you offer a free trial?',
    answer: 'Yes! We offer a 14-day free trial with full access to all features in your selected plan.',
    category: 'billing',
    tags: ['trial', 'free', 'billing'],
    plans: ['grower', 'builder', 'maven', 'enterprise']
  },
  {
    id: 'faq-12',
    question: 'How do I respond to negative reviews?',
    answer: 'Always respond professionally and promptly to negative reviews. Acknowledge the concern, apologize if appropriate, offer to resolve the issue offline, and demonstrate your commitment to customer satisfaction. Our platform provides response templates and best practices.',
    category: 'review-management',
    tags: ['negative-reviews', 'responses', 'reputation'],
    plans: ['grower', 'builder', 'maven', 'enterprise']
  }
];

/**
 * Filter FAQs based on user's plan
 */
function filterFAQsByPlan(faqs: any[], userPlan: string = 'grower') {
  return faqs.filter(faq => {
    // If no plans specified, available to all
    if (!faq.plans || faq.plans.length === 0) return true;
    
    // Check if user's plan is in the FAQ's allowed plans
    return faq.plans.includes(userPlan);
  });
}

/**
 * Filter and rank FAQs based on search criteria
 */
function filterAndRankFAQs(faqs: any[], context: string[] = []) {
  return faqs
    .map(faq => {
      // Calculate relevance score
      const contextLower = context.map(c => c.toLowerCase());
      let score = 0;
      
      // Check tag matches
      if (faq.tags) {
        faq.tags.forEach((tag: string) => {
          if (contextLower.includes(tag.toLowerCase())) {
            score += 20;
          }
        });
      }
      
      // Check category match
      if (faq.category && contextLower.includes(faq.category.toLowerCase())) {
        score += 30;
      }
      
      // Check question/answer matches
      const searchText = `${faq.question} ${faq.answer}`.toLowerCase();
      context.forEach(keyword => {
        if (searchText.includes(keyword.toLowerCase())) {
          score += 10;
        }
      });
      
      // Give a baseline score to ensure we always show some FAQs
      const finalScore = score > 0 ? score : 5;
      return { ...faq, relevanceScore: Math.min(finalScore, 100) };
    })
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, 10); // Limit to top 10 FAQs
}

export async function POST(req: NextRequest) {
  try {
    const { context, userPlan, category } = await req.json();
    
    let faqs = [...faqData];
    
    // Filter by category if specified
    if (category) {
      faqs = faqs.filter(faq => faq.category === category);
    }
    
    // Filter and rank by context
    if (context && context.length > 0) {
      faqs = filterAndRankFAQs(faqs, context);
    }
    
    // Filter by user's plan
    faqs = filterFAQsByPlan(faqs, userPlan);
    
    return NextResponse.json({
      faqs,
      total: faqs.length,
      context,
      userPlan,
      category,
      source: 'app-faqs'
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get('category');
    const userPlan = searchParams.get('userPlan') || 'grower';
    
    let faqs = [...faqData];
    
    // Filter by category if specified
    if (category) {
      faqs = faqs.filter(faq => faq.category === category);
    }
    
    // Filter by user's plan
    faqs = filterFAQsByPlan(faqs, userPlan);
    
    return NextResponse.json({
      faqs,
      total: faqs.length,
      category,
      userPlan,
      source: 'app-faqs'
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}