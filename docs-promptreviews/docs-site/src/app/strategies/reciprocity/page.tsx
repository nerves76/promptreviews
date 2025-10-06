import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DocsLayout from '../../docs-layout'
import PageHeader from '../../components/PageHeader'
import {
  Heart,
  ArrowRight,
  ArrowLeft,
  Gift,
  Users,
  Star,
  TrendingUp,
  MessageCircle,
  CheckCircle,
  Smile
} from 'lucide-react'
import { getArticleBySlug } from '@/lib/docs/articles'
const fallbackTitle = 'The Psychology of Getting Customer Reviews: Dr. Cialdini\'s Method'
const fallbackDescription = 'Learn how to use psychology to get more customer reviews. Master Dr. Cialdini\'s reciprocity principle to increase review response rates naturally.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('strategies/reciprocity')
    if (!article) {
      return {
        title: fallbackTitle,
        description: fallbackDescription,
        alternates: {
          canonical: 'https://docs.promptreviews.app/strategies/reciprocity',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title || fallbackTitle
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? [],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/strategies/reciprocity',
      },
    }
  } catch (error) {
    console.error('generateMetadata strategies/reciprocity error:', error)
    return {
      title: fallbackTitle,
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/strategies/reciprocity',
      },
    }
  }
}

// JSON-LD structured data
const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Leverage Reciprocity Strategy',
  description: 'How to use the psychology of reciprocity to increase review response rates',
  image: 'https://docs.promptreviews.com/images/reciprocity-strategy.jpg',
  estimatedCost: {
    '@type': 'MonetaryAmount',
    currency: 'USD',
    value: '0.00',
  },
  supply: [
    {
      '@type': 'HowToSupply',
      name: 'Customer Relationships',
    },
    {
      '@type': 'HowToSupply',
      name: 'Value-Added Services',
    },
    {
      '@type': 'HowToSupply',
      name: 'Prompt Reviews Account',
    },
  ],
  step: [
    {
      '@type': 'HowToStep',
      name: 'Provide Value First',
      text: 'Offer something valuable to your customers before asking for reviews',
    },
    {
      '@type': 'HowToStep',
      name: 'Create Reciprocity',
      text: 'Use the natural human tendency to return favors',
    },
    {
      '@type': 'HowToStep',
      name: 'Ask for Reviews',
      text: 'Request reviews when customers feel indebted to you',
    },
  ],
}

export default function ReciprocityPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' },
            { label: 'Strategies', href: '/strategies' }
          ]}
          currentPage="Leverage Reciprocity"
          categoryLabel="Review Collection"
          categoryIcon={Heart}
          categoryColor="red"
          title="The psychology of getting customer reviews"
          description="Learn how to use psychology to get more customer reviews. Master Dr. Cialdini's reciprocity principle to increase review response rates naturally."
        />

        {/* Strategy Overview */}
        <div className="mb-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="text-center mb-8">
              <Heart className="w-16 h-16 text-red-300 mx-auto mb-4" />
                             <h2 className="text-2xl font-bold text-white mb-4">How Psychology Helps You Get More Reviews</h2>
               <p className="text-white/90 text-lg">
                 Understanding the psychology of getting customer reviews is key to success. When you use psychology 
                 to get more reviews, you tap into natural human behavior that can dramatically increase your review 
                 response rates.
               </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Gift className="w-6 h-6 text-red-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Give First</h3>
                <p className="text-white/80 text-sm">
                  Provide value, help, or a gift before asking for anything in return
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-green-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Create Obligation</h3>
                <p className="text-white/80 text-sm">
                  The natural human tendency to return favors kicks in automatically
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-yellow-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Get Reviews</h3>
                <p className="text-white/80 text-sm">
                  When you ask for a review, they're more likely to say yes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dr. Cialdini's Theory */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">The Science Behind Reciprocity</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Dr. Robert Cialdini's Research</h3>
                <p className="text-white/90 mb-4">
                  Dr. Cialdini's groundbreaking research on influence identified reciprocity as one of the six key principles 
                  of persuasion. His studies showed that when people receive something of value, they feel a strong psychological 
                  obligation to return the favor—even if the original gift was unsolicited.
                </p>
                <p className="text-white/90">
                  This principle is so powerful that it works across cultures, ages, and situations. It's not manipulation—it's 
                  understanding and working with natural human psychology.
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Key Findings:</h4>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>• Reciprocity works even with unsolicited gifts</li>
                  <li>• The obligation can last for years</li>
                  <li>• It's stronger when the gift is personalized</li>
                  <li>• Timing matters—ask soon after providing value</li>
                </ul>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Why It Works:</h4>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>• Hardwired into human psychology</li>
                  <li>• Creates social bonds and trust</li>
                  <li>• Makes people feel good about helping</li>
                  <li>• Builds long-term relationships</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* How to Implement */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How to Implement Reciprocity</h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
                <h3 className="text-xl font-semibold text-white">Provide Unexpected Value</h3>
              </div>
              <p className="text-white/90 mb-4">
                Go above and beyond what customers expect. This could be extra service, helpful advice, a small gift, 
                or simply being there when they need you most.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">Examples of Value:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• Free consultation or advice</li>
                    <li>• Going the extra mile on service</li>
                    <li>• Sending helpful resources</li>
                    <li>• Remembering personal details</li>
                    <li>• Following up after service</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">Timing:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• During the service process</li>
                    <li>• Right after completion</li>
                    <li>• When they have a problem</li>
                    <li>• On special occasions</li>
                    <li>• Just because you care</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
                <h3 className="text-xl font-semibold text-white">Let Reciprocity Work</h3>
              </div>
              <p className="text-white/90 mb-4">
                After providing value, give customers time to feel the natural urge to reciprocate. Don't immediately ask 
                for a review—let the psychological principle work its magic.
              </p>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-white/80">
                  <strong>Pro tip:</strong> The best time to ask for a review is when they express gratitude or satisfaction. 
                  That's when the reciprocity feeling is strongest.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
                <h3 className="text-xl font-semibold text-white">Ask for the Review</h3>
              </div>
              <p className="text-white/90 mb-4">
                When you do ask for a review, frame it as a way they can help you, which aligns with their natural desire 
                to return the favor you've given them.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
                  <MessageCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white/90">"Would you help us by..."</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-white/90">"We'd really appreciate..."</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white/90">"It would mean a lot..."</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real Examples */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Real Examples</h2>
          
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Restaurant Example</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">The Value:</h4>
                  <p className="text-white/80 text-sm">
                    A couple celebrating their anniversary gets a complimentary dessert and champagne. 
                    The server remembers their names and makes the evening special.
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">The Ask:</h4>
                  <p className="text-white/80 text-sm">
                    "We're so glad we could make your anniversary special! Would you help us by sharing 
                    your experience on Google? It would mean a lot to our team."
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Service Business Example</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">The Value:</h4>
                  <p className="text-white/80 text-sm">
                    A plumber fixes a leak and then checks the entire system for free, saving the customer 
                    from future problems. He also provides maintenance tips.
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">The Ask:</h4>
                  <p className="text-white/80 text-sm">
                    "I'm glad I could help prevent future issues! Would you mind sharing your experience 
                    on our Google page? It helps other homeowners find reliable service."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Best Practices</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Be Genuine</h3>
              <p className="text-white/80 text-sm mb-4">
                Reciprocity works best when your value is genuine and heartfelt. Don't fake it—truly care about helping your customers.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> People can sense when you're being manipulative. Authentic care creates stronger reciprocity.
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Personalize the Value</h3>
              <p className="text-white/80 text-sm mb-4">
                Tailor your value to each customer's specific needs and situation. Personalized value creates stronger reciprocity.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Remember details about their life, preferences, and past interactions.
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Don't Keep Score</h3>
              <p className="text-white/80 text-sm mb-4">
                Give value without expecting anything in return. The reciprocity will happen naturally when you least expect it.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Focus on building relationships, not collecting reviews.
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Timing is Key</h3>
              <p className="text-white/80 text-sm mb-4">
                Ask for reviews when customers are expressing gratitude or satisfaction. That's when reciprocity is strongest.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Listen for cues like "Thank you so much!" or "This is amazing!"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Win-Win Philosophy */}
        <div className="mb-12">
          <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-8">
            <div className="text-center">
              <Smile className="w-16 h-16 text-green-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">The Win-Win Philosophy</h2>
              <p className="text-white/90 text-lg mb-6">
                Reciprocity isn't about manipulation—it's about creating genuine win-win relationships. When you help your customers, 
                they naturally want to help you back. It's human nature at its best.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/10 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">You Win Because:</h3>
                  <ul className="text-white/80 text-sm space-y-1">
                    <li>• Higher review response rates</li>
                    <li>• Stronger customer relationships</li>
                    <li>• More loyal customers</li>
                    <li>• Better word-of-mouth</li>
                  </ul>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">They Win Because:</h3>
                  <ul className="text-white/80 text-sm space-y-1">
                    <li>• Receive unexpected value</li>
                    <li>• Feel appreciated and cared for</li>
                    <li>• Get better service</li>
                    <li>• Build a relationship with you</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-white/20">
          <div className="flex-1">
            <Link
              href="/strategies/double-dip"
              className="inline-flex items-center space-x-2 px-4 py-2 text-white/80 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous: Double-Dip</span>
            </Link>
          </div>
          
          <div className="flex-1 text-center">
            <span className="text-sm text-white/60">Strategy 2 of 6</span>
          </div>
          
          <div className="flex-1 text-right">
            <Link
              href="/strategies/personal-outreach"
              className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <span>Next: Personal Outreach</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
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
