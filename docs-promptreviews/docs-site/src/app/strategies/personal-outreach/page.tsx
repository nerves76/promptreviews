import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../../docs-layout'
import PageHeader from '../../components/PageHeader'
import { 
  Users, 
  ArrowRight, 
  ArrowLeft,
  MessageCircle,
  Heart,
  Star,
  TrendingUp,
  UserCheck,
  Mail,
  Phone,
  Smile
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Personal vs Mass Marketing for Reviews: Which Gets Better Results?',
  description: 'Discover why personal customer outreach gets more reviews than mass marketing. Learn how one-on-one connections build trust and loyalty for better review collection.',
  keywords: [
    'personal vs mass marketing for reviews',
    'personal customer outreach',
    'one-on-one marketing reviews',
    'mass marketing vs personal outreach',
    'which gets more reviews',
    'personal outreach vs mass marketing',
    'customer relationship building for reviews'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/strategies/personal-outreach',
  },
}

// JSON-LD structured data
const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Personal Outreach Strategy',
  description: 'How to use one-on-one connections to build trust and collect authentic customer reviews',
  image: 'https://docs.promptreviews.com/images/personal-outreach-strategy.jpg',
  estimatedCost: {
    '@type': 'MonetaryAmount',
    currency: 'USD',
    value: '0.00',
  },
  supply: [
    {
      '@type': 'HowToSupply',
      name: 'Customer Database',
    },
    {
      '@type': 'HowToSupply',
      name: 'Personal Touch',
    },
    {
      '@type': 'HowToSupply',
      name: 'Prompt Reviews Account',
    },
  ],
  step: [
    {
      '@type': 'HowToStep',
      name: 'Build Personal Connections',
      text: 'Create genuine one-on-one relationships with your customers',
    },
    {
      '@type': 'HowToStep',
      name: 'Understand Individual Needs',
      text: 'Learn about each customer\'s specific situation and preferences',
    },
    {
      '@type': 'HowToStep',
      name: 'Make Personal Requests',
      text: 'Ask for reviews in a way that feels personal and meaningful',
    },
  ],
}

export default function PersonalOutreachPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' },
            { label: 'Strategies', href: '/strategies' }
          ]}
          currentPage="Personal Outreach"
          categoryLabel="Review Collection"
          categoryIcon={Users}
          categoryColor="green"
          title="Personal vs mass marketing for reviews"
          description="Discover why personal customer outreach gets more reviews than mass marketing. Learn how one-on-one connections build trust and loyalty."
        />

        {/* Strategy Overview */}
        <div className="mb-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="text-center mb-8">
              <Users className="w-16 h-16 text-green-300 mx-auto mb-4" />
                             <h2 className="text-2xl font-bold text-white mb-4">Personal vs Mass Marketing: Which Gets More Reviews?</h2>
               <p className="text-white/90 text-lg">
                 Personal customer outreach is the art of connecting with customers on an individual level rather than treating them 
                 as part of a mass audience. It's about building genuine relationships that lead to trust, loyalty, and 
                 authentic word-of-mouth recommendations.
               </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <UserCheck className="w-6 h-6 text-green-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Individual Connection</h3>
                <p className="text-white/80 text-sm">
                  Treat each customer as a unique person with specific needs and preferences
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-yellow-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Build Trust</h3>
                <p className="text-white/80 text-sm">
                  Create genuine relationships that go beyond transactional interactions
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-6 h-6 text-purple-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Word of Mouth</h3>
                <p className="text-white/80 text-sm">
                  Satisfied customers become your best advocates and referral sources
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Personal Outreach Works */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Why Personal Outreach Works</h2>
          
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-green-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Higher Response Rates</h3>
                  <p className="text-white/90 mb-4">
                    Personal outreach typically achieves 3-5x higher response rates than mass marketing. When someone feels 
                    personally addressed and valued, they're much more likely to respond positively to your requests.
                  </p>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-white/80">
                      <strong>Pro tip:</strong> Personalization can increase response rates by up to 50% compared to generic mass communications.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Builds Genuine Relationships</h3>
                  <p className="text-white/90 mb-4">
                    Personal outreach creates authentic connections that go beyond business transactions. When customers feel 
                    seen and understood, they develop loyalty that lasts far longer than any promotional offer.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-2">Relationship Benefits:</h4>
                      <ul className="text-white/80 space-y-1">
                        <li>• Increased customer lifetime value</li>
                        <li>• Higher retention rates</li>
                        <li>• More referrals and recommendations</li>
                        <li>• Better understanding of customer needs</li>
                      </ul>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-2">Trust Building:</h4>
                      <ul className="text-white/80 space-y-1">
                        <li>• Customers feel valued and heard</li>
                        <li>• Creates emotional connection</li>
                        <li>• Reduces customer churn</li>
                        <li>• Increases brand loyalty</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Creates Word-of-Mouth Marketing</h3>
                  <p className="text-white/90 mb-4">
                    Satisfied customers who feel personally connected to your business become your best advocates. They don't 
                    just leave reviews—they actively recommend you to friends, family, and colleagues.
                  </p>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-white/80">
                      <strong>Pro tip:</strong> Personal relationships create the most powerful form of marketing: authentic word-of-mouth recommendations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personal vs Mass Marketing */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Personal vs. Mass Marketing</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <UserCheck className="w-5 h-5 mr-2 text-green-300" />
                  Personal Outreach
                </h3>
                <ul className="space-y-3 text-white/80">
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Higher response rates (3-5x better)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Builds genuine relationships</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Creates word-of-mouth marketing</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Higher customer lifetime value</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>More authentic reviews</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Better customer insights</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-red-300" />
                  Mass Marketing
                </h3>
                <ul className="space-y-3 text-white/80">
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Lower response rates</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Transactional relationships</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Limited word-of-mouth</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Higher customer churn</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Generic, less authentic reviews</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Limited customer insights</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* How to Implement */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How to Implement Personal Outreach</h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
                <h3 className="text-xl font-semibold text-white">Know Your Customers</h3>
              </div>
              <p className="text-white/90 mb-4">
                Start by understanding each customer as an individual. Collect and remember personal details, preferences, 
                and their specific situation.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">Information to Track:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• Name and family details</li>
                    <li>• Previous interactions</li>
                    <li>• Preferences and needs</li>
                    <li>• Important dates</li>
                    <li>• Communication preferences</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-2">Tools to Use:</h4>
                  <ul className="text-white/80 space-y-1">
                    <li>• CRM system</li>
                    <li>• Customer notes</li>
                    <li>• Interaction history</li>
                    <li>• Preference tracking</li>
                    <li>• Follow-up reminders</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
                <h3 className="text-xl font-semibold text-white">Choose the Right Channel</h3>
              </div>
              <p className="text-white/90 mb-4">
                Different customers prefer different communication methods. Use their preferred channel to make the connection 
                feel more personal and natural.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-6 h-6 text-yellow-300" />
                  </div>
                  <h4 className="font-semibold text-white mb-2">Email</h4>
                  <p className="text-white/80 text-sm">
                    Personalized emails with specific details about their experience
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Phone className="w-6 h-6 text-green-300" />
                  </div>
                  <h4 className="font-semibold text-white mb-2">Phone</h4>
                  <p className="text-white/80 text-sm">
                    Direct calls for high-value customers or complex situations
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-6 h-6 text-purple-300" />
                  </div>
                  <h4 className="font-semibold text-white mb-2">Text/SMS</h4>
                  <p className="text-white/80 text-sm">
                    Quick, personal messages for immediate connection
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
                <h3 className="text-xl font-semibold text-white">Make Personal Requests</h3>
              </div>
              <p className="text-white/90 mb-4">
                When asking for reviews, make it personal and meaningful. Reference specific details about their experience 
                and explain why their feedback matters to you personally.
              </p>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Personal Request Example:</h4>
                  <p className="text-white/80 text-sm italic">
                    "Hi Sarah, I wanted to personally thank you for choosing us for your kitchen renovation. I remember how 
                    excited you were about the new countertops, and I'm so glad we could make your vision come to life. 
                    Your feedback would mean a lot to our team and would help other families find the right contractor for 
                    their projects. Would you mind sharing your experience on Google?"
                  </p>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Generic Request (Avoid):</h4>
                  <p className="text-white/80 text-sm italic">
                    "Please leave us a review on Google. Your feedback is important to us."
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
              <h3 className="font-semibold text-white mb-3">Be Authentic</h3>
              <p className="text-white/80 text-sm mb-4">
                Personal outreach only works when it's genuine. Don't fake personalization—truly care about your customers 
                and their experiences.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Authentic care is contagious and creates lasting relationships.
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Respect Their Time</h3>
              <p className="text-white/80 text-sm mb-4">
                Personal doesn't mean intrusive. Respect their communication preferences and timing. Don't overwhelm them.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Quality over quantity—better to have fewer, more meaningful interactions.
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Follow Up Personally</h3>
              <p className="text-white/80 text-sm mb-4">
                When customers do leave reviews, respond personally. Thank them by name and reference specific details 
                from their review.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Personal follow-ups strengthen the relationship and encourage future engagement.
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Scale Thoughtfully</h3>
              <p className="text-white/80 text-sm mb-4">
                Personal outreach takes more time, so focus on your most valuable customers first. Use tools to help 
                you remember details and stay organized.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Start with your top 20% of customers and expand from there.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Story */}
        <div className="mb-12">
          <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-8">
            <div className="text-center mb-6">
              <Smile className="w-16 h-16 text-green-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Success Story: Local Dental Practice</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">The Challenge:</h3>
                <p className="text-white/90 text-sm mb-4">
                  A dental practice was struggling with low review response rates despite having satisfied patients. 
                  They were sending generic mass emails asking for reviews.
                </p>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>• 5% response rate on mass emails</li>
                  <li>• Generic, impersonal requests</li>
                  <li>• No personal connection with patients</li>
                  <li>• Low patient engagement</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">The Solution:</h3>
                <p className="text-white/90 text-sm mb-4">
                  They implemented personal outreach by having the dentist personally call patients after procedures 
                  and send personalized follow-up messages.
                </p>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>• 35% response rate on personal outreach</li>
                  <li>• Personalized messages with patient details</li>
                  <li>• Stronger patient relationships</li>
                  <li>• Increased referrals and loyalty</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-white/90 font-semibold">
                "Personal outreach transformed our practice. Patients feel valued and heard, and they're much more 
                likely to share their positive experiences with others." - Dr. Sarah Johnson
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-white/20">
          <div className="flex-1">
            <Link
              href="/strategies/reciprocity"
              className="inline-flex items-center space-x-2 px-4 py-2 text-white/80 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous: Reciprocity</span>
            </Link>
          </div>
          
          <div className="flex-1 text-center">
            <span className="text-sm text-white/60">Strategy 3 of 6</span>
          </div>
          
          <div className="flex-1 text-right">
            <Link
              href="/strategies/non-ai-strategies"
              className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <span>Next: Non-AI Strategies</span>
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
