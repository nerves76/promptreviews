#!/usr/bin/env node

/**
 * Script to convert prompt-pages/features documentation to CMS articles
 *
 * This script:
 * 1. Extracts content from existing static pages
 * 2. Creates CMS articles via the admin API
 * 3. Reports conversion results
 *
 * Usage: node scripts/convert-features-to-cms.js
 */

const featuresData = [
  {
    slug: 'prompt-pages/features/analytics',
    title: 'Analytics & Insights',
    category: 'Prompt Pages Features',
    description: 'Track performance metrics, gain actionable insights into your review collection efforts, and make data-driven decisions to optimize your review strategy.',
    seo_title: 'Analytics & Insights - Track Review Collection Performance',
    seo_description: 'Monitor review collection performance, completion rates, platform distribution, and customer engagement to optimize your review strategy.',
    keywords: ['analytics', 'review insights', 'performance tracking', 'completion rates', 'data analysis'],
    category_label: 'Features',
    category_icon: 'BarChart3',
    category_color: 'green',
    available_plans: ['grower', 'builder', 'maven'],
    key_features: [
      {
        icon: 'TrendingUp',
        title: 'Completion Rates',
        description: 'See how many customers complete reviews vs those who start but don\'t finish'
      },
      {
        icon: 'PieChart',
        title: 'Platform Distribution',
        description: 'Track which review platforms (Google, Facebook, etc.) receive the most reviews'
      },
      {
        icon: 'Users',
        title: 'Customer Engagement',
        description: 'Monitor how customers interact with your prompt pages and features'
      },
      {
        icon: 'Clock',
        title: 'Timing Insights',
        description: 'Discover optimal times and days for sending review requests'
      },
      {
        icon: 'Target',
        title: 'Conversion Metrics',
        description: 'Track conversions from prompt page visits to completed reviews'
      },
      {
        icon: 'Activity',
        title: 'Performance Trends',
        description: 'View trends over time to understand improvement or decline'
      }
    ],
    how_it_works: [
      {
        number: 1,
        icon: 'Database',
        title: 'Automatic data collection',
        description: 'System tracks all customer interactions with your prompt pages'
      },
      {
        number: 2,
        icon: 'Brain',
        title: 'Data analysis and processing',
        description: 'Analytics engine processes data to identify patterns and trends'
      },
      {
        number: 3,
        icon: 'BarChart3',
        title: 'Visual dashboard presentation',
        description: 'View insights through easy-to-understand charts and graphs'
      },
      {
        number: 4,
        icon: 'Lightbulb',
        title: 'Actionable recommendations',
        description: 'Receive suggestions for improving your review collection strategy'
      }
    ],
    best_practices: [
      {
        icon: 'Target',
        title: 'Data-driven decisions',
        description: 'Make informed choices based on real performance data'
      },
      {
        icon: 'Search',
        title: 'Identify opportunities',
        description: 'Discover where you can improve review collection'
      },
      {
        icon: 'TrendingUp',
        title: 'Optimize performance',
        description: 'Continuously improve based on what works best'
      },
      {
        icon: 'DollarSign',
        title: 'Track ROI',
        description: 'Measure return on investment for review collection efforts'
      }
    ]
  },
  {
    slug: 'prompt-pages/features/customization',
    title: 'Customization Options',
    category: 'Prompt Pages Features',
    description: 'Personalize your prompt pages with your brand colors, logos, custom messaging, and business-specific styling to create a cohesive, professional brand experience.',
    seo_title: 'Customization Options - Brand Your Prompt Pages',
    seo_description: 'Learn how to customize your prompt pages with your business colors, logos, and messaging to create a cohesive brand experience.',
    keywords: ['customization', 'branding', 'brand colors', 'logo upload', 'custom messaging'],
    category_label: 'Features',
    category_icon: 'Palette',
    category_color: 'pink',
    available_plans: ['grower', 'builder', 'maven'],
    key_features: [
      {
        icon: 'Palette',
        title: 'Brand Colors',
        description: 'Choose custom colors for buttons, headers, backgrounds, and accents to match your brand'
      },
      {
        icon: 'Image',
        title: 'Logo & Images',
        description: 'Upload your business logo and custom images to personalize the page appearance'
      },
      {
        icon: 'Type',
        title: 'Custom Messaging',
        description: 'Write your own questions, prompts, and thank you messages in your brand voice'
      },
      {
        icon: 'Layout',
        title: 'Page Layout',
        description: 'Choose from different layout styles and arrangements to fit your preferences'
      },
      {
        icon: 'Sparkles',
        title: 'Custom Fields',
        description: 'Add business-specific fields and questions relevant to your industry'
      },
      {
        icon: 'Eye',
        title: 'Live Preview',
        description: 'See changes in real-time as you customize your prompt page'
      }
    ],
    how_it_works: [
      {
        number: 1,
        icon: 'Settings',
        title: 'Access style settings',
        description: 'Navigate to Prompt Page Settings or Style Settings from your dashboard'
      },
      {
        number: 2,
        icon: 'Upload',
        title: 'Upload your brand assets',
        description: 'Add your logo, choose brand colors, and upload any custom images'
      },
      {
        number: 3,
        icon: 'Edit',
        title: 'Customize messaging',
        description: 'Write custom questions, prompts, and thank you messages that reflect your brand voice'
      },
      {
        number: 4,
        icon: 'Eye',
        title: 'Preview and publish',
        description: 'Review your changes with live preview, then publish when you\'re satisfied'
      }
    ],
    best_practices: [
      {
        icon: 'Sparkles',
        title: 'Keep it simple',
        description: 'Don\'t overdo customization - maintain clean, easy-to-read pages'
      },
      {
        icon: 'Image',
        title: 'Use high-quality images',
        description: 'Upload clear, professional logos and images for the best appearance'
      },
      {
        icon: 'Link',
        title: 'Match your website',
        description: 'Use the same colors and style as your website for consistency'
      },
      {
        icon: 'Smartphone',
        title: 'Test on mobile',
        description: 'Preview your customizations on mobile devices to ensure they look good'
      }
    ]
  },
  {
    slug: 'prompt-pages/features/emoji-sentiment',
    title: 'Emoji Sentiment Flow',
    category: 'Prompt Pages Features',
    description: 'Interactive emoji-based review collection that makes leaving reviews fun, engaging, and guides customers to the right platform based on their satisfaction level.',
    seo_title: 'Emoji Sentiment Flow - Interactive Review Collection',
    seo_description: 'Learn how Emoji Sentiment Flow makes review collection fun and engaging with interactive emoji reactions that guide customers to appropriate review platforms.',
    keywords: ['emoji sentiment', 'interactive reviews', 'customer feedback', 'emoji reactions'],
    category_label: 'Features',
    category_icon: 'Smile',
    category_color: 'orange',
    available_plans: ['grower', 'builder', 'maven'],
    key_features: [
      {
        icon: 'Heart',
        title: 'Excellent',
        description: 'Extremely satisfied customers directed to public review platforms'
      },
      {
        icon: 'ThumbsUp',
        title: 'Satisfied',
        description: 'Happy customers directed to public review platforms'
      },
      {
        icon: 'Meh',
        title: 'Neutral',
        description: 'Okay experiences directed to private feedback'
      },
      {
        icon: 'ThumbsDown',
        title: 'Unsatisfied',
        description: 'Disappointed customers directed to private feedback'
      },
      {
        icon: 'Frown',
        title: 'Frustrated',
        description: 'Very unhappy customers sent directly to you for resolution'
      }
    ],
    how_it_works: [
      {
        number: 1,
        icon: 'MessageSquare',
        title: 'Customer sees emoji question',
        description: 'Your prompt page displays a question like "How was your experience?" with 5 emoji options'
      },
      {
        number: 2,
        icon: 'MousePointer',
        title: 'Customer selects emoji',
        description: 'They click the emoji that best represents their satisfaction level'
      },
      {
        number: 3,
        icon: 'GitBranch',
        title: 'Smart routing happens',
        description: 'Positive sentiments go to public review platforms, negative sentiments to private feedback'
      },
      {
        number: 4,
        icon: 'CheckCircle',
        title: 'Customer completes their feedback',
        description: 'They\'re guided to the appropriate platform to share their full experience'
      }
    ],
    best_practices: [
      {
        icon: 'Zap',
        title: 'Increases engagement',
        description: 'Fun, visual interface encourages more customers to participate'
      },
      {
        icon: 'Shield',
        title: 'Protects your reputation',
        description: 'Negative feedback goes to you privately, not public platforms'
      },
      {
        icon: 'Clock',
        title: 'Quick emotional feedback',
        description: 'Instantly gauge customer satisfaction levels'
      },
      {
        icon: 'Smartphone',
        title: 'Mobile-friendly',
        description: 'Emojis are perfect for touch interfaces on phones'
      }
    ]
  },
  {
    slug: 'prompt-pages/features/integration',
    title: 'Platform Integration',
    category: 'Prompt Pages Features',
    description: 'Seamlessly connect your prompt pages with Google, Facebook, Yelp, and other major review platforms to maximize visibility, streamline management, and improve local search rankings.',
    seo_title: 'Platform Integration - Connect with Major Review Sites',
    seo_description: 'Seamlessly connect your prompt pages with Google, Facebook, Yelp, and other major review platforms for maximum visibility and streamlined review management.',
    keywords: ['platform integration', 'google reviews', 'facebook reviews', 'yelp', 'review platforms', 'api integration'],
    category_label: 'Features',
    category_icon: 'Globe',
    category_color: 'indigo',
    available_plans: ['grower', 'builder', 'maven'],
    key_features: [
      {
        icon: 'MapPin',
        title: 'Google Business Profile',
        description: 'Direct integration with Google for local search visibility and review management'
      },
      {
        icon: 'ThumbsUp',
        title: 'Facebook',
        description: 'Connect with Facebook Pages to collect and manage Facebook reviews'
      },
      {
        icon: 'Star',
        title: 'Yelp',
        description: 'Direct customers to your Yelp page for reviews and ratings'
      },
      {
        icon: 'Building2',
        title: 'Trustpilot',
        description: 'Integrate with Trustpilot for verified customer reviews'
      },
      {
        icon: 'Globe',
        title: 'Industry-Specific Platforms',
        description: 'Support for industry-specific platforms like Healthgrades, Avvo, and more'
      },
      {
        icon: 'Link2',
        title: 'Custom Platforms',
        description: 'Ability to add custom review platform URLs for niche platforms'
      }
    ],
    how_it_works: [
      {
        number: 1,
        icon: 'Link',
        title: 'Connect your platforms',
        description: 'Link your Google Business Profile, Facebook Page, and other platforms to PromptReviews'
      },
      {
        number: 2,
        icon: 'Settings',
        title: 'Configure routing rules',
        description: 'Set up which types of reviews go to which platforms (e.g., positive to Google, constructive to you)'
      },
      {
        number: 3,
        icon: 'Users',
        title: 'Customer leaves review',
        description: 'Customers are automatically directed to the appropriate platform based on their sentiment'
      },
      {
        number: 4,
        icon: 'BarChart3',
        title: 'Track all reviews centrally',
        description: 'View and manage reviews from all platforms in one unified dashboard'
      }
    ],
    best_practices: [
      {
        icon: 'Globe',
        title: 'Connect all major platforms',
        description: 'Maximize visibility by integrating with Google, Facebook, Yelp, and industry-specific platforms'
      },
      {
        icon: 'GitBranch',
        title: 'Configure smart routing',
        description: 'Send positive reviews to public platforms, constructive feedback to you directly'
      },
      {
        icon: 'Zap',
        title: 'Respond promptly',
        description: 'Use the unified dashboard to respond quickly to reviews across all platforms'
      },
      {
        icon: 'TrendingUp',
        title: 'Monitor platform performance',
        description: 'Track which platforms generate the most and best quality reviews'
      }
    ]
  },
  {
    slug: 'prompt-pages/features/mobile',
    title: 'Mobile Optimization',
    category: 'Prompt Pages Features',
    description: 'Prompt pages deliver a perfect experience on all devices with responsive design, touch-friendly interfaces, and optimized loading speeds for mobile networks.',
    seo_title: 'Mobile Optimization - Perfect Review Experience on Any Device',
    seo_description: 'Prompt pages are fully optimized for mobile devices with responsive design, touch-friendly interfaces, and fast loading for the best mobile experience.',
    keywords: ['mobile optimization', 'responsive design', 'mobile-friendly', 'touch interface', 'mobile reviews'],
    category_label: 'Features',
    category_icon: 'Smartphone',
    category_color: 'cyan',
    available_plans: ['grower', 'builder', 'maven'],
    key_features: [
      {
        icon: 'Eye',
        title: 'Responsive Design',
        description: 'Automatically adapts to any screen size - phone, tablet, or desktop'
      },
      {
        icon: 'Hand',
        title: 'Touch-Friendly Interface',
        description: 'Large buttons, easy tapping, and swipe gestures designed for fingers'
      },
      {
        icon: 'Zap',
        title: 'Fast Loading Speeds',
        description: 'Optimized for mobile networks with compressed assets and efficient code'
      },
      {
        icon: 'Wifi',
        title: 'Offline Capability',
        description: 'Works reliably even on slow or unstable mobile connections'
      },
      {
        icon: 'Smartphone',
        title: 'Mobile-Specific Features',
        description: 'Camera integration for photos, location services, and mobile keyboards'
      },
      {
        icon: 'Monitor',
        title: 'Cross-Device Consistency',
        description: 'Same great experience whether on phone, tablet, or computer'
      }
    ],
    how_it_works: [
      {
        number: 1,
        icon: 'Smartphone',
        title: 'Automatic device detection',
        description: 'System detects screen size, device type, and capabilities'
      },
      {
        number: 2,
        icon: 'Layout',
        title: 'Layout adaptation',
        description: 'Page layout and components adjust to fit screen perfectly'
      },
      {
        number: 3,
        icon: 'Hand',
        title: 'Touch interface activation',
        description: 'Touch-optimized controls and gestures enable for mobile devices'
      },
      {
        number: 4,
        icon: 'Zap',
        title: 'Performance optimization',
        description: 'Images, scripts, and assets load efficiently for fast mobile experience'
      }
    ],
    best_practices: [
      {
        icon: 'Smartphone',
        title: 'Test on real devices',
        description: 'Preview your prompt pages on actual phones and tablets before launching'
      },
      {
        icon: 'Minimize',
        title: 'Keep it simple',
        description: 'Mobile screens are small - avoid cluttered designs and long forms'
      },
      {
        icon: 'Image',
        title: 'Use mobile-friendly images',
        description: 'Optimize images for mobile to ensure fast loading on cellular networks'
      },
      {
        icon: 'Zap',
        title: 'Prioritize speed',
        description: 'Every second of loading time reduces review completion rates'
      }
    ]
  },
  {
    slug: 'prompt-pages/features/multi-platform',
    title: 'Multi-Platform Sharing',
    category: 'Prompt Pages Features',
    description: 'Distribute your prompt pages across all your marketing channels - social media, email, websites, and physical materials - to maximize review collection opportunities.',
    seo_title: 'Multi-Platform Sharing - Distribute Prompt Pages Everywhere',
    seo_description: 'Share your prompt pages across all marketing channels including social media, email, websites, and physical materials for maximum reach.',
    keywords: ['multi-platform', 'social sharing', 'email campaigns', 'website embedding', 'review distribution'],
    category_label: 'Features',
    category_icon: 'Share2',
    category_color: 'blue',
    available_plans: ['grower', 'builder', 'maven'],
    key_features: [
      {
        icon: 'Link2',
        title: 'Direct Links',
        description: 'Share custom URLs via text, messaging apps, or anywhere you communicate with customers'
      },
      {
        icon: 'Mail',
        title: 'Email Campaigns',
        description: 'Include prompt page links in newsletters, transactional emails, and email campaigns'
      },
      {
        icon: 'Facebook',
        title: 'Social Media',
        description: 'Share to Facebook, Instagram, Twitter, LinkedIn, and other social platforms'
      },
      {
        icon: 'Globe',
        title: 'Website Embedding',
        description: 'Embed prompt pages directly on your website with custom code snippets'
      },
      {
        icon: 'QrCode',
        title: 'QR Codes',
        description: 'Generate QR codes for print materials, signage, and physical locations'
      },
      {
        icon: 'Instagram',
        title: 'Stories & Posts',
        description: 'Share in Instagram Stories, Facebook Stories, and other ephemeral content'
      }
    ],
    how_it_works: [
      {
        number: 1,
        icon: 'FileText',
        title: 'Create your prompt page',
        description: 'Set up your prompt page with customized branding and messaging'
      },
      {
        number: 2,
        icon: 'Download',
        title: 'Generate sharing assets',
        description: 'Create links, embed codes, QR codes, and social media-ready content'
      },
      {
        number: 3,
        icon: 'Share2',
        title: 'Distribute across channels',
        description: 'Share on social media, add to emails, embed on website, print QR codes'
      },
      {
        number: 4,
        icon: 'BarChart3',
        title: 'Track performance by channel',
        description: 'Analytics show which channels drive the most review completions'
      }
    ],
    best_practices: [
      {
        icon: 'Target',
        title: 'Match content to channel',
        description: 'Tailor your message for each platform - casual for social media, professional for email'
      },
      {
        icon: 'TestTube',
        title: 'Test different channels',
        description: 'Try various platforms to discover where your customers are most responsive'
      },
      {
        icon: 'BarChart3',
        title: 'Track and optimize',
        description: 'Monitor performance by channel and focus efforts on what works best'
      },
      {
        icon: 'CheckCircle',
        title: 'Maintain consistency',
        description: 'Keep your branding and core message consistent across all channels'
      }
    ]
  },
  {
    slug: 'prompt-pages/features/qr-codes',
    title: 'QR Code Generation',
    category: 'Prompt Pages Features',
    description: 'Generate scannable QR codes that customers can use to quickly access your prompt pages from their mobile devices, making review collection more convenient than ever.',
    seo_title: 'QR Code Generation - Easy Review Access from Anywhere',
    seo_description: 'Learn how to generate and use QR codes to make review collection convenient. Perfect for physical locations, printed materials, and offline marketing.',
    keywords: ['qr codes', 'review collection', 'mobile reviews', 'offline marketing', 'qr code generation'],
    category_label: 'Features',
    category_icon: 'QrCode',
    category_color: 'blue',
    available_plans: ['grower', 'builder', 'maven'],
    key_features: [
      {
        icon: 'CreditCard',
        title: 'Business Cards',
        description: 'Add QR codes to business cards for easy review access at networking events'
      },
      {
        icon: 'Printer',
        title: 'Receipts & Invoices',
        description: 'Include QR codes on receipts to capture feedback right after purchase'
      },
      {
        icon: 'QrCode',
        title: 'Table Tents & Displays',
        description: 'Place QR codes on tables, counters, and waiting areas for easy access'
      },
      {
        icon: 'FileText',
        title: 'Marketing Materials',
        description: 'Add to flyers, brochures, posters, and any printed marketing materials'
      },
      {
        icon: 'Users',
        title: 'Employee Badges',
        description: 'Team members can share their employee-specific prompt page QR codes'
      },
      {
        icon: 'Monitor',
        title: 'Digital Displays',
        description: 'Show QR codes on digital screens, presentations, or video displays'
      }
    ],
    how_it_works: [
      {
        number: 1,
        icon: 'Plus',
        title: 'Generate your QR code',
        description: 'Each prompt page has a unique QR code that you can generate with one click'
      },
      {
        number: 2,
        icon: 'Download',
        title: 'Download and print',
        description: 'Download the QR code in high resolution and add it to your materials'
      },
      {
        number: 3,
        icon: 'Smartphone',
        title: 'Customer scans the code',
        description: 'Customers use their phone\'s camera app to scan the QR code'
      },
      {
        number: 4,
        icon: 'ExternalLink',
        title: 'Instant access to prompt page',
        description: 'The prompt page opens automatically in their mobile browser'
      }
    ],
    best_practices: [
      {
        icon: 'Maximize',
        title: 'Size matters',
        description: 'Make QR codes at least 1 inch x 1 inch (2.5cm x 2.5cm) for easy scanning'
      },
      {
        icon: 'MessageSquare',
        title: 'Add clear instructions',
        description: 'Include text like "Scan to leave a review" or "Scan for quick feedback"'
      },
      {
        icon: 'MapPin',
        title: 'Strategic placement',
        description: 'Place QR codes where customers naturally look - near exits, on receipts, at checkout'
      },
      {
        icon: 'Contrast',
        title: 'High contrast',
        description: 'Ensure good contrast between QR code and background for reliable scanning'
      }
    ]
  },
  {
    slug: 'prompt-pages/features/security',
    title: 'Security & Privacy',
    category: 'Prompt Pages Features',
    description: 'Enterprise-grade security measures protect all customer data and review information, ensuring compliance with privacy regulations and maintaining customer trust.',
    seo_title: 'Security & Privacy - Enterprise-Grade Protection',
    seo_description: 'Learn how we protect customer data with enterprise-grade security, end-to-end encryption, GDPR compliance, and comprehensive privacy controls.',
    keywords: ['security', 'privacy', 'encryption', 'GDPR', 'CCPA', 'data protection'],
    category_label: 'Features',
    category_icon: 'Shield',
    category_color: 'emerald',
    available_plans: ['grower', 'builder', 'maven'],
    key_features: [
      {
        icon: 'Lock',
        title: 'End-to-End Encryption',
        description: 'All data transmission is encrypted with industry-standard SSL/TLS protocols'
      },
      {
        icon: 'Key',
        title: 'Secure Authentication',
        description: 'Multi-factor authentication and secure session management'
      },
      {
        icon: 'Eye',
        title: 'Privacy Controls',
        description: 'Granular control over what customer information is collected and stored'
      },
      {
        icon: 'FileCheck',
        title: 'GDPR & CCPA Compliance',
        description: 'Built-in compliance features for international privacy regulations'
      },
      {
        icon: 'Globe',
        title: 'Secure Hosting',
        description: 'Infrastructure hosted on enterprise-grade secure servers'
      },
      {
        icon: 'AlertCircle',
        title: 'Regular Security Audits',
        description: 'Continuous monitoring and regular third-party security assessments'
      }
    ],
    how_it_works: [
      {
        number: 1,
        icon: 'Lock',
        title: 'Encrypted transmission',
        description: 'All data sent between customers and servers is encrypted with 256-bit SSL'
      },
      {
        number: 2,
        icon: 'Database',
        title: 'Secure storage',
        description: 'Data stored in encrypted databases with strict access controls'
      },
      {
        number: 3,
        icon: 'Users',
        title: 'Access management',
        description: 'Role-based permissions ensure only authorized users access data'
      },
      {
        number: 4,
        icon: 'Shield',
        title: 'Continuous monitoring',
        description: '24/7 security monitoring and automatic threat detection'
      }
    ],
    best_practices: [
      {
        icon: 'Shield',
        title: 'Customer trust',
        description: 'Build confidence with enterprise-grade security'
      },
      {
        icon: 'FileCheck',
        title: 'Legal compliance',
        description: 'Meet regulatory requirements automatically'
      },
      {
        icon: 'AlertTriangle',
        title: 'Risk reduction',
        description: 'Minimize security risks and potential liability'
      },
      {
        icon: 'Award',
        title: 'Professional reputation',
        description: 'Demonstrate commitment to data protection'
      }
    ]
  }
];

// Function to create article via API
async function createArticle(articleData) {
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
  const endpoint = `${apiUrl}/api/admin/help-content`;

  const article = {
    slug: articleData.slug,
    title: articleData.title,
    content: `# ${articleData.title}\n\n${articleData.description}`,
    status: 'published',
    metadata: {
      description: articleData.description,
      category: articleData.category,
      seo_title: articleData.seo_title,
      seo_description: articleData.seo_description,
      keywords: articleData.keywords,
      category_label: articleData.category_label,
      category_icon: articleData.category_icon,
      category_color: articleData.category_color,
      available_plans: articleData.available_plans,
      key_features: articleData.key_features,
      how_it_works: articleData.how_it_works,
      best_practices: articleData.best_practices
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(article)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    return { success: true, slug: articleData.slug, data: result };
  } catch (error) {
    return { success: false, slug: articleData.slug, error: error.message };
  }
}

// Main execution
async function main() {
  console.log('Starting conversion of feature pages to CMS...\n');

  const results = [];

  for (const feature of featuresData) {
    console.log(`Converting: ${feature.title} (${feature.slug})...`);
    const result = await createArticle(feature);
    results.push(result);

    if (result.success) {
      console.log(`✓ Success: ${feature.slug}\n`);
    } else {
      console.log(`✗ Failed: ${feature.slug}`);
      console.log(`  Error: ${result.error}\n`);
    }

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n========== CONVERSION SUMMARY ==========');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Total: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\nFailed conversions:');
    failed.forEach(f => {
      console.log(`  - ${f.slug}: ${f.error}`);
    });
  }

  console.log('\n========================================\n');
}

main().catch(console.error);
