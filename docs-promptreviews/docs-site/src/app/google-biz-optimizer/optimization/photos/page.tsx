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
  title: 'Photos | Google Biz Optimizer™',
  description: 'Photos are the silent salesperson of your Google Business Profile. They generate more engagement than any other element and directly influence customer decisions.',
  keywords: [
    'Google Business Profile',
    'Optimization',
    'local SEO',
    'business optimization'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/google-biz-optimizer/optimization/photos',
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
        currentPage="Photos"
        categoryLabel="Optimization"
        categoryIcon={Search}
        categoryColor="green"
        title="Photos"
        description="Photos are the silent salesperson of your Google Business Profile. They generate more engagement than any other element and directly influence customer decisions."
      />

      <div className="prose prose-gray max-w-none">
        <h2 className="text-2xl font-bold mb-4 mt-8">The Power of Photos</h2>
        <p className="mb-4">Photos are the silent salesperson of your Google Business Profile. They generate more engagement than any other element and directly influence customer decisions.</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Photo Impact Statistics</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">The Numbers Don't Lie</h3>
        <ul className="space-y-2 mb-6"><li>Businesses with <strong>100+ photos</strong> get <strong>520% more calls</strong></li><li><strong>42% more direction requests</strong> with recent photos</li><li>Customers spend <strong>35% longer</strong> viewing profiles with photos</li><li><strong>60% of consumers</strong> say photos influence their choice</li><li>Photos generate <strong>35% of all profile clicks</strong></li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Google's Photo Categories</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Essential Categories to Fill</h3>
        <ul className="space-y-2 mb-6"><li><strong>Cover Photo</strong> - Your hero image</li><li><strong>Profile Photo</strong> - Logo or storefront</li><li><strong>Interior</strong> - Inside atmosphere (minimum 3)</li><li><strong>Exterior</strong> - Building and signage (minimum 3)</li><li><strong>Product/Service</strong> - What you sell (minimum 10)</li><li><strong>Team</strong> - Build trust with faces</li><li><strong>Identity</strong> - Behind the scenes</li><li><strong>At Work</strong> - Services in action</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Photo Quantity Benchmarks</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">By Industry</h3>
        <p className="mb-4">| Business Type | Minimum | Good | Excellent |</p>
        <p className="mb-4">|--------------|---------|------|-----------|</p>
        <p className="mb-4">| Restaurants | 30 | 100 | 250+ |</p>
        <p className="mb-4">| Retail | 20 | 50 | 100+ |</p>
        <p className="mb-4">| Services | 15 | 40 | 75+ |</p>
        <p className="mb-4">| Hotels | 50 | 150 | 300+ |</p>
        <p className="mb-4">| Healthcare | 10 | 30 | 50+ |</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Photo Quality Guidelines</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Technical Requirements</h3>
        <ul className="space-y-2 mb-6"><li><strong>Minimum:</strong> 720px (width or height)</li><li><strong>Recommended:</strong> 1080px or higher</li><li><strong>Format:</strong> JPG or PNG</li><li><strong>File size:</strong> Under 5MB</li><li><strong>Aspect ratio:</strong> Various (Google auto-crops)</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Visual Best Practices</h3>
        <p className="mb-4">✅ Well-lit, natural lighting</p>
        <p className="mb-4">✅ Sharp focus, no blur</p>
        <p className="mb-4">✅ Authentic, not stock photos</p>
        <p className="mb-4">✅ Current and seasonal</p>
        <p className="mb-4">✅ Clean, professional composition</p>
        <p className="mb-4">❌ Heavy filters or effects</p>
        <p className="mb-4">❌ Text overlays or watermarks</p>
        <p className="mb-4">❌ Misleading or outdated</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Strategic Photo Upload Schedule</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">The 90-Day Photo Plan</h3>
        <p className="mb-4"><strong>Week 1-2: Foundation</strong></p>
        <ul className="space-y-2 mb-6"><li>Upload 20 core photos</li><li>Cover all main categories</li><li>Focus on best quality</li></ul>
        <p className="mb-4"><strong>Week 3-4: Expansion</strong></p>
        <ul className="space-y-2 mb-6"><li>Add product/service photos</li><li>Include team members</li><li>Show different times of day</li></ul>
        <p className="mb-4"><strong>Month 2: Depth</strong></p>
        <ul className="space-y-2 mb-6"><li>Seasonal updates</li><li>Event photos</li><li>Customer experience shots</li><li>Behind-the-scenes content</li></ul>
        <p className="mb-4"><strong>Month 3: Optimization</strong></p>
        <ul className="space-y-2 mb-6"><li>Replace poor performers</li><li>Add trending categories</li><li>Update seasonal content</li><li>Fresh exterior shots</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Photo Types That Drive Action</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Conversion Drivers</h3>
        <ul className="space-y-2 mb-6"><li><strong>Before/After</strong> - Shows transformation</li><li><strong>Happy Customers</strong> - Social proof</li><li><strong>Fresh Products</strong> - Daily/weekly updates</li><li><strong>Team at Work</strong> - Builds trust</li><li><strong>Atmosphere</strong> - Sets expectations</li><li><strong>Unique Features</strong> - Differentiators</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Customer Photo Management</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Leveraging User Content</h3>
        <ul className="space-y-2 mb-6"><li>Customer photos get <strong>50% more views</strong></li><li>Appear more authentic</li><li>Can't be controlled directly</li><li>Encourage through:</li></ul>
        <p className="mb-4">  - Photo-worthy spaces</p>
        <p className="mb-4">  - Instagram hashtags</p>
        <p className="mb-4">  - Photo contests</p>
        <p className="mb-4">  - Review requests with photos</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Managing Inappropriate Photos</h3>
        <ul className="space-y-2 mb-6"><li>Flag quickly (within 24 hours)</li><li>Document violations</li><li>Multiple flags help</li><li>Follow up if not removed</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Photo SEO Optimization</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">File Naming Strategy</h3>
        <p className="mb-4">❌ IMG_1234.jpg</p>
        <p className="mb-4">✅ italian-restaurant-dining-room-denver.jpg</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Geotagging Benefits</h3>
        <ul className="space-y-2 mb-6"><li>Add location data to photos</li><li>Improves local relevance</li><li>Tools: Geoimgr, GeoSetter</li><li>Mobile phones often auto-tag</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Industry-Specific Photo Strategies</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Restaurants</h3>
        <p className="mb-4"><strong>Priority:</strong> Food photos (update weekly)</p>
        <p className="mb-4"><strong>Must-have:</strong> Menu items, ambiance, bar</p>
        <p className="mb-4"><strong>Trending:</strong> Dietary options, takeout setup</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Medical/Dental</h3>
        <p className="mb-4"><strong>Priority:</strong> Clean, modern facilities</p>
        <p className="mb-4"><strong>Must-have:</strong> Waiting room, equipment, team</p>
        <p className="mb-4"><strong>Avoid:</strong> Graphic procedures, patient faces</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Home Services</h3>
        <p className="mb-4"><strong>Priority:</strong> Before/after work</p>
        <p className="mb-4"><strong>Must-have:</strong> Team in uniform, vehicles</p>
        <p className="mb-4"><strong>Power move:</strong> Time-lapse videos as photos</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Retail</h3>
        <p className="mb-4"><strong>Priority:</strong> Product displays</p>
        <p className="mb-4"><strong>Must-have:</strong> Store layout, featured items</p>
        <p className="mb-4"><strong>Update:</strong> Weekly for new inventory</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Photo Performance Metrics</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">What to Track</h3>
        <ul className="space-y-2 mb-6"><li>Views per photo</li><li>Click-through rates</li><li>Time on profile</li><li>Direction requests after viewing</li><li>Call conversions</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Signs of Success</h3>
        <ul className="space-y-2 mb-6"><li>Steady view growth</li><li>Low bounce rate</li><li>Photo-to-action correlation</li><li>Customer photo uploads</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Common Photo Mistakes</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Avoid These</h3>
        <p className="mb-4">❌ Stock photos (Google can detect)</p>
        <p className="mb-4">❌ Low resolution/blurry</p>
        <p className="mb-4">❌ Outdated seasonal content</p>
        <p className="mb-4">❌ Empty establishment</p>
        <p className="mb-4">❌ Cluttered or messy scenes</p>
        <p className="mb-4">❌ Competitor's photos</p>
        <p className="mb-4">❌ Irrelevant content</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Quick Win Photo Strategy</h2>
        <p className="mb-4"><strong>The 7-Day Photo Blitz:</strong></p>
        <ul className="space-y-2 mb-6"><li>Day 1-2: Exterior (5 angles, different times)</li><li>Day 3-4: Interior (10 areas, good lighting)</li><li>Day 5: Products/Services (15 best examples)</li><li>Day 6: Team photos (all key staff)</li><li>Day 7: Action shots (services being performed)</li></ul>
        <p className="mb-4"><strong>Result:</strong> 35+ quality photos in one week</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Advanced Photo Tactics</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">360° Photos & Virtual Tours</h3>
        <ul className="space-y-2 mb-6"><li><strong>700% more interest</strong> than standard profiles</li><li>Higher engagement rates</li><li>Premium placement potential</li><li>Google Street View integration</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Video Posts as Photos</h3>
        <ul className="space-y-2 mb-6"><li>Upload short videos</li><li>Auto-plays in gallery</li><li>Higher engagement</li><li>Shows dynamism</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Photo Refresh Strategy</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Monthly Updates</h3>
        <ul className="space-y-2 mb-6"><li>Add 5-10 new photos</li><li>Remove poor performers</li><li>Update seasonal content</li><li>Refresh cover photo</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Quarterly Overhaul</h3>
        <ul className="space-y-2 mb-6"><li>Full category review</li><li>Competitor analysis</li><li>Style consistency check</li><li>Performance audit</li></ul>
        <p className="mb-4">---</p>
        <p className="mb-4"><em>Need professional photos? <a href="mailto:support@promptreviews.app" className="text-blue-600 hover:text-blue-700 underline">Get our recommended photographers</a></em></p>
      </div>
    </DocsLayout>
  )
}