/**
 * Script to seed Google Business Profile documentation articles
 * Run with: npx ts-node scripts/seed-google-business-articles.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const articles = [
  {
    slug: 'google-business',
    title: 'Google Business Profile Integration',
    content: `# Google Business Profile Integration

Connect your Google Business Profile to manage reviews, respond to customers, create posts, and handle multiple locations—all from your Prompt Reviews dashboard.

## Why Connect Your Google Business Profile?

Google Business Profile is one of the most important tools for local businesses. By connecting it to Prompt Reviews, you can:

- **Centralize Review Management**: View and respond to Google reviews alongside reviews from other platforms
- **Streamline Responses**: Use AI-powered response suggestions to maintain quick response times
- **Import Reviews**: Bring your existing Google reviews into Prompt Reviews for website widgets and marketing
- **Manage Multiple Locations**: Handle all your business locations from a single dashboard
- **Track Performance**: Monitor review trends and customer sentiment over time

## Getting Started

To connect your Google Business Profile:

1. Navigate to the Google Business section in your dashboard
2. Click "Connect Google Business Profile"
3. Sign in with your Google account (must be an owner or manager)
4. Grant the requested permissions
5. Select which locations to connect

Once connected, you can manage reviews, create posts, and leverage all the features Prompt Reviews offers for Google Business Profile.`,
    status: 'published',
    metadata: {
      description: 'Connect your Google Business Profile to manage reviews, respond to customers, create posts, and handle multiple locations—all from your Prompt Reviews dashboard.',
      category: 'integrations',
      category_label: 'Google Business Profile',
      category_icon: 'Building2',
      category_color: 'red',
      keywords: ['google business profile', 'gbp', 'reviews', 'integration', 'local seo'],
      tags: ['integration', 'reviews', 'google'],
      available_plans: ['grower', 'builder', 'maven'],
      seo_title: 'Google Business Profile Integration - Prompt Reviews Help',
      seo_description: 'Learn how to connect and manage your Google Business Profile with Prompt Reviews. Centralize review management, respond to customers, and handle multiple locations.',
    }
  },
  {
    slug: 'google-business/bulk-updates',
    title: 'Bulk Updates for Multiple Locations',
    content: `# Bulk Updates for Multiple Locations

Efficiently manage multiple Google Business Profile locations with bulk editing capabilities. Perfect for franchises, chains, and multi-location businesses.

## What You Can Do with Bulk Updates

- **Create Posts Across Locations**: Publish announcements, offers, and updates to multiple locations simultaneously
- **Upload Photos**: Add new images to all your locations at once for consistent branding
- **Update Business Information**: Make changes to multiple profiles in one action
- **Schedule Content**: Plan and schedule posts to go live across all locations

## How to Use Bulk Updates

1. Connect all your Google Business Profile locations
2. Navigate to the bulk updates section
3. Select which locations should receive the update
4. Create your post, upload photos, or make information changes
5. Review and publish to all selected locations

## Best Practices

- **Maintain Brand Consistency**: Use bulk updates to ensure all locations have the same branding and messaging
- **Location-Specific Customization**: While bulk updates save time, consider customizing certain details for each location
- **Regular Updates**: Keep all your profiles active with weekly bulk posts
- **Photo Quality**: Use high-quality images that represent your brand well across all locations`,
    status: 'published',
    metadata: {
      description: 'Efficiently manage multiple Google Business Profile locations with bulk editing capabilities for posts, photos, and business information.',
      category: 'google-business',
      category_label: 'Google Business Profile',
      category_icon: 'Layers',
      category_color: 'red',
      keywords: ['bulk updates', 'multiple locations', 'franchise', 'chain business'],
      tags: ['bulk-editing', 'multi-location', 'efficiency'],
      available_plans: ['builder', 'maven'],
      seo_title: 'Bulk Updates for Multiple Google Business Locations',
      seo_description: 'Learn how to efficiently manage multiple Google Business Profile locations with bulk posts, photos, and updates.',
    }
  },
  {
    slug: 'google-business/business-info',
    title: 'Managing Business Information',
    content: `# Managing Business Information

Keep your Google Business Profile information accurate and up-to-date to improve local search visibility and customer experience.

## Key Business Information Fields

- **Business Name**: Your official business name (must match real-world signage)
- **Address**: Your physical location (critical for local SEO)
- **Phone Number**: Primary contact number
- **Website**: Link to your main website
- **Hours**: Regular hours and special hours for holidays
- **Categories**: Primary and additional business categories
- **Attributes**: Features like "wheelchair accessible", "outdoor seating", etc.

## Why Accurate Information Matters

Google uses your business information to:
- Determine when to show your profile in search results
- Calculate relevance for location-based searches
- Build trust with potential customers
- Enable features like direct calling and navigation

## Updating Your Information

1. Navigate to the business info section
2. Review all fields for accuracy
3. Make necessary updates
4. Save changes (they may require Google verification)
5. Monitor for any user-suggested edits

## Tips for Optimization

- **Consistency**: Ensure your business information matches across all platforms (website, social media, directories)
- **Completeness**: Fill out every applicable field
- **Accuracy**: Double-check phone numbers, addresses, and hours
- **Regular Updates**: Keep special hours updated for holidays and events
- **Categories**: Choose the most specific categories that apply to your business`,
    status: 'published',
    metadata: {
      description: 'Learn how to manage and optimize your Google Business Profile information for better local search visibility.',
      category: 'google-business',
      category_label: 'Google Business Profile',
      category_icon: 'Building2',
      category_color: 'red',
      keywords: ['business information', 'local seo', 'business profile', 'accuracy'],
      tags: ['business-info', 'optimization', 'local-seo'],
      available_plans: ['grower', 'builder', 'maven'],
      seo_title: 'Managing Google Business Profile Information',
      seo_description: 'Keep your Google Business Profile accurate and optimized. Learn best practices for business information management.',
    }
  },
  {
    slug: 'google-business/categories-services',
    title: 'Categories and Services',
    content: `# Categories and Services

Properly categorizing your business and listing your services helps Google understand what you offer and when to show your profile in search results.

## Business Categories

### Primary Category
Your primary category is the most important classification and should precisely describe your main business type. Choose carefully, as this significantly impacts when your profile appears in search results.

### Additional Categories
You can add up to 9 additional categories to cover other aspects of your business. These help you appear in more relevant searches.

### Category Best Practices
- Be specific rather than generic
- Don't use categories you don't qualify for
- Review category options regularly as Google adds new ones
- Consider competitive categories in your area

## Services

Listing your services provides detailed information about what you offer, which can:
- Appear in search results when customers search for specific services
- Help you rank for service-related keywords
- Improve click-through rates by showing exactly what you do
- Support "near me" searches for specific services

### Adding Services

1. Navigate to the services section
2. Add service names, descriptions, and pricing (if applicable)
3. Group related services into categories
4. Keep service descriptions clear and benefit-focused
5. Update pricing regularly

### Service Optimization Tips

- **Use Keywords**: Include terms customers actually search for
- **Be Specific**: "Kitchen Remodeling" is better than "Remodeling"
- **Include Pricing**: Transparency builds trust and can increase conversions
- **Regular Updates**: Keep services current and remove discontinued offerings
- **Descriptions**: Explain what's included and what makes your service unique`,
    status: 'published',
    metadata: {
      description: 'Learn how to optimize your Google Business Profile categories and services to improve search visibility and attract customers.',
      category: 'google-business',
      category_label: 'Google Business Profile',
      category_icon: 'Tag',
      category_color: 'red',
      keywords: ['categories', 'services', 'local seo', 'business classification'],
      tags: ['categories', 'services', 'optimization'],
      available_plans: ['grower', 'builder', 'maven'],
      seo_title: 'Google Business Profile Categories & Services Guide',
      seo_description: 'Optimize your business categories and service listings for better Google search visibility and customer discovery.',
    }
  },
  {
    slug: 'google-business/image-upload',
    title: 'Image Upload and Management',
    content: `# Image Upload and Management

High-quality photos are one of the most important elements of your Google Business Profile. Businesses with photos receive significantly more clicks and engagement.

## Why Photos Matter

- **42% more requests for directions** to businesses with photos
- **35% more clicks** through to websites
- Photos appear in Google search results and Maps
- Customers want to see what they're getting before visiting
- Visual content builds trust and credibility

## Types of Photos

### Logo
Your business logo appears in search results and helps with brand recognition.

### Cover Photo
The main photo that represents your business in Google Search and Maps.

### Additional Photos
- **Exterior**: Outside view of your location
- **Interior**: Inside your business
- **Products**: What you sell
- **Services**: Your team at work
- **Food & Drink**: Menu items (for restaurants)
- **Team**: Your staff
- **Common Areas**: Shared spaces

## Photo Requirements

- **Format**: JPG or PNG
- **Size**: Between 10 KB and 5 MB
- **Resolution**: Minimum 720px wide by 720px tall
- **Quality**: High-resolution, well-lit, in focus
- **Content**: Must represent your actual business

## Photo Best Practices

1. **Use High-Quality Images**: Sharp, well-lit, professional-looking
2. **Show Variety**: Mix of interior, exterior, products, services, and team
3. **Keep Updated**: Add new photos regularly (at least monthly)
4. **Authentic**: Use real photos, not stock images
5. **People**: Include photos with people when possible (with permission)
6. **Seasonal**: Update photos for seasons and special events
7. **Consistency**: Maintain brand consistency across all images

## Uploading Photos

You can upload photos through:
- Prompt Reviews bulk upload feature (for multiple locations)
- Google Business Profile Manager
- The Google Maps app
- Direct uploads from customers (monitor and manage these)

## Managing Customer Photos

Customers can also upload photos to your profile. While you can't delete customer photos, you can:
- Flag inappropriate images for removal
- Upload your own photos to increase the ratio of professional images
- Thank customers who post helpful photos`,
    status: 'published',
    metadata: {
      description: 'Learn best practices for uploading and managing photos on your Google Business Profile to increase engagement and clicks.',
      category: 'google-business',
      category_label: 'Google Business Profile',
      category_icon: 'Image',
      category_color: 'red',
      keywords: ['photos', 'images', 'visual content', 'google business photos'],
      tags: ['photos', 'images', 'visual-content'],
      available_plans: ['grower', 'builder', 'maven'],
      seo_title: 'Google Business Profile Photo Upload Guide',
      seo_description: 'Master photo uploads for your Google Business Profile. Learn requirements, best practices, and optimization tips.',
    }
  },
  {
    slug: 'google-business/review-import',
    title: 'Review Import',
    content: `# Review Import

Import your existing Google reviews into Prompt Reviews to display them on your website, run double-dip campaigns, and track customer sentiment.

## Why Import Google Reviews?

- **Website Display**: Show your Google reviews on your website with widgets
- **Double-Dip Strategy**: Convert Google reviews into testimonials for other platforms
- **Centralized Management**: See all reviews in one dashboard
- **Analytics**: Track trends and sentiment across all your reviews
- **Response Tracking**: Monitor which reviews have been responded to

## What Gets Imported

When you import reviews, Prompt Reviews retrieves:
- Review text
- Star rating
- Reviewer name
- Review date
- Your response (if any)
- Profile photo (when available)

## How to Import Reviews

1. Connect your Google Business Profile
2. Navigate to the review import section
3. Select which location(s) to import from
4. Choose date range (optional)
5. Click "Import Reviews"
6. Reviews will be processed and added to your dashboard

## Using Imported Reviews

Once imported, you can:
- Display them in website widgets
- Feature them in marketing materials
- Track response rates
- Analyze sentiment trends
- Export for reporting

## The Double-Dip Strategy

The "double-dip" strategy maximizes the value of each review:

1. **Customer leaves Google review**
2. **Import to Prompt Reviews**
3. **Display on your website** using widgets
4. **Request permission** to use as testimonial
5. **Share on social media**
6. **Include in marketing materials**

This transforms a single review into multiple marketing touchpoints.

## Review Update Frequency

- Initial import: All reviews from selected timeframe
- Ongoing sync: New reviews imported automatically (frequency depends on your plan)
- Manual refresh: Available anytime to get latest reviews

## Privacy and Permissions

- Only public reviews are imported
- Reviewer information comes from public Google profiles
- You can choose which imported reviews to display publicly
- Respects Google's terms of service`,
    status: 'published',
    metadata: {
      description: 'Import Google reviews into Prompt Reviews to display on your website, run double-dip campaigns, and centralize review management.',
      category: 'google-business',
      category_label: 'Google Business Profile',
      category_icon: 'Download',
      category_color: 'red',
      keywords: ['review import', 'google reviews', 'double-dip strategy', 'testimonials'],
      tags: ['reviews', 'import', 'double-dip'],
      available_plans: ['grower', 'builder', 'maven'],
      seo_title: 'Import Google Reviews - Prompt Reviews Guide',
      seo_description: 'Learn how to import Google reviews and leverage the double-dip strategy to maximize review value across your marketing.',
    }
  },
  {
    slug: 'google-business/scheduling',
    title: 'Post Scheduling',
    content: `# Post Scheduling

Schedule Google Business Profile posts in advance to maintain a consistent presence and save time on social media management.

## Benefits of Scheduling Posts

- **Time Efficiency**: Batch-create posts and schedule them for optimal times
- **Consistency**: Maintain regular posting even during busy periods
- **Strategic Timing**: Post when your audience is most active
- **Multi-Location Management**: Schedule the same post across multiple locations
- **Holiday Planning**: Set up holiday hours and special announcements in advance

## Types of Posts You Can Schedule

### What's New Posts
- Business updates
- New products or services
- Company news
- Special announcements

### Event Posts
- Upcoming events
- Classes or workshops
- Grand openings
- Special appearances

### Offer Posts
- Sales and promotions
- Limited-time offers
- Seasonal discounts
- Special deals

## How to Schedule Posts

1. Navigate to the post creation section
2. Create your post content and add photos
3. Select post type (What's New, Event, or Offer)
4. Choose scheduling options:
   - Post now
   - Schedule for later (specific date/time)
5. For multi-location: Select which locations should receive the post
6. Review and confirm schedule

## Best Practices for Scheduling

### Timing
- **Peak Hours**: Schedule for when your customers are most active
- **Consistent Schedule**: Post at regular intervals (e.g., every Monday and Thursday)
- **Event Lead Time**: Post events 1-2 weeks in advance
- **Offers**: Schedule offers to start early in the week

### Content Strategy
- **Plan Ahead**: Create a content calendar for the month
- **Seasonal Content**: Schedule holiday and seasonal posts in advance
- **Mix Content Types**: Alternate between updates, events, and offers
- **Quality Over Quantity**: Better to post high-quality content weekly than low-quality content daily

### Post Lifespan
- Regular posts: Active for 7 days
- Event posts: Active until event date
- Offer posts: Active until offer end date

## Managing Scheduled Posts

You can:
- View all scheduled posts in a calendar view
- Edit scheduled posts before they go live
- Cancel scheduled posts
- Reschedule to different times
- Duplicate posts for other locations

## Tips for Success

1. **Batch Creation**: Set aside time weekly to create multiple posts
2. **Use Templates**: Save time with reusable post templates
3. **Image Library**: Maintain a library of approved images for quick access
4. **Review Schedule**: Check your schedule weekly to ensure posts align with current events
5. **Monitor Performance**: Track which post times get the most engagement`,
    status: 'published',
    metadata: {
      description: 'Learn how to schedule Google Business Profile posts in advance to maintain consistent presence and save time.',
      category: 'google-business',
      category_label: 'Google Business Profile',
      category_icon: 'Calendar',
      category_color: 'red',
      keywords: ['post scheduling', 'google posts', 'content calendar', 'social media scheduling'],
      tags: ['scheduling', 'posts', 'content-planning'],
      available_plans: ['builder', 'maven'],
      seo_title: 'Schedule Google Business Profile Posts',
      seo_description: 'Master post scheduling for Google Business Profile. Learn timing strategies, best practices, and content planning.',
    }
  }
];

async function seedArticles() {
  console.log('Starting to seed Google Business Profile articles...\n');

  for (const articleData of articles) {
    try {
      console.log(`Creating article: ${articleData.slug}...`);

      // Check if article already exists
      const { data: existing } = await supabase
        .from('articles')
        .select('slug')
        .eq('slug', articleData.slug)
        .single();

      if (existing) {
        console.log(`  ⚠️  Article already exists: ${articleData.slug}`);
        continue;
      }

      // Insert article
      const { data, error } = await supabase
        .from('articles')
        .insert({
          ...articleData,
          published_at: articleData.status === 'published' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) {
        console.error(`  ❌ Error creating ${articleData.slug}:`, error);
      } else {
        console.log(`  ✅ Created: ${articleData.slug}`);
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${articleData.slug}:`, error);
    }
  }

  console.log('\n✅ Seeding complete!');
  console.log('\nCreated articles:');
  articles.forEach(a => console.log(`  - ${a.slug}`));
}

seedArticles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
