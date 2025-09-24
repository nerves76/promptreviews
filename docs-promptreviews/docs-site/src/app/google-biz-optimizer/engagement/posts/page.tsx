import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../../../docs-layout'
import PageHeader from '../../../components/PageHeader'
import {
  Star,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  BarChart3,
  ArrowRight,
  Search,
  MessageSquare,
  Image,
  Phone,
  Globe,
  Lightbulb
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Posts | Google Biz Optimizer™',
  description: 'Google Posts are mini-ads that appear directly in your Business Profile and search results. They\'re free, powerful, and criminally underutilized by most businesses.',
  keywords: [
    'Google Business Profile',
    'Engagement',
    'local SEO',
    'business optimization'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/google-biz-optimizer/engagement/posts',
  },
}

export default function Page() {
  return (
    <DocsLayout>
      <PageHeader
        breadcrumbs={[
          { label: 'Help', href: '/' },
          { label: 'Google Biz Optimizer', href: '/google-biz-optimizer' }
        ]}
        currentPage="Posts"
        categoryLabel="Engagement"
        categoryIcon={MessageSquare}
        categoryColor="purple"
        title="Posts"
        description="Google Posts are mini-ads that appear directly in your Business Profile and search results. They're free, powerful, and criminally underutilized by most businesses."
      />

      <div className="prose prose-gray max-w-none">
        <h2 className="text-2xl font-bold mb-4 mt-8">What Are Google Posts?</h2>
        <p className="mb-4">Google Posts are mini-ads that appear directly in your Business Profile and search results. They're free, powerful, and criminally underutilized by most businesses.</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">The Power of Posts</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Visibility Impact</h3>
        <ul className="space-y-2 mb-6"><li>Appear in <strong>Knowledge Panel</strong> (right side of search)</li><li>Show in <strong>Maps listings</strong></li><li>Display <strong>before reviews</strong> on mobile</li><li>Get <strong>dedicated carousel</strong> space</li><li><strong>2.7x more visibility</strong> than profiles without posts</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Conversion Benefits</h3>
        <ul className="space-y-2 mb-6"><li><strong>Call-to-action buttons</strong> drive action</li><li><strong>Event RSVPs</strong> directly in search</li><li><strong>Offer redemption</strong> tracking</li><li><strong>29% increase</strong> in clicks with active posts</li><li><strong>Free advertising</strong> in premium placement</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Types of Google Posts</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">1. What's New (General Updates)</h3>
        <ul className="space-y-2 mb-6"><li>Expires after 7 days</li><li>Great for announcements</li><li>Regular content rotation</li><li>Build engagement habit</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">2. Events</h3>
        <ul className="space-y-2 mb-6"><li>Specific date/time</li><li>RSVP tracking</li><li>Appears until event ends</li><li>Calendar integration</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">3. Offers</h3>
        <ul className="space-y-2 mb-6"><li>Promotional deals</li><li>Coupon codes</li><li>Clear start/end dates</li><li>Redemption tracking</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">4. Products</h3>
        <ul className="space-y-2 mb-6"><li>Permanent unless removed</li><li>Price display</li><li>Direct purchase links</li><li>Catalog building</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">The Perfect Post Formula</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Structure for Success</h3>
        <ul className="space-y-2 mb-6"><li><strong>Eye-catching image</strong> (1200x900px optimal)</li><li><strong>Compelling headline</strong> (58 characters max)</li><li><strong>Engaging description</strong> (1,500 characters available)</li><li><strong>Clear CTA button</strong> (Book, Call, Sign up, etc.)</li><li><strong>Tracking link</strong> (UTM parameters)</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Example Post:</h3>
        <p className="mb-4"><strong>Image:</strong> Stunning food photo</p>
        <p className="mb-4"><strong>Title:</strong> "New Fall Menu Now Available!"</p>
        <p className="mb-4"><strong>Text:</strong> "Featuring 12 seasonal dishes with local ingredients..."</p>
        <p className="mb-4"><strong>CTA:</strong> "View Menu"</p>
        <p className="mb-4"><strong>Link:</strong> website.com/fall-menu?utm_source=gbp_post</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Posting Frequency Strategy</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Optimal Schedule</h3>
        <ul className="space-y-2 mb-6"><li><strong>Minimum:</strong> 1 post per week</li><li><strong>Recommended:</strong> 2-3 posts per week</li><li><strong>Maximum impact:</strong> Daily posts</li><li><strong>Event-driven:</strong> As needed</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Content Calendar</h3>
        <p className="mb-4"><strong>Monday:</strong> Week's specials/offers</p>
        <p className="mb-4"><strong>Wednesday:</strong> Educational/tips</p>
        <p className="mb-4"><strong>Friday:</strong> Weekend events/promos</p>
        <p className="mb-4"><strong>As needed:</strong> News, updates, seasonal</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Content Ideas That Convert</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Top Performing Topics</h3>
        <ul className="space-y-2 mb-6"><li><strong>Limited-time offers</strong> (urgency)</li><li><strong>New products/services</strong> (novelty)</li><li><strong>Customer success stories</strong> (proof)</li><li><strong>Behind-the-scenes</strong> (authenticity)</li><li><strong>Seasonal content</strong> (relevance)</li><li><strong>Tips and advice</strong> (value)</li><li><strong>Staff spotlights</strong> (personality)</li><li><strong>Community involvement</strong> (local connection)</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Industry-Specific Post Strategies</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Restaurants</h3>
        <ul className="space-y-2 mb-6"><li>Daily specials</li><li>New menu items</li><li>Chef features</li><li>Event nights</li><li>Reservation reminders</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Services</h3>
        <ul className="space-y-2 mb-6"><li>Before/after showcases</li><li>Seasonal tips</li><li>Emergency availability</li><li>Customer testimonials</li><li>How-to guides</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Retail</h3>
        <ul className="space-y-2 mb-6"><li>New arrivals</li><li>Sales events</li><li>Product spotlights</li><li>Store events</li><li>Loyalty programs</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Healthcare</h3>
        <ul className="space-y-2 mb-6"><li>Health tips</li><li>New services</li><li>Provider introductions</li><li>Insurance updates</li><li>Wellness events</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Image Requirements & Best Practices</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Technical Specs</h3>
        <ul className="space-y-2 mb-6"><li><strong>Minimum:</strong> 400x300px</li><li><strong>Recommended:</strong> 1200x900px</li><li><strong>Format:</strong> JPG or PNG</li><li><strong>Aspect ratio:</strong> 4:3 ideal</li><li><strong>File size:</strong> Under 5MB</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Visual Strategy</h3>
        <p className="mb-4">✅ Bright, high contrast</p>
        <p className="mb-4">✅ Minimal text overlay</p>
        <p className="mb-4">✅ People when possible</p>
        <p className="mb-4">✅ Brand consistent</p>
        <p className="mb-4">✅ Mobile-optimized</p>
        <p className="mb-4">❌ Stock photos</p>
        <p className="mb-4">❌ Cluttered designs</p>
        <p className="mb-4">❌ Poor lighting</p>
        <p className="mb-4">❌ Outdated content</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Call-to-Action Optimization</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Available CTAs</h3>
        <ul className="space-y-2 mb-6"><li><strong>Book</strong> - Appointments/reservations</li><li><strong>Online Order</strong> - E-commerce/food</li><li><strong>Buy</strong> - Products</li><li><strong>Learn More</strong> - Information</li><li><strong>Sign Up</strong> - Events/newsletters</li><li><strong>Call Now</strong> - Direct contact</li><li><strong>Get Offer</strong> - Promotions</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">CTA Best Practices</h3>
        <ul className="space-y-2 mb-6"><li>Match CTA to content</li><li>Use urgency when appropriate</li><li>Test different buttons</li><li>Track conversion rates</li><li>Clear value proposition</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Writing Compelling Post Copy</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Headlines That Work</h3>
        <ul className="space-y-2 mb-6"><li>"Limited Time: [Offer]"</li><li>"New: [Product/Service]"</li><li>"This Week Only"</li><li>"Join Us for [Event]"</li><li>"Introducing [Feature]"</li><li>"[Number] Tips for [Benefit]"</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Description Tactics</h3>
        <ul className="space-y-2 mb-6"><li>Lead with benefit</li><li>Use bullet points</li><li>Include social proof</li><li>Create urgency</li><li>Clear next steps</li><li>Mobile-friendly formatting</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Measuring Post Performance</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Key Metrics</h3>
        <ul className="space-y-2 mb-6"><li><strong>Views</strong> - Impressions</li><li><strong>Clicks</strong> - Engagement</li><li><strong>CTR</strong> - Click-through rate</li><li><strong>Conversions</strong> - Actions taken</li><li><strong>Post lifespan</strong> - Active duration</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Performance Benchmarks</h3>
        <ul className="space-y-2 mb-6"><li><strong>Good CTR:</strong> 1-2%</li><li><strong>Excellent CTR:</strong> 3%+</li><li><strong>Views target:</strong> 100+ per post</li><li><strong>Engagement rate:</strong> 5%+</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Common Posting Mistakes</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">What to Avoid</h3>
        <p className="mb-4">❌ Posting once and forgetting</p>
        <p className="mb-4">❌ No images or poor quality</p>
        <p className="mb-4">❌ Vague or misleading content</p>
        <p className="mb-4">❌ Missing CTAs</p>
        <p className="mb-4">❌ Expired offers showing</p>
        <p className="mb-4">❌ Duplicate content</p>
        <p className="mb-4">❌ Ignoring seasonality</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Advanced Post Tactics</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">A/B Testing Elements</h3>
        <ul className="space-y-2 mb-6"><li>Image styles</li><li>Headline formats</li><li>CTA buttons</li><li>Posting times</li><li>Content types</li><li>Offer amounts</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Cross-Promotion Strategy</h3>
        <ul className="space-y-2 mb-6"><li>Share posts on social media</li><li>Include in email newsletters</li><li>Feature on website</li><li>Staff sharing program</li><li>Customer amplification</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Quick Win Strategy</h2>
        <p className="mb-4"><strong>The 30-Day Post Challenge:</strong></p>
        <p className="mb-4">Week 1: Post 3 different offers</p>
        <p className="mb-4">Week 2: Share 3 tips/advice posts</p>
        <p className="mb-4">Week 3: Highlight 3 products/services</p>
        <p className="mb-4">Week 4: Feature 3 events/updates</p>
        <p className="mb-4">Track which type performs best, then double down on winners.</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Post Scheduling Tips</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Best Times to Post</h3>
        <ul className="space-y-2 mb-6"><li><strong>Tuesday-Thursday:</strong> Highest engagement</li><li><strong>10 AM-2 PM:</strong> Peak visibility</li><li><strong>Avoid Monday morning</strong> and <strong>Friday afternoon</strong></li><li><strong>Weekend posts</strong> for restaurants/entertainment</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">SEO Benefits</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">How Posts Help Rankings</h3>
        <ul className="space-y-2 mb-6"><li>Fresh content signals</li><li>Keyword opportunities</li><li>Engagement metrics</li><li>Click-through improvements</li><li>Time on profile increases</li></ul>
        <p className="mb-4">---</p>
        <p className="mb-4"><em>Want post templates and ideas? <a href="mailto:support@promptreviews.app" className="text-blue-600 hover:text-blue-700 underline">Get our content calendar</a></em></p>
      </div>
    </DocsLayout>
  )
}