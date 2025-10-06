/**
 * Script to populate the CMS with prompt page types content
 * Run with: npx tsx scripts/populate-prompt-types.ts
 */

const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:3002/api/admin/help-content';
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

interface ArticlePayload {
  slug: string;
  title: string;
  content: string;
  metadata: {
    description?: string;
    keywords?: string[];
    canonical_url?: string;
    category?: string;
    category_label?: string;
    category_icon?: string;
    category_color?: string;
    seo_title?: string;
    seo_description?: string;
    available_plans?: string[];
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
    overview_markdown?: string;
    overview_title?: string;
    faqs?: Array<{
      question: string;
      answer: string;
    }>;
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
  status: 'published';
}

const articles: ArticlePayload[] = [
  // Main Types Overview Page
  {
    slug: 'prompt-pages/types',
    title: 'Prompt page types',
    content: `# Prompt Page Types

Choose the perfect prompt page type for your business. Each type is designed for specific use cases and offers unique features to help you collect better reviews.

## Available Types

We offer 7 different prompt page types, each optimized for specific business needs:

### Service Prompt Pages
Perfect for restaurants, salons, and service-based businesses.

### Product Prompt Pages
Ideal for product-based businesses and e-commerce stores.

### Photo Prompt Pages
Collect reviews with customer photos for visual social proof.

### Video Prompt Pages
Collect video reviews for maximum engagement and authenticity.

### Event Prompt Pages
Perfect for events, workshops, and special occasions.

### Employee Prompt Pages
Spotlight individual team members with dedicated review pages.

### Universal Prompt Pages
One-page solution for any type of review collection.

## Choosing the Right Type

Consider your business model, the type of feedback you need, and how you plan to use the reviews when choosing your prompt page type.
`,
    metadata: {
      description: 'Learn about all prompt page types: Service, Product, Photo, Video, Event, Employee, and Universal. Choose the right type for your business needs.',
      keywords: ['prompt page types', 'service reviews', 'product reviews', 'photo reviews', 'video reviews', 'universal prompt page'],
      canonical_url: 'https://docs.promptreviews.app/prompt-pages/types',
      category: 'prompt-pages',
      category_label: 'Page Types',
      category_icon: 'FileText',
      category_color: 'blue',
      seo_title: 'Prompt Page Types - Service, Product, Photo, Video & More',
      seo_description: 'Comprehensive guide to Service, Product, Photo, Video, Event, Employee, and Universal prompt page types.',
      available_plans: ['grower', 'builder', 'maven'],
    },
    status: 'published',
  },

  // Service Page
  {
    slug: 'prompt-pages/types/service',
    title: 'Service Prompt Pages',
    content: `# Service Prompt Pages

Perfect for restaurants, salons, professional services, and any business that provides services to customers. Collect detailed, service-specific reviews that help you improve and grow.

## Why Service Prompt Pages?

Service prompt pages are specifically designed for businesses where the experience and quality of service matter most. They help you collect structured feedback about specific aspects of your service delivery.

## Perfect For

- **Restaurants & Cafes**: Food quality, service, atmosphere
- **Hair Salons**: Styling expertise, customer service, cleanliness
- **Professional Services**: Communication, expertise, results
- **Healthcare**: Patient care, professionalism, outcomes

## Best Practices

### Keep Questions Specific
Ask about specific aspects of your service rather than general satisfaction. For example, instead of "How was your experience?" ask "How was the food quality and presentation?"

### Use Positive Language
Frame questions positively to encourage detailed, constructive feedback. Ask "What did you enjoy most?" rather than focusing on negatives.

### Include Multiple Touchpoints
Cover different aspects of the customer journey from booking to service delivery to follow-up.

### Make It Personal
Use your business name and personalize questions to your specific services.
`,
    metadata: {
      description: 'Learn how to create effective Service prompt pages for restaurants, salons, and service-based businesses. Get more reviews with our proven approach.',
      keywords: ['service prompt pages', 'restaurant reviews', 'salon reviews', 'service business reviews', 'local business reviews'],
      canonical_url: 'https://docs.promptreviews.app/prompt-pages/types/service',
      category: 'prompt-pages',
      category_label: 'Page Types',
      category_icon: 'MessageCircle',
      category_color: 'purple',
      seo_title: 'Service Prompt Pages - Complete Guide',
      seo_description: 'Create effective Service prompt pages to collect better reviews from your customers.',
      available_plans: ['grower', 'builder', 'maven'],
      key_features: [
        {
          icon: 'Star',
          title: 'Service-Focused',
          description: 'Questions specifically designed for service-based businesses'
        },
        {
          icon: 'Users',
          title: 'Customer-Centric',
          description: 'Focus on customer experience and satisfaction'
        },
        {
          icon: 'MapPin',
          title: 'Local SEO',
          description: 'Optimized for local search and business visibility'
        }
      ],
      how_it_works: [
        {
          number: 1,
          icon: 'MessageCircle',
          title: 'Choose Service Type',
          description: 'Select "Service" when creating your prompt page'
        },
        {
          number: 2,
          icon: 'Building',
          title: 'Add Business Info',
          description: 'Include name, address, hours, and contact details'
        },
        {
          number: 3,
          icon: 'Settings',
          title: 'Customize Questions',
          description: 'Add service-specific review prompts'
        },
        {
          number: 4,
          icon: 'Palette',
          title: 'Brand Your Page',
          description: 'Add logo, colors, and custom messaging'
        }
      ],
      best_practices: [
        {
          icon: 'Target',
          title: 'Keep Questions Specific',
          description: 'Ask about specific aspects of your service rather than general satisfaction'
        },
        {
          icon: 'SmilePlus',
          title: 'Use Positive Language',
          description: 'Frame questions positively to encourage detailed, constructive feedback'
        },
        {
          icon: 'Route',
          title: 'Include Multiple Touchpoints',
          description: 'Cover different aspects of the customer journey from booking to follow-up'
        },
        {
          icon: 'Heart',
          title: 'Make It Personal',
          description: 'Use your business name and personalize questions to your specific services'
        }
      ],
    },
    status: 'published',
  },

  // Product Page
  {
    slug: 'prompt-pages/types/product',
    title: 'Product Prompt Pages',
    content: `# Product Prompt Pages

Perfect for e-commerce stores, retail businesses, and any company selling physical or digital products. Collect detailed product-specific reviews that help customers make informed purchase decisions.

## Why Product Prompt Pages?

Product reviews are essential for e-commerce success. They build trust, improve SEO, and help customers make confident purchase decisions.

## Perfect For

- **E-commerce Stores**: Online retailers selling products
- **Product Manufacturers**: Companies making physical goods
- **Digital Products**: Software, courses, downloadable content
- **Handmade/Craft Sellers**: Etsy, artisan products

## Key Features

- Product-specific questions about quality and features
- Purchase context and experience tracking
- Photo upload capability for visual reviews
- Integration with product catalogs

## Best Practices

### Include Product Details
Add product images, specifications, and SKU numbers to help customers remember what they purchased.

### Ask About Use Cases
Understanding how customers use your product provides valuable insights for marketing and development.

### Request Photos
Customer photos provide authentic visual proof and great marketing content.

### Focus on Benefits
Ask how the product improved their life or solved their problem.
`,
    metadata: {
      description: 'Learn how to create effective Product prompt pages for e-commerce and retail businesses. Get more product reviews with our proven approach.',
      keywords: ['product prompt pages', 'product reviews', 'e-commerce reviews', 'retail reviews', 'product feedback'],
      canonical_url: 'https://docs.promptreviews.app/prompt-pages/types/product',
      category: 'prompt-pages',
      category_label: 'Page Types',
      category_icon: 'Gift',
      category_color: 'green',
      seo_title: 'Product Prompt Pages - Complete Guide',
      seo_description: 'Create effective Product prompt pages to collect better product reviews from your customers.',
      available_plans: ['grower', 'builder', 'maven'],
      key_features: [
        {
          icon: 'Package',
          title: 'Product-Focused',
          description: 'Questions specifically about product quality and features'
        },
        {
          icon: 'ShoppingCart',
          title: 'Purchase Context',
          description: 'Capture the complete shopping experience'
        },
        {
          icon: 'TrendingUp',
          title: 'Conversion Boost',
          description: 'Product reviews increase sales conversions'
        }
      ],
      best_practices: [
        {
          icon: 'Image',
          title: 'Include Product Details',
          description: 'Add product images and specifications to help customers remember their purchase'
        },
        {
          icon: 'Lightbulb',
          title: 'Ask About Use Cases',
          description: 'Understanding how customers use your product provides valuable insights'
        },
        {
          icon: 'Camera',
          title: 'Request Photos',
          description: 'Customer photos provide authentic visual proof and marketing content'
        },
        {
          icon: 'Award',
          title: 'Focus on Benefits',
          description: 'Ask how the product improved their life or solved their problem'
        }
      ],
    },
    status: 'published',
  },

  // Photo Page
  {
    slug: 'prompt-pages/types/photo',
    title: 'Photo Prompt Pages',
    content: `# Photo Prompt Pages

Collect reviews with customer photos to create powerful visual testimonials. Perfect for businesses where visual results matter - hair salons, restaurants, home improvement, fitness, and more.

## Why Photo Prompt Pages?

Visual reviews are incredibly powerful. They provide authentic proof of your work, get 5x more engagement than text alone, and become valuable marketing content.

## Perfect Industries

### Beauty & Wellness
- Hair salons - Before/after transformations
- Nail salons - Manicure/pedicure results
- Makeup artists - Client makeovers
- Skincare - Treatment progress photos

### Food & Hospitality
- Restaurants - Dish presentations
- Cafes - Coffee art and pastries
- Bakeries - Custom cakes and treats
- Hotels - Room and amenity photos

### Home Services
- Contractors - Renovation projects
- Landscaping - Garden transformations
- Cleaning - Before/after results
- Interior design - Room makeovers

### Fitness & Health
- Gyms - Member transformations
- Personal trainers - Client progress
- Nutritionists - Diet results
- Yoga studios - Class experiences

## Key Features

- Multiple photo uploads
- Before/after comparisons
- Direct camera capture
- Gallery selection
- Photo galleries and lightbox viewing
- Social sharing capabilities
- Watermark options

## Best Practices

### Make It Easy
Provide clear instructions on what photos to upload. Consider adding example photos to guide customers.

### Respect Privacy
Always get permission before sharing customer photos. Include privacy options in your prompt page.

### Incentivize Uploads
Consider offering incentives for photo reviews, like discounts or entries into contests.

### Moderate Content
Review photos before displaying them publicly to ensure quality and appropriateness.
`,
    metadata: {
      description: 'Learn how to create Photo prompt pages for collecting visual reviews with customer photos. Perfect for showcasing real results.',
      keywords: ['photo prompt pages', 'visual reviews', 'photo testimonials', 'before after photos', 'customer photos'],
      canonical_url: 'https://docs.promptreviews.app/prompt-pages/types/photo',
      category: 'prompt-pages',
      category_label: 'Page Types',
      category_icon: 'Camera',
      category_color: 'pink',
      seo_title: 'Photo Prompt Pages - Visual Reviews Guide',
      seo_description: 'Create Photo prompt pages to collect reviews with customer photos for powerful visual testimonials.',
      available_plans: ['builder', 'maven'],
      key_features: [
        {
          icon: 'Image',
          title: 'Visual Proof',
          description: 'Photos provide authentic proof of your work and results'
        },
        {
          icon: 'Heart',
          title: 'Higher Engagement',
          description: 'Visual reviews get 5x more engagement than text alone'
        },
        {
          icon: 'Sparkles',
          title: 'Marketing Gold',
          description: 'Customer photos become valuable marketing content'
        }
      ],
      best_practices: [
        {
          icon: 'CheckCircle',
          title: 'Make It Easy',
          description: 'Provide clear instructions and example photos to guide customers'
        },
        {
          icon: 'Shield',
          title: 'Respect Privacy',
          description: 'Always get permission before sharing customer photos publicly'
        },
        {
          icon: 'Gift',
          title: 'Incentivize Uploads',
          description: 'Offer incentives like discounts or contest entries for photo reviews'
        },
        {
          icon: 'Eye',
          title: 'Moderate Content',
          description: 'Review photos before displaying them publicly for quality control'
        }
      ],
    },
    status: 'published',
  },

  // Video Page
  {
    slug: 'prompt-pages/types/video',
    title: 'Video Prompt Pages',
    content: `# Video Prompt Pages

Collect powerful video testimonials that showcase authentic customer experiences. Perfect for high-value services, personal brands, and businesses where trust is paramount.

## Why Video Prompt Pages?

Video testimonials are the most trusted form of social proof. They increase conversion rates by up to 80% and help viewers connect emotionally with your brand.

## Perfect For

### High-Value Services
- Business consultants
- Financial advisors
- Real estate agents
- Legal services

### Personal Brands
- Life coaches
- Personal trainers
- Course creators
- Speakers & authors

### Healthcare & Wellness
- Medical practices
- Therapy services
- Wellness centers
- Alternative medicine

### Education & Training
- Online courses
- Bootcamps
- Workshops
- Certification programs

## Video Features

### Recording Options
- In-browser recording
- Mobile device support
- Upload existing videos
- Time limits (30s-5min)

### Production Quality
- HD video quality
- Clear audio capture
- Background blur option
- Preview before submit

## Tips for Success

### Provide Prompts
Give customers 3-5 questions to answer in their video to guide their testimonial.

### Keep It Short
Request 30-60 second videos for higher completion rates and better engagement.

### Timing Matters
Request videos when customers are most excited about their results.

### Make It Easy
Ensure one-click recording with no downloads or sign-ups required.

### Show Examples
Display sample videos so customers know what you're looking for.

### Offer Incentives
Consider offering discounts or bonuses for video testimonials.

## Using Video Testimonials

- **Website Homepage**: Feature video testimonials prominently above the fold
- **Sales Pages**: Include relevant testimonials near calls-to-action
- **Social Media**: Share video testimonials as social proof content
- **Email Marketing**: Include video testimonials in nurture sequences
- **Ad Campaigns**: Use testimonials in video ads for higher conversion
`,
    metadata: {
      description: 'Learn how to create Video prompt pages for collecting powerful video testimonials and reviews from customers.',
      keywords: ['video prompt pages', 'video testimonials', 'video reviews', 'customer testimonials', 'video feedback'],
      canonical_url: 'https://docs.promptreviews.app/prompt-pages/types/video',
      category: 'prompt-pages',
      category_label: 'Page Types',
      category_icon: 'Video',
      category_color: 'red',
      seo_title: 'Video Prompt Pages - Video Testimonials Guide',
      seo_description: 'Create Video prompt pages to collect authentic video testimonials that build trust and credibility.',
      available_plans: ['maven'],
      key_features: [
        {
          icon: 'Award',
          title: 'Maximum Authenticity',
          description: 'Video testimonials are the most trusted form of social proof'
        },
        {
          icon: 'TrendingUp',
          title: 'Higher Conversion',
          description: 'Video testimonials increase conversion rates by up to 80%'
        },
        {
          icon: 'Users',
          title: 'Personal Connection',
          description: 'Viewers connect emotionally with video testimonials'
        }
      ],
      best_practices: [
        {
          icon: 'MessageSquare',
          title: 'Provide Prompts',
          description: 'Give customers 3-5 questions to guide their video testimonial'
        },
        {
          icon: 'Clock',
          title: 'Keep It Short',
          description: 'Request 30-60 second videos for higher completion rates'
        },
        {
          icon: 'Timer',
          title: 'Timing Matters',
          description: 'Request videos when customers are most excited about results'
        },
        {
          icon: 'Zap',
          title: 'Make It Easy',
          description: 'Ensure one-click recording with no downloads required'
        }
      ],
    },
    status: 'published',
  },

  // Event Page
  {
    slug: 'prompt-pages/types/event',
    title: 'Event Prompt Pages',
    content: `# Event Prompt Pages

Capture feedback from events, workshops, conferences, and special occasions. Perfect for event planners, venues, educators, and anyone hosting memorable experiences.

## Why Event Prompt Pages?

Event-specific feedback is time-sensitive and context-rich. Collecting reviews while memories are fresh helps you improve future events and build credibility.

## Perfect Event Types

### Corporate Events
- Conferences & summits
- Team building events
- Product launches
- Company celebrations

### Social Events
- Weddings & receptions
- Birthday parties
- Anniversary celebrations
- Reunions & gatherings

### Educational Events
- Workshops & masterclasses
- Seminars & webinars
- Training sessions
- Certification courses

### Entertainment Events
- Concerts & performances
- Festivals & fairs
- Sports events
- Art exhibitions

## Event-Specific Features

### Event Details
- Event name and date
- Venue information
- Ticket type tracking
- Session/speaker feedback

### Feedback Options
- Overall event rating
- Specific aspect ratings
- Photo sharing from event
- Improvement suggestions

## Sample Questions

### Conference/Workshop
- How valuable was the content presented?
- Which session was most beneficial?
- How was the venue and facilities?
- Would you attend our next event?

### Wedding/Social Event
- How was the venue and atmosphere?
- How was the food and service?
- What was your favorite moment?
- Would you recommend our venue?

### Entertainment Event
- How was the overall experience?
- Was the event worth the price?
- How was the organization and flow?
- Would you attend similar events?

## Best Practices

### Send Quickly
Request feedback within 24-48 hours while the experience is fresh.

### Be Specific
Reference specific aspects of the event in your questions.

### Keep It Short
Limit to 5-7 questions for higher completion rates.

### Offer Incentives
Consider early-bird discounts for next event to reviewers.
`,
    metadata: {
      description: 'Learn how to create Event prompt pages for collecting reviews from workshops, conferences, weddings, and special occasions.',
      keywords: ['event prompt pages', 'event reviews', 'workshop feedback', 'conference reviews', 'wedding reviews'],
      canonical_url: 'https://docs.promptreviews.app/prompt-pages/types/event',
      category: 'prompt-pages',
      category_label: 'Page Types',
      category_icon: 'Calendar',
      category_color: 'yellow',
      seo_title: 'Event Prompt Pages - Event Reviews Guide',
      seo_description: 'Create Event prompt pages to collect feedback from attendees and showcase successful events.',
      available_plans: ['builder', 'maven'],
      key_features: [
        {
          icon: 'Clock',
          title: 'Time-Specific',
          description: 'Capture feedback while memories are fresh'
        },
        {
          icon: 'Users',
          title: 'Attendee Insights',
          description: 'Understand what resonated with your audience'
        },
        {
          icon: 'Sparkles',
          title: 'Social Proof',
          description: 'Build credibility for future events'
        }
      ],
      best_practices: [
        {
          icon: 'Send',
          title: 'Send Quickly',
          description: 'Request feedback within 24-48 hours while experience is fresh'
        },
        {
          icon: 'Target',
          title: 'Be Specific',
          description: 'Reference specific aspects of the event in your questions'
        },
        {
          icon: 'List',
          title: 'Keep It Short',
          description: 'Limit to 5-7 questions for higher completion rates'
        },
        {
          icon: 'Gift',
          title: 'Offer Incentives',
          description: 'Consider early-bird discounts for reviewers'
        }
      ],
    },
    status: 'published',
  },

  // Employee Page
  {
    slug: 'prompt-pages/types/employee',
    title: 'Employee Prompt Pages',
    content: `# Employee Prompt Pages

Spotlight individual team members with dedicated review pages. Perfect for recognizing exceptional service, building employee morale, and helping customers connect with specific team members.

## Why Employee Prompt Pages?

Individual employee reviews help recognize top performers, build team morale with positive feedback, and create personal connections between customers and team members.

## Perfect For

### Service Businesses
- Hair salons & barbershops
- Spa & wellness centers
- Restaurants & cafes
- Hotels & hospitality

### Sales Teams
- Real estate agents
- Car dealerships
- Insurance agents
- Financial advisors

### Healthcare
- Doctors & specialists
- Dentists & hygienists
- Therapists & counselors
- Veterinarians

### Professional Services
- Consultants
- Lawyers
- Accountants
- Personal trainers

## Employee Page Features

### Profile Elements
- Employee photo and bio
- Role and specializations
- Years of experience
- Certifications and awards

### Review Options
- Service quality rating
- Communication skills
- Expertise assessment
- Would recommend rating

## Benefits

### Performance Insights
Get direct customer feedback about individual employee performance to identify stars and areas for improvement.

### Competitive Advantage
Stand out by showcasing your team's expertise and excellent service through individual reviews.

### Employee Retention
Boost employee satisfaction and retention by recognizing their contributions publicly.

### Customer Loyalty
Build stronger customer relationships by connecting them with their favorite team members.

## Implementation Tips

### Start with Top Performers
Begin by creating pages for your best employees to generate positive reviews quickly.

### Include in Email Signatures
Add employee review links to email signatures for easy customer access.

### Display on Name Tags
Add QR codes to employee name tags or business cards for in-person interactions.

### Celebrate Successes
Share positive reviews in team meetings and on social media to boost morale.
`,
    metadata: {
      description: 'Learn how to create Employee prompt pages to spotlight individual team members and collect reviews about specific employees.',
      keywords: ['employee prompt pages', 'team member reviews', 'staff reviews', 'employee recognition', 'individual reviews'],
      canonical_url: 'https://docs.promptreviews.app/prompt-pages/types/employee',
      category: 'prompt-pages',
      category_label: 'Page Types',
      category_icon: 'User',
      category_color: 'indigo',
      seo_title: 'Employee Prompt Pages - Team Member Reviews',
      seo_description: 'Create Employee prompt pages to recognize team members and collect customer feedback about specific employees.',
      available_plans: ['builder', 'maven'],
      key_features: [
        {
          icon: 'Award',
          title: 'Recognition',
          description: 'Recognize and reward exceptional team members'
        },
        {
          icon: 'Heart',
          title: 'Morale Boost',
          description: 'Build team morale with positive customer feedback'
        },
        {
          icon: 'Users',
          title: 'Personal Connection',
          description: 'Help customers connect with specific team members'
        }
      ],
      best_practices: [
        {
          icon: 'Star',
          title: 'Start with Top Performers',
          description: 'Create pages for your best employees to generate positive reviews quickly'
        },
        {
          icon: 'Mail',
          title: 'Include in Email Signatures',
          description: 'Add employee review links to email signatures for easy access'
        },
        {
          icon: 'QrCode',
          title: 'Display on Name Tags',
          description: 'Add QR codes to name tags or business cards'
        },
        {
          icon: 'PartyPopper',
          title: 'Celebrate Successes',
          description: 'Share positive reviews in team meetings and social media'
        }
      ],
    },
    status: 'published',
  },

  // Universal Page
  {
    slug: 'prompt-pages/types/universal',
    title: 'The Universal Prompt Page',
    content: `# The Universal Prompt Page

The all-purpose review collection solution. One page that works for any customer, any time, anywhere. Perfect for businesses that want a simple, always-ready review collection tool.

## Why The Universal Prompt Page?

The Universal Prompt Page provides a single, permanent link and QR code that works for every customer interaction. It's the simplest way to start collecting reviews immediately.

## Key Benefits

### Always Ready
One link that works for every customer interaction - no need to create different pages for different situations.

### Simple Setup
Create once, use everywhere forever. Your link and QR code never change.

### Universal Compatibility
Works for any business type and any customer scenario.

## Key Features

### QR Code Generation
Automatically generates a QR code for your universal page, perfect for:
- Business cards
- Table tents
- Receipts
- Physical signage
- Vehicle wraps
- Marketing materials

### One Simple Link
A single, memorable link to share via:
- Email signatures
- Text messages
- Social media bios
- Website headers/footers
- Newsletter footers

## Perfect Use Cases

### Business Cards & Marketing Materials
Add your universal QR code to all printed materials. Customers can scan and leave a review anytime.

### Physical Locations
Display your QR code at:
- Front desk displays
- Table tents and counters
- Window stickers
- Reception area posters
- Waiting areas

### Digital Communications
Include your universal link in:
- Email signatures
- Newsletter footers
- Social media bios
- Website headers/footers
- Auto-reply messages

## Universal vs. Specific Pages

### Use Universal When:
- You want one simple solution
- General reviews are sufficient
- You need QR codes for physical locations
- Simplicity is priority
- You're just getting started

### Use Specific Pages When:
- You need targeted feedback
- Tracking specific services/products
- Personalization matters
- Different customer segments
- Advanced analytics needed

## How It Works

1. **Create Your Page**: Set up your universal page once with business information and branding
2. **Get Your Assets**: Download QR code and copy your unique link (they never change)
3. **Share Everywhere**: Add to all touchpoints - physical and digital
4. **Collect Reviews**: Customers visit, write reviews with AI assistance, and submit

## Best Practices

### Make It Visible
Place QR codes where customers naturally look - receipts, counters, waiting areas.

### Include Instructions
Add "Scan to Review" or similar text near QR codes to clarify the action.

### Train Your Team
Ensure all employees know about the universal page and can guide customers.

### Monitor Performance
Track which placement locations generate the most scans and reviews.
`,
    metadata: {
      description: 'Learn about the Universal Prompt Page - the all-purpose review collection solution for any business type.',
      keywords: ['universal prompt page', 'general reviews', 'QR code reviews', 'all-purpose reviews', 'simple review pages'],
      canonical_url: 'https://docs.promptreviews.app/prompt-pages/types/universal',
      category: 'prompt-pages',
      category_label: 'Page Types',
      category_icon: 'Globe',
      category_color: 'cyan',
      seo_title: 'The Universal Prompt Page - One Page for All Reviews',
      seo_description: 'Learn about the Universal Prompt Page for simple, effective review collection that works for any business.',
      available_plans: ['grower', 'builder', 'maven'],
      key_features: [
        {
          icon: 'Zap',
          title: 'Always Ready',
          description: 'One link that works for every customer interaction'
        },
        {
          icon: 'Clock',
          title: 'Simple Setup',
          description: 'Create once, use everywhere forever'
        },
        {
          icon: 'QrCode',
          title: 'QR Code Included',
          description: 'Automatic QR code generation for physical locations'
        },
        {
          icon: 'Link',
          title: 'One Simple Link',
          description: 'Memorable link to share anywhere'
        }
      ],
      how_it_works: [
        {
          number: 1,
          icon: 'Settings',
          title: 'Create Your Page',
          description: 'Set up once with your business information and branding'
        },
        {
          number: 2,
          icon: 'Download',
          title: 'Get Your Assets',
          description: 'Download QR code and copy your unique link'
        },
        {
          number: 3,
          icon: 'Share2',
          title: 'Share Everywhere',
          description: 'Add to all touchpoints - physical and digital'
        },
        {
          number: 4,
          icon: 'Star',
          title: 'Collect Reviews',
          description: 'Customers visit, write reviews, and submit to platforms'
        }
      ],
      best_practices: [
        {
          icon: 'Eye',
          title: 'Make It Visible',
          description: 'Place QR codes where customers naturally look'
        },
        {
          icon: 'MessageCircle',
          title: 'Include Instructions',
          description: 'Add "Scan to Review" text near QR codes'
        },
        {
          icon: 'Users',
          title: 'Train Your Team',
          description: 'Ensure employees can guide customers to the page'
        },
        {
          icon: 'BarChart',
          title: 'Monitor Performance',
          description: 'Track which placements generate the most reviews'
        }
      ],
    },
    status: 'published',
  },
];

async function createArticle(article: ArticlePayload) {
  try {
    const response = await fetch(ADMIN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_SECRET}`,
      },
      body: JSON.stringify(article),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create article ${article.slug}: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    console.log(`✓ Created: ${article.slug}`);
    return result;
  } catch (error) {
    console.error(`✗ Failed: ${article.slug}`, error);
    throw error;
  }
}

async function main() {
  console.log('Populating CMS with prompt page types content...\n');

  for (const article of articles) {
    await createArticle(article);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✓ Successfully created ${articles.length} articles`);
}

main().catch(console.error);
