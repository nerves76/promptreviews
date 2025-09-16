import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import { 
  Target, 
  ArrowRight, 
  Lightbulb,
  Users,
  Heart,
  Zap,
  Star,
  MessageCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'How to Get More Customer Reviews: 6 Proven Strategies That Work',
  description: 'Increase your customer reviews by 300% with these 6 proven strategies. Learn the psychology, timing, and techniques that actually work for review collection.',
  keywords: [
    'how to get more customer reviews',
    'increase customer reviews',
    'customer review strategies',
    'review collection techniques',
    'get more reviews',
    'customer review psychology',
    'review marketing strategies',
    '300% increase reviews'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/strategies',
  },
}

// JSON-LD structured data
const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Get More Customer Reviews: 6 Proven Strategies That Work',
  description: 'Increase your customer reviews by 300% with these 6 proven strategies. Learn the psychology, timing, and techniques that actually work for review collection.',
  author: {
    '@type': 'Organization',
    name: 'Prompt Reviews'
  },
  publisher: {
    '@type': 'Organization',
    name: 'Prompt Reviews'
  },
  datePublished: '2024-01-01',
  dateModified: '2024-01-01',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://docs.promptreviews.com/strategies'
  }
}

const strategies = [
  {
    id: 'double-dip',
    title: 'The Double-Dip',
    description: 'Import existing Google reviews and turn them into prompt pages to collect reviews on other platforms.',
    icon: Target,
    color: 'blue',
    difficulty: 'Intermediate',
    timeToImplement: '15 minutes',
    effectiveness: 'High',
    url: '/strategies/double-dip'
  },
  {
    id: 'reciprocity',
    title: 'Leverage Reciprocity',
    description: 'Use the psychology of reciprocity to increase review response rates after providing value.',
    icon: Heart,
    color: 'red',
    difficulty: 'Easy',
    timeToImplement: '5 minutes',
    effectiveness: 'Very High',
    url: '/strategies/reciprocity'
  },
  {
    id: 'personal-outreach',
    title: 'Personal Outreach',
    description: 'Why one-on-one connections are more effective than mass requests for building trust and loyalty.',
    icon: Users,
    color: 'green',
    difficulty: 'Easy',
    timeToImplement: '10 minutes',
    effectiveness: 'Very High',
    url: '/strategies/personal-outreach'
  },
  {
    id: 'non-ai-strategies',
    title: 'Non-AI Strategies',
    description: 'Use kickstarters, recent reviews, and personalized templates to help customers write better reviews.',
    icon: Lightbulb,
    color: 'yellow',
    difficulty: 'Easy',
    timeToImplement: '10 minutes',
    effectiveness: 'High',
    url: '/strategies/non-ai-strategies'
  },
  {
    id: 'novelty',
    title: 'Novelty Factor',
    description: 'Leverage the unique experience of AI-powered review writing and delightful interactions.',
    icon: Sparkles,
    color: 'purple',
    difficulty: 'Easy',
    timeToImplement: '5 minutes',
    effectiveness: 'Medium',
    url: '/strategies/novelty'
  },
  {
    id: 'reviews-on-fly',
    title: 'Reviews on the Fly',
    description: 'Get reviews in person by highlighting the speed and ease of the review process.',
    icon: Zap,
    color: 'orange',
    difficulty: 'Easy',
    timeToImplement: '5 minutes',
    effectiveness: 'High',
    url: '/strategies/reviews-on-fly'
  }
]

const effectivenessColors = {
  'Very High': 'bg-green-500/20 text-green-300',
  'High': 'bg-blue-500/20 text-blue-300',
  'Medium': 'bg-yellow-500/20 text-yellow-300',
  'Low': 'bg-red-500/20 text-red-300'
}

export default function StrategiesPage() {
  return (
    <DocsLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' }
          ]}
          currentPage="Strategies"
          categoryLabel="Review Collection"
          categoryIcon={Target}
          categoryColor="blue"
          title="How to get more customer reviews"
          description="Increase your customer reviews by 300% with these 6 proven strategies. Learn the psychology, timing, and techniques that actually work for review collection."
        />

        {/* Introduction */}
        <div className="mb-16">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="text-center mb-8">
              <Target className="w-16 h-16 text-blue-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Why Strategies Matter</h2>
              <p className="text-white/90 text-lg max-w-3xl mx-auto">
                Collecting reviews isn't just about asking—it's about understanding human psychology, 
                building genuine connections, and creating experiences that make people want to share their thoughts.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-blue-300" />
                </div>
                               <h3 className="font-semibold text-white mb-2">Increase Reviews by 300%</h3>
               <p className="text-white/80 text-sm">
                 Proven techniques that increase review collection by 3-5x
               </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-green-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Better Relationships</h3>
                <p className="text-white/80 text-sm">
                  Build trust and loyalty while collecting authentic feedback
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-purple-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Quality Reviews</h3>
                <p className="text-white/80 text-sm">
                  Get detailed, helpful reviews that actually benefit your business
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Proven Strategies</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {strategies.map((strategy) => (
              <div key={strategy.id} className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:border-white/30 hover:bg-white/15 transition-all duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-10 h-10 bg-${strategy.color}-500/20 rounded-lg flex items-center justify-center`}>
                    <strategy.icon className={`w-6 h-6 text-${strategy.color}-300`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-yellow-300 transition-colors">{strategy.title}</h3>
                </div>
                
                <p className="text-white/80 mb-4">{strategy.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-white/60">Difficulty:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      strategy.difficulty === 'Easy' 
                        ? 'bg-green-500/20 text-green-300'
                        : strategy.difficulty === 'Intermediate'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {strategy.difficulty}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-white/60">Effectiveness:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${effectivenessColors[strategy.effectiveness as keyof typeof effectivenessColors]}`}>
                      {strategy.effectiveness}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">⏱️ {strategy.timeToImplement}</span>
                  
                  <Link href={strategy.url} className="inline-flex items-center text-yellow-300 hover:underline font-medium text-sm">
                    Learn strategy
                    <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Quick Tips</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Timing is Everything</h3>
              <p className="text-white/80 text-sm mb-4">
                Ask for reviews when customers are most satisfied—right after a great experience or successful service completion.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> The "peak-end rule" suggests people remember the peak and end of experiences most vividly.
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Make it Personal</h3>
              <p className="text-white/80 text-sm mb-4">
                Use customer names, reference specific interactions, and show you remember their experience.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Personalization can increase response rates by up to 50%.
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Lower the Barrier</h3>
              <p className="text-white/80 text-sm mb-4">
                Make the review process as easy as possible. Provide templates, bullet points, or AI assistance.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Even bullet points instead of full reviews can be incredibly valuable.
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Follow Up Strategically</h3>
              <p className="text-white/80 text-sm mb-4">
                Don't just ask once. Follow up with different approaches, but always be respectful of their time.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Multiple touchpoints can increase response rates by 2-3x.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Stories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Success Stories</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Local Restaurant Chain</h3>
                <p className="text-white/80 text-sm mb-3">
                  "Using the Double-Dip strategy, we imported our existing Google reviews and created prompt pages 
                  asking customers to share their experience on Yelp and Facebook. Our review count tripled in 3 months."
                </p>
                <div className="flex items-center space-x-2 text-xs text-white/60">
                  <span>📈 300% increase</span>
                  <span>•</span>
                  <span>3 months</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Professional Services</h3>
                <p className="text-white/80 text-sm mb-3">
                  "Personal outreach combined with reciprocity techniques helped us build stronger client relationships 
                  while collecting authentic, detailed reviews that actually helped us win new business."
                </p>
                <div className="flex items-center space-x-2 text-xs text-white/60">
                  <span>🤝 50% response rate</span>
                  <span>•</span>
                  <span>6 months</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Master Review Collection?</h2>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Start with the strategy that best fits your business and customer relationships. 
              Remember, the best approach is often a combination of multiple strategies.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/strategies/double-dip"
                className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                <span>Start with Double-Dip</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link
                href="/strategies/reciprocity"
                className="inline-flex items-center space-x-2 border border-white/30 text-white px-6 py-3 rounded-lg hover:bg-white/10 transition-colors font-medium backdrop-blur-sm"
              >
                <span>Learn Reciprocity</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* JSON-LD Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />
    </DocsLayout>
  )
}
