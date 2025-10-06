import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DocsLayout from '../../docs-layout'
import PageHeader from '../../components/PageHeader'
import {
  Zap,
  ArrowRight,
  ArrowLeft,
  Star,
  MessageSquare,
  Clock,
  Users,
  CheckCircle,
  TrendingUp,
  Smartphone
} from 'lucide-react'
import { getArticleBySlug } from '@/lib/docs/articles'

// Revalidate every 60 seconds - allows CMS updates to show without redeployment
export const revalidate = 60


const fallbackTitle = 'Get Reviews While Customers Are Still Excited: In-Person Collection'
const fallbackDescription = 'Learn how to get customer reviews instantly in-person. Capture reviews while customers are still excited about their experience for higher quality and response rates.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('strategies/reviews-on-fly')
    if (!article) {
      return {
        title: fallbackTitle,
        description: fallbackDescription,
        alternates: {
          canonical: 'https://docs.promptreviews.app/strategies/reviews-on-fly',
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
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/strategies/reviews-on-fly',
      },
    }
  } catch (error) {
    console.error('generateMetadata strategies/reviews-on-fly error:', error)
    return {
      title: fallbackTitle,
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/strategies/reviews-on-fly',
      },
    }
  }
}

// JSON-LD structured data
const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Reviews on the Fly Strategy',
  description: 'How to collect reviews in person by emphasizing speed and ease',
  image: 'https://docs.promptreviews.com/images/reviews-on-fly-strategy.jpg',
  estimatedCost: {
    '@type': 'MonetaryAmount',
    currency: 'USD',
    value: '0.00',
  },
  supply: [
    {
      '@type': 'HowToSupply',
      name: 'Mobile Device',
    },
    {
      '@type': 'HowToSupply',
      name: 'Prompt Reviews Account',
    },
    {
      '@type': 'HowToSupply',
      name: 'Satisfied Customers',
    },
  ],
  step: [
    {
      '@type': 'HowToStep',
      name: 'Identify the Right Moment',
      text: 'Ask for reviews when customers are most satisfied and engaged',
    },
    {
      '@type': 'HowToStep',
      name: 'Emphasize Speed and Ease',
      text: 'Highlight how quick and simple the review process is',
    },
    {
      '@type': 'HowToStep',
      name: 'Make It Immediate',
      text: 'Collect reviews while the experience is fresh and positive',
    },
  ],
}

export default function ReviewsOnFlyPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' },
            { label: 'Strategies', href: '/strategies' }
          ]}
          currentPage="Reviews on the Fly"
          categoryLabel="Review Collection"
          categoryIcon={Zap}
          categoryColor="orange"
          title="Get reviews while customers are still excited"
          description="Learn how to get customer reviews instantly in-person. Capture reviews while customers are still excited about their experience."
        />

        {/* Strategy Overview */}
        <div className="mb-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="text-center mb-8">
              <Zap className="w-16 h-16 text-orange-300 mx-auto mb-4" />
                             <h2 className="text-2xl font-bold text-white mb-4">How to Get Reviews While Customers Are Still Excited</h2>
               <p className="text-white/90 text-lg">
                 Reviews on the Fly is about capturing reviews in the moment—when customers are most satisfied, 
                 engaged, and likely to share their positive experience. It's about getting reviews while customers are still excited 
                 and making the review process so quick and easy that they can't say no.
               </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-orange-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Perfect Timing</h3>
                <p className="text-white/80 text-sm">
                  Ask for reviews when customers are most satisfied and engaged
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-yellow-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Lightning Fast</h3>
                <p className="text-white/80 text-sm">
                  Emphasize how quick and simple the review process is
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="w-6 h-6 text-green-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Mobile Ready</h3>
                <p className="text-white/80 text-sm">
                  Use mobile devices to collect reviews anywhere, anytime
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Reviews on the Fly Work */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Why Reviews on the Fly Work</h2>
          
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-orange-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Perfect Timing</h3>
                  <p className="text-white/90 mb-4">
                    When you ask for reviews immediately after a positive experience, customers are at their peak 
                    satisfaction level. Their emotions are high, their experience is fresh, and they're most likely 
                    to share their enthusiasm.
                  </p>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-white/80">
                      <strong>Pro tip:</strong> The "peak-end rule" shows people remember the peak and end of experiences most vividly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Reduced Friction</h3>
                  <p className="text-white/90 mb-4">
                    By making the review process immediate and easy, you eliminate the friction that prevents 
                    customers from leaving reviews later. No need to remember, no need to find time, no need 
                    to search for your business online.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-2">Eliminated Barriers:</h4>
                      <ul className="text-white/80 space-y-1">
                        <li>• No need to remember later</li>
                        <li>• No searching for your business</li>
                        <li>• No finding time to review</li>
                        <li>• No forgetting the experience</li>
                      </ul>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-2">Immediate Benefits:</h4>
                      <ul className="text-white/80 space-y-1">
                        <li>• Fresh experience in mind</li>
                        <li>• High satisfaction level</li>
                        <li>• Immediate gratification</li>
                        <li>• Personal connection</li>
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
                  <h3 className="text-xl font-semibold text-white mb-2">Higher Quality Reviews</h3>
                  <p className="text-white/90 mb-4">
                    Reviews collected immediately tend to be more detailed, authentic, and emotionally charged. 
                    Customers remember specific details and feelings that might fade over time.
                  </p>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-white/80">
                      <strong>Pro tip:</strong> Immediate reviews often include specific details and emotional responses that make them more valuable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* When to Ask for Reviews on the Fly */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">When to Ask for Reviews on the Fly</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-300" />
                Perfect Moments
              </h3>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Right after completing a service successfully</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>When customers express satisfaction or gratitude</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>After resolving a problem or exceeding expectations</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>When customers are visibly happy with results</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>During peak satisfaction moments</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-red-300" />
                Avoid These Times
              </h3>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>When customers are in a hurry or stressed</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>If there were any issues or problems</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>When customers seem distracted or busy</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>During peak business hours if it creates delays</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>If the customer seems dissatisfied</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* How to Implement */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How to Implement Reviews on the Fly</h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
                <h3 className="text-xl font-semibold text-white">Identify the Perfect Moment</h3>
              </div>
              <p className="text-white/90 mb-4">
                Watch for signs that customers are satisfied and engaged. Look for positive body language, 
                expressions of gratitude, or verbal satisfaction.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">Positive Signs:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• Smiling and relaxed body language</li>
                    <li>• Expressing thanks or satisfaction</li>
                    <li>• Asking about future services</li>
                    <li>• Complimenting your work</li>
                    <li>• Taking photos of results</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">Verbal Cues:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• "This is amazing!"</li>
                    <li>• "Thank you so much!"</li>
                    <li>• "I'm so happy with this"</li>
                    <li>• "You guys are the best"</li>
                    <li>• "I'll definitely recommend you"</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
                <h3 className="text-xl font-semibold text-white">Emphasize Speed and Ease</h3>
              </div>
              <p className="text-white/90 mb-4">
                When asking for the review, focus on how quick and simple the process is. Make it sound 
                like it will take just a moment of their time.
              </p>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Example Approaches:</h4>
                  <ul className="text-white/80 text-sm space-y-2">
                    <li>• "This will literally take 30 seconds"</li>
                    <li>• "It's super quick - just a couple of taps"</li>
                    <li>• "Our AI makes it really easy"</li>
                    <li>• "You can do it right here on your phone"</li>
                    <li>• "It's faster than sending a text message"</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
                <h3 className="text-xl font-semibold text-white">Make It Immediate</h3>
              </div>
              <p className="text-white/90 mb-4">
                Have your phone or tablet ready with the prompt page open. Make it as easy as possible 
                for them to leave a review right then and there.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">Preparation:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• Have your phone ready</li>
                    <li>• Prompt page already open</li>
                    <li>• Know your business name</li>
                    <li>• Have a QR code ready</li>
                    <li>• Practice the process</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">Execution:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• Hand them your phone</li>
                    <li>• Guide them through it</li>
                    <li>• Offer to help if needed</li>
                    <li>• Thank them immediately</li>
                    <li>• Celebrate their review</li>
                  </ul>
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
                  <h4 className="font-semibold text-white mb-2">The Moment:</h4>
                  <p className="text-white/80 text-sm">
                    Customer finishes their meal, pushes their plate away with a satisfied smile, and says 
                    "That was absolutely delicious!"
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">The Ask:</h4>
                  <p className="text-white/80 text-sm">
                    "I'm so glad you enjoyed it! Would you mind taking 30 seconds to share your experience? 
                    Our AI makes it super easy - it's literally just a couple of taps on your phone."
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Service Business Example</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">The Moment:</h4>
                  <p className="text-white/80 text-sm">
                    Customer sees the completed work, gasps with delight, and says "This is exactly what 
                    I was hoping for! It's perfect!"
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">The Ask:</h4>
                  <p className="text-white/80 text-sm">
                    "I'm thrilled you love it! While you're here and feeling great about the results, 
                    would you mind sharing your experience? Our AI will help you write the perfect review 
                    in just a moment."
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
                Only ask for reviews when you genuinely believe the customer had a great experience. 
                Don't pressure anyone who seems less than satisfied.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Your enthusiasm for their satisfaction should be genuine, not salesy.
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Keep It Quick</h3>
              <p className="text-white/80 text-sm mb-4">
                Emphasize the speed and simplicity of the process. Make it clear that it won't take 
                much of their time.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> "30 seconds" or "just a couple of taps" works better than "real quick."
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Have Everything Ready</h3>
              <p className="text-white/80 text-sm mb-4">
                Prepare your device, know your process, and have everything set up so the review 
                process is truly seamless.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Practice the process yourself so you can guide customers smoothly.
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Respect Their Time</h3>
              <p className="text-white/80 text-sm mb-4">
                If they seem busy or in a hurry, don't push it. There will be other opportunities 
                to ask for reviews.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> It's better to miss one review than to create a negative experience.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Story */}
        <div className="mb-12">
          <div className="bg-orange-500/20 border border-orange-400/30 rounded-xl p-8">
            <div className="text-center mb-6">
              <Zap className="w-16 h-16 text-orange-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Success Story: Mobile Hair Salon</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">The Challenge:</h3>
                <p className="text-white/90 text-sm mb-4">
                  A mobile hair salon was struggling to get reviews because customers would forget to leave 
                  them after the stylist left their home.
                </p>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>• Low review response rates</li>
                  <li>• Customers forgetting to review</li>
                  <li>• No follow-up system</li>
                  <li>• Lost momentum after service</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">The Solution:</h3>
                <p className="text-white/90 text-sm mb-4">
                  They implemented "Reviews on the Fly" by asking for reviews immediately after completing 
                  the service, while customers were still excited about their new look.
                </p>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>• 60% increase in review response rate</li>
                  <li>• Higher quality, more detailed reviews</li>
                  <li>• Immediate customer feedback</li>
                  <li>• Stronger customer relationships</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-white/90 font-semibold">
                "Asking for reviews right after I finish their hair is a game-changer. They're so excited 
                about their new look that they can't wait to share their experience!" - Stylist Sarah Chen
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-white/20">
          <div className="flex-1">
            <Link
              href="/strategies/novelty"
              className="inline-flex items-center space-x-2 px-4 py-2 text-white/80 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous: Novelty Factor</span>
            </Link>
          </div>
          
          <div className="flex-1 text-center">
            <span className="text-sm text-white/60">Strategy 6 of 6</span>
          </div>
          
          <div className="flex-1 text-right">
            <Link
              href="/strategies"
              className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <span>Back to Strategies</span>
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
