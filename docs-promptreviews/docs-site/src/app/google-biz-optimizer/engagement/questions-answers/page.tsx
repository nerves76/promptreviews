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
  title: 'Questions Answers | Google Biz Optimizer™',
  description: 'The Questions & Answers feature lets anyone ask questions about your business directly on your Google Business Profile. It\'s a powerful but often overlooked tool for customer engagement and SEO.',
  keywords: [
    'Google Business Profile',
    'Engagement',
    'local SEO',
    'business optimization'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/google-biz-optimizer/engagement/questions-answers',
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
        currentPage="Questions Answers"
        categoryLabel="Engagement"
        categoryIcon={MessageSquare}
        categoryColor="purple"
        title="Questions Answers"
        description="The Questions & Answers feature lets anyone ask questions about your business directly on your Google Business Profile. It's a powerful but often overlooked tool for customer engagement and SEO."
      />

      <div className="prose prose-gray max-w-none">
        <h2 className="text-2xl font-bold mb-4 mt-8">What is Google Q&A?</h2>
        <p className="mb-4">The Questions & Answers feature lets anyone ask questions about your business directly on your Google Business Profile. It's a powerful but often overlooked tool for customer engagement and SEO.</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Why Q&A Matters More Than You Think</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">The Hidden Impact</h3>
        <ul className="space-y-2 mb-6"><li>Q&A appears <strong>above reviews</strong> on mobile</li><li><strong>Rich snippets</strong> in search results</li><li><strong>Voice search</strong> pulls from Q&A</li><li>Unanswered questions <strong>hurt trust</strong> by 47%</li><li>Q&A content is <strong>indexed for SEO</strong></li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">The Danger of Ignoring Q&A</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">What Happens Without Management</h3>
        <ul className="space-y-2 mb-6"><li>Competitors can answer questions</li><li>Wrong information spreads</li><li>Customers make negative assumptions</li><li>Lost sales from confusion</li><li>Damaged reputation</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Real Horror Stories</h3>
        <ul className="space-y-2 mb-6"><li>Competitor posted "Closed permanently"</li><li>Wrong prices listed by random user</li><li>Inappropriate content left for months</li><li>Lost customers due to wrong hours</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Proactive Q&A Strategy</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Seed Your Own Questions</h3>
        <p className="mb-4">Google allows you to ask and answer your own questions. Use this strategically:</p>
        <p className="mb-4"><strong>Top Questions to Pre-Answer:</strong></p>
        <ul className="space-y-2 mb-6"><li>"What are your hours?"</li><li>"Do you offer [popular service]?"</li><li>"What's the parking situation?"</li><li>"Do you take [payment type]?"</li><li>"Is appointment needed?"</li><li>"What COVID precautions are in place?"</li><li>"Do you offer delivery/takeout?"</li><li>"What's the price range?"</li><li>"Are you wheelchair accessible?"</li><li>"Do you have WiFi?"</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Perfect Answer Formula</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Structure Every Answer:</h3>
        <ul className="space-y-2 mb-6"><li><strong>Direct answer</strong> (first sentence)</li><li><strong>Additional detail</strong> (helpful context)</li><li><strong>Call to action</strong> (next step)</li><li><strong>Contact option</strong> (for more info)</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Example:</h3>
        <p className="mb-4"><strong>Q:</strong> "Do you offer gluten-free options?"</p>
        <p className="mb-4"><strong>A:</strong> "Yes, we have an extensive gluten-free menu! Over 20 dishes are available gluten-free, including pizzas, pastas, and desserts. View our full gluten-free menu at [website]. For specific dietary concerns, call us at [phone] and our chef will personally assist you."</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Response Time Matters</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Speed Benchmarks</h3>
        <ul className="space-y-2 mb-6"><li><strong>Within 1 hour:</strong> Excellent (rare)</li><li><strong>Within 24 hours:</strong> Good standard</li><li><strong>Within 48 hours:</strong> Acceptable</li><li><strong>Over 72 hours:</strong> Damaging</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Set Up Alerts</h3>
        <ul className="space-y-2 mb-6"><li>Google Maps app notifications</li><li>Email alerts via Google Business</li><li>Third-party monitoring tools</li><li>Team member assignments</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">SEO Benefits of Q&A</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Keyword Opportunities</h3>
        <ul className="space-y-2 mb-6"><li>Natural keyword placement</li><li>Long-tail search matches</li><li>Voice search optimization</li><li>Featured snippet potential</li><li>Local search relevance</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Strategic Keywords to Include</h3>
        <ul className="space-y-2 mb-6"><li>Service/product names</li><li>Location identifiers</li><li>Problem/solution terms</li><li>Industry terminology</li><li>Branded terms</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Handling Negative Questions</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">When Critics Attack</h3>
        <p className="mb-4"><strong>Bad Question:</strong> "Why is your service so expensive?"</p>
        <p className="mb-4"><strong>Good Response:</strong> "We understand price is important! Our pricing reflects premium materials, certified technicians, and a 5-year warranty. We also offer financing options and seasonal discounts. Contact us for a personalized quote that fits your budget."</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">The Redirect Method</h3>
        <ul className="space-y-2 mb-6"><li>Acknowledge concern</li><li>Provide positive context</li><li>Offer solution</li><li>Invite direct contact</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Industry-Specific Q&A Templates</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Restaurants</h3>
        <ul className="space-y-2 mb-6"><li>Dietary restrictions</li><li>Reservation policies</li><li>Dress code</li><li>Kids menu/high chairs</li><li>Private dining options</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Medical/Dental</h3>
        <ul className="space-y-2 mb-6"><li>Insurance accepted</li><li>New patient process</li><li>Emergency availability</li><li>Parking/accessibility</li><li>Wait times</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Services</h3>
        <ul className="space-y-2 mb-6"><li>Service area coverage</li><li>Free estimates</li><li>License/insurance info</li><li>Guarantee details</li><li>Emergency availability</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Retail</h3>
        <ul className="space-y-2 mb-6"><li>Product availability</li><li>Return policy</li><li>Online ordering</li><li>Curbside pickup</li><li>Special orders</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Q&A Best Practices</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Do's</h3>
        <p className="mb-4">✅ Answer within 24 hours</p>
        <p className="mb-4">✅ Keep answers current</p>
        <p className="mb-4">✅ Include helpful links</p>
        <p className="mb-4">✅ Thank question askers</p>
        <p className="mb-4">✅ Upvote helpful questions</p>
        <p className="mb-4">✅ Report inappropriate content</p>
        <p className="mb-4">✅ Use professional tone</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Don'ts</h3>
        <p className="mb-4">❌ Ignore questions</p>
        <p className="mb-4">❌ Give vague answers</p>
        <p className="mb-4">❌ Argue with users</p>
        <p className="mb-4">❌ Post promotional spam</p>
        <p className="mb-4">❌ Share sensitive info</p>
        <p className="mb-4">❌ Make promises you can't keep</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Managing at Scale</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Weekly Q&A Routine</h3>
        <p className="mb-4"><strong>Monday:</strong> Check for new questions</p>
        <p className="mb-4"><strong>Wednesday:</strong> Post 1-2 proactive Q&As</p>
        <p className="mb-4"><strong>Friday:</strong> Review and update old answers</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Team Approach</h3>
        <ul className="space-y-2 mb-6"><li>Assign Q&A monitor role</li><li>Create answer templates</li><li>Train on brand voice</li><li>Set response protocols</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Measuring Q&A Success</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Key Metrics</h3>
        <ul className="space-y-2 mb-6"><li>Response time average</li><li>Question volume trends</li><li>Upvotes received</li><li>Click-throughs from answers</li><li>Conversion correlation</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Performance Indicators</h3>
        <ul className="space-y-2 mb-6"><li>Decreasing repeat questions</li><li>Increasing upvotes</li><li>More specific inquiries</li><li>Fewer negative questions</li><li>Higher profile engagement</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Advanced Q&A Tactics</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">The FAQ Anticipation Method</h3>
        <ul className="space-y-2 mb-6"><li>Review support tickets</li><li>Note common questions</li><li>Post preemptive Q&As</li><li>Link to detailed resources</li><li>Update seasonally</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Competitive Intelligence</h3>
        <ul className="space-y-2 mb-6"><li>Monitor competitor Q&As</li><li>Identify their weaknesses</li><li>Address gaps in your Q&A</li><li>Highlight advantages</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Quick Win</h2>
        <p className="mb-4"><strong>The Q&A Audit:</strong> Right now, check your profile for unanswered questions. Answer ALL of them today, then post 5 common questions with detailed answers. This immediately improves your profile completeness and SEO.</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Common Q&A Mistakes</h2>
        <p className="mb-4">❌ One-word answers</p>
        <p className="mb-4">❌ Outdated information</p>
        <p className="mb-4">❌ No contact details</p>
        <p className="mb-4">❌ Defensive responses</p>
        <p className="mb-4">❌ Ignoring spam/fake questions</p>
        <p className="mb-4">❌ Not utilizing the feature</p>
        <p className="mb-4">---</p>
        <p className="mb-4"><em>Need help managing Q&A? <a href="mailto:support@promptreviews.app" className="text-blue-600 hover:text-blue-700 underline">Learn about automation options</a></em></p>
      </div>
    </DocsLayout>
  )
}