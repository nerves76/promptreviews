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
  title: 'Categories | Google Biz Optimizer™',
  description: 'Categories tell Google what your business does, directly impacting when and where you appear in search results. They\'re the foundation of your local SEO strategy.',
  keywords: [
    'Google Business Profile',
    'Optimization',
    'local SEO',
    'business optimization'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/google-biz-optimizer/optimization/categories',
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
        currentPage="Categories"
        categoryLabel="Optimization"
        categoryIcon={Search}
        categoryColor="green"
        title="Categories"
        description="Categories tell Google what your business does, directly impacting when and where you appear in search results. They're the foundation of your local SEO strategy."
      />

      <div className="prose prose-gray max-w-none">
        <h2 className="text-2xl font-bold mb-4 mt-8">What Are Google Business Categories?</h2>
        <p className="mb-4">Categories tell Google what your business does, directly impacting when and where you appear in search results. They're the foundation of your local SEO strategy.</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Primary vs. Secondary Categories</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Primary Category (Most Important)</h3>
        <ul className="space-y-2 mb-6"><li><strong>Determines your main business type</strong></li><li><strong>Biggest ranking factor</strong> for "near me" searches</li><li>Shows what you primarily do</li><li>Can only have ONE primary</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Secondary Categories (Up to 9)</h3>
        <ul className="space-y-2 mb-6"><li>Support services you offer</li><li>Capture additional search traffic</li><li>Broaden your visibility</li><li>Strategic differentiation</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Category Impact on Rankings</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">The Numbers</h3>
        <ul className="space-y-2 mb-6"><li>Right primary category: <strong>+42% visibility</strong></li><li>Using 3+ categories: <strong>+25% more searches</strong></li><li>Category mismatch: <strong>-70% discovery traffic</strong></li><li>Specific beats general by <strong>3.5x</strong></li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Choosing the Perfect Categories</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">The Specificity Rule</h3>
        <p className="mb-4">❌ <strong>Too Broad:</strong> "Restaurant"</p>
        <p className="mb-4">✅ <strong>Just Right:</strong> "Italian Restaurant"</p>
        <p className="mb-4">✅ <strong>Even Better:</strong> "Tuscan Restaurant"</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Research Strategy</h3>
        <ul className="space-y-2 mb-6"><li><strong>Start typing</strong> in Google Business - see suggestions</li><li><strong>Check competitors</strong> - What categories rank well?</li><li><strong>Search test</strong> - Does this category trigger map results?</li><li><strong>Customer language</strong> - What do they search for?</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Category Mistakes to Avoid</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Common Errors</h3>
        <ul className="space-y-2 mb-6"><li>Using location in category (wrong: "Denver Pizza")</li><li>Keyword stuffing attempts</li><li>Irrelevant categories for reach</li><li>Missing obvious categories</li><li>Too general when specific exists</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Industry-Specific Category Strategies</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Restaurants</h3>
        <ul className="space-y-2 mb-6"><li>Primary: Specific cuisine type</li><li>Add: "Bar", "Takeout", "Catering"</li><li>Consider: Meal types, dietary options</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Medical Practices</h3>
        <ul className="space-y-2 mb-6"><li>Primary: Exact specialty</li><li>Add: General practice areas</li><li>Include: Treatment types offered</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Home Services</h3>
        <ul className="space-y-2 mb-6"><li>Primary: Main service (e.g., "Plumber")</li><li>Add: Specialties (e.g., "Emergency Plumber")</li><li>Include: Commercial/Residential variants</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Professional Services</h3>
        <ul className="space-y-2 mb-6"><li>Primary: License type (e.g., "Tax Attorney")</li><li>Add: Service areas</li><li>Include: Consultation types</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Category Optimization Tips</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Finding Hidden Categories</h3>
        <ul className="space-y-2 mb-6"><li>Type slowly in category field</li><li>Try synonyms and variations</li><li>Look for newly added categories</li><li>Check seasonal categories</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">The 80/20 Rule</h3>
        <ul className="space-y-2 mb-6"><li><strong>Primary category:</strong> 80% of impact</li><li><strong>First 2 secondary:</strong> 15% of impact</li><li><strong>Additional:</strong> 5% of impact</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Real-World Examples</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Pizza Restaurant</h3>
        <ul className="space-y-2 mb-6"><li><strong>Primary:</strong> Pizza Restaurant</li><li><strong>Secondary:</strong></li></ul>
        <p className="mb-4">  - Italian Restaurant</p>
        <p className="mb-4">  - Delivery Restaurant</p>
        <p className="mb-4">  - Takeout Restaurant</p>
        <p className="mb-4">  - Bar</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Dental Practice</h3>
        <ul className="space-y-2 mb-6"><li><strong>Primary:</strong> Cosmetic Dentist</li><li><strong>Secondary:</strong></li></ul>
        <p className="mb-4">  - Dentist</p>
        <p className="mb-4">  - Dental Implants Periodontist</p>
        <p className="mb-4">  - Teeth Whitening Service</p>
        <p className="mb-4">  - Emergency Dental Service</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Digital Agency</h3>
        <ul className="space-y-2 mb-6"><li><strong>Primary:</strong> Marketing Agency</li><li><strong>Secondary:</strong></li></ul>
        <p className="mb-4">  - Website Designer</p>
        <p className="mb-4">  - Advertising Agency</p>
        <p className="mb-4">  - Internet Marketing Service</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Category Updates & Changes</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Google's Evolution</h3>
        <ul className="space-y-2 mb-6"><li>New categories added monthly</li><li>Old categories deprecated</li><li>Seasonal categories appear/disappear</li><li>Industry-specific additions</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Stay Current</h3>
        <ul className="space-y-2 mb-6"><li>Review categories quarterly</li><li>Check for new options</li><li>Remove deprecated ones</li><li>Test category changes</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Measuring Category Performance</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Track These Metrics</h3>
        <ul className="space-y-2 mb-6"><li>Discovery searches before/after</li><li>"Near me" appearances</li><li>Click-through rate changes</li><li>Phone call variations</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Quick Win</h2>
        <p className="mb-4"><strong>The Category Audit:</strong> Open your competitors' profiles. Note ALL their categories. Find 2-3 relevant ones you're missing. Add them today for instant reach expansion.</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Pro Tips</h2>
        <ul className="space-y-2 mb-6"><li><strong>Never leave secondary slots empty</strong> - Use all 9 if relevant</li><li><strong>Update seasonally</strong> - Add "Christmas Tree Shop" in season</li><li><strong>Test changes</strong> - One category change at a time</li><li><strong>Document performance</strong> - Screenshot before/after</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Category Ranking Boost</h2>
        <p className="mb-4">Categories that typically perform best:</p>
        <ul className="space-y-2 mb-6"><li><strong>Most specific applicable</strong></li><li><strong>High search volume terms</strong></li><li><strong>Service + location type</strong> (e.g., "Airport Shuttle Service")</li><li><strong>Problem-solving categories</strong> (e.g., "Emergency Plumber")</li></ul>
        <p className="mb-4">---</p>
        <p className="mb-4"><em>Need help with category selection? <a href="mailto:support@promptreviews.app" className="text-blue-600 hover:text-blue-700 underline">Get expert analysis</a></em></p>
      </div>
    </DocsLayout>
  )
}