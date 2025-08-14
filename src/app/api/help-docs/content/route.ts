/**
 * API endpoint for fetching help article content
 * Returns formatted article content for inline display
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock article content database
// In production, this would fetch from a CMS or markdown files
const articleContent: Record<string, string> = {
  'faq-comprehensive': `
    <h1>Frequently Asked Questions</h1>
    
    <h2>Getting Started</h2>
    
    <h3>What is Prompt Reviews?</h3>
    <p>Prompt Reviews is a comprehensive platform designed to help businesses manage their online reputation through intelligent review collection, management, and display tools.</p>
    
    <h3>How do I create my first prompt page?</h3>
    <p>Creating a prompt page is simple:</p>
    <ol>
      <li>Navigate to Dashboard → Prompt Pages</li>
      <li>Click "Create New Page"</li>
      <li>Choose from our templates or start from scratch</li>
      <li>Customize the content, branding, and review platforms</li>
      <li>Share the unique link with your customers</li>
    </ol>
    
    <h3>Can I have multiple businesses under one account?</h3>
    <p>Yes! Our platform supports multi-business management. You can add additional businesses from Settings → Business Management.</p>
    
    <h2>Features & Functionality</h2>
    
    <h3>What review platforms do you support?</h3>
    <p>We currently support:</p>
    <ul>
      <li>Google Business Profile</li>
      <li>Facebook</li>
      <li>Yelp</li>
      <li>TripAdvisor</li>
      <li>Custom review collection</li>
    </ul>
    
    <h3>Can I customize the appearance of my review pages?</h3>
    <p>Absolutely! You can customize colors, fonts, logos, and messaging to match your brand identity.</p>
    
    <h3>How do review widgets work?</h3>
    <p>Review widgets are embeddable components that display your best reviews on your website. Simply copy the embed code and paste it into your website's HTML.</p>
    
    <h2>Account & Billing</h2>
    
    <h3>What payment methods do you accept?</h3>
    <p>We accept all major credit cards through our secure payment processor, Stripe.</p>
    
    <h3>Can I cancel my subscription anytime?</h3>
    <p>Yes, you can cancel your subscription at any time from Account Settings. Your access will continue until the end of your billing period.</p>
    
    <h3>Do you offer a free trial?</h3>
    <p>Yes! We offer a 14-day free trial with full access to all features.</p>
  `,
  
  'getting-started': `
    <h1>Getting Started with Prompt Pages</h1>
    
    <p>Prompt pages are the heart of your review collection strategy. They're customizable landing pages designed to guide your customers through leaving reviews on the platforms that matter most to your business.</p>
    
    <h2>Creating Your First Prompt Page</h2>
    
    <h3>Step 1: Navigate to Prompt Pages</h3>
    <p>From your dashboard, click on "Prompt Pages" in the main navigation menu.</p>
    
    <h3>Step 2: Choose a Template</h3>
    <p>We offer several pre-designed templates optimized for different industries:</p>
    <ul>
      <li><strong>Restaurant:</strong> Perfect for cafes, restaurants, and food services</li>
      <li><strong>Service Business:</strong> Ideal for contractors, consultants, and service providers</li>
      <li><strong>Retail:</strong> Optimized for stores and e-commerce businesses</li>
      <li><strong>Healthcare:</strong> Designed for medical and wellness practices</li>
    </ul>
    
    <h3>Step 3: Customize Your Page</h3>
    <p>Make the page your own by customizing:</p>
    <ul>
      <li>Business name and logo</li>
      <li>Welcome message</li>
      <li>Review platform priorities</li>
      <li>Colors and fonts</li>
      <li>Thank you message</li>
    </ul>
    
    <h3>Step 4: Set Up Review Routing</h3>
    <p>Configure which review platforms to show and in what order. You can also set up intelligent routing based on customer satisfaction.</p>
    
    <h3>Step 5: Share Your Page</h3>
    <p>Once your page is ready, share it via:</p>
    <ul>
      <li>Email campaigns</li>
      <li>SMS messages</li>
      <li>QR codes</li>
      <li>Social media</li>
      <li>Receipt footers</li>
    </ul>
    
    <h2>Best Practices</h2>
    
    <h3>Timing is Everything</h3>
    <p>Send review requests when the experience is fresh - ideally within 24-48 hours of service.</p>
    
    <h3>Make it Personal</h3>
    <p>Use customer names and reference specific services when possible.</p>
    
    <h3>Follow Up (But Don't Spam)</h3>
    <p>A gentle reminder after a week can increase response rates by 30%.</p>
  `,
  
  'business-profile': `
    <h1>Customizing Your Business Profile</h1>
    
    <p>Your business profile is the foundation of your presence on Prompt Reviews. It contains all the essential information about your business and controls how you appear across the platform.</p>
    
    <h2>Basic Information</h2>
    
    <h3>Business Name</h3>
    <p>Enter your business name exactly as you want it to appear to customers. This will be displayed on all your prompt pages and widgets.</p>
    
    <h3>Business Description</h3>
    <p>Write a compelling description that tells customers what makes your business unique. Keep it concise but informative - aim for 2-3 sentences.</p>
    
    <h3>Contact Information</h3>
    <ul>
      <li><strong>Phone:</strong> Your primary business phone number</li>
      <li><strong>Email:</strong> Customer service email address</li>
      <li><strong>Website:</strong> Your business website URL</li>
      <li><strong>Address:</strong> Physical location(s)</li>
    </ul>
    
    <h2>Branding</h2>
    
    <h3>Logo</h3>
    <p>Upload a high-resolution logo (recommended: 500x500px minimum). We support PNG, JPG, and SVG formats.</p>
    
    <h3>Brand Colors</h3>
    <p>Set your primary and secondary brand colors. These will be used throughout your prompt pages and widgets to maintain brand consistency.</p>
    
    <h3>Custom Domain</h3>
    <p>Premium accounts can set up a custom domain for their prompt pages (e.g., reviews.yourbusiness.com).</p>
    
    <h2>Social Media Integration</h2>
    
    <p>Connect your social media profiles to:</p>
    <ul>
      <li>Display social proof on your prompt pages</li>
      <li>Enable social sharing of positive reviews</li>
      <li>Monitor mentions and engagement</li>
    </ul>
    
    <h2>Business Hours</h2>
    
    <p>Set your operating hours to help customers know when to expect responses. This also helps our system schedule automated communications appropriately.</p>
  `,
  
  'contacts': `
    <h1>Managing Contacts and Import Options</h1>
    
    <p>Effectively managing your customer contacts is crucial for successful review campaigns. Our contact management system helps you organize, segment, and communicate with your customers.</p>
    
    <h2>Adding Contacts</h2>
    
    <h3>Manual Entry</h3>
    <p>Add individual contacts through the dashboard by entering:</p>
    <ul>
      <li>Name (first and last)</li>
      <li>Email address</li>
      <li>Phone number (optional)</li>
      <li>Last service date</li>
      <li>Custom tags</li>
    </ul>
    
    <h3>Bulk Import via CSV</h3>
    <p>Import multiple contacts at once using a CSV file:</p>
    <ol>
      <li>Download our CSV template</li>
      <li>Fill in your customer data</li>
      <li>Upload the file</li>
      <li>Map columns to fields</li>
      <li>Review and confirm import</li>
    </ol>
    
    <h3>Integration Import</h3>
    <p>Connect with popular CRM and POS systems to automatically sync contacts.</p>
    
    <h2>Contact Segmentation</h2>
    
    <h3>Tags</h3>
    <p>Use tags to categorize contacts:</p>
    <ul>
      <li>Service type (e.g., "Premium", "Regular")</li>
      <li>Location</li>
      <li>Customer value</li>
      <li>Review status</li>
    </ul>
    
    <h3>Smart Lists</h3>
    <p>Create dynamic lists based on criteria:</p>
    <ul>
      <li>Recent customers (last 30 days)</li>
      <li>High-value clients</li>
      <li>Haven't left a review</li>
      <li>Engaged customers</li>
    </ul>
    
    <h2>Communication Management</h2>
    
    <h3>Review Invitations</h3>
    <p>Send personalized review invitations via email or SMS. Track open rates, click-through rates, and conversion.</p>
    
    <h3>Follow-ups</h3>
    <p>Set up automated follow-up sequences for customers who haven't responded to initial requests.</p>
    
    <h3>Thank You Messages</h3>
    <p>Automatically send thank you messages to customers who leave reviews.</p>
  `,
  
  'widgets': `
    <h1>Embedding Review Widgets</h1>
    
    <p>Review widgets allow you to showcase your best reviews directly on your website, building trust and credibility with potential customers.</p>
    
    <h2>Types of Widgets</h2>
    
    <h3>Carousel Widget</h3>
    <p>Displays reviews in an attractive sliding carousel. Perfect for homepages and landing pages.</p>
    
    <h3>Grid Widget</h3>
    <p>Shows multiple reviews in a responsive grid layout. Ideal for testimonial pages.</p>
    
    <h3>Badge Widget</h3>
    <p>Compact widget showing your average rating and review count. Great for headers and footers.</p>
    
    <h3>Floating Widget</h3>
    <p>A subtle floating button that expands to show recent reviews. Minimally invasive but highly effective.</p>
    
    <h2>Installation</h2>
    
    <h3>Step 1: Create Your Widget</h3>
    <ol>
      <li>Go to Widgets in your dashboard</li>
      <li>Click "Create New Widget"</li>
      <li>Choose your widget type</li>
      <li>Select reviews to display</li>
      <li>Customize appearance</li>
    </ol>
    
    <h3>Step 2: Get the Embed Code</h3>
    <p>Once configured, copy the embed code provided. It will look something like:</p>
    <pre><code>&lt;div id="pr-widget-123"&gt;&lt;/div&gt;
&lt;script src="https://promptreviews.app/widget.js?id=123"&gt;&lt;/script&gt;</code></pre>
    
    <h3>Step 3: Add to Your Website</h3>
    <p>Paste the code into your website's HTML where you want the widget to appear.</p>
    
    <h2>Customization Options</h2>
    
    <ul>
      <li><strong>Colors:</strong> Match your brand colors</li>
      <li><strong>Fonts:</strong> Use your website's typography</li>
      <li><strong>Size:</strong> Responsive or fixed dimensions</li>
      <li><strong>Review Selection:</strong> Show all or filter by rating</li>
      <li><strong>Display Options:</strong> Show/hide dates, reviewer names, platform logos</li>
    </ul>
    
    <h2>Advanced Features</h2>
    
    <h3>Schema Markup</h3>
    <p>Our widgets automatically include structured data to help search engines understand your reviews.</p>
    
    <h3>Lazy Loading</h3>
    <p>Widgets load asynchronously to avoid impacting your website's performance.</p>
    
    <h3>Mobile Optimization</h3>
    <p>All widgets are fully responsive and optimized for mobile devices.</p>
  `,
  
  'google-business': `
    <h1>Google Business Profile Integration</h1>
    
    <p>Connect your Google Business Profile to streamline review management and improve your local search visibility.</p>
    
    <h2>Benefits of Integration</h2>
    
    <ul>
      <li>Sync reviews automatically</li>
      <li>Respond to reviews from our dashboard</li>
      <li>Track review metrics and trends</li>
      <li>Get notified of new reviews instantly</li>
      <li>Analyze competitor reviews</li>
    </ul>
    
    <h2>Setting Up Integration</h2>
    
    <h3>Step 1: Verify Ownership</h3>
    <p>Ensure you have owner or manager access to your Google Business Profile.</p>
    
    <h3>Step 2: Connect Your Account</h3>
    <ol>
      <li>Go to Settings → Integrations</li>
      <li>Click "Connect Google Business"</li>
      <li>Sign in with your Google account</li>
      <li>Grant necessary permissions</li>
      <li>Select your business location(s)</li>
    </ol>
    
    <h3>Step 3: Configure Sync Settings</h3>
    <p>Choose how often to sync reviews and what actions to automate.</p>
    
    <h2>Managing Google Reviews</h2>
    
    <h3>Review Monitoring</h3>
    <p>See all your Google reviews in one place with powerful filtering and search capabilities.</p>
    
    <h3>Response Management</h3>
    <p>Craft and publish responses to reviews directly from our platform. Use templates for common responses.</p>
    
    <h3>Review Insights</h3>
    <p>Analyze trends in your Google reviews:</p>
    <ul>
      <li>Rating distribution over time</li>
      <li>Common keywords and themes</li>
      <li>Response rate and time</li>
      <li>Competitor comparison</li>
    </ul>
    
    <h2>Best Practices</h2>
    
    <h3>Respond Quickly</h3>
    <p>Aim to respond to all reviews within 24-48 hours.</p>
    
    <h3>Be Professional</h3>
    <p>Always maintain a professional tone, even with negative reviews.</p>
    
    <h3>Personalize Responses</h3>
    <p>Avoid generic responses - reference specific details from the review.</p>
    
    <h3>Encourage More Reviews</h3>
    <p>Use our tools to make it easy for satisfied customers to leave Google reviews.</p>
  `,
  
  'docs': `
    <h1>Dashboard Overview and Navigation</h1>
    
    <p>Your dashboard is the command center for all your review management activities. Here's how to navigate and make the most of it.</p>
    
    <h2>Main Navigation</h2>
    
    <h3>Dashboard Home</h3>
    <p>Your landing page shows key metrics at a glance:</p>
    <ul>
      <li>Total reviews across all platforms</li>
      <li>Average rating</li>
      <li>Recent review activity</li>
      <li>Response rate</li>
      <li>Quick actions</li>
    </ul>
    
    <h3>Prompt Pages</h3>
    <p>Create and manage your review collection pages. See performance metrics for each page.</p>
    
    <h3>Reviews</h3>
    <p>Central hub for all your reviews across platforms. Filter, search, and respond to reviews.</p>
    
    <h3>Contacts</h3>
    <p>Manage your customer database and review invitation campaigns.</p>
    
    <h3>Widgets</h3>
    <p>Create and customize review display widgets for your website.</p>
    
    <h3>Analytics</h3>
    <p>Deep dive into your review performance with detailed reports and insights.</p>
    
    <h2>Quick Actions Bar</h2>
    
    <p>Access frequently used actions from any page:</p>
    <ul>
      <li>Send review invitation</li>
      <li>Create prompt page</li>
      <li>Import contacts</li>
      <li>View recent reviews</li>
    </ul>
    
    <h2>Account Switcher</h2>
    
    <p>If you manage multiple businesses, use the account switcher in the top navigation to quickly switch between them.</p>
    
    <h2>Search Functionality</h2>
    
    <p>Use the global search (Cmd/Ctrl + K) to quickly find:</p>
    <ul>
      <li>Specific reviews</li>
      <li>Contacts</li>
      <li>Prompt pages</li>
      <li>Settings</li>
    </ul>
    
    <h2>Customizing Your Dashboard</h2>
    
    <h3>Widget Layout</h3>
    <p>Drag and drop dashboard widgets to arrange them according to your preferences.</p>
    
    <h3>Metric Selection</h3>
    <p>Choose which metrics to display prominently based on what matters most to your business.</p>
    
    <h3>Date Ranges</h3>
    <p>Adjust date ranges for all metrics to focus on specific time periods.</p>
  `
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path');
    
    if (!path) {
      return NextResponse.json(
        { error: 'Article path is required' },
        { status: 400 }
      );
    }
    
    // Get the content for the requested article
    const content = articleContent[path] || articleContent['docs'];
    
    return NextResponse.json({
      content,
      path,
      success: true
    });
  } catch (error) {
    console.error('Error fetching article content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article content' },
      { status: 500 }
    );
  }
}