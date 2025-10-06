#!/usr/bin/env ts-node

/**
 * Import strategies pages to CMS
 *
 * This script extracts content from static strategy pages and imports them
 * into the Supabase articles table for CMS management.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Article data extracted from the static pages
const articles = [
  {
    slug: 'strategies',
    title: 'How to get more customer reviews',
    content: `# How to Get More Customer Reviews: 6 Proven Strategies

Collecting reviews isn't just about asking—it's about understanding human psychology, building genuine connections, and creating experiences that make people want to share their thoughts.

## Why These Strategies Work

Our proven strategies can increase your review collection by 300%. They're based on psychology, personal relationships, and unique approaches that set you apart from competitors.

## The 6 Strategies

1. **The Double-Dip Strategy** - Import existing Google reviews and turn them into prompt pages to collect reviews on other platforms
2. **Psychology of Reciprocity** - Use proven psychological principles to increase review response rates
3. **Personal Outreach Mastery** - Build one-on-one connections for better relationships and reviews
4. **Smart Non-AI Techniques** - Use kickstarters, templates, and examples to help customers write reviews
5. **AI Novelty Factor** - Leverage the unique AI experience to create delightful interactions
6. **Reviews on the Fly** - Collect reviews in-person while customers are still excited
`,
    metadata: {
      description: 'Increase your customer reviews by 300% with these 6 proven strategies. Learn the psychology, timing, and techniques that actually work for review collection.',
      keywords: [
        'how to get more customer reviews',
        'increase customer reviews',
        'customer review strategies',
        'review collection techniques',
        'get more reviews',
        'customer review psychology',
        'review marketing strategies',
        '300% increase reviews'
      ],
      canonical_url: 'https://docs.promptreviews.app/strategies',
      category: 'strategies',
      category_label: 'Review Collection',
      category_icon: 'Target',
      category_color: 'blue',
      seo_title: 'How to Get More Customer Reviews: 6 Proven Strategies That Work',
      seo_description: 'Increase your customer reviews by 300% with these 6 proven strategies. Learn the psychology, timing, and techniques that actually work for review collection.',
      available_plans: ['grower', 'builder', 'maven'],
      key_features: [
        {
          icon: 'Target',
          title: 'The Double-Dip Strategy',
          description: 'Import existing Google reviews and turn them into prompt pages to collect reviews on other platforms - increasing reviews by 300%.',
          href: '/strategies/double-dip'
        },
        {
          icon: 'Heart',
          title: 'Psychology of Reciprocity',
          description: 'Use proven psychological principles to increase review response rates after providing exceptional value to customers.',
          href: '/strategies/reciprocity'
        },
        {
          icon: 'Users',
          title: 'Personal Outreach Mastery',
          description: 'Why one-on-one connections are more effective than mass requests for building lasting customer relationships.',
          href: '/strategies/personal-outreach'
        },
        {
          icon: 'Lightbulb',
          title: 'Smart Non-AI Techniques',
          description: 'Use kickstarters, recent reviews, and personalized templates to help customers write detailed, authentic reviews.',
          href: '/strategies/non-ai-strategies'
        },
        {
          icon: 'Sparkles',
          title: 'AI Novelty Factor',
          description: 'Leverage the unique experience of AI-powered review writing to create delightful customer interactions.',
          href: '/strategies/novelty'
        },
        {
          icon: 'Zap',
          title: 'Reviews on the Fly',
          description: 'Collect reviews in-person by highlighting the speed and ease of your review process with QR codes and mobile optimization.',
          href: '/strategies/reviews-on-fly'
        }
      ],
      how_it_works: [
        {
          number: 1,
          title: 'Choose Your Strategy',
          description: 'Select the approach that best fits your business model, customer relationships, and review collection goals.',
          icon: 'Target'
        },
        {
          number: 2,
          title: 'Understand the Psychology',
          description: 'Learn why each strategy works by understanding customer psychology, timing, and motivation factors.',
          icon: 'Brain'
        },
        {
          number: 3,
          title: 'Implement the Technique',
          description: 'Follow our step-by-step guides to implement your chosen strategies with proven templates and best practices.',
          icon: 'CheckCircle'
        },
        {
          number: 4,
          title: 'Track and Optimize',
          description: 'Monitor your results and combine multiple strategies to maximize your review collection effectiveness.',
          icon: 'TrendingUp'
        }
      ],
      best_practices: [
        {
          icon: 'Clock',
          title: 'Perfect Your Timing',
          description: 'Ask for reviews when customers are most satisfied—right after a great experience or successful service completion. The "peak-end rule" suggests people remember peaks and endings most vividly.'
        },
        {
          icon: 'MessageCircle',
          title: 'Make It Personal',
          description: 'Use customer names, reference specific interactions, and show you remember their experience. Personalization can increase response rates by up to 50%.'
        },
        {
          icon: 'Star',
          title: 'Lower the Barrier',
          description: 'Make the review process as easy as possible. Provide templates, bullet points, or AI assistance. Even simple bullet points can be incredibly valuable.'
        },
        {
          icon: 'TrendingUp',
          title: 'Follow Up Strategically',
          description: "Don't just ask once. Follow up with different approaches, but always be respectful of their time. Multiple touchpoints can increase response rates by 2-3x."
        }
      ],
      overview_title: 'Why Strategies Matter',
      overview_markdown: `Collecting reviews isn't just about asking—it's about understanding human psychology, building genuine connections, and creating experiences that make people want to share their thoughts.

### Results You Can Expect

- **Increase Reviews by 300%**: Proven techniques that increase review collection by 3-5x
- **Better Relationships**: Build trust and loyalty while collecting authentic feedback
- **Quality Reviews**: Get detailed, helpful reviews that actually benefit your business`,
      faqs: [
        {
          question: 'Which strategy should I start with?',
          answer: 'Start with the Double-Dip strategy if you have existing Google reviews. Otherwise, begin with Personal Outreach to build strong relationships.'
        },
        {
          question: 'Can I use multiple strategies together?',
          answer: 'Absolutely! The strategies work great together. Many businesses combine Personal Outreach with Reviews on the Fly for maximum results.'
        },
        {
          question: 'How long does it take to see results?',
          answer: 'Most businesses see an increase in reviews within the first week. Full results typically show within 30 days of consistent implementation.'
        }
      ],
      call_to_action: {
        primary: {
          text: 'Learn Double-Dip Strategy',
          href: '/strategies/double-dip'
        }
      }
    },
    status: 'published'
  },
  {
    slug: 'strategies/double-dip',
    title: 'Double your reviews',
    content: `# The Double-Dip Strategy: Turn Google Reviews into Yelp, Facebook & More

The Double-Dip strategy takes your existing Google reviews and turns them into opportunities to get reviews on Yelp, Facebook, and other platforms. It's like getting a second scoop of reviews from customers who already love you!

## How It Works

### 1. Import Your Google Reviews

Start by importing your existing Google Business reviews into Prompt Reviews. This gives you a database of customers who have already left positive feedback.

**Pro tip:** Focus on 4-5 star reviews first, as these customers are most likely to help you again.

### 2. Create Personalized Prompt Pages with Imported Reviews

When you create a prompt page from a Google contact, you can automatically import their existing Google review! This pre-fills their review content, making it incredibly easy for them to share on other platforms.

**Key Feature:** Their Google review is imported automatically, allowing customers to:
- Reference their previous review for consistency
- Post it as-is to save time
- Easily modify or expand on their original thoughts
- Add new experiences since their Google review

**Best Practice:** While customers can post their review as-is, encouraging them to modify it slightly for each platform helps avoid duplicate content issues and makes reviews appear more authentic.

### 3. Request Cross-Platform Reviews

Send the personalized prompt page to each customer, asking them to either update their existing review or share their experience on a different platform (Yelp, Facebook, industry-specific sites, etc.).

## Real Example

**Original Google Review:**
> ⭐⭐⭐⭐⭐ "Amazing service! The team was professional and completed our kitchen renovation on time and under budget. The quality is outstanding and they really listened to our vision. Highly recommend!" - Sarah M.

**Double-Dip Email:**
> Hi Sarah! Thank you for your wonderful Google review! We're trying to grow our presence on Facebook and would love if you could share your experience there as well. Click this link to see your original review (which you can edit or rewrite with AI). Then just click "Copy & submit" to post on Facebook!

**Result:** Sarah updates her Google review AND posts on Yelp, effectively doubling your review presence from one satisfied customer.

## Advanced: The Triple-Dip

Once you've mastered the Double-Dip, you can attempt the Triple-Dip: asking customers to share their experience on a third platform or in a different format (like a video testimonial or case study).

**Triple-Dip Challenge:** If you successfully get a customer to review on three different platforms, you've achieved the rare Triple-Dip! 🎉

## The Legendary Quadruple-Dip

The mythical Quadruple-Dip: when a customer reviews on four different platforms or formats. This is the holy grail of review collection—so rare that we want to hear about it!

🏆 If anyone successfully achieves a Quadruple-Dip, we want to hear about it! Share your success story with our team.
`,
    metadata: {
      description: 'Learn how to get reviews on multiple platforms from one customer. Import Google reviews and turn them into Yelp, Facebook, and other platform reviews.',
      keywords: [
        'double your reviews',
        'get reviews on multiple platforms',
        'Google reviews to Yelp',
        'cross platform reviews',
        'multiple platform reviews',
        'turn Google reviews into other reviews',
        'review multiplication strategy'
      ],
      canonical_url: 'https://docs.promptreviews.app/strategies/double-dip',
      category: 'strategies',
      category_label: 'Review Collection',
      category_icon: 'Target',
      category_color: 'blue',
      seo_title: 'Double Your Reviews: Turn Google Reviews into Yelp, Facebook & More',
      seo_description: 'Learn how to get reviews on multiple platforms from one customer. Import Google reviews and turn them into Yelp, Facebook, and other platform reviews.',
      available_plans: ['grower', 'builder', 'maven'],
      best_practices: [
        {
          icon: 'Users',
          title: 'Offer Multiple Options',
          description: 'Give customers a choice of platforms to review on. Not everyone has accounts on all platforms, so offering 2-3 options increases your success rate.'
        },
        {
          icon: 'Target',
          title: 'Be Specific',
          description: 'Reference specific details from their original review. Show them you remember and value their feedback. Personalization increases response rates by up to 50%.'
        },
        {
          icon: 'Zap',
          title: 'Make it Easy',
          description: 'Provide clear instructions and multiple platform options. Include direct links to the platforms you want reviews on.'
        },
        {
          icon: 'Heart',
          title: 'Show Appreciation',
          description: 'Always thank them for their original review and explain how it helped your business. Gratitude builds stronger relationships and increases willingness to help.'
        }
      ]
    },
    status: 'published'
  }
  // Add more articles here...
];

async function importArticles() {
  console.log('Starting article import...\n');

  for (const article of articles) {
    console.log(`Importing: ${article.slug}...`);

    // Check if article already exists
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', article.slug)
      .single();

    if (existing) {
      // Update existing article
      const { error } = await supabase
        .from('articles')
        .update({
          title: article.title,
          content: article.content,
          metadata: article.metadata,
          status: article.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error(`  ❌ Error updating ${article.slug}:`, error);
      } else {
        console.log(`  ✅ Updated ${article.slug}`);
      }
    } else {
      // Insert new article
      const { error } = await supabase
        .from('articles')
        .insert({
          slug: article.slug,
          title: article.title,
          content: article.content,
          metadata: article.metadata,
          status: article.status,
          published_at: article.status === 'published' ? new Date().toISOString() : null
        });

      if (error) {
        console.error(`  ❌ Error inserting ${article.slug}:`, error);
      } else {
        console.log(`  ✅ Inserted ${article.slug}`);
      }
    }
  }

  console.log('\n✨ Import complete!');
}

importArticles().catch(console.error);
