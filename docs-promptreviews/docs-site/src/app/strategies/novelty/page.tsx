import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DocsLayout from '../../docs-layout'
import PageHeader from '../../components/PageHeader'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Star,
  MessageSquare,
  Zap,
  Users,
  CheckCircle,
  TrendingUp,
  Heart
} from 'lucide-react'
import { getArticleBySlug } from '@/lib/docs/articles'
const fallbackTitle = 'Stand Out from Competitors: Unique Review Collection Methods'
const fallbackDescription = 'Learn how to use unique experiences to get more customer reviews. Stand out from competitors with innovative review collection methods that create memorable customer experiences.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('strategies/novelty')
    if (!article) {
      return {
        title: fallbackTitle,
        description: fallbackDescription,
        alternates: {
          canonical: 'https://docs.promptreviews.app/strategies/novelty',
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
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/strategies/novelty',
      },
    }
  } catch (error) {
    console.error('generateMetadata strategies/novelty error:', error)
    return {
      title: fallbackTitle,
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/strategies/novelty',
      },
    }
  }
}

// JSON-LD structured data
const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Novelty Factor Strategy',
  description: 'How to leverage unique experiences and AI-powered features to increase customer engagement',
  image: 'https://docs.promptreviews.com/images/novelty-factor-strategy.jpg',
  estimatedCost: {
    '@type': 'MonetaryAmount',
    currency: 'USD',
    value: '0.00',
  },
  supply: [
    {
      '@type': 'HowToSupply',
      name: 'Prompt Reviews Account',
    },
    {
      '@type': 'HowToSupply',
      name: 'AI Features',
    },
    {
      '@type': 'HowToSupply',
      name: 'Unique Experiences',
    },
  ],
  step: [
    {
      '@type': 'HowToStep',
      name: 'Highlight Unique Features',
      text: 'Showcase the unique aspects of your review collection process',
    },
    {
      '@type': 'HowToStep',
      name: 'Create Delightful Moments',
      text: 'Use AI and interactive elements to create memorable experiences',
    },
    {
      '@type': 'HowToStep',
      name: 'Leverage Novelty',
      text: 'Use the uniqueness of your approach to increase engagement',
    },
  ],
}

export default function NoveltyPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' },
            { label: 'Strategies', href: '/strategies' }
          ]}
          currentPage="Novelty Factor"
          categoryLabel="Review Collection"
          categoryIcon={Sparkles}
          categoryColor="purple"
          title="Stand out from competitors"
          description="Learn how to use unique experiences to get more customer reviews. Stand out from competitors with innovative review collection methods."
        />

        {/* Strategy Overview */}
        <div className="mb-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="text-center mb-8">
              <Sparkles className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                             <h2 className="text-2xl font-bold text-white mb-4">How to Stand Out from Competitors</h2>
               <p className="text-white/90 text-lg">
                 The novelty factor is the power of being different and offering unique experiences. Since Prompt Reviews 
                 is the only app that helps customers write reviews with AI, this uniqueness can help you stand out from competitors 
                 and motivate customers to engage and try something new.
               </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-purple-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Unique Experience</h3>
                <p className="text-white/80 text-sm">
                  Offer something customers haven't seen before in review collection
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-yellow-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">AI-Powered</h3>
                <p className="text-white/80 text-sm">
                  Leverage the novelty of AI assistance for review writing
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-green-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Delightful Interactions</h3>
                <p className="text-white/80 text-sm">
                  Create memorable moments that make customers want to engage
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Novelty Works */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Why the Novelty Factor Works</h2>
          
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Humans Love New Experiences</h3>
                  <p className="text-white/90 mb-4">
                    People are naturally drawn to new and unique experiences. When something is different from what 
                    they're used to, it creates curiosity and interest. This is especially true when the novelty 
                    provides clear value and makes their life easier.
                  </p>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-white/80">
                      <strong>Pro tip:</strong> Novelty works best when combined with clear benefits and ease of use.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Social Sharing Potential</h3>
                  <p className="text-white/90 mb-4">
                    Unique experiences are more likely to be shared with friends and family. When customers have 
                    a novel experience with your review process, they're more likely to talk about it and recommend 
                    your business to others.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-2">Word-of-Mouth Benefits:</h4>
                      <ul className="text-white/80 space-y-1">
                        <li>• "You have to try this cool review system"</li>
                        <li>• "They use AI to help you write reviews"</li>
                        <li>• "It's like nothing I've seen before"</li>
                        <li>• "The experience was really unique"</li>
                      </ul>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-2">Social Media Potential:</h4>
                      <ul className="text-white/80 space-y-1">
                        <li>• Shareable moments</li>
                        <li>• Interesting conversation starters</li>
                        <li>• Unique content for social feeds</li>
                        <li>• Viral potential</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Competitive Advantage</h3>
                  <p className="text-white/90 mb-4">
                    Being the only business in your area or industry using AI-powered review collection gives you 
                    a significant competitive advantage. It differentiates you from competitors and positions you 
                    as innovative and forward-thinking.
                  </p>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-white/80">
                      <strong>Pro tip:</strong> Use your novelty factor in marketing materials to stand out from competitors.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unique Features to Highlight */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Unique Features to Highlight</h2>
          
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-purple-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">AI-Powered Review Writing</h3>
              </div>
              <p className="text-white/90 mb-4">
                Prompt Reviews is the only platform that uses AI to help customers write better reviews. This is 
                a truly unique feature that sets you apart from every other business.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">How to Highlight:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• "We use AI to help you write the perfect review"</li>
                    <li>• "Our AI assistant makes review writing easy"</li>
                    <li>• "Get help from our AI writing assistant"</li>
                    <li>• "The only platform with AI review assistance"</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">Customer Benefits:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• No more writer's block</li>
                    <li>• Professional-sounding reviews</li>
                    <li>• Saves time and effort</li>
                    <li>• Better review quality</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Delightful Star Fall Effect</h3>
              </div>
              <p className="text-white/90 mb-4">
                The star fall celebration effect creates a memorable, delightful moment when customers submit their 
                reviews. This unique visual experience makes the review process fun and engaging.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">How to Highlight:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• "Watch the stars fall when you submit"</li>
                    <li>• "Experience our magical star celebration"</li>
                    <li>• "See the stars fall as you complete your review"</li>
                    <li>• "A delightful surprise awaits"</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">Emotional Impact:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• Creates positive emotions</li>
                    <li>• Makes the experience memorable</li>
                    <li>• Encourages sharing</li>
                    <li>• Builds brand affinity</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-yellow-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Interactive Experience</h3>
              </div>
              <p className="text-white/90 mb-4">
                Unlike traditional review forms, Prompt Reviews creates an interactive, engaging experience that 
                feels more like a conversation than a form submission.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">Interactive Elements:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• Real-time AI suggestions</li>
                    <li>• Dynamic content generation</li>
                    <li>• Personalized prompts</li>
                    <li>• Visual feedback</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">User Experience:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• Feels like a conversation</li>
                    <li>• Engaging and fun</li>
                    <li>• Less intimidating than forms</li>
                    <li>• More likely to complete</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How to Leverage Novelty */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How to Leverage the Novelty Factor</h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
                <h3 className="text-xl font-semibold text-white">Introduce the Novelty</h3>
              </div>
              <p className="text-white/90 mb-4">
                When asking customers to leave reviews, introduce the unique aspects of your process. Make them 
                curious about the experience they're about to have.
              </p>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Example Introductions:</h4>
                  <ul className="text-white/80 text-sm space-y-2">
                    <li>• "We have something special for you - our AI-powered review system"</li>
                    <li>• "Experience our unique review process with AI assistance"</li>
                    <li>• "Try our innovative review writing system - it's like nothing you've seen before"</li>
                    <li>• "We've made review writing fun and easy with our AI assistant"</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
                <h3 className="text-xl font-semibold text-white">Create Anticipation</h3>
              </div>
              <p className="text-white/90 mb-4">
                Build excitement about the unique experience they're about to have. Use language that creates 
                anticipation and curiosity.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">Anticipation Builders:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• "You're in for a treat"</li>
                    <li>• "Wait until you see this"</li>
                    <li>• "Something special awaits"</li>
                    <li>• "You won't believe how easy this is"</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">Curiosity Triggers:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• "How does AI help write reviews?"</li>
                    <li>• "What makes this different?"</li>
                    <li>• "Why is this so special?"</li>
                    <li>• "What's the surprise?"</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
                <h3 className="text-xl font-semibold text-white">Follow Up on the Experience</h3>
              </div>
              <p className="text-white/90 mb-4">
                After customers experience the novelty, follow up to reinforce the unique experience and encourage 
                them to share it with others.
              </p>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Follow-up Messages:</h4>
                  <ul className="text-white/80 text-sm space-y-2">
                    <li>• "How did you like our AI review assistant?"</li>
                    <li>• "Wasn't that star fall effect amazing?"</li>
                    <li>• "What did you think of our unique review process?"</li>
                    <li>• "Feel free to share this experience with friends!"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Marketing the Novelty */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Marketing Your Novelty Factor</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">In Your Business Materials</h3>
              <p className="text-white/80 text-sm mb-4">
                Include mentions of your unique review process in brochures, business cards, and other marketing materials.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Example:</strong> "Experience our AI-powered review system - the only one of its kind!"
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">On Your Website</h3>
              <p className="text-white/80 text-sm mb-4">
                Dedicate a section of your website to showcasing your unique review process and its benefits.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Example:</strong> "See how our AI makes review writing easy and fun!"
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">In Customer Conversations</h3>
              <p className="text-white/80 text-sm mb-4">
                Mention your unique review process during customer interactions to build curiosity and interest.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Example:</strong> "You'll love our review system - it's completely different from anything else."
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">On Social Media</h3>
              <p className="text-white/80 text-sm mb-4">
                Share videos or screenshots of your unique review process to generate interest and engagement.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Example:</strong> "Watch the magic happen when our AI helps write reviews!"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Story */}
        <div className="mb-12">
          <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl p-8">
            <div className="text-center mb-6">
              <Sparkles className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Success Story: Tech-Savvy Restaurant</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">The Challenge:</h3>
                <p className="text-white/90 text-sm mb-4">
                  A modern restaurant was struggling to get reviews despite having great food and service. 
                  Traditional review requests weren't working.
                </p>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>• Low review response rates</li>
                  <li>• Generic review requests</li>
                  <li>• No differentiation from competitors</li>
                  <li>• Boring review process</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">The Solution:</h3>
                <p className="text-white/90 text-sm mb-4">
                  They embraced their novelty factor by highlighting their AI-powered review system and 
                  creating excitement around the unique experience.
                </p>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>• 40% increase in review response rate</li>
                  <li>• Customers excited to try the AI system</li>
                  <li>• Social media buzz about the experience</li>
                  <li>• Word-of-mouth recommendations</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-white/90 font-semibold">
                "Our customers love telling their friends about our 'futuristic' review system. It's become 
                a conversation starter and has really set us apart from other restaurants." - Chef Maria Rodriguez
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-white/20">
          <div className="flex-1">
            <Link
              href="/strategies/non-ai-strategies"
              className="inline-flex items-center space-x-2 px-4 py-2 text-white/80 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous: Non-AI Strategies</span>
            </Link>
          </div>
          
          <div className="flex-1 text-center">
            <span className="text-sm text-white/60">Strategy 5 of 6</span>
          </div>
          
          <div className="flex-1 text-right">
            <Link
              href="/strategies/reviews-on-fly"
              className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <span>Next: Reviews on the Fly</span>
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
