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
    <h1>Getting Started with Prompt Reviews</h1>
    
    <p>Welcome to Prompt Reviews! This guide will walk you through setting up your business and creating your Universal prompt page to start collecting reviews.</p>
    
    <h2>Step 1: Set Up Your Business Profile</h2>
    
    <h3>Navigate to Business Profile</h3>
    <p>From your dashboard, click on "Business Profile" in the main navigation menu.</p>
    
    <h3>Enter Your Business Information</h3>
    <p>Fill in the essential details:</p>
    <ul>
      <li><strong>Business Name:</strong> Your official business name</li>
      <li><strong>Phone Number:</strong> Primary contact number</li>
      <li><strong>Email:</strong> Customer service email</li>
      <li><strong>Website:</strong> Your business website URL</li>
      <li><strong>Address:</strong> Physical business location</li>
    </ul>
    
    <h3>Upload Your Logo</h3>
    <p>Add your business logo for branding consistency. We recommend using a high-resolution image (at least 500x500px) in PNG or JPG format.</p>
    
    <h2>Step 2: Design Your Universal Prompt Page</h2>
    
    <h3>Access the Universal Prompt Page</h3>
    <p>From your dashboard, navigate to "Get Reviews" → "Universal Prompt Page".</p>
    
    <h3>Customize Your Page Design</h3>
    <p>The Universal prompt page is your main review collection tool. Customize it to match your brand:</p>
    <ul>
      <li><strong>Header:</strong> Add a welcoming headline for your customers</li>
      <li><strong>Description:</strong> Write a brief message asking for reviews</li>
      <li><strong>Brand Colors:</strong> Set colors that match your brand identity</li>
      <li><strong>Review Platforms:</strong> Select and prioritize the platforms where you want reviews (Google, Facebook, etc.)</li>
    </ul>
    
    <h3>Configure Review Platforms</h3>
    <p>Add the review platforms most important to your business:</p>
    <ol>
      <li>Click "Add Platform"</li>
      <li>Select from available platforms (Google Business, Facebook, Yelp, etc.)</li>
      <li>Enter your business's direct review link for each platform</li>
      <li>Drag to reorder platforms by priority</li>
    </ol>
    
    <h3>Preview and Test</h3>
    <p>Use the preview feature to see how your page looks on desktop and mobile devices. Test all review links to ensure they work correctly.</p>
    
    <h2>Step 3: Share Your Prompt Page</h2>
    
    <h3>Get Your Unique Link</h3>
    <p>Once saved, you'll receive a unique URL for your prompt page (e.g., app.promptreviews.app/r/yourbusiness).</p>
    
    <h3>Ways to Share</h3>
    <ul>
      <li><strong>Email:</strong> Include the link in follow-up emails to customers</li>
      <li><strong>SMS:</strong> Send via text message for higher engagement</li>
      <li><strong>QR Code:</strong> Generate a QR code for physical locations</li>
      <li><strong>Website:</strong> Add a "Leave a Review" button to your website</li>
    </ul>
    
    <h2>Get Reviews Menu Options</h2>
    
    <h3>Universal Prompt Page</h3>
    <p>Your main review collection page that works for all customers and platforms.</p>
    
    <h3>Service Prompt Pages</h3>
    <p>Create specific pages for different services or customer segments.</p>
    
    <h3>Individual Requests</h3>
    <p>Send personalized review invitations to individual customers.</p>
    
    <h3>Contacts</h3>
    <p>Manage your customer database and import contacts for review campaigns.</p>
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
    <p>In reviews, you can view, verify, and delete reviews or download all of your reviews as an SVG.</p>
    
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
  `,

  'google-products': `
    <h1>Google Business Profile Products: A Complete Guide</h1>
    
    <h2>What Are Google Business Products?</h2>
    
    <p>Google Business Products are visual showcases of what you offer, appearing directly in your Google Business Profile listing. They display as cards with images, names, prices, and descriptions when customers find your business on Google Search and Maps.</p>
    
    <h2>Why Products Matter (Even for Service Businesses)</h2>
    
    <h3>🎯 Enhanced Visual Presence</h3>
    <p>Products add rich visual content to your listing:</p>
    <ul>
      <li><strong>Eye-catching cards</strong> with images appear in your profile</li>
      <li><strong>Increased engagement</strong> - listings with products get 42% more clicks</li>
      <li><strong>Stand out from competitors</strong> who only list basic information</li>
    </ul>
    
    <h3>🔍 Improved Search Visibility</h3>
    <p>Products help you rank for specific searches:</p>
    <ul>
      <li>Each product is indexed separately</li>
      <li>Customers searching for specific items can find you</li>
      <li>Products appear in "Popular items" sections</li>
    </ul>
    
    <h3>💰 Price Transparency Builds Trust</h3>
    <p>Showing prices upfront:</p>
    <ul>
      <li>Reduces price-shopping phone calls</li>
      <li>Pre-qualifies customers before they contact you</li>
      <li>Builds trust through transparency</li>
    </ul>
    
    <h2>How to Add Products to Your Profile</h2>
    
    <h3>Step 1: Access Your Google Business Profile</h3>
    <ol>
      <li>Go to business.google.com</li>
      <li>Sign in with your Google account</li>
      <li>Select your business location</li>
    </ol>
    
    <h3>Step 2: Navigate to Products Section</h3>
    <ol>
      <li>Click on "Products" in the left menu</li>
      <li>Click "Add product" or the "+" button</li>
    </ol>
    
    <h3>Step 3: Add Product Details</h3>
    <ul>
      <li><strong>Product name</strong> (required) - Be specific and descriptive</li>
      <li><strong>Product category</strong> - Select the most relevant category</li>
      <li><strong>Price</strong> - Include currency and be exact</li>
      <li><strong>Description</strong> - 1000 characters max, highlight benefits</li>
      <li><strong>Photo</strong> - High-quality, well-lit image (minimum 250x250px)</li>
      <li><strong>Product link</strong> (optional) - Direct link to purchase/learn more</li>
    </ul>
    
    <h2>Productizing Services: The Secret Weapon</h2>
    
    <p>Service businesses can leverage products too! Here's how to "productize" your services:</p>
    
    <h3>For Consultants & Professionals</h3>
    <p><strong>Traditional Service:</strong> "Business Consulting"</p>
    <p><strong>Productized Versions:</strong></p>
    <ul>
      <li>"1-Hour Strategy Session - $299"</li>
      <li>"Business Audit Package - $999"</li>
      <li>"Monthly Coaching Program - $499/month"</li>
      <li>"DIY Business Plan Template - $49"</li>
    </ul>
    
    <h3>For Home Services</h3>
    <p><strong>Traditional Service:</strong> "Plumbing Services"</p>
    <p><strong>Productized Versions:</strong></p>
    <ul>
      <li>"Drain Cleaning Service - Starting at $149"</li>
      <li>"Water Heater Installation - From $1,299"</li>
      <li>"Annual Maintenance Package - $299/year"</li>
      <li>"Emergency Call-Out - $99 + parts"</li>
    </ul>
    
    <h3>For Creative Services</h3>
    <p><strong>Traditional Service:</strong> "Web Design"</p>
    <p><strong>Productized Versions:</strong></p>
    <ul>
      <li>"5-Page Website Package - $2,499"</li>
      <li>"Logo Design Bundle - $599"</li>
      <li>"Website Maintenance - $99/month"</li>
      <li>"Rush Delivery Option - +50%"</li>
    </ul>
    
    <h2>Best Practices for Product Success</h2>
    <ul>
      <li><strong>Use high-quality images</strong> - Professional photos convert better</li>
      <li><strong>Be specific with pricing</strong> - Include "from" or "starting at" for variable pricing</li>
      <li><strong>Update regularly</strong> - Keep seasonal items current</li>
      <li><strong>Track performance</strong> - Monitor which products get the most views</li>
      <li><strong>Respond to questions</strong> - Customers may ask about products in Q&A</li>
    </ul>
  `,

  'google-services-seo': `
    <h1>How Google Business Services Boost Your Local SEO</h1>
    
    <h2>Why Services Matter More Than You Think</h2>
    
    <p>Adding services to your Google Business Profile isn't just about listing what you do—it's a powerful SEO strategy that can significantly improve your local search visibility and rankings.</p>
    
    <h2>🎯 Keyword Relevance in Local Search</h2>
    
    <p>Services act as <strong>additional relevance signals</strong> that help you rank for specific queries beyond your primary category.</p>
    
    <h3>How It Works:</h3>
    <ul>
      <li>Your primary category (e.g., "Web Design Agency") gets you in the door</li>
      <li>Your services (e.g., "Shopify Development", "WordPress Migration", "SEO Audits") open new ranking opportunities</li>
      <li>Each service is an "extra hook" for searches your competitors might miss</li>
    </ul>
    
    <h3>Real Example:</h3>
    <p><strong>Primary Category:</strong> Plumber</p>
    <p><strong>Services Added:</strong></p>
    <ul>
      <li>Emergency Water Heater Repair</li>
      <li>Tankless Water Heater Installation</li>
      <li>Drain Cleaning</li>
      <li>Sewer Line Inspection</li>
    </ul>
    <p><strong>Result:</strong> Now ranking for "emergency water heater repair near me" (not just generic "plumber near me")</p>
    
    <h2>🔍 Better Match to User Intent</h2>
    
    <p>Google's #1 goal is serving the most precise answer to each query. Services help Google understand exactly what you offer.</p>
    
    <h3>The Precision Advantage:</h3>
    <ul>
      <li><strong>Broad:</strong> "Restaurant" (your category)</li>
      <li><strong>Specific:</strong> "Gluten-Free Pizza", "Vegan Brunch", "Private Event Catering" (your services)</li>
      <li><strong>Result:</strong> Higher chance of appearing in the 3-Pack for specific searches</li>
    </ul>
    
    <p><strong>Pro Tip:</strong> Think like your customers. What specific problems are they trying to solve? Those are your service keywords.</p>
    
    <h2>📝 Content Indexing Within Google's Ecosystem</h2>
    
    <p>Your services and their descriptions are <strong>indexed as structured content</strong> directly within Google's platform.</p>
    
    <h3>Why This Matters:</h3>
    <ul>
      <li>It's like having on-page SEO within Google itself</li>
      <li>Service descriptions reinforce your keywords</li>
      <li>Google trusts its own data more than external sources</li>
      <li>Clear, keyword-rich descriptions improve relevance matching</li>
    </ul>
    
    <h3>Best Practice:</h3>
    <p>Write service descriptions that are:</p>
    <ul>
      <li><strong>Specific:</strong> "24/7 Emergency HVAC Repair" not "Heating Services"</li>
      <li><strong>Benefit-focused:</strong> Include what customers get, not just what you do</li>
      <li><strong>Naturally keyword-rich:</strong> Use terms customers actually search for</li>
    </ul>
    
    <h2>📊 Conversion Signals That Boost Rankings</h2>
    
    <p>While services primarily influence relevance, they also drive engagement metrics that Google monitors.</p>
    
    <h3>The Engagement Loop:</h3>
    <ol>
      <li>Customer searches for specific service</li>
      <li>Sees exact match in your profile</li>
      <li>More likely to click, call, or message</li>
      <li>Higher engagement signals = Google trusts you more</li>
      <li>Better trust = higher rankings</li>
    </ol>
    
    <h3>Metrics That Matter:</h3>
    <ul>
      <li>Click-through rate from search results</li>
      <li>"Call" button clicks</li>
      <li>Direction requests</li>
      <li>Website visits from GBP</li>
    </ul>
    
    <h2>🛠️ How to Optimize Your Services for Maximum SEO Impact</h2>
    
    <h3>1. Audit Your Competitors</h3>
    <p>Search for your main keywords and see what services top-ranking competitors list. Find gaps you can fill.</p>
    
    <h3>2. Use Long-Tail Service Names</h3>
    <p>Instead of "Cleaning", use "Deep House Cleaning", "Move-Out Cleaning Service", "Post-Construction Cleanup"</p>
    
    <h3>3. Include Location Modifiers When Relevant</h3>
    <p>"Downtown Austin Food Delivery" vs just "Food Delivery"</p>
    
    <h3>4. Update Seasonally</h3>
    <p>Add seasonal services like "Holiday Light Installation" or "Spring AC Tune-Up" when relevant</p>
    
    <h3>5. Write Compelling Descriptions</h3>
    <p>Each service can have a description. Use it to naturally include related keywords and benefits.</p>
    
    <h2>The Bottom Line</h2>
    
    <p>Services aren't just a list of what you do—they're powerful SEO assets that:</p>
    <ul>
      <li>Expand your keyword footprint</li>
      <li>Match specific user intent</li>
      <li>Build relevance signals within Google</li>
      <li>Drive engagement metrics that boost rankings</li>
    </ul>
    
    <p><strong>Action Step:</strong> Review your services list today. Are you missing opportunities to rank for specific, high-intent searches your customers are making?</p>
  `,

  'google-post-types': `
    <h1>Google Business Post Types Guide</h1>
    
    <h2>Understanding Google Business Posts</h2>
    
    <p>Google Business posts are mini-advertisements that appear directly in your Business Profile. They're visible in Google Search and Maps, giving you prime real estate to communicate with potential customers.</p>
    
    <h2>Types of Posts and When to Use Them</h2>
    
    <h3>📢 Updates</h3>
    <p><strong>Purpose:</strong> Share general news, announcements, or content</p>
    <p><strong>Duration:</strong> Visible for 7 days</p>
    <p><strong>Best for:</strong></p>
    <ul>
      <li>New product or service announcements</li>
      <li>Business milestones or achievements</li>
      <li>Seasonal reminders</li>
      <li>Tips or educational content</li>
    </ul>
    
    <h3>🎁 Offers</h3>
    <p><strong>Purpose:</strong> Promote special deals and discounts</p>
    <p><strong>Duration:</strong> Can set custom start/end dates</p>
    <p><strong>Best for:</strong></p>
    <ul>
      <li>Limited-time discounts</li>
      <li>Coupon codes</li>
      <li>Buy-one-get-one deals</li>
      <li>Seasonal promotions</li>
    </ul>
    <p><strong>Pro tip:</strong> Include a clear call-to-action and redemption instructions</p>
    
    <h3>📅 Events</h3>
    <p><strong>Purpose:</strong> Promote upcoming events</p>
    <p><strong>Duration:</strong> Visible until the event ends</p>
    <p><strong>Best for:</strong></p>
    <ul>
      <li>Grand openings</li>
      <li>Workshops or classes</li>
      <li>Sales events</li>
      <li>Community gatherings</li>
    </ul>
    <p><strong>Required info:</strong> Event title, start/end dates and times</p>
    
    <h3>🆕 Products (New!)</h3>
    <p><strong>Purpose:</strong> Showcase specific products or services</p>
    <p><strong>Duration:</strong> Permanent until you remove them</p>
    <p><strong>Best for:</strong></p>
    <ul>
      <li>Featured items</li>
      <li>New arrivals</li>
      <li>Popular services</li>
      <li>Seasonal offerings</li>
    </ul>
    
    <h2>How Posts Boost Your SEO</h2>
    
    <h3>1. Fresh Content Signals</h3>
    <p>Google loves fresh content. Regular posts show your business is active and engaged.</p>
    
    <h3>2. Keyword Optimization</h3>
    <p>Posts are indexed and searchable. Use relevant keywords naturally in your post content.</p>
    
    <h3>3. Increased Engagement</h3>
    <p>Posts with images get 2x more clicks. Higher engagement improves your local ranking.</p>
    
    <h3>4. Local Relevance</h3>
    <p>Mentioning local events, neighborhoods, or landmarks increases local search visibility.</p>
    
    <h2>Creating Effective Posts</h2>
    
    <h3>Writing Compelling Content</h3>
    <ul>
      <li><strong>Hook in first 30 characters</strong> - This is what shows in preview</li>
      <li><strong>Use action words</strong> - "Discover," "Save," "Join," "Experience"</li>
      <li><strong>Include a clear CTA</strong> - Tell customers exactly what to do</li>
      <li><strong>Keep it concise</strong> - 150-300 words is ideal</li>
    </ul>
    
    <h3>Image Best Practices</h3>
    <ul>
      <li><strong>Size:</strong> 720x720px minimum (1200x900px recommended)</li>
      <li><strong>Format:</strong> JPG or PNG</li>
      <li><strong>Quality:</strong> High-resolution, well-lit photos</li>
      <li><strong>Content:</strong> Show products, happy customers, or your team</li>
    </ul>
    
    <h3>Posting Frequency</h3>
    <ul>
      <li><strong>Minimum:</strong> 1 post per week</li>
      <li><strong>Ideal:</strong> 2-3 posts per week</li>
      <li><strong>Maximum:</strong> 1 post per day (avoid appearing spammy)</li>
    </ul>
    
    <h2>Measuring Success</h2>
    
    <p>Track these metrics in your Google Business Profile Insights:</p>
    <ul>
      <li><strong>Views:</strong> How many people saw your post</li>
      <li><strong>Clicks:</strong> How many clicked your call-to-action</li>
      <li><strong>Call clicks:</strong> Direct calls from the post</li>
      <li><strong>Direction requests:</strong> Navigation requests from the post</li>
    </ul>
    
    <h2>Pro Tips for Maximum Impact</h2>
    <ol>
      <li><strong>Plan ahead:</strong> Create a content calendar for consistent posting</li>
      <li><strong>Test different types:</strong> See what resonates with your audience</li>
      <li><strong>Respond to engagement:</strong> Reply to questions and comments quickly</li>
      <li><strong>Cross-promote:</strong> Share posts on social media too</li>
      <li><strong>Track competitors:</strong> See what's working for similar businesses</li>
    </ol>
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