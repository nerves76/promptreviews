import type { Metadata } from 'next'
import Link from 'next/link'
import { 
  CheckCircle, 
  Star, 
  Users, 
  Zap, 
  ArrowRight, 
  Clock,
  AlertCircle,
  QrCode,
  Link2,
  Send,
  Target,
  Settings,
  Calendar,
  Camera,
  Sparkles,
  Copy,
  Share2,
  Gift
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Prompt Pages - Personalized Review Request Pages | Prompt Reviews Help',
  description: 'Learn about Prompt Pages - personalized review request pages that make it easy for happy customers to share their story. Create unique pages for services, products, employees, and events.',
  keywords: [
    'prompt pages',
    'review request pages',
    'personalized review collection',
    'QR code reviews',
    'service review pages',
    'employee review pages',
    'product review pages'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/prompt-pages',
  },
}

const pageTypes = [
  {
    name: 'Universal Prompt Page',
    description: 'Your go-to page for general review collection. Perfect for businesses that want one simple link to share everywhere.',
    icon: Star,
    color: 'bg-blue-500',
    features: ['Works for any customer', 'General business reviews', 'Simple to share', 'Always ready'],
    bestFor: 'Ongoing review collection, business cards, email signatures',
  },
  {
    name: 'Service Prompt Pages',
    description: 'Create a unique page for each service you offer. Customers know exactly what they\'re reviewing.',
    icon: Settings,
    color: 'bg-purple-500',
    features: ['Service-specific context', 'Project details included', 'Team member tracking', 'Outcome highlights'],
    bestFor: 'Professional services, consultants, contractors',
  },
  {
    name: 'Product Prompt Pages',
    description: 'Dedicated pages for products you sell. Perfect for collecting detailed product feedback.',
    icon: Gift,
    color: 'bg-green-500',
    features: ['Product specifications', 'Purchase context', 'Feature highlights', 'Usage experience'],
    bestFor: 'E-commerce, retail, product-based businesses',
  },
  {
    name: 'Employee Prompt Pages',
    description: 'Spotlight your team members with individual review pages. Let customers praise specific people.',
    icon: Users,
    color: 'bg-orange-500',
    features: ['Employee recognition', 'Personal touch', 'Team building', 'Performance tracking'],
    bestFor: 'Service businesses, sales teams, hospitality',
  },
  {
    name: 'Event Prompt Pages',
    description: 'Capture the magic of events with dedicated review pages for each occasion.',
    icon: Calendar,
    color: 'bg-pink-500',
    features: ['Event details', 'Date tracking', 'Attendee context', 'Experience highlights'],
    bestFor: 'Venues, event planners, workshops, conferences',
  },
  {
    name: 'Photo Testimonial Pages',
    description: 'Collect visual testimonials with before/after photos and detailed stories.',
    icon: Camera,
    color: 'bg-indigo-500',
    features: ['Photo uploads', 'Visual proof', 'Story collection', 'Transformation showcase'],
    bestFor: 'Home services, beauty, fitness, renovations',
  },
]

const shareOptions = [
  {
    name: 'QR Codes',
    description: 'Generate unique QR codes for each prompt page. Perfect for in-person interactions.',
    icon: QrCode,
    examples: ['Business cards', 'Receipts', 'Table tents', 'Product packaging'],
  },
  {
    name: 'Direct Links',
    description: 'Simple, shareable URLs that work anywhere online.',
    icon: Link2,
    examples: ['Email signatures', 'Text messages', 'Social media', 'Website buttons'],
  },
  {
    name: 'NFC Tags',
    description: 'Tap-to-review technology for the smoothest experience.',
    icon: Sparkles,
    examples: ['Counter displays', 'Name tags', 'Product tags', 'Vehicle decals'],
  },
  {
    name: 'Email Campaigns',
    description: 'Send personalized review requests to your contact list.',
    icon: Send,
    examples: ['Post-service follow-ups', 'Customer campaigns', 'Event attendees', 'Purchase confirmations'],
  },
]

const keyFeatures = [
  {
    title: 'Personalization That Works',
    description: 'Every prompt page can include customer names, service details, and personal touches that make reviews feel natural.',
    icon: Target,
  },
  {
    title: 'Platform Flexibility',
    description: 'Direct customers to Google, Yelp, Facebook, or any review platform you choose. Smart routing based on their device.',
    icon: Share2,
  },
  {
    title: 'Custom Instructions',
    description: 'Add specific guidance for what customers should mention. Help them tell the story you want told.',
    icon: Sparkles,
  },
  {
    title: 'Instant Creation',
    description: 'Create a new prompt page in seconds. No design skills needed—we handle the beautiful layouts.',
    icon: Clock,
  },
]

export default function PromptPagesPage() {
  return (
    <>
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          <span>Prompt Pages Overview</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 text-balance">
          Prompt Pages: Your Review Collection Superpower
        </h1>
        
        <p className="text-xl text-white/90 mb-8 text-balance">
          Personalized review request pages that make it easy—and even fun—for happy customers to share their story. 
          Create unique pages in seconds, share them anywhere, and watch the five-star reviews roll in.
        </p>

        {/* Prompty's Encouragement */}
        <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-md border border-yellow-300/30 rounded-xl p-6 mb-12">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-6 h-6 text-yellow-300 mt-1" />
            <div>
              <p className="text-white font-medium mb-2">
                💫 Prompty says: "Let's zip-zap your reviews to the tippity-top!"
              </p>
              <p className="text-white/80 text-sm">
                Every prompt page is like a red carpet for your customers—roll it out and watch them share the love!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What Are Prompt Pages */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">What Are Prompt Pages?</h2>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 mb-8">
          <p className="text-white/90 text-lg mb-6">
            Think of prompt pages as personalized landing pages designed for one purpose: making it incredibly easy for customers to leave you a review.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">They're Personal</h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Include customer names and details</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Reference specific services or products</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Highlight team members involved</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">They're Powerful</h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>AI-assisted review generation available</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Direct links to review platforms</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Mobile-optimized for on-the-go reviews</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Types of Prompt Pages */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Six Types of Prompt Pages for Every Situation</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {pageTypes.map((type) => (
            <div key={type.name} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all">
              <div className="flex items-start space-x-4">
                <div className={`${type.color} p-3 rounded-lg flex-shrink-0`}>
                  <type.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{type.name}</h3>
                  <p className="text-white/80 mb-4">{type.description}</p>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-white mb-2">Key Features:</h4>
                    <ul className="text-sm text-white/70 space-y-1">
                      {type.features.map((feature, idx) => (
                        <li key={idx}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium text-yellow-300">Best for: </span>
                    <span className="text-white/70">{type.bestFor}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to Share */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Share Your Prompt Pages Everywhere</h2>
        
        <div className="bg-white/5 border border-white/20 rounded-xl p-6 mb-8">
          <p className="text-white/90">
            The magic happens when you share. Every prompt page comes with multiple sharing options—pick what works for your business.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {shareOptions.map((option) => (
            <div key={option.name} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <option.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">{option.name}</h3>
              </div>
              
              <p className="text-white/80 mb-4">{option.description}</p>
              
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Perfect for:</h4>
                <div className="flex flex-wrap gap-2">
                  {option.examples.map((example, idx) => (
                    <span key={idx} className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded">
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Features */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Features That Make the Difference</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {keyFeatures.map((feature) => (
            <div key={feature.title} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/80">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">How Prompt Pages Work</h2>
        
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
              <h3 className="text-xl font-semibold text-white">Create Your Page</h3>
            </div>
            <p className="text-white/90 mb-4">
              Choose your page type and add details. Include customer names, service info, or any context that makes the review personal.
            </p>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-white/70">
                <strong>Pro tip:</strong> The more specific your prompt page, the more detailed and helpful the reviews you'll receive.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
              <h3 className="text-xl font-semibold text-white">Share Your Link</h3>
            </div>
            <p className="text-white/90 mb-4">
              Get your unique link, QR code, or NFC tag. Share it however works best—email, text, in-person, or on social media.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2 bg-white/5 px-3 py-2 rounded-lg">
                <Copy className="w-4 h-4 text-white/60" />
                <span className="text-sm text-white/80">Copy link</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 px-3 py-2 rounded-lg">
                <QrCode className="w-4 h-4 text-white/60" />
                <span className="text-sm text-white/80">Download QR</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 px-3 py-2 rounded-lg">
                <Send className="w-4 h-4 text-white/60" />
                <span className="text-sm text-white/80">Send email</span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
              <h3 className="text-xl font-semibold text-white">Customer Leaves Review</h3>
            </div>
            <p className="text-white/90 mb-4">
              Your customer lands on a beautiful, personalized page. They can write their own review or use AI assistance to help express their thoughts.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/5 rounded-lg p-3">
                <Star className="w-5 h-5 text-yellow-300 mb-2" />
                <p className="text-white/80">Select rating</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <Sparkles className="w-5 h-5 text-yellow-300 mb-2" />
                <p className="text-white/80">Optional AI help</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <Send className="w-5 h-5 text-yellow-300 mb-2" />
                <p className="text-white/80">Submit to platform</p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-semibold">4</div>
              <h3 className="text-xl font-semibold text-white">Track Your Success</h3>
            </div>
            <p className="text-white/90">
              Monitor which prompt pages generate the most reviews. See conversion rates, track performance, and optimize your approach.
            </p>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Best Practices for Prompt Pages</h2>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Timing Is Everything</h3>
              <ul className="space-y-3 text-white/90">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Share immediately after service completion</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Strike while the experience is fresh</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Follow up within 24-48 hours</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Make It Personal</h3>
              <ul className="space-y-3 text-white/90">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Always include customer names</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Reference specific services or products</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Add a thank you message</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
            <p className="text-white/90 text-sm">
              <strong className="text-yellow-300">Golden Rule:</strong> The easier you make it for customers to leave a review, the more likely they are to do it. Prompt pages remove all the friction.
            </p>
          </div>
        </div>
      </div>

      {/* Success Story */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Real Results from Real Businesses</h2>
        
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <blockquote className="text-white/90 text-lg mb-4 italic">
            "We went from struggling to get 1-2 reviews a month to averaging 15-20. The personalized prompt pages make customers actually want to leave reviews. It's like magic!"
          </blockquote>
          <p className="text-white/70">
            — Sarah M., Local Service Business Owner
          </p>
          
          <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300">10x</div>
              <div className="text-sm text-white/70">More reviews</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300">4.8</div>
              <div className="text-sm text-white/70">Average rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300">73%</div>
              <div className="text-sm text-white/70">Response rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Create Your First Prompt Page?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            It takes less than a minute to create your first prompt page. Start with a universal page, then explore the specialized options.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ai-reviews"
              className="inline-flex items-center space-x-2 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 border border-white/30 transition-colors font-medium backdrop-blur-sm"
            >
              <span>Learn About AI Features</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <a
              href="https://promptreviews.com/dashboard"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span>Create Your First Page</span>
              <Zap className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </>
  )
}