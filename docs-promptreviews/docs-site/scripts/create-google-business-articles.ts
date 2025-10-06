#!/usr/bin/env ts-node
/**
 * Create comprehensive Google Business Profile subpage articles
 * These articles help users understand features and optimize for Google SEO
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ltneloufqjktdplodvao.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bmVsb3VmcWprdGRwbG9kdmFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA0MTU3OCwiZXhwIjoyMDYzNjE3NTc4fQ.IkGh1VhXoqUSGPudm3NH9BqrUP2GMb1OxfmzJxpwOL4'
)

const articles = [
  {
    slug: 'google-business/bulk-updates',
    title: 'Bulk Updates for Multiple Locations',
    content: `Manage all your Google Business Profile locations efficiently with powerful bulk editing capabilities. Perfect for multi-location businesses, franchises, and chains that need to maintain consistency while saving time.

With bulk updates, you can publish posts, upload photos, and manage business information across multiple locations simultaneously—eliminating the need to update each profile individually.`,
    status: 'published',
    metadata: {
      description: 'Efficiently manage multiple Google Business Profile locations with bulk editing. Update posts, photos, and information across all locations simultaneously.',
      seo_title: 'Bulk Updates - Manage Multiple Google Business Locations',
      seo_description: 'Save hours managing multiple Google Business Profiles. Bulk publish posts, upload photos, and update information across all locations. Perfect for franchises and multi-location businesses.',
      keywords: [
        'bulk updates google business',
        'multiple location management',
        'google business profile bulk editing',
        'multi-location google posts',
        'franchise google business',
        'bulk photo upload google',
        'manage multiple locations'
      ],
      category_label: 'Google Business Profile',
      category_icon: 'Layers',
      category_color: 'blue',
      available_plans: ['builder', 'maven'],
      key_features: [
        {
          icon: 'Layers',
          title: 'Bulk Post Publishing',
          description: 'Create a post once and publish it to multiple locations instantly. Perfect for announcing sales, events, new products, or company-wide updates. Save hours compared to posting individually.'
        },
        {
          icon: 'MapPin',
          title: 'Smart Location Selection',
          description: 'Easily select specific locations or all at once. Filter by region, brand, or custom groups. The system remembers your last selection for faster workflow.'
        },
        {
          icon: 'Image',
          title: 'Bulk Photo Management',
          description: 'Upload photos to multiple locations simultaneously. Maintain consistent branding across all profiles with batch uploads for logos, interiors, products, or team photos.'
        },
        {
          icon: 'Clock',
          title: 'Scheduled Bulk Posts',
          description: 'Plan and schedule posts across all locations in advance. Coordinate marketing campaigns, seasonal promotions, and regular updates with automated publishing.'
        }
      ],
      how_it_works: [
        {
          number: 1,
          icon: 'Building2',
          title: 'Connect Your Locations',
          description: 'Connect all your Google Business Profile locations using OAuth. You must be an owner or manager of each location to connect it.'
        },
        {
          number: 2,
          icon: 'MapPin',
          title: 'Select Target Locations',
          description: 'In the Google Business dashboard, choose which locations should receive the update. Select all, or filter by specific criteria like region or brand.'
        },
        {
          number: 3,
          icon: 'Edit3',
          title: 'Create Your Content',
          description: 'Write your post, upload photos, or update business information. Preview how it will appear on Google before publishing.'
        },
        {
          number: 4,
          icon: 'Send',
          title: 'Publish to All Selected',
          description: 'Review your selections and publish to all chosen locations at once. Track success and see which locations were updated successfully.'
        }
      ],
      best_practices: [
        {
          icon: 'Sparkles',
          title: 'Maintain Brand Consistency',
          description: 'Use bulk updates to ensure all locations have identical branding, messaging, and visual identity. Consistency builds trust and recognition across your brand.'
        },
        {
          icon: 'Target',
          title: 'Customize When Necessary',
          description: 'While bulk updates save time, some content should be location-specific. Events, local promotions, or community involvement posts may need individual attention.'
        },
        {
          icon: 'Calendar',
          title: 'Schedule Strategic Campaigns',
          description: 'Plan bulk posts weeks in advance for product launches, seasonal sales, or recurring events. Google Posts last 7 days, so maintain a regular schedule.'
        },
        {
          icon: 'TrendingUp',
          title: 'Optimize for Local SEO',
          description: 'Include location-specific keywords naturally when appropriate. Even bulk posts can mention "all locations" or "nationwide" to signal reach while maintaining local relevance.'
        }
      ],
      faqs: [
        {
          question: 'Can I bulk update some locations but not others?',
          answer: 'Yes! The location selector lets you choose any combination of connected locations. You can save location groups for frequently-used selections.'
        },
        {
          question: 'Will bulk posts appear at the same time on all profiles?',
          answer: 'Yes, posts publish simultaneously to all selected locations. For scheduled posts, they all go live at the same scheduled time across all profiles.'
        },
        {
          question: 'Can I customize posts per location after bulk publishing?',
          answer: 'Yes, after bulk publishing you can edit individual location posts through Google Business directly if location-specific changes are needed.'
        },
        {
          question: 'Do bulk updates affect my Google ranking differently?',
          answer: 'No, bulk updates function identically to individual updates. Google doesn\'t penalize bulk posting—what matters is posting high-quality, relevant content regularly.'
        },
        {
          question: 'How many locations can I update at once?',
          answer: 'There\'s no hard limit on the Builder and Maven plans. The system can handle hundreds of locations, though processing time increases with very large batches.'
        }
      ],
      call_to_action: {
        primary: {
          text: 'Learn About Business Info',
          href: '/google-business/business-info',
          external: false
        },
        secondary: {
          text: 'View Photo Upload Guide',
          href: '/google-business/image-upload',
          external: false
        }
      }
    }
  },
  {
    slug: 'google-business/business-info',
    title: 'Managing Business Information',
    content: `Keep your Google Business Profile information accurate, complete, and optimized for local search. Your business information is the foundation of your Google presence—it affects search ranking, customer trust, and how Google displays your business.

Prompt Reviews helps you manage critical business details like hours, contact information, attributes, and descriptions across all your locations with confidence and consistency.`,
    status: 'published',
    metadata: {
      description: 'Manage and optimize your Google Business Profile information for better local search rankings. Update hours, contact info, descriptions, and attributes.',
      seo_title: 'Business Information Management - Google Business Profile',
      seo_description: 'Keep your Google Business information accurate and optimized. Manage hours, contact details, descriptions, and attributes to improve local search rankings and customer trust.',
      keywords: [
        'google business information',
        'google business profile optimization',
        'local seo business info',
        'google business hours',
        'business description seo',
        'google business attributes',
        'complete google profile'
      ],
      category_label: 'Google Business Profile',
      category_icon: 'Building2',
      category_color: 'blue',
      available_plans: ['grower', 'builder', 'maven'],
      key_features: [
        {
          icon: 'Building2',
          title: 'Complete Business Details',
          description: 'Manage your business name, address, phone number, website, and hours. Google rewards complete profiles with better visibility in local search results.'
        },
        {
          icon: 'FileText',
          title: 'SEO-Optimized Descriptions',
          description: 'Craft compelling business descriptions with strategic keyword placement. Your description helps Google understand what you offer and when to show your business.'
        },
        {
          icon: 'Tag',
          title: 'Business Attributes',
          description: 'Select attributes that describe your business—wheelchair accessible, outdoor seating, LGBTQ+ friendly, etc. Attributes appear in search and help customers find the right fit.'
        },
        {
          icon: 'Clock',
          title: 'Hours & Special Hours',
          description: 'Set regular hours and manage special hours for holidays, events, or seasonal changes. Accurate hours prevent customer frustration and negative reviews.'
        }
      ],
      how_it_works: [
        {
          number: 1,
          icon: 'Link2',
          title: 'Connect Your Profile',
          description: 'Connect your Google Business Profile through the Google Business integration. You\'ll need owner or manager permissions.'
        },
        {
          number: 2,
          icon: 'Edit3',
          title: 'Review Current Information',
          description: 'View your current business information synced from Google. Identify missing or outdated details that need updating.'
        },
        {
          number: 3,
          icon: 'Sparkles',
          title: 'Optimize for Search',
          description: 'Update descriptions with relevant keywords, add missing attributes, ensure hours are accurate, and complete any blank fields.'
        },
        {
          number: 4,
          icon: 'CheckCircle',
          title: 'Sync with Google',
          description: 'Changes sync directly to your Google Business Profile. Updates typically appear within minutes, though some may take up to 24 hours.'
        }
      ],
      best_practices: [
        {
          icon: 'Target',
          title: 'Use Keywords Naturally',
          description: 'Include 2-3 primary keywords in your business description, but write for humans first. Mention your location, services, and what makes you unique without keyword stuffing.'
        },
        {
          icon: 'Award',
          title: 'Complete Every Field',
          description: 'Google\'s algorithm favors complete profiles. Fill in every applicable field—attributes, services, products, hours, and descriptions. Incomplete profiles rank lower in local search.'
        },
        {
          icon: 'Clock',
          title: 'Keep Hours Current',
          description: 'Update hours immediately when they change, especially for holidays. Wrong hours lead to frustrated customers, negative reviews, and lower rankings. Set special hours in advance.'
        },
        {
          icon: 'Repeat',
          title: 'Audit Regularly',
          description: 'Review your information quarterly. Check for outdated details, new attribute options Google added, or services you now offer. Keep your profile current to maintain ranking.'
        }
      ],
      faqs: [
        {
          question: 'How long does it take for changes to appear on Google?',
          answer: 'Most changes appear within minutes. However, some updates (especially business name or category changes) may trigger Google review and take 1-3 business days to appear publicly.'
        },
        {
          question: 'What should I include in my business description?',
          answer: 'Include what you do, where you\'re located, what makes you different, and 2-3 primary keywords. Stay under 750 characters and write naturally. The first 250 characters are most important as they appear in search snippets.'
        },
        {
          question: 'Can I change my business name to include keywords?',
          answer: 'No. Google requires your business name to match your real-world signage and legal name. Adding keywords to your business name violates Google\'s guidelines and can result in suspension.'
        },
        {
          question: 'Which attributes matter most for SEO?',
          answer: 'Attributes don\'t directly affect ranking, but they help Google match you to relevant searches. Focus on accurate attributes that differentiate you—accessibility features, service options, and amenities customers care about.'
        },
        {
          question: 'Should I update my business address if I move?',
          answer: 'Yes, update immediately. Address changes can affect ranking temporarily as Google re-validates your location. For service-area businesses, you can hide your address and show service areas instead.'
        }
      ],
      call_to_action: {
        primary: {
          text: 'Set Up Categories & Services',
          href: '/google-business/categories-services',
          external: false
        },
        secondary: {
          text: 'Learn About Review Import',
          href: '/google-business/review-import',
          external: false
        }
      }
    }
  },
  {
    slug: 'google-business/categories-services',
    title: 'Categories & Services Optimization',
    content: `Your Google Business Profile categories and services are critical ranking factors that tell Google what you do and when to show your business in search results. Choosing the right categories can dramatically increase your visibility for relevant local searches.

Prompt Reviews helps you select optimal primary and additional categories, manage your service offerings, and structure your profile for maximum local SEO impact.`,
    status: 'published',
    metadata: {
      description: 'Optimize your Google Business categories and services for better local search rankings. Choose the right primary category, add services, and improve visibility.',
      seo_title: 'Categories & Services - Google Business Profile SEO',
      seo_description: 'Select the right Google Business categories and services to improve local search rankings. Learn which categories drive traffic and how to structure your service offerings.',
      keywords: [
        'google business categories',
        'google business primary category',
        'google business services',
        'local seo categories',
        'business category optimization',
        'google business profile categories',
        'service area business categories'
      ],
      category_label: 'Google Business Profile',
      category_icon: 'Tag',
      category_color: 'blue',
      available_plans: ['grower', 'builder', 'maven'],
      key_features: [
        {
          icon: 'Tag',
          title: 'Primary Category Selection',
          description: 'Choose the most accurate primary category for your business. This is the single most important category—it defines your business type and affects which searches you appear in.'
        },
        {
          icon: 'Tags',
          title: 'Additional Categories',
          description: 'Add up to 9 additional categories to capture related services. Each category helps you appear in more relevant searches without diluting your primary focus.'
        },
        {
          icon: 'ListChecks',
          title: 'Service Management',
          description: 'Define specific services you offer with descriptions. Services appear in your profile and help customers understand exactly what you provide.'
        },
        {
          icon: 'TrendingUp',
          title: 'Category Performance Insights',
          description: 'Track which categories drive the most visibility and customer actions. Optimize your category strategy based on real search performance data.'
        }
      ],
      how_it_works: [
        {
          number: 1,
          icon: 'Building2',
          title: 'Access Category Settings',
          description: 'From your Google Business integration, navigate to categories. You\'ll see your current primary and additional categories.'
        },
        {
          number: 2,
          icon: 'Search',
          title: 'Research Category Options',
          description: 'Search Google\'s category list to find the most specific match for your primary service. More specific categories often perform better than broad ones.'
        },
        {
          number: 3,
          icon: 'Tag',
          title: 'Set Primary Category',
          description: 'Choose one primary category that best represents your core business. This cannot be changed frequently without affecting ranking.'
        },
        {
          number: 4,
          icon: 'Tags',
          title: 'Add Related Categories',
          description: 'Add up to 9 additional categories for secondary services. Focus on categories that match actual customer searches, not just services you offer.'
        }
      ],
      best_practices: [
        {
          icon: 'Sparkles',
          title: 'Be Specific with Primary Category',
          description: 'Choose the most specific category available. "Italian Restaurant" beats "Restaurant," "Personal Injury Attorney" beats "Lawyer." Specific categories face less competition and match more qualified searches.'
        },
        {
          icon: 'Scale',
          title: 'Balance Breadth and Relevance',
          description: 'Add additional categories strategically. Too many unrelated categories dilute your profile. Stick to services you actively promote and can deliver well.'
        },
        {
          icon: 'Award',
          title: 'Match Competitor Categories',
          description: 'Research top-ranking competitors in your area. If they use certain categories consistently, those categories likely drive local traffic. Match or beat their category strategy.'
        },
        {
          icon: 'ListChecks',
          title: 'Add Detailed Service Descriptions',
          description: 'For each service, write a clear 2-3 sentence description with relevant keywords. Service descriptions help Google understand context and may appear in search results.'
        }
      ],
      faqs: [
        {
          question: 'How many categories should I add?',
          answer: 'Add as many as accurately describe your business, up to 10 total (1 primary + 9 additional). Quality over quantity—only add categories for services you actively provide and want to be found for.'
        },
        {
          question: 'Can I change my primary category often?',
          answer: 'No, avoid changing your primary category frequently. Each change can temporarily affect your ranking as Google re-evaluates your business type. Only change if genuinely inaccurate.'
        },
        {
          question: 'What if my exact business type isn\'t a category option?',
          answer: 'Choose the closest available category. You can use additional categories and services to clarify your specific offerings. Google regularly adds new categories, so check back periodically.'
        },
        {
          question: 'Do categories affect what keywords I rank for?',
          answer: 'Yes, significantly. Your primary category directly influences which search terms trigger your profile. If you\'re a "Coffee Shop," you\'ll rank for coffee-related searches but not restaurant searches.'
        },
        {
          question: 'Should service-area businesses use different categories?',
          answer: 'No, use the same category logic. Your service area (defined separately) determines where you appear geographically, while categories determine what searches you appear in.'
        }
      ],
      call_to_action: {
        primary: {
          text: 'Optimize Business Information',
          href: '/google-business/business-info',
          external: false
        },
        secondary: {
          text: 'Upload Professional Photos',
          href: '/google-business/image-upload',
          external: false
        }
      }
    }
  },
  {
    slug: 'google-business/image-upload',
    title: 'Photo Upload & Management',
    content: `High-quality photos are one of the most powerful tools for attracting customers on Google. Businesses with photos receive 42% more requests for directions and 35% more clicks to their websites compared to businesses without photos.

Prompt Reviews makes it easy to upload, organize, and optimize photos across all your locations—ensuring your Google Business Profile stands out in search results and Google Maps.`,
    status: 'published',
    metadata: {
      description: 'Upload and manage professional photos for your Google Business Profile. Optimize images for better visibility, customer engagement, and local search rankings.',
      seo_title: 'Photo Upload & Management - Google Business Profile',
      seo_description: 'Boost your Google Business Profile with professional photos. Learn what images to upload, how to optimize them, and best practices for maximum customer engagement.',
      keywords: [
        'google business photos',
        'google business profile images',
        'upload photos google business',
        'optimize google business images',
        'business photo seo',
        'google maps photos',
        'professional business photos'
      ],
      category_label: 'Google Business Profile',
      category_icon: 'Image',
      category_color: 'blue',
      available_plans: ['grower', 'builder', 'maven'],
      key_features: [
        {
          icon: 'Upload',
          title: 'Easy Photo Upload',
          description: 'Upload photos individually or in batches. Drag-and-drop interface with automatic resizing and optimization for Google\'s requirements.'
        },
        {
          icon: 'Layers',
          title: 'Bulk Photo Management',
          description: 'Upload the same photos to multiple locations at once. Perfect for franchises maintaining consistent branding across all profiles.'
        },
        {
          icon: 'Tag',
          title: 'Photo Categorization',
          description: 'Organize photos by type—logo, cover, interior, exterior, team, products, services. Proper categorization helps Google display the right photo in the right context.'
        },
        {
          icon: 'Sparkles',
          title: 'Photo Optimization',
          description: 'Automatic compression and formatting to meet Google\'s specifications. Ensures fast loading while maintaining visual quality.'
        }
      ],
      how_it_works: [
        {
          number: 1,
          icon: 'Building2',
          title: 'Select Your Location',
          description: 'Choose which Google Business Profile location should receive the photos. You can select multiple locations for bulk uploads.'
        },
        {
          number: 2,
          icon: 'Upload',
          title: 'Upload Your Photos',
          description: 'Drag and drop photos or browse your files. Supported formats: JPG, PNG. Minimum size: 720px × 720px. Optimal: 1080px × 1080px or larger.'
        },
        {
          number: 3,
          icon: 'Tag',
          title: 'Categorize Images',
          description: 'Select the photo type—logo, cover photo, interior, exterior, team, at work, products, services, food/drink, menu, or additional photos.'
        },
        {
          number: 4,
          icon: 'Send',
          title: 'Publish to Google',
          description: 'Review and publish. Photos typically appear on your Google Business Profile within minutes and enter the pool of images Google may show in search and maps.'
        }
      ],
      best_practices: [
        {
          icon: 'Camera',
          title: 'Upload High-Quality, Original Photos',
          description: 'Use professional photos or high-quality smartphone images in good lighting. Avoid stock photos—Google and customers prefer authentic images. Minimum 720px, but 1080px+ performs best.'
        },
        {
          icon: 'CalendarCheck',
          title: 'Add Photos Regularly',
          description: 'Upload new photos monthly or whenever something changes. Google prioritizes businesses with recent photos. Fresh content signals an active, current business.'
        },
        {
          icon: 'Users',
          title: 'Show Your Team and Customers',
          description: 'Photos with people receive 2x more engagement than empty spaces. Show your team at work, happy customers (with permission), and the experience customers will have.'
        },
        {
          icon: 'Grid3x3',
          title: 'Diversify Photo Types',
          description: 'Upload a variety: exterior (for recognition), interior (atmosphere), products/services (offerings), team (trust), and at-work photos (authenticity). Aim for 10+ photos minimum.'
        }
      ],
      faqs: [
        {
          question: 'What size should my photos be?',
          answer: 'Minimum: 720px × 720px. Recommended: 1080px × 1080px or larger. Maximum file size: 5MB. Format: JPG or PNG. Higher resolution photos may be displayed more prominently by Google.'
        },
        {
          question: 'How many photos should I upload?',
          answer: 'Minimum 10 photos for a complete profile, but more is better. Top-performing businesses have 50+ photos. Include at least 3 exterior, 5 interior, team photos, and product/service photos.'
        },
        {
          question: 'Can customers upload photos to my profile?',
          answer: 'Yes, customers can upload photos with their reviews. You can\'t remove customer photos unless they violate Google\'s policies. The best defense is uploading enough high-quality photos yourself.'
        },
        {
          question: 'Should I add logos or text overlays to my photos?',
          answer: 'Avoid heavy text, watermarks, or promotional overlays—Google may reject them. Your logo photo is separate. Business photos should show authentic views of your location, products, and team.'
        },
        {
          question: 'How do I choose a cover photo?',
          answer: 'Upload a high-quality photo representing your business well. Google algorithmically chooses which photo to display as your cover, prioritizing recent, high-quality images with engagement.'
        }
      ],
      call_to_action: {
        primary: {
          text: 'Set Up Bulk Updates',
          href: '/google-business/bulk-updates',
          external: false
        },
        secondary: {
          text: 'Import Your Reviews',
          href: '/google-business/review-import',
          external: false
        }
      }
    }
  },
  {
    slug: 'google-business/review-import',
    title: 'Google Review Import',
    content: `Import your Google Business Profile reviews into Prompt Reviews to display them on your website, launch double-dip campaigns, or track customer sentiment across all review platforms in one dashboard.

Review import gives you full ownership of your Google reviews—showcase them on your website, respond faster, and leverage them for marketing without relying solely on Google\'s platform.`,
    status: 'published',
    metadata: {
      description: 'Import Google Business Profile reviews to your website, launch double-dip campaigns, and manage all reviews in one dashboard. Full control of your Google reviews.',
      seo_title: 'Google Review Import - Display Reviews on Your Website',
      seo_description: 'Import Google reviews to display on your website, launch double-dip campaigns, and manage reviews across platforms. Take ownership of your Google Business Profile reviews.',
      keywords: [
        'google review import',
        'import google business reviews',
        'display google reviews on website',
        'google review widget',
        'sync google reviews',
        'aggregate google reviews',
        'google review management'
      ],
      category_label: 'Google Business Profile',
      category_icon: 'Download',
      category_color: 'blue',
      available_plans: ['grower', 'builder', 'maven'],
      key_features: [
        {
          icon: 'Download',
          title: 'Automatic Review Import',
          description: 'Automatically sync Google reviews to your Prompt Reviews dashboard. New reviews appear within minutes, keeping your website and campaigns current.'
        },
        {
          icon: 'Globe',
          title: 'Website Display',
          description: 'Showcase imported Google reviews on your website with customizable widgets. Build trust by displaying social proof from Google directly on your site.'
        },
        {
          icon: 'TrendingUp',
          title: 'Double-Dip Campaigns',
          description: 'Contact customers who left Google reviews to request additional reviews on other platforms. Maximize the value of each satisfied customer.',
          href: '/double-dip-strategy'
        },
        {
          icon: 'BarChart3',
          title: 'Unified Dashboard',
          description: 'View Google reviews alongside reviews from all other platforms. Track sentiment, response rates, and trends across your entire review ecosystem.'
        }
      ],
      how_it_works: [
        {
          number: 1,
          icon: 'Link2',
          title: 'Connect Google Business Profile',
          description: 'Authorize Prompt Reviews to access your Google Business Profile. You need owner or manager permissions to import reviews.'
        },
        {
          number: 2,
          icon: 'Download',
          title: 'Import Existing Reviews',
          description: 'We\'ll automatically import all existing Google reviews from your profile. This initial import typically completes within minutes.'
        },
        {
          number: 3,
          icon: 'RefreshCw',
          title: 'Automatic Sync',
          description: 'New Google reviews automatically sync to your dashboard daily. You\'ll always have the latest reviews without manual imports.'
        },
        {
          number: 4,
          icon: 'Monitor',
          title: 'Use Across Platform',
          description: 'Display reviews in website widgets, include in email campaigns, launch double-dip requests, or track sentiment—all from your unified dashboard.'
        }
      ],
      best_practices: [
        {
          icon: 'Zap',
          title: 'Respond Faster with Centralized Dashboard',
          description: 'Manage Google reviews alongside all platforms in one place. Respond to Google reviews within 24 hours—Google rewards quick responses with better visibility.'
        },
        {
          icon: 'Award',
          title: 'Showcase Your Best Google Reviews',
          description: 'Create website widgets featuring your top Google reviews. Filter by rating, keywords, or recency to display the most compelling social proof to website visitors.'
        },
        {
          icon: 'Users',
          title: 'Launch Strategic Double-Dip Campaigns',
          description: 'Contact customers who left 5-star Google reviews and request reviews on industry-specific platforms. Don\'t waste satisfied customers—maximize their testimonials across platforms.'
        },
        {
          icon: 'TrendingUp',
          title: 'Track Trends Across Platforms',
          description: 'Compare Google review sentiment to other platforms. Identify which platforms drive more reviews, which have better ratings, and where to focus your review generation efforts.'
        }
      ],
      faqs: [
        {
          question: 'How often do Google reviews sync?',
          answer: 'New Google reviews automatically sync to your dashboard daily. For real-time needs, you can trigger a manual sync anytime from the Google Business integration settings.'
        },
        {
          question: 'Can I import reviews from multiple Google locations?',
          answer: 'Yes! Connect multiple Google Business Profile locations and import reviews from each. Widgets can display reviews from one location or aggregate across all locations.'
        },
        {
          question: 'Will imported reviews appear on Google too?',
          answer: 'Reviews import FROM Google TO Prompt Reviews, not the other way. Google reviews remain on Google—importing simply copies them to your dashboard for additional use.'
        },
        {
          question: 'Can I filter which Google reviews to display?',
          answer: 'Yes, widgets let you filter by minimum rating, date range, keyword content, or manually select specific reviews. Show only 4-5 star reviews or highlight reviews mentioning specific services.'
        },
        {
          question: 'What happens if a Google review is deleted or edited?',
          answer: 'Daily syncs update imported reviews. If a customer edits their Google review, the updated version syncs. If Google or the customer deletes a review, it\'s removed from your dashboard.'
        }
      ],
      call_to_action: {
        primary: {
          text: 'Learn About Double-Dip Strategy',
          href: '/double-dip-strategy',
          external: false
        },
        secondary: {
          text: 'Create Review Widgets',
          href: '/widgets',
          external: false
        }
      }
    }
  },
  {
    slug: 'google-business/scheduling',
    title: 'Post Scheduling & Automation',
    content: `Schedule Google Business Profile posts in advance to maintain a consistent presence without daily manual posting. Strategic scheduling helps you plan campaigns, coordinate multi-location promotions, and keep your profile active—a key ranking factor for local SEO.

Prompt Reviews' scheduling system makes it easy to plan weeks or months of content in advance, ensuring your Google Business Profile stays fresh and engaging.`,
    status: 'published',
    metadata: {
      description: 'Schedule Google Business Profile posts in advance. Plan campaigns, maintain consistency, and keep your profile active for better local search rankings.',
      seo_title: 'Post Scheduling & Automation - Google Business Profile',
      seo_description: 'Schedule Google Business posts weeks in advance. Plan campaigns, maintain consistent posting, and improve local SEO with automated Google Business Profile updates.',
      keywords: [
        'google business post scheduling',
        'schedule google business posts',
        'automate google business profile',
        'google post calendar',
        'scheduled google posts',
        'google business automation',
        'plan google business content'
      ],
      category_label: 'Google Business Profile',
      category_icon: 'Calendar',
      category_color: 'blue',
      available_plans: ['builder', 'maven'],
      key_features: [
        {
          icon: 'Calendar',
          title: 'Advanced Post Scheduling',
          description: 'Schedule posts days, weeks, or months in advance. Plan entire campaigns before they launch. Set exact publish dates and times for optimal visibility.'
        },
        {
          icon: 'Repeat',
          title: 'Recurring Posts',
          description: 'Create templates for recurring events or promotions. Schedule them to repeat weekly, monthly, or on custom intervals without recreating each time.'
        },
        {
          icon: 'Layers',
          title: 'Bulk Scheduling for Multiple Locations',
          description: 'Schedule the same post to publish across multiple locations simultaneously or at location-specific times. Perfect for coordinated marketing campaigns.'
        },
        {
          icon: 'CalendarCheck',
          title: 'Visual Content Calendar',
          description: 'View your entire scheduled post calendar at a glance. Drag and drop to reschedule, identify gaps in your posting schedule, and maintain consistency.'
        }
      ],
      how_it_works: [
        {
          number: 1,
          icon: 'Edit3',
          title: 'Create Your Post',
          description: 'Write your Google Business post, add photos, select post type (update, offer, event), and include a call-to-action button.'
        },
        {
          number: 2,
          icon: 'Calendar',
          title: 'Choose Schedule Time',
          description: 'Instead of publishing immediately, select a future date and time. Consider when your target customers are most active on Google.'
        },
        {
          number: 3,
          icon: 'Building2',
          title: 'Select Locations',
          description: 'Choose which Google Business locations should receive the post. Schedule the same post for different times at different locations if needed.'
        },
        {
          number: 4,
          icon: 'CheckCircle',
          title: 'Auto-Publish at Scheduled Time',
          description: 'Posts automatically publish at the scheduled time. You\'ll receive confirmation once published. Focus on creating content, not manual posting.'
        }
      ],
      best_practices: [
        {
          icon: 'CalendarCheck',
          title: 'Maintain Weekly Posting Frequency',
          description: 'Schedule at least one post per week. Google rewards active profiles with better visibility. Plan a month of posts in one sitting to maintain consistency effortlessly.'
        },
        {
          icon: 'Clock',
          title: 'Post When Customers Are Active',
          description: 'Schedule posts for times your target customers typically search. For restaurants, post lunch/dinner times. For B2B services, schedule business hours. Analyze Google Insights for your peak times.'
        },
        {
          icon: 'Sparkles',
          title: 'Plan Campaigns in Advance',
          description: 'Schedule entire promotional campaigns weeks before they launch. Plan holiday sales, seasonal services, or event series. Ensure consistent messaging across all posts in the campaign.'
        },
        {
          icon: 'Layers',
          title: 'Coordinate Multi-Location Launches',
          description: 'For franchises or chains, schedule identical posts to publish simultaneously across all locations for brand consistency, or stagger times based on local peak hours.'
        }
      ],
      faqs: [
        {
          question: 'How far in advance can I schedule posts?',
          answer: 'You can schedule posts as far in advance as you want—weeks, months, or even a year ahead. This is perfect for planning seasonal campaigns, recurring events, or holiday promotions.'
        },
        {
          question: 'Can I edit or delete scheduled posts?',
          answer: 'Yes, you can edit, reschedule, or delete any scheduled post before it publishes. Once published, you can edit or delete it directly on Google Business Profile.'
        },
        {
          question: 'What happens if my Google connection expires before a scheduled post?',
          answer: 'Scheduled posts will fail to publish if your Google authorization expires. You\'ll receive a notification to reconnect. Once reconnected, you can manually publish the failed post.'
        },
        {
          question: 'Do scheduled posts perform differently than immediate posts?',
          answer: 'No, Google treats scheduled posts identically to manually posted content. What matters is posting consistently and at optimal times—which scheduling helps you achieve.'
        },
        {
          question: 'Can I schedule different post types?',
          answer: 'Yes, schedule any Google post type—updates, offers, events, or products. Event posts can be scheduled to publish before the event and automatically expire after.'
        }
      ],
      call_to_action: {
        primary: {
          text: 'Set Up Bulk Updates',
          href: '/google-business/bulk-updates',
          external: false
        },
        secondary: {
          text: 'Optimize Your Business Info',
          href: '/google-business/business-info',
          external: false
        }
      }
    }
  }
]

async function main() {
  console.log('📝 Creating Google Business Profile subpage articles...\n')

  for (const article of articles) {
    console.log(`\n📄 Creating: ${article.slug}`)
    console.log(`   Title: ${article.title}`)

    const { data, error } = await supabase
      .from('articles')
      .insert([article])
      .select()

    if (error) {
      console.error(`   ❌ Error: ${error.message}`)
    } else {
      console.log(`   ✅ Created successfully`)
      console.log(`   📊 Content length: ${article.content.length} chars`)
      console.log(`   🔑 Keywords: ${article.metadata.keywords.length}`)
      console.log(`   ⭐ Features: ${article.metadata.key_features.length}`)
      console.log(`   📋 Steps: ${article.metadata.how_it_works.length}`)
      console.log(`   💡 Best practices: ${article.metadata.best_practices.length}`)
      console.log(`   ❓ FAQs: ${article.metadata.faqs.length}`)
    }
  }

  console.log('\n\n✅ All articles created!')
  console.log('\n📋 Summary:')
  articles.forEach(a => {
    console.log(`   ✓ ${a.slug}`)
  })
  console.log('\n🌐 Live URLs:')
  articles.forEach(a => {
    console.log(`   https://docs.promptreviews.app/${a.slug}`)
  })
}

main()
