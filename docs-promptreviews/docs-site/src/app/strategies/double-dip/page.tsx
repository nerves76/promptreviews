import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../../docs-layout'
import PageHeader from '../../components/PageHeader'
import { 
  Target, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw,
  Share2,
  Star,
  TrendingUp,
  Users,
  MessageCircle,
  CheckCircle
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Double Your Reviews: Turn Google Reviews into Yelp, Facebook & More',
  description: 'Learn how to get reviews on multiple platforms from one customer. Import Google reviews and turn them into Yelp, Facebook, and other platform reviews.',
  keywords: [
    'double your reviews',
    'get reviews on multiple platforms',
    'Google reviews to Yelp',
    'cross platform reviews',
    'multiple platform reviews',
    'turn Google reviews into other reviews',
    'review multiplication strategy'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/strategies/double-dip',
  },
}

// JSON-LD structured data
const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Double Your Reviews: Turn Google Reviews into Yelp, Facebook & More',
  description: 'How to get reviews on multiple platforms from one customer by importing Google reviews',
  image: 'https://docs.promptreviews.com/images/double-dip-strategy.jpg',
  estimatedCost: {
    '@type': 'MonetaryAmount',
    currency: 'USD',
    value: '0.00',
  },
  supply: [
    {
      '@type': 'HowToSupply',
      name: 'Existing Google Reviews',
    },
    {
      '@type': 'HowToSupply',
      name: 'Prompt Reviews Account',
    },
    {
      '@type': 'HowToSupply',
      name: 'Customer Contact Information',
    },
  ],
  step: [
    {
      '@type': 'HowToStep',
      name: 'Import Google Reviews',
      text: 'Import your existing Google Business reviews into Prompt Reviews',
    },
    {
      '@type': 'HowToStep',
      name: 'Create Prompt Pages',
      text: 'Turn each review into a personalized prompt page',
    },
    {
      '@type': 'HowToStep',
      name: 'Request Cross-Platform Reviews',
      text: 'Ask customers to share their experience on different platforms',
    },
  ],
}

export default function DoubleDipPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' },
            { label: 'Strategies', href: '/strategies' }
          ]}
          currentPage="The Double-Dip"
          categoryLabel="Review Collection"
          categoryIcon={Target}
          categoryColor="blue"
          title="Double your reviews"
          description="Turn Google reviews into Yelp, Facebook, and other platform reviews. Get reviews on multiple platforms from one customer!"
        />

        {/* Strategy Overview */}
        <div className="mb-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="text-center mb-8">
              <Target className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                             <h2 className="text-2xl font-bold text-white mb-4">How to Get Reviews on Multiple Platforms</h2>
               <p className="text-white/90 text-lg">
                 The Double-Dip strategy takes your existing Google reviews and turns them into opportunities 
                 to get reviews on Yelp, Facebook, and other platforms. It's like getting a second scoop of reviews 
                 from customers who already love you!
               </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <RefreshCw className="w-6 h-6 text-blue-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Import & Transform</h3>
                <p className="text-white/80 text-sm">
                  Import your Google reviews and transform them into personalized prompt pages
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Share2 className="w-6 h-6 text-green-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Cross-Platform</h3>
                <p className="text-white/80 text-sm">
                  Ask satisfied customers to share their experience on different review platforms
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-purple-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Multiply Results</h3>
                <p className="text-white/80 text-sm">
                  Turn one review into multiple reviews across different platforms
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How the Double-Dip Works</h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
                <h3 className="text-xl font-semibold text-white">Import Your Google Reviews</h3>
              </div>
              <p className="text-white/90 mb-4">
                Start by importing your existing Google Business reviews into Prompt Reviews. 
                This gives you a database of customers who have already left positive feedback.
              </p>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-white/80">
                  <strong>Pro tip:</strong> Focus on 4-5 star reviews first, as these customers are most likely to help you again.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
                <h3 className="text-xl font-semibold text-white">Create Personalized Prompt Pages with Imported Reviews</h3>
              </div>
              <p className="text-white/90 mb-4">
                When you create a prompt page from a Google contact, you can automatically import their existing Google review! 
                This pre-fills their review content, making it incredibly easy for them to share on other platforms.
              </p>
              
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 mb-4">
                <p className="text-white/90 text-sm">
                  <strong className="text-blue-300">✨ Key Feature:</strong> Their Google review is imported automatically, allowing customers to:
                </p>
                <ul className="text-white/80 text-sm mt-2 space-y-1 ml-4">
                  <li>• Reference their previous review for consistency</li>
                  <li>• Post it as-is to save time</li>
                  <li>• Easily modify or expand on their original thoughts</li>
                  <li>• Add new experiences since their Google review</li>
                </ul>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">Auto-Imported Content:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• Their complete Google review text</li>
                    <li>• Original star rating</li>
                    <li>• Review date and context</li>
                    <li>• Customer's name and details</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">Encourage Them To:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• Personalize for each platform</li>
                    <li>• Add platform-specific details</li>
                    <li>• Update with recent experiences</li>
                    <li>• Vary the wording slightly</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3 mt-4">
                <p className="text-xs text-white/90">
                  <strong>Best Practice:</strong> While customers can post their review as-is, encouraging them to modify it slightly 
                  for each platform helps avoid duplicate content issues and makes reviews appear more authentic.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
                <h3 className="text-xl font-semibold text-white">Request Cross-Platform Reviews</h3>
              </div>
              <p className="text-white/90 mb-4">
                Send the personalized prompt page to each customer, asking them to either update their existing review 
                or share their experience on a different platform (Yelp, Facebook, industry-specific sites, etc.).
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white/90">Update Google review</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
                  <MessageCircle className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white/90">Post on Facebook</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white/90">Review on Yelp</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Example */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Real Example</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Original Google Review:</h3>
              <div className="bg-white/5 rounded-lg p-4 border-l-4 border-yellow-400">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-yellow-400">★★★★★</span>
                  <span className="text-white/80 text-sm">Sarah M. - 2 months ago</span>
                </div>
                <p className="text-white/90 italic">
                  "Amazing service! The team was professional and completed our kitchen renovation on time and under budget. 
                  The quality is outstanding and they really listened to our vision. Highly recommend!"
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Double-Dip Email/Text Message:</h3>
              <div className="bg-white/5 rounded-lg p-4 border-l-4 border-blue-400">
                <h4 className="text-white font-semibold mb-2">Hi Sarah!</h4>
                <p className="text-white/90 mb-3">
                  Thank you for your wonderful Google review of our kitchen renovation work that you provided a few months ago!
                </p>
                <p className="text-white/90 mb-3">
                  We're trying to grow our web presence on Facebook and we would love it if you could share your experience there as well. 
                  If you click this <span className="text-blue-300 underline">LINK</span> you will see I provided your original review 
                  (which you can edit or rewrite with the AI button).
                </p>
                <div className="bg-blue-500/20 rounded px-3 py-2 inline-block mb-3">
                  <span className="text-blue-300 font-mono text-sm">https://promptreviews.app/r/kitchen-reno-sarah</span>
                </div>
                <p className="text-white/90 mb-3">
                  Then just click "Copy & submit" and you will be redirected to Facebook where you can post the review. 
                  Easy as that! We really appreciate your support.
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">What Sarah Sees on the Prompt Page:</h3>
              <div className="bg-white/5 rounded-lg p-4 border-l-4 border-green-400">
                <div className="bg-white/10 rounded-lg p-3 mb-3">
                  <p className="text-xs text-white/70 mb-2">YOUR IMPORTED GOOGLE REVIEW:</p>
                  <div className="border border-white/20 rounded bg-white/5 p-3">
                    <p className="text-white/90 italic">
                      "Amazing service! The team was professional and completed our kitchen renovation on time and under budget. 
                      The quality is outstanding and they really listened to our vision. Highly recommend!"
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-3 mb-3">
                  <button className="bg-blue-500/20 border border-blue-400/50 text-blue-300 px-4 py-2 rounded-lg text-sm">
                    📋 Copy & Submit to Facebook
                  </button>
                  <button className="bg-purple-500/20 border border-purple-400/50 text-purple-300 px-4 py-2 rounded-lg text-sm">
                    🤖 AI-Generate New Version
                  </button>
                </div>
                
                <p className="text-white/80 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400 inline mr-1" />
                  Your review is pre-filled and ready to post. Choose any option above!
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-white/80 text-sm">
                <strong>Result:</strong> Sarah updates her Google review with additional details AND posts a new review on Yelp, 
                effectively doubling your review presence from one satisfied customer.
              </p>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Best Practices</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Offer Multiple Options</h3>
              <p className="text-white/80 text-sm mb-4">
                Give customers a choice of platforms to review on. Not everyone has accounts on all platforms, so offering 
                2-3 options increases your success rate.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Include Facebook, Yelp, and an industry-specific site. Let them choose what's easiest for them.
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Be Specific</h3>
              <p className="text-white/80 text-sm mb-4">
                Reference specific details from their original review. Show them you remember and value their feedback.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Personalization increases response rates by up to 50%.
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Make it Easy</h3>
              <p className="text-white/80 text-sm mb-4">
                Provide clear instructions and multiple platform options. Don't make them choose—offer several alternatives.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Include direct links to the platforms you want reviews on.
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Show Appreciation</h3>
              <p className="text-white/80 text-sm mb-4">
                Always thank them for their original review and explain how it helped your business. Make them feel valued.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Gratitude builds stronger relationships and increases willingness to help.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced: Triple-Dip */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Advanced: The Triple-Dip</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-purple-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Taking It to the Next Level</h3>
              <p className="text-white/90">
                Once you've mastered the Double-Dip, you can attempt the Triple-Dip: asking customers to share their experience 
                on a third platform or in a different format (like a video testimonial or case study).
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-blue-300">1</span>
                </div>
                <p className="text-white/80 text-sm">Google Review</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-green-300">2</span>
                </div>
                <p className="text-white/80 text-sm">Yelp/Facebook</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-purple-300">3</span>
                </div>
                <p className="text-white/80 text-sm">Video/Testimonial</p>
              </div>
            </div>
            
            <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
              <p className="text-white/90 text-center">
                <strong>Triple-Dip Challenge:</strong> If you successfully get a customer to review on three different platforms, 
                you've achieved the rare Triple-Dip! 🎉
              </p>
            </div>
          </div>
        </div>

        {/* The Quadruple-Dip */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-purple-300">4</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">The Legendary Quadruple-Dip</h2>
              <p className="text-white/90 mb-6">
                The mythical Quadruple-Dip: when a customer reviews on four different platforms or formats. 
                This is the holy grail of review collection—so rare that we want to hear about it!
              </p>
              
              <div className="bg-white/10 rounded-lg p-4 mb-6">
                <p className="text-white/90 text-sm">
                  <strong>Quadruple-Dip Achievement:</strong> Google Review → Yelp → Facebook → Video Testimonial
                </p>
              </div>
              
              <p className="text-white/90 font-semibold">
                🏆 If anyone successfully achieves a Quadruple-Dip, we want to hear about it! 
                Share your success story with our team.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-white/20">
          <div className="flex-1">
            <Link
              href="/strategies"
              className="inline-flex items-center space-x-2 px-4 py-2 text-white/80 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous: Strategies</span>
            </Link>
          </div>
          
          <div className="flex-1 text-center">
            <span className="text-sm text-white/60">Strategy 1 of 6</span>
          </div>
          
          <div className="flex-1 text-right">
            <Link
              href="/strategies/reciprocity"
              className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <span>Next: Reciprocity</span>
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
