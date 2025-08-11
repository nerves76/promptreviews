// Comprehensive FAQ data for all documentation pages

export const pageFAQs = {
  // Getting Started FAQs
  'getting-started': [
    {
      question: 'How long does it take to set up Prompt Reviews?',
      answer: 'Most businesses are fully set up and collecting their first reviews within 30 minutes. The basic setup (account creation and business profile) takes about 5 minutes, and creating your first prompt page takes another 10 minutes.'
    },
    {
      question: 'Do I need technical skills to use Prompt Reviews?',
      answer: 'No technical skills required! Prompt Reviews is designed to be user-friendly. The interface is intuitive, and our AI assistant helps you create content automatically. If you can use email and social media, you can use Prompt Reviews.'
    },
    {
      question: 'Can I start collecting reviews immediately after signing up?',
      answer: 'Yes! As soon as you create your account and set up your first prompt page, you can start sharing it with customers. Many businesses send their first review request within minutes of signing up.'
    },
    {
      question: 'What information do I need to get started?',
      answer: 'You\'ll need your business name, address, phone number, and website. Having a customer contact list ready (optional) helps you start faster, but you can also add contacts manually or collect them via QR codes.'
    },
    {
      question: 'Is there a free trial available?',
      answer: 'Yes, we offer a free trial so you can experience how Prompt Reviews works for your business before committing to a paid plan. You can explore all features and start collecting reviews during the trial period.'
    },
    {
      question: 'Can I migrate from another review platform?',
      answer: 'Yes! You can import your existing customer contacts via CSV and continue building on your review collection efforts. While we cannot import reviews from other platforms, you can display existing Google reviews through our integration.'
    }
  ],

  // Prompt Pages FAQs
  'prompt-pages': [
    {
      question: 'What exactly is a prompt page?',
      answer: 'A prompt page is a personalized review request page you create for specific situations, customers, or services. It\'s like a landing page designed specifically to make leaving reviews easy and engaging for your customers.'
    },
    {
      question: 'How many prompt pages can I create?',
      answer: 'The number of prompt pages depends on your plan. The Grower plan includes 3 custom prompt pages, Builder includes 50 prompt pages, and Maven includes 500 prompt pages. You can create different pages for various services, employees, or customer types.'
    },
    {
      question: 'Can I customize the look of my prompt pages?',
      answer: 'Yes! You can customize colors, add your logo, personalize messages, and choose from different page types (service, product, photo, video, event, employee, or universal). Each page can be tailored to match your brand and specific use case.'
    },
    {
      question: 'How do customers access my prompt pages?',
      answer: 'Customers can access your prompt pages through multiple channels: direct links (via email or text), QR codes (perfect for in-person), NFC tags, or embedded buttons on your website. Each page has a unique URL that you can share anywhere.'
    },
    {
      question: 'Do prompt pages work on mobile devices?',
      answer: 'Absolutely! All prompt pages are fully responsive and optimized for mobile devices. Since most customers leave reviews on their phones, we\'ve designed the experience to be perfect on smaller screens.'
    },
    {
      question: 'Can I track which prompt pages perform best?',
      answer: 'Yes, you get detailed analytics for each prompt page including views, conversion rates, and review submissions. This helps you understand what works best for your business and optimize your approach.'
    },
    {
      question: 'What\'s the difference between page types?',
      answer: 'Each page type is optimized for different scenarios: Service pages focus on experience, Product pages on items purchased, Photo/Video pages include media uploads, Event pages are time-specific, Employee pages spotlight team members, and Universal pages work for any situation.'
    },
    {
      question: 'Can I use AI to help create prompt page content?',
      answer: 'Yes! Our AI assistant can generate personalized content for your prompt pages based on your business type and customer context. You can use AI suggestions as-is or customize them to match your voice.'
    }
  ],

  // Contact Management FAQs
  'contacts': [
    {
      question: 'How do I import my existing customer list?',
      answer: 'You can import contacts via CSV file upload. We support most common formats and automatically detect duplicates. Your CSV should include email addresses, names, and optionally phone numbers and custom tags. The import process takes just 2-5 minutes.'
    },
    {
      question: 'What happens if I have duplicate contacts?',
      answer: 'Our system automatically detects and merges duplicate contacts based on email addresses and phone numbers. This keeps your database clean and prevents sending multiple requests to the same customer.'
    },
    {
      question: 'Can I segment my contacts into different groups?',
      answer: 'Yes! You can organize contacts using tags, custom fields, and groups. This allows you to send targeted review requests to specific customer segments, like "VIP customers," "recent purchases," or "event attendees."'
    },
    {
      question: 'How many contacts can I store?',
      answer: 'Contact limits vary by plan. The Grower plan doesn\'t include contact management, Builder plan includes up to 1,000 contacts, and Maven plan offers up to 10,000 contacts.'
    },
    {
      question: 'Can customers add themselves to my contact list?',
      answer: 'Yes! Customers can add themselves through QR codes at your location or through sign-up forms on your prompt pages. This self-service option is perfect for in-person businesses and events.'
    },
    {
      question: 'How do I ensure high email deliverability?',
      answer: 'We handle email authentication and send from verified domains to avoid spam filters. We also automatically clean your list by removing invalid addresses and managing bounces to maintain high deliverability rates.'
    },
    {
      question: 'Can I send review requests via SMS?',
      answer: 'Yes, you can send review requests via SMS if you have phone numbers for your contacts. SMS requests often have higher open rates and faster responses than email, especially for service-based businesses.'
    }
  ],

  // Google Business Profile FAQs
  'google-business': [
    {
      question: 'Which plans include Google Business Profile integration?',
      answer: 'Google Business Profile integration is available on Builder ($35/month) and Maven ($100/month) plans. This feature is not available on the Grower plan.'
    },
    {
      question: 'What can I do with Google Business Profile integration?',
      answer: 'You can manage reviews, respond to customers, create and schedule Google Posts, import existing reviews, and manage multiple locations - all from your Prompt Reviews dashboard without switching between platforms.'
    },
    {
      question: 'Do I need to be the owner of the Google Business Profile?',
      answer: 'You need to be either an owner or manager of the Google Business Profile to connect it. If you\'re not sure about your role, check your Google Business Profile settings or ask the profile owner to add you as a manager.'
    },
    {
      question: 'Can I manage multiple Google Business locations?',
      answer: 'Yes! Perfect for franchises or multi-location businesses. You can connect and manage multiple locations from one dashboard, create location-specific prompt pages, and track analytics for each location separately.'
    },
    {
      question: 'Is it safe to connect my Google account?',
      answer: 'Absolutely. We use OAuth 2.0 for secure authentication - we never see or store your Google password. You can revoke access at any time from your Google account settings. We only request the minimum permissions needed.'
    },
    {
      question: 'Can I schedule Google Posts in advance?',
      answer: 'Yes, you can create and schedule Google Posts in advance. This helps maintain a consistent presence on your Google Business Profile without daily manual work.'
    },
    {
      question: 'Will connecting Google affect my existing reviews?',
      answer: 'No, connecting your Google Business Profile won\'t affect your existing reviews. It simply allows you to manage them from Prompt Reviews. Your reviews remain on Google, and we help you respond and track them more efficiently.'
    }
  ],

  // Reviews Management FAQs
  'reviews': [
    {
      question: 'How do I track reviews from multiple platforms?',
      answer: 'Prompt Reviews centralizes reviews from Google, Yelp, Facebook, and other platforms in one dashboard. You can see all reviews, respond to them, and track trends without logging into multiple accounts.'
    },
    {
      question: 'Can I respond to reviews directly from Prompt Reviews?',
      answer: 'Yes, for connected platforms like Google Business Profile (on Builder and Maven plans), you can respond to reviews directly from your dashboard. For other platforms, we provide quick links to respond on the original platform.'
    },
    {
      question: 'How do I handle negative reviews?',
      answer: 'Respond promptly and professionally to all reviews, especially negative ones. Address concerns constructively, apologize if appropriate, offer to resolve issues offline, and show you value customer feedback. Never argue or get defensive in public responses.'
    },
    {
      question: 'Can I filter or report fake reviews?',
      answer: 'While Prompt Reviews can\'t remove reviews from platforms, we help you identify potentially fake reviews through pattern analysis. You can then report these directly to the review platform (Google, Yelp, etc.) with the evidence needed.'
    },
    {
      question: 'How often should I check for new reviews?',
      answer: 'We recommend checking at least weekly, but daily is better for active businesses. Prompt Reviews sends notifications for new reviews so you never miss one. Quick responses show customers you care and can improve your reputation.'
    },
    {
      question: 'Can I export my review data?',
      answer: 'Yes, you can export your review data, analytics, and reports at any time. This is useful for presentations, deeper analysis, or backup purposes. Exports are available in CSV format.'
    }
  ],

  // Billing FAQs
  'billing': [
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover) and debit cards. All payments are processed securely through our payment provider.'
    },
    {
      question: 'Can I change my plan at any time?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any billing adjustments. If downgrading, some features may become unavailable based on the new plan limits.'
    },
    {
      question: 'Do you offer annual billing discounts?',
      answer: 'Yes, we offer discounts for annual billing. Contact our sales team for annual pricing options which can save you up to 20% compared to monthly billing.'
    },
    {
      question: 'What happens if my payment fails?',
      answer: 'We\'ll retry the payment and send you a notification. You have a 7-day grace period to update your payment method. After that, your account may be temporarily suspended until payment is resolved, but your data remains safe.'
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time. Your account remains active until the end of your current billing period. You can also pause your subscription if you need a temporary break.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a satisfaction guarantee for new customers. If you\'re not satisfied within the first 30 days, contact our support team for a full refund. After 30 days, we don\'t offer refunds but you can cancel anytime.'
    }
  ],

  // Widgets FAQs
  'widgets': [
    {
      question: 'What are review widgets and how do they work?',
      answer: 'Review widgets are embeddable displays that showcase your best reviews on your website. They update automatically as new reviews come in, providing social proof to website visitors without manual updates.'
    },
    {
      question: 'How do I install a widget on my website?',
      answer: 'We provide a simple embed code that you copy and paste into your website HTML. No coding knowledge required - it works like embedding a YouTube video. We also offer plugins for popular platforms like WordPress.'
    },
    {
      question: 'Can I customize the widget appearance?',
      answer: 'Yes! You can customize colors, layout (grid, carousel, list), size, which reviews to display, and more. The widget can match your website\'s design perfectly.'
    },
    {
      question: 'Do widgets slow down my website?',
      answer: 'No, our widgets are optimized for performance. They load asynchronously (after your page loads) and use CDN delivery for fast loading times. They won\'t impact your site\'s speed or SEO.'
    },
    {
      question: 'Can I choose which reviews appear in my widget?',
      answer: 'Yes, you can filter reviews by rating, date, or manually select specific reviews to showcase. You can also set it to automatically display your highest-rated recent reviews.'
    },
    {
      question: 'Do widgets work on mobile devices?',
      answer: 'Absolutely! All widgets are fully responsive and look great on phones, tablets, and desktops. They automatically adjust to fit any screen size.'
    }
  ],

  // AI Reviews FAQs
  'ai-reviews': [
    {
      question: 'How does AI help with review collection?',
      answer: 'Our AI analyzes your business context to create personalized review requests, suggests optimal timing, helps customers write better reviews, and identifies patterns in feedback to improve your strategy.'
    },
    {
      question: 'Will AI-generated content sound robotic?',
      answer: 'No! Our AI is trained to create natural, conversational content that matches your brand voice. You can always edit AI suggestions to add your personal touch. The goal is to help you be more personal, not less.'
    },
    {
      question: 'Can AI write reviews for my customers?',
      answer: 'No, we never write fake reviews. Our AI helps customers express their genuine experiences better by suggesting structure and helping them articulate their thoughts, but customers always write their own authentic reviews.'
    },
    {
      question: 'How does AI personalization work?',
      answer: 'AI uses information about your business, the specific service or product, and customer context to create personalized messages. For example, it might reference the specific service date or employee who helped them.'
    },
    {
      question: 'Can I turn off AI features?',
      answer: 'Yes, AI features are optional. You can use Prompt Reviews with fully manual content creation if you prefer. However, most users find AI saves significant time while improving results.'
    },
    {
      question: 'Does AI analyze my review trends?',
      answer: 'Yes, AI analyzes your reviews to identify trends, common praise, and areas for improvement. This helps you understand what customers love and what might need attention.'
    }
  ],

  // Team Management FAQs
  'team': [
    {
      question: 'How many team members can I add?',
      answer: 'Team member limits depend on your plan. Grower is for single users only, Builder includes up to 3 team members, and Maven includes up to 5 team members with different permission levels.'
    },
    {
      question: 'What permission levels are available?',
      answer: 'You can set different permission levels: Admin (full access), Manager (can manage reviews and contacts), and Viewer (read-only access). This ensures team members only access what they need.'
    },
    {
      question: 'Can team members have their own login credentials?',
      answer: 'Yes, each team member gets their own login credentials. This improves security and allows you to track who makes changes. You can also revoke access instantly if needed.'
    },
    {
      question: 'Can I assign team members to specific locations?',
      answer: 'Yes, on the Maven plan, you can assign team members to specific business locations. They\'ll only see and manage reviews for their assigned locations.'
    },
    {
      question: 'How do I add or remove team members?',
      answer: 'Simply go to Team Settings, click "Add Team Member," and enter their email. They\'ll receive an invitation to create their account. You can remove members instantly from the same settings page.'
    },
    {
      question: 'Can team members create their own prompt pages?',
      answer: 'Yes, with appropriate permissions. You can allow team members to create employee-specific prompt pages, which is perfect for businesses where individual employees build customer relationships.'
    }
  ],

  // Analytics FAQs
  'analytics': [
    {
      question: 'What metrics can I track in Prompt Reviews?',
      answer: 'Track review volume, average ratings, response rates, prompt page conversion rates, platform distribution, sentiment trends, and more. Analytics help you understand what\'s working and optimize your strategy.'
    },
    {
      question: 'Can I see which prompt pages perform best?',
      answer: 'Yes! Each prompt page has detailed analytics showing views, clicks, conversion rates, and reviews generated. This helps you identify your most effective pages and replicate their success.'
    },
    {
      question: 'How do I track ROI from review collection?',
      answer: 'Track metrics like review volume growth, rating improvements, and conversion rates. Many businesses see increased customer inquiries and sales after improving their review profiles, which you can correlate with your efforts.'
    },
    {
      question: 'Can I export analytics reports?',
      answer: 'Yes, you can export analytics data in CSV format for deeper analysis or presentations. Create custom date ranges and filter by specific metrics to get exactly the data you need.'
    },
    {
      question: 'Do you provide competitor analysis?',
      answer: 'While we don\'t directly track competitors, you can use our analytics to benchmark your performance against industry standards and set improvement goals based on your market.'
    },
    {
      question: 'How often are analytics updated?',
      answer: 'Analytics update in real-time for most metrics. Review data from external platforms syncs every few hours to ensure you always have current information.'
    }
  ],

  // Troubleshooting FAQs
  'troubleshooting': [
    {
      question: 'Why aren\'t my emails being delivered?',
      answer: 'Check that email addresses are valid and ask customers to add your sending address to contacts. If issues persist, contact support to check your domain reputation and authentication settings.'
    },
    {
      question: 'Why can\'t I connect my Google Business Profile?',
      answer: 'Ensure you\'re signing in with the Google account that manages your business profile and that you\'re an owner or manager. Also verify you\'re on the Builder or Maven plan, as Grower doesn\'t include this feature.'
    },
    {
      question: 'My QR code isn\'t working - what should I do?',
      answer: 'Ensure the QR code is printed clearly at sufficient size (at least 1 inch square). Test it with multiple devices. If issues persist, regenerate the QR code from your dashboard.'
    },
    {
      question: 'Why is my prompt page not loading?',
      answer: 'Check your internet connection and try clearing your browser cache. Ensure you\'re using a supported browser (Chrome, Firefox, Safari, Edge). Contact support if the issue continues.'
    },
    {
      question: 'How do I recover a deleted contact or prompt page?',
      answer: 'Contact support within 30 days of deletion. We maintain backups and can often recover recently deleted data. To prevent future issues, export important data regularly.'
    },
    {
      question: 'What browsers are supported?',
      answer: 'Prompt Reviews works on all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, use the latest version of your preferred browser.'
    }
  ],

  // Strategies FAQs
  'strategies': [
    {
      question: 'What\'s the best time to request reviews?',
      answer: 'The optimal time is 1-3 days after service completion when the experience is fresh but the customer isn\'t overwhelmed. For products, wait until they\'ve had time to use it - typically 1-2 weeks after delivery.'
    },
    {
      question: 'How many review requests should I send?',
      answer: 'Quality over quantity! Focus on 10-50 highly satisfied customers per month rather than mass-sending to everyone. Personalized requests to happy customers yield better results than bulk campaigns.'
    },
    {
      question: 'Should I incentivize reviews?',
      answer: 'Be careful with incentives as many platforms prohibit them. Instead, make the process easy, explain how reviews help your business, and show appreciation after they leave a review. Never offer incentives for positive reviews only.'
    },
    {
      question: 'How do I identify which customers to ask?',
      answer: 'Look for customers who expressed satisfaction, made repeat purchases, referred others, or gave positive feedback. Your team often knows who your happiest customers are - ask them for suggestions.'
    },
    {
      question: 'What\'s the Double-Dip strategy?',
      answer: 'The Double-Dip strategy involves first asking for feedback privately, then requesting public reviews from satisfied customers. This helps you catch and resolve issues before they become negative public reviews.'
    },
    {
      question: 'How do I encourage photo and video reviews?',
      answer: 'Make it easy with dedicated photo/video prompt pages, show examples of great visual reviews, and explain how photos help other customers. Visual reviews get more engagement and build stronger trust.'
    }
  ]
}

// Consolidated FAQ for main FAQ page - organized by category
export const consolidatedFAQs = [
  {
    category: 'Getting Started & Setup',
    faqs: [
      {
        question: 'How long does it take to set up Prompt Reviews?',
        answer: 'Most businesses are fully set up and collecting their first reviews within 30 minutes. The basic setup takes about 5 minutes, and creating your first prompt page takes another 10 minutes.'
      },
      {
        question: 'Do I need technical skills to use Prompt Reviews?',
        answer: 'No technical skills required! The interface is intuitive, and our AI assistant helps you create content automatically. If you can use email and social media, you can use Prompt Reviews.'
      },
      {
        question: 'What information do I need to get started?',
        answer: 'You\'ll need your business name, address, phone number, and website. Having a customer contact list ready helps you start faster, but you can also add contacts manually or collect them via QR codes.'
      }
    ]
  },
  {
    category: 'Pricing & Plans',
    faqs: [
      {
        question: 'How much does Prompt Reviews cost?',
        answer: 'Prompt Reviews starts at $15/month for the Grower plan. We offer Builder ($35/month) and Maven ($100/month) plans to fit businesses of all sizes, with features that scale with your needs.'
      },
      {
        question: 'Is there a free trial available?',
        answer: 'Yes, we offer a free trial so you can experience how Prompt Reviews works for your business before committing to a paid plan.'
      },
      {
        question: 'Can I change my plan at any time?',
        answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any billing adjustments.'
      }
    ]
  },
  {
    category: 'Prompt Pages',
    faqs: [
      {
        question: 'What exactly is a prompt page?',
        answer: 'A prompt page is a personalized review request page you create for specific situations, customers, or services. It\'s designed to make leaving reviews easy and engaging for your customers.'
      },
      {
        question: 'How many prompt pages can I create?',
        answer: 'The Grower plan includes 3 custom prompt pages, Builder includes 50 prompt pages, and Maven includes 500 prompt pages. You can create different pages for various services, employees, or customer types.'
      },
      {
        question: 'How do customers access my prompt pages?',
        answer: 'Customers can access prompt pages through direct links (email/text), QR codes, NFC tags, or embedded buttons on your website. Each page has a unique URL you can share anywhere.'
      }
    ]
  },
  {
    category: 'Contact Management',
    faqs: [
      {
        question: 'How do I import my existing customer list?',
        answer: 'You can import contacts via CSV file upload. We support most formats and automatically detect duplicates. The import process takes just 2-5 minutes.'
      },
      {
        question: 'Can I segment my contacts into different groups?',
        answer: 'Yes! You can organize contacts using tags, custom fields, and groups. This allows you to send targeted review requests to specific customer segments.'
      },
      {
        question: 'Can I send review requests via SMS?',
        answer: 'Yes, you can send review requests via SMS if you have phone numbers. SMS often has higher open rates and faster responses than email.'
      }
    ]
  },
  {
    category: 'Google Business & Integrations',
    faqs: [
      {
        question: 'Which plans include Google Business Profile integration?',
        answer: 'Google Business Profile integration is available on Builder ($35/month) and Maven ($100/month) plans.'
      },
      {
        question: 'What can I do with Google Business Profile integration?',
        answer: 'Manage reviews, respond to customers, create Google Posts, import existing reviews, and manage multiple locations - all from your Prompt Reviews dashboard.'
      },
      {
        question: 'Is it safe to connect my Google account?',
        answer: 'Yes! We use OAuth 2.0 for secure authentication. We never see or store your Google password, and you can revoke access at any time.'
      }
    ]
  },
  {
    category: 'AI Features',
    faqs: [
      {
        question: 'How does AI help with review collection?',
        answer: 'AI analyzes your business to create personalized review requests, suggests optimal timing, helps customers write better reviews, and identifies feedback patterns.'
      },
      {
        question: 'Will AI-generated content sound robotic?',
        answer: 'No! Our AI creates natural, conversational content that matches your brand voice. You can always edit suggestions to add your personal touch.'
      },
      {
        question: 'Can AI write fake reviews?',
        answer: 'No, we never write fake reviews. AI helps customers express genuine experiences better, but customers always write their own authentic reviews.'
      }
    ]
  },
  {
    category: 'Technical & Support',
    faqs: [
      {
        question: 'What browsers are supported?',
        answer: 'Prompt Reviews works on all modern browsers including Chrome, Firefox, Safari, and Edge. Use the latest version for the best experience.'
      },
      {
        question: 'Is my data secure?',
        answer: 'Yes! We use industry-standard encryption and security practices. Your data is never shared with third parties and you can export it anytime.'
      },
      {
        question: 'What if I need help?',
        answer: 'Check our troubleshooting guide first, then contact our support team through our contact form at promptreviews.app/contact. We typically respond within 24 hours.'
      }
    ]
  }
]