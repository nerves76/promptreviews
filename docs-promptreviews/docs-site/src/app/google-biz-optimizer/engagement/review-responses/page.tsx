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
  title: 'Review Responses | Google Biz Optimizer™',
  description: 'Responding to reviews isn\'t just courtesy—it\'s a powerful business tool that impacts rankings, reputation, and revenue.',
  keywords: [
    'Google Business Profile',
    'Engagement',
    'local SEO',
    'business optimization'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/google-biz-optimizer/engagement/review-responses',
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
        currentPage="Review Responses"
        categoryLabel="Engagement"
        categoryIcon={MessageSquare}
        categoryColor="purple"
        title="Review Responses"
        description="Responding to reviews isn't just courtesy—it's a powerful business tool that impacts rankings, reputation, and revenue."
      />

      <div className="prose prose-gray max-w-none">
        <h2 className="text-2xl font-bold mb-4 mt-8">Why Review Responses Matter</h2>
        <p className="mb-4">Responding to reviews isn't just courtesy—it's a powerful business tool that impacts rankings, reputation, and revenue.</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">The Statistics</h3>
        <ul className="space-y-2 mb-6"><li><strong>89% of consumers</strong> read business responses to reviews</li><li>Businesses that respond see <strong>12% more reviews</strong> on average</li><li>Response rate is a <strong>Google ranking factor</strong></li><li><strong>97% of customers</strong> feel responses show the business cares</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Response Time Benchmarks</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Ideal Timing</h3>
        <ul className="space-y-2 mb-6"><li><strong>Negative reviews:</strong> Within 24 hours</li><li><strong>Positive reviews:</strong> Within 48 hours</li><li><strong>Questions in reviews:</strong> Within 4 hours</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Industry Standards</h3>
        <ul className="space-y-2 mb-6"><li><strong>Excellent:</strong> 100% response rate, <24hr average</li><li><strong>Good:</strong> 80% response rate, <48hr average</li><li><strong>Needs Work:</strong> <50% response rate, >72hr average</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">The Perfect Response Formula</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">For Positive Reviews (4-5 stars)</h3>
        <p className="mb-4"><strong>Structure:</strong></p>
        <ul className="space-y-2 mb-6"><li>Personal greeting with name</li><li>Specific thank you</li><li>Highlight something they mentioned</li><li>Invitation to return</li><li>Sign with name/title</li></ul>
        <p className="mb-4"><strong>Example:</strong></p>
        <p className="mb-4">"Hi Sarah! Thank you for taking the time to share your experience. We're thrilled you enjoyed our new seasonal menu—Chef Maria puts her heart into every dish. We can't wait to welcome you back soon! - John, Owner"</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">For Negative Reviews (1-3 stars)</h3>
        <p className="mb-4"><strong>The A.L.E.R.T. Method:</strong></p>
        <ul className="space-y-2 mb-6"><li><strong>A</strong>cknowledge the issue</li><li><strong>L</strong>isten to their concerns</li><li><strong>E</strong>mpathize genuinely</li><li><strong>R</strong>espond with solution</li><li><strong>T</strong>ake it offline if needed</li></ul>
        <p className="mb-4"><strong>Example:</strong></p>
        <p className="mb-4">"Hi Michael, I sincerely apologize for your disappointing experience yesterday. This isn't the level of service we strive for. I'd like to personally address this—please email me at owner@business.com so I can make this right. - Jane, Manager"</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">What NOT to Do</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Never:</h3>
        <ul className="space-y-2 mb-6"><li>Argue or get defensive</li><li>Make excuses</li><li>Reveal customer private info</li><li>Copy-paste responses</li><li>Ignore negative reviews</li><li>Offer bribes for removal</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Avoid:</h3>
        <ul className="space-y-2 mb-6"><li>Generic responses</li><li>Corporate speak</li><li>Delayed responses</li><li>Emotional reactions</li><li>Grammar/spelling errors</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Advanced Strategies</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">The 'Review Response SEO' Technique</h3>
        <p className="mb-4">Include relevant keywords naturally:</p>
        <ul className="space-y-2 mb-6"><li>Service mentions</li><li>Location references</li><li>Product names</li><li>Industry terms</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">The 'Future Customer' Approach</h3>
        <p className="mb-4">Write responses knowing prospects will read them:</p>
        <ul className="space-y-2 mb-6"><li>Showcase values</li><li>Demonstrate expertise</li><li>Highlight policies</li><li>Show personality</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Templates by Situation</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Service Excellence</h3>
        <p className="mb-4">"Thank you [Name]! Your kind words about our [specific service] mean everything to our team. We're passionate about [value/mission] and reviews like yours motivate us daily. Looking forward to serving you again!"</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Minor Issue Resolution</h3>
        <p className="mb-4">"Hi [Name], thank you for your honest feedback. While we're glad you enjoyed [positive aspect], we apologize that [issue] didn't meet expectations. We've addressed this with our team to ensure better experiences. We'd love another chance to wow you!"</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Major Problem Response</h3>
        <p className="mb-4">"[Name], I am deeply sorry about your experience. This is absolutely not acceptable, and I take full responsibility. Please contact me directly at [email/phone] - I want to personally ensure we make this right and restore your faith in our business. - [Owner name]"</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Fake/Unfair Review</h3>
        <p className="mb-4">"Hi [Name], we're unable to locate your visit in our records. If you're our customer, please contact us at [email] with details so we can address your concerns. If this was posted in error, we kindly ask you to review. Thank you for understanding."</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Response Rate Impact</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">On Rankings:</h3>
        <ul className="space-y-2 mb-6"><li>0% response rate: Baseline</li><li>50% response rate: +15% visibility</li><li>100% response rate: +30% visibility</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">On Revenue:</h3>
        <ul className="space-y-2 mb-6"><li>Responding increases revenue by 35% average</li><li>4x more likely to get repeat business</li><li>2x more referrals from responded customers</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Managing at Scale</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Prioritization:</h3>
        <ul className="space-y-2 mb-6"><li>Negative reviews (immediate)</li><li>Detailed reviews (high value)</li><li>Recent reviews (relevancy)</li><li>Positive reviews (appreciation)</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Time-Saving Tips:</h3>
        <ul className="space-y-2 mb-6"><li>Create response templates library</li><li>Set daily response time</li><li>Use team delegation</li><li>Set up alerts</li><li>Batch similar responses</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Legal Considerations</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Do:</h3>
        <ul className="space-y-2 mb-6"><li>Keep it professional</li><li>Stick to facts</li><li>Protect privacy</li><li>Document everything</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Don't:</h3>
        <ul className="space-y-2 mb-6"><li>Admit fault/liability</li><li>Promise compensation publicly</li><li>Share customer details</li><li>Violate HIPAA/privacy laws</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Quick Win</h2>
        <p className="mb-4"><strong>The 24-Hour Challenge:</strong> Respond to all unaddressed reviews in the next 24 hours. Even old reviews deserve responses—it shows you're actively engaged now.</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Measuring Success</h2>
        <p className="mb-4">Track:</p>
        <ul className="space-y-2 mb-6"><li>Response rate percentage</li><li>Average response time</li><li>Customer sentiment change</li><li>Follow-up review ratings</li><li>Response engagement</li></ul>
        <p className="mb-4">---</p>
        <p className="mb-4"><em>Need help managing responses? <a href="https://promptreviews.app" className="text-blue-600 hover:text-blue-700 underline">Try PromptReviews automation</a></em></p>
      </div>
    </DocsLayout>
  )
}