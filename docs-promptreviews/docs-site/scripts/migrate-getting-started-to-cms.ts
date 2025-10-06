/**
 * Migration script to convert getting-started pages to CMS
 *
 * This script creates articles in the database for all getting-started pages
 * Run with: npx tsx scripts/migrate-getting-started-to-cms.ts
 */

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

interface ArticlePayload {
  title: string;
  slug: string;
  content: string;
  status: 'published' | 'draft';
  metadata: {
    description?: string;
    keywords?: string[];
    canonical_url?: string;
    category?: string;
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
    faqs?: Array<{
      question: string;
      answer: string;
    }>;
    overview_title?: string;
    overview_markdown?: string;
    key_features_title?: string;
    how_it_works_title?: string;
    best_practices_title?: string;
    faqs_title?: string;
    call_to_action?: {
      primary?: {
        text: string;
        href: string;
        external?: boolean;
      };
      secondary?: {
        text: string;
        href: string;
        external?: boolean;
      };
    };
  };
}

const articles: ArticlePayload[] = [
  // 1. Getting Started Main Page
  {
    title: 'Getting started with Prompt Reviews',
    slug: 'getting-started',
    content: `Welcome to Prompt Reviews! This comprehensive guide will help you set up your account and start collecting customer reviews in under 30 minutes.

Most businesses are fully set up and collecting their first reviews within 30 minutes. Our streamlined onboarding process makes it easy to get started, even if you've never used a review collection platform before.`,
    status: 'published',
    metadata: {
      description: 'Welcome to Prompt Reviews! This comprehensive guide will help you set up your account and start collecting customer reviews in under 30 minutes.',
      keywords: [
        'Prompt Reviews setup',
        'getting started guide',
        'review collection tutorial',
        'customer review automation',
        'business profile setup'
      ],
      canonical_url: 'https://docs.promptreviews.app/getting-started',
      category: 'getting-started',
      category_label: 'Quick Start Guide',
      category_icon: 'CheckCircle',
      category_color: 'green',
      available_plans: ['grower', 'builder', 'maven'],
      seo_title: 'Getting Started with Prompt Reviews - Complete Setup Guide',
      seo_description: 'Learn how to set up your Prompt Reviews account, create your first prompt page, and start collecting customer reviews in under 30 minutes.',
      overview_title: 'Everything You Need to Get Started',
      overview_markdown: `Most businesses are fully set up and collecting their first reviews within 30 minutes. Our streamlined onboarding process makes it easy to get started, even if you've never used a review collection platform before.

### Setup Highlights

- **30 Minutes Total** - Complete setup from account creation to first review request
- **AI-Powered** - Let AI help you create personalized content and optimize requests
- **All Skill Levels** - No technical skills required - intuitive interface for everyone`,
      key_features: [
        {
          icon: 'CheckCircle',
          title: 'Quick Setup Process',
          description: 'Get your account set up and collecting reviews in under 30 minutes with our streamlined onboarding process.'
        },
        {
          icon: 'Settings',
          title: 'Business Profile Configuration',
          description: 'Complete your business information to unlock all features and personalize your review requests.'
        },
        {
          icon: 'MessageCircle',
          title: 'First Prompt Page Creation',
          description: 'Create your first personalized review request page with AI-powered content generation.'
        },
        {
          icon: 'Users',
          title: 'Contact Management Setup',
          description: 'Import your existing customer database or manually add contacts to start requesting reviews.'
        },
        {
          icon: 'Star',
          title: 'Review Collection Launch',
          description: 'Send your first review requests and start collecting authentic customer feedback immediately.'
        },
        {
          icon: 'Globe',
          title: 'Website Integration',
          description: 'Embed review widgets on your website to showcase positive reviews and build trust.'
        }
      ],
      how_it_works: [
        {
          number: 1,
          icon: 'Settings',
          title: 'Create Your Account',
          description: 'Sign up for Prompt Reviews and complete your business profile information including name, address, and contact details.'
        },
        {
          number: 2,
          icon: 'Target',
          title: 'Choose Your Plan',
          description: 'Select the subscription plan that best fits your business needs and review collection goals.'
        },
        {
          number: 3,
          icon: 'MessageCircle',
          title: 'Build Your First Prompt Page',
          description: 'Create a personalized review request page using our AI-powered content generation tools.'
        },
        {
          number: 4,
          icon: 'Users',
          title: 'Add Contacts & Start Collecting',
          description: 'Import your customers and send your first review requests via email, SMS, or QR codes.'
        }
      ],
      best_practices: [
        {
          icon: 'Clock',
          title: 'Start with Recent Customers',
          description: "Focus on customers who recently had positive experiences. They're more likely to leave glowing reviews and remember details clearly."
        },
        {
          icon: 'Sparkles',
          title: 'Use AI Content Generation',
          description: 'Take advantage of AI-powered content creation to personalize your review requests and improve response rates.'
        },
        {
          icon: 'Target',
          title: 'Test Different Approaches',
          description: 'Try various prompt page types and messaging strategies to see what works best for your business and customers.'
        },
        {
          icon: 'Zap',
          title: 'Keep It Simple',
          description: "Make the review process as easy as possible. The fewer clicks and steps required, the more reviews you'll collect."
        }
      ],
      call_to_action: {
        primary: {
          text: 'View Setup Guides',
          href: '/getting-started/account-setup'
        }
      }
    }
  },

  // 2. Account Setup
  {
    title: 'Account setup & business profile',
    slug: 'getting-started/account-setup',
    content: `Create your Prompt Reviews account and complete your business information to get started.

## Creating Your Account

Getting started with Prompt Reviews begins with creating your account and setting up your business profile. This foundational step ensures that all your review requests are personalized and professional.

## Setting Up Your Business Profile

Your business profile is crucial for creating effective prompt pages and collecting reviews. Complete profile information helps our AI generate better content and makes your review requests more trustworthy to customers.`,
    status: 'published',
    metadata: {
      description: 'Create your Prompt Reviews account and set up your business profile to start collecting customer reviews.',
      keywords: ['account setup', 'business profile', 'prompt reviews registration', 'sign up'],
      canonical_url: 'https://docs.promptreviews.app/getting-started/account-setup',
      category: 'getting-started',
      category_label: 'Step 1',
      category_icon: 'UserPlus',
      category_color: 'blue',
      available_plans: ['grower', 'builder', 'maven'],
      seo_title: 'Account Setup & Business Profile | Prompt Reviews',
      overview_markdown: `## Sign-Up Process

### Step 1: Visit the Sign-Up Page

Go to [app.promptreviews.app/signup](https://app.promptreviews.app/signup) to create your account.

- Enter your email address
- Create a secure password
- Verify your email address

### Step 2: Complete Your Profile

After signing up, you'll be prompted to complete your profile information:

- Your name and role
- Company/business name
- Phone number (optional)

## Business Information Required

### Business Details
- Business name
- Business type/industry
- Physical address
- Phone number
- Website URL
- Business hours

### Review Platforms
- Google Business Profile link
- Facebook page URL
- Yelp business page
- Industry-specific platforms
- Custom review platforms`,
      best_practices: [
        {
          icon: 'CheckCircle',
          title: 'Complete Profile = Better Results',
          description: 'A complete business profile helps our AI generate more personalized and effective review requests.'
        },
        {
          icon: 'Star',
          title: 'Add Review Platforms Early',
          description: "Set up your review platforms in your business profile. They'll be available on all prompt pages automatically."
        },
        {
          icon: 'Search',
          title: 'Use Keywords for SEO',
          description: 'Include relevant keywords in your business description to help with search engine rankings and discoverability.'
        },
        {
          icon: 'Brain',
          title: 'AI Best Practices',
          description: 'Be specific about your services and customer experience. The more detail you provide, the better AI can assist customers.'
        }
      ]
    }
  },

  // 3. Choosing Plan
  {
    title: 'Choose your plan',
    slug: 'getting-started/choosing-plan',
    content: `Select the subscription plan that best fits your business size and review collection needs.

## Free Trial Available

Start with the Grower plan and get a 14-day free trial - no credit card required! Perfect for testing the waters before upgrading to a paid plan with more features.

## Save with Annual Billing

Choose annual billing and save 15% on any plan! Pay yearly and get the equivalent of almost 2 months free. Perfect for businesses ready to commit to growing their online reputation.`,
    status: 'published',
    metadata: {
      description: 'Select the perfect Prompt Reviews plan for your business. Compare features and pricing to find what works best for you.',
      keywords: ['prompt reviews pricing', 'plans', 'subscription', 'free trial', 'pricing comparison'],
      canonical_url: 'https://docs.promptreviews.app/getting-started/choosing-plan',
      category: 'getting-started',
      category_label: 'Step 2',
      category_icon: 'CreditCard',
      category_color: 'purple',
      available_plans: ['grower', 'builder', 'maven'],
      seo_title: 'Choose Your Plan | Prompt Reviews',
      overview_markdown: `## Plan Comparison

### Grower - $15/month
Perfect for small businesses just getting started
- 14-day free trial
- Universal prompt page
- 3 custom prompt pages
- Review widget
- Analytics

### Builder - $35/month (Most Popular)
Ideal for growing businesses with a team
- 3 team members
- Workflow management
- 50 prompt pages
- 1,000 contacts
- Google Business Profile management

### Maven - $100/month
For established businesses & franchises
- 5 team members
- Up to 10 business locations
- 500 prompt pages
- 10,000 contacts
- Priority support

## Key Features Explained

**Universal vs Custom Prompt Pages**: Universal page for general use (QR codes), custom pages for individual customers with AI assistance.

**Google Business Profile Management**: Direct integration for importing reviews, managing responses, and handling multiple locations (Maven only).

**Contact Management & Workflow**: Upload and organize customer contacts (Builder & Maven), send personalized requests, and automate workflows.`,
      best_practices: [
        {
          icon: 'Zap',
          title: 'Start with Free Trial',
          description: 'Test the platform with the 14-day Grower trial, then upgrade when you need more features like team management and analytics.'
        },
        {
          icon: 'Target',
          title: 'Choose Based on Team Size',
          description: 'Grower for solo businesses, Builder for small teams, Maven for multi-location or franchises.'
        },
        {
          icon: 'Star',
          title: 'Save with Annual Billing',
          description: 'Pay annually to save 15% - almost 2 months free on any plan!'
        }
      ]
    }
  },

  // 4. First Prompt Page
  {
    title: 'Create your first prompt page',
    slug: 'getting-started/first-prompt-page',
    content: `Build a personalized review request page with AI-powered content generation to start collecting customer reviews.

## What is a Prompt Page?

A prompt page is your personalized review collection landing page. It's where customers go to leave reviews about their experience with your business. Each page is customized with your branding, messaging, and review platform links.

Prompt pages are AI-powered, customizable, and proven to deliver higher completion rates than generic review requests.`,
    status: 'published',
    metadata: {
      description: 'Learn how to create your first personalized review request page with AI-powered content generation in Prompt Reviews.',
      keywords: ['create prompt page', 'review request page', 'AI content generation', 'prompt reviews tutorial'],
      canonical_url: 'https://docs.promptreviews.app/getting-started/first-prompt-page',
      category: 'getting-started',
      category_label: 'Step 3',
      category_icon: 'FileText',
      category_color: 'green',
      available_plans: ['grower', 'builder', 'maven'],
      seo_title: 'Create Your First Prompt Page | Prompt Reviews',
      overview_markdown: `## Creating Your Prompt Page - Step by Step

### 1. Navigate to Prompt Pages
From your dashboard, click "Prompt Pages" in the main navigation, then "Create New Page".

### 2. Choose Your Page Type
- **Service**: For service-based businesses
- **Product**: For e-commerce and retail
- **Event**: For workshops and events
- **Universal**: All-purpose solution

### 3. Enter Basic Information
- Page name (internal reference)
- Business/Service name (customer-facing)
- Description of your service or product

### 4. Let AI Generate Content
Click "Generate with AI" to create:
- Welcome message tailored to your business
- Review request text optimized for conversions
- Thank you message for completed reviews

**Note**: You can edit all AI-generated content to match your voice and style.

### 5. Customize Design & Branding
**Visual Elements**: Logo, brand colors, emoji style, background images
**Content Options**: Edit messages, customize questions, add testimonials, include contact info

### 6. Connect Review Platforms
Add links to Google, Facebook, Yelp, Trustpilot, and other review platforms.

### 7. Preview and Publish
- Preview on desktop and mobile
- Make final adjustments
- Click "Publish" to make your page live`,
      best_practices: [
        {
          icon: 'Zap',
          title: 'Keep It Simple',
          description: "Don't overwhelm customers with too many questions. Focus on making the review process quick and easy."
        },
        {
          icon: 'MessageCircle',
          title: 'Use Your Brand Voice',
          description: 'Edit AI-generated content to match your brand\'s tone and personality for authenticity.'
        },
        {
          icon: 'Smartphone',
          title: 'Mobile-First Design',
          description: 'Most customers will access your page on mobile. Always preview on different devices.'
        },
        {
          icon: 'Eye',
          title: 'Test Before Sharing',
          description: 'Send the page to yourself first to experience the full customer journey.'
        }
      ]
    }
  },

  // 5. Adding Contacts
  {
    title: 'Add your first contacts',
    slug: 'getting-started/adding-contacts',
    content: `Import your customer database or manually add contacts to start sending personalized review requests.

## Managing Your Contacts

Contacts are the foundation of your review collection strategy. Prompt Reviews offers multiple ways to add and manage your customer contacts, making it easy to start requesting reviews immediately.

**Note**: Contact management is available on Builder and Maven plans only.`,
    status: 'published',
    metadata: {
      description: 'Learn how to import your customer database or manually add contacts to start sending personalized review requests.',
      keywords: ['add contacts', 'import customers', 'CSV upload', 'contact management', 'prompt reviews'],
      canonical_url: 'https://docs.promptreviews.app/getting-started/adding-contacts',
      category: 'getting-started',
      category_label: 'Step 4',
      category_icon: 'Users',
      category_color: 'indigo',
      available_plans: ['builder', 'maven'],
      seo_title: 'Add Your First Contacts | Prompt Reviews',
      overview_markdown: `## Methods to Add Contacts

### Method 1: CSV Import (Recommended)
The fastest way to add multiple contacts at once.

**Required CSV Columns**:
- first_name (required)
- last_name (required)
- email (required)
- phone (optional)
- company (optional)
- tags (optional)

**Upload Steps**:
1. Go to Contacts → Import Contacts
2. Select your CSV file (max 5MB, up to 10,000 contacts)
3. Map your columns if needed
4. Review and confirm the import

### Method 2: Manual Entry
Add contacts one at a time for precise control.

1. Navigate to Contacts → Add Contact
2. Fill in customer information (name, email, phone)
3. Add relevant tags for organization
4. Optionally add notes about the customer
5. Click "Save Contact"

**Pro Tip**: Use keyboard shortcuts (Ctrl/Cmd + N) to quickly add new contacts.

### Method 3: Integrations (Coming Soon)
Automatically sync contacts from CRMs (Salesforce, HubSpot, Pipedrive) and e-commerce platforms (Shopify, WooCommerce, Square).

## Organizing with Tags

### Recommended Tags
- **vip**: Your best customers
- **new-customer**: First-time buyers
- **repeat**: Returning customers
- **2024**: Year-based segmentation
- **service-name**: Specific service users

### Tag Benefits
- Send targeted review requests
- Track campaign performance
- Personalize messaging
- Filter and search quickly
- Create automated workflows`,
      best_practices: [
        {
          icon: 'Users',
          title: 'Start Small',
          description: 'Begin with your most satisfied customers. They\'re more likely to leave positive reviews.'
        },
        {
          icon: 'CheckCircle',
          title: 'Keep Data Clean',
          description: 'Regularly update contact information and remove bounced emails to maintain list quality.'
        },
        {
          icon: 'Tags',
          title: 'Segment Strategically',
          description: 'Use tags to create meaningful segments for personalized review campaigns.'
        },
        {
          icon: 'Shield',
          title: 'Respect Preferences',
          description: "Honor unsubscribe requests and don't over-contact customers."
        }
      ]
    }
  },

  // 6. First Review Request
  {
    title: 'Send your first review request',
    slug: 'getting-started/first-review-request',
    content: `Learn how to send personalized review requests to your customers through multiple channels.

## Review Request Methods

Prompt Reviews offers multiple ways to reach your customers where they're most comfortable. Choose the method that works best for your business and customer preferences.

- **Email**: Most popular, rich content
- **SMS**: Highest open rate (98%), mobile-first
- **QR Code**: Perfect for in-person interactions
- **Direct Link**: Most flexible, share anywhere`,
    status: 'published',
    metadata: {
      description: 'Learn how to send personalized review requests via email, SMS, QR codes, and direct links using Prompt Reviews.',
      keywords: ['send review request', 'email reviews', 'SMS reviews', 'QR code reviews', 'prompt reviews'],
      canonical_url: 'https://docs.promptreviews.app/getting-started/first-review-request',
      category: 'getting-started',
      category_label: 'Step 5',
      category_icon: 'Send',
      category_color: 'pink',
      available_plans: ['grower', 'builder', 'maven'],
      seo_title: 'Send Your First Review Request | Prompt Reviews',
      overview_markdown: `## Sending Methods

### Method 1: Email Campaigns
Send personalized email invitations with your branding and custom messaging.

**Steps**:
1. Go to Contacts and select recipients
2. Click "Send Review Request"
3. Choose "Email" as delivery method
4. Select your prompt page
5. Customize the email template (or use AI-generated)
6. Preview and send immediately or schedule

**Best Practices**:
- Personalize subject lines with customer names
- Send 3-7 days after service completion
- Keep emails short and action-focused
- Include a clear call-to-action button

### Method 2: SMS Text Messages
Quick and direct with 98% open rates.

**Steps**:
1. Select contacts with phone numbers
2. Choose "SMS" delivery method
3. Craft a concise message (160 characters)
4. Include shortened link to prompt page
5. Send or schedule delivery

**Template Example**: "Hi {first_name}! Thanks for choosing {business}. We'd love your feedback! Leave a review: {link} Reply STOP to opt out."

### Method 3: QR Codes
Perfect for in-person interactions.

**Steps**:
1. Go to your prompt page settings
2. Click "Generate QR Code"
3. Download in PNG/SVG format
4. Print on receipts, cards, or displays

**Where to Display**: Reception desk, table tents, business cards, receipts

### Method 4: Direct Links
Share your prompt page URL anywhere.

**Steps**:
1. Navigate to your prompt page
2. Click "Share" button
3. Copy the unique URL or shortened link
4. Share via any platform

**Where to Share**: WhatsApp/Messenger, social media, email signatures, website buttons

## Timing Your Requests

### Service Businesses
Send within 24-48 hours after service completion. The experience is fresh in their mind, leading to more detailed reviews.

### Product Sales
Wait 5-7 days after delivery. Gives customers time to use the product before reviewing.

### Events/Workshops
Send within 24 hours. Capture feedback while the event experience is still vivid.`,
      best_practices: [
        {
          icon: 'Target',
          title: 'Use Customer Data',
          description: 'Include first name, reference specific service/product, mention purchase date, and add personal touch.'
        },
        {
          icon: 'Smartphone',
          title: 'Optimize for Mobile',
          description: 'Use short subject lines, large tap targets, minimal scrolling, and quick load times.'
        },
        {
          icon: 'Clock',
          title: 'Perfect Your Timing',
          description: 'Send when experience is fresh but not overwhelming - typically 1-3 days after service.'
        },
        {
          icon: 'CheckCircle',
          title: 'Track Your Success',
          description: 'Monitor open rates, click rates, completion rates, and platform distribution in Analytics.'
        }
      ]
    }
  },

  // 7. Review Widget
  {
    title: 'Set up your review widget',
    slug: 'getting-started/review-widget',
    content: `Display your best reviews on your website with customizable widgets that match your brand.

## What is a Review Widget?

Review widgets are embeddable components that display your customer reviews directly on your website. They automatically update with new reviews and can be customized to match your site's design.

- **Build Trust**: Show real customer feedback
- **Customizable**: Match your brand style
- **Responsive**: Works on all devices`,
    status: 'published',
    metadata: {
      description: 'Learn how to create and embed customizable review widgets on your website to showcase customer testimonials.',
      keywords: ['review widget', 'embed reviews', 'website integration', 'review display', 'prompt reviews'],
      canonical_url: 'https://docs.promptreviews.app/getting-started/review-widget',
      category: 'getting-started',
      category_label: 'Step 6',
      category_icon: 'Code',
      category_color: 'teal',
      available_plans: ['grower', 'builder', 'maven'],
      seo_title: 'Set Up Your Review Widget | Prompt Reviews',
      overview_markdown: `## Available Widget Types

### Grid Layout
Display multiple reviews in a clean grid format. Perfect for testimonial pages.
- 2-4 columns responsive grid
- Shows reviewer name and rating
- Expandable review text
- Platform badges (Google, Facebook, etc.)

### Carousel Slider
Auto-rotating reviews that save space. Great for headers and sidebars.
- Smooth auto-rotation
- Manual navigation controls
- Adjustable rotation speed
- Touch/swipe enabled

### Badge Widget
Compact rating summary with star average. Ideal for product pages.
- Average star rating display
- Total review count
- Click to expand reviews
- Minimal space required

### Floating Button
Fixed position button that opens reviews overlay. Non-intrusive option.
- Customizable position
- Opens review modal
- Shows rating preview
- Mobile-friendly

## Creating Your Widget

### Step 1: Navigate to Widgets
From your dashboard, go to "Widgets" → "Create New Widget"

### Step 2: Choose Widget Type
Select Grid, Carousel, Badge, or Floating layout

### Step 3: Select Reviews to Display
- **All Reviews**: Show everything (default)
- **Featured Only**: Hand-picked testimonials
- **4+ Stars**: High ratings only
- **Recent**: Last 30 days

### Step 4: Customize Appearance
**Colors & Style**: Background color, text color, star color, border style, shadow effects
**Display Options**: Number of reviews, show/hide dates, platform badges, reviewer photos, read more links

### Step 5: Preview Your Widget
Preview on desktop and mobile views before publishing

### Step 6: Get Your Embed Code
\`\`\`html
<!-- Prompt Reviews Widget -->
<script src="https://app.promptreviews.app/widget.js"
        data-widget-id="your-widget-id">
</script>
<div id="prompt-reviews-widget"></div>
\`\`\`

## Installation Instructions

### WordPress
1. Go to WordPress admin dashboard
2. Navigate to Appearance → Widgets or use Custom HTML block
3. Paste the embed code
4. Save and preview your site

### Shopify
1. Go to Online Store → Themes
2. Click "Customize" on your theme
3. Add a "Custom HTML" section
4. Paste the widget code and save

### Wix
1. Open your Wix editor
2. Click "Add" → "Embed" → "HTML iframe"
3. Paste the code in HTML Settings
4. Adjust size and position as needed

### Custom Website
1. Open your HTML file in a code editor
2. Paste the code where you want the widget
3. Save and upload to your server
4. Clear cache if needed`,
      best_practices: [
        {
          icon: 'Target',
          title: 'Strategic Placement',
          description: 'Place widgets where they\'ll have maximum impact - homepage, product pages, and checkout.'
        },
        {
          icon: 'Smartphone',
          title: 'Mobile Optimization',
          description: 'Always test on mobile devices. Over 60% of visitors will view on phones.'
        },
        {
          icon: 'Clock',
          title: 'Regular Updates',
          description: 'Widgets auto-update with new reviews, but periodically check appearance.'
        },
        {
          icon: 'Zap',
          title: 'Loading Speed',
          description: "Widget loads asynchronously and won't slow down your site."
        }
      ]
    }
  }
];

async function createOrUpdateArticle(article: ArticlePayload) {
  try {
    // First, check if article exists
    const checkResponse = await fetch(`${API_BASE}/api/admin/help-content?search=${encodeURIComponent(article.slug)}`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!checkResponse.ok) {
      throw new Error(`Failed to check article existence: ${checkResponse.statusText}`);
    }

    const checkData = await checkResponse.json();
    const existingArticle = checkData.articles?.find((a: any) => a.slug === article.slug);

    let response;
    if (existingArticle) {
      // Update existing article
      console.log(`Updating article: ${article.slug}`);
      response = await fetch(`${API_BASE}/api/admin/help-content/${existingArticle.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${ADMIN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(article),
      });
    } else {
      // Create new article
      console.log(`Creating article: ${article.slug}`);
      response = await fetch(`${API_BASE}/api/admin/help-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(article),
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to ${existingArticle ? 'update' : 'create'} article: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log(`✓ Successfully ${existingArticle ? 'updated' : 'created'}: ${article.slug}`);
    return data;
  } catch (error) {
    console.error(`✗ Error with article ${article.slug}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting migration of getting-started pages to CMS...\n');

  if (!ADMIN_API_KEY) {
    console.error('❌ ADMIN_API_KEY environment variable is required');
    process.exit(1);
  }

  const results = {
    succeeded: [] as string[],
    failed: [] as Array<{ slug: string; error: string }>,
  };

  for (const article of articles) {
    try {
      await createOrUpdateArticle(article);
      results.succeeded.push(article.slug);
    } catch (error) {
      results.failed.push({
        slug: article.slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`✓ Succeeded: ${results.succeeded.length}`);
  console.log(`✗ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed articles:');
    results.failed.forEach(({ slug, error }) => {
      console.log(`  - ${slug}: ${error}`);
    });
  }

  console.log('\n✅ Migration complete!');
}

main().catch(console.error);
