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
  Brain,
  Edit3,
  Shield,
  Target,
  Settings
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI-Assisted Reviews - Human-Controlled, AI-Enhanced | Prompt Reviews Help',
  description: 'Learn how Prompt Reviews uses AI to help create authentic reviews while keeping humans in complete control. Never auto-submits, always requires human approval.',
  keywords: [
    'AI reviews',
    'AI-assisted review generation',
    'human-controlled AI',
    'authentic review creation',
    'Prompty AI assistant',
    'review automation with oversight'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/ai-reviews',
  },
}

const aiFeatures = [
  {
    name: 'Human-First Approach',
    description: 'AI generates, humans decide. Every review requires manual approval before submission.',
    icon: Shield,
    color: 'bg-green-500',
  },
  {
    name: 'Business Intelligence',
    description: 'AI learns your business details, values, and voice to create authentic-sounding reviews.',
    icon: Brain,
    color: 'bg-blue-500',
  },
  {
    name: 'Always Editable',
    description: 'Generated content appears in editable text areas. Change anything, anytime.',
    icon: Edit3,
    color: 'bg-purple-500',
  },
  {
    name: 'Platform Optimization',
    description: 'AI adapts content for Google, Yelp, Facebook, and other review platforms.',
    icon: Target,
    color: 'bg-orange-500',
  },
]

const promptPageTypes = [
  {
    name: 'Universal Pages',
    context: 'General business reviews',
    aiTraining: 'Business profile only',
    bestFor: 'Ongoing review collection',
    icon: Star,
  },
  {
    name: 'Service Pages',
    context: 'Specific services provided',
    aiTraining: 'Business + service + outcomes',
    bestFor: 'Professional services',
    icon: Settings,
  },
  {
    name: 'Product Pages',
    context: 'Specific products sold',
    aiTraining: 'Business + product + experience',
    bestFor: 'E-commerce businesses',
    icon: Target,
  },
  {
    name: 'Employee Pages',
    context: 'Team member highlights',
    aiTraining: 'Business + employee + interaction',
    bestFor: 'Service-based businesses',
    icon: Users,
  },
]

export default function AIReviewsPage() {
  return (
    <>
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Brain className="w-4 h-4" />
          <span>AI-Assisted Reviews</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 text-balance">
          AI-Assisted Reviews: Human-Controlled, AI-Enhanced
        </h1>
        
        <p className="text-xl text-white/90 mb-8 text-balance">
          The best reviews feel real because they are. Prompt Reviews uses AI to help create authentic reviews while keeping you in complete control—no auto-submissions, ever.
        </p>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-12">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-green-300" />
            Our Core Promise
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-white/90">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
              <span>Every AI-generated review requires human approval</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
              <span>All content is fully editable before submission</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
              <span>No automatic submissions to any platform</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
              <span>Humans always have the final say</span>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">How AI-Assisted Reviews Work</h2>
        
        <div className="space-y-8">
          {/* Step 1 */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
              <h3 className="text-xl font-semibold text-white">Business Information Training</h3>
            </div>
            <p className="text-white/90 mb-4">
              Your business profile becomes Prompty's knowledge base. The more details you provide, the more authentic your AI-generated reviews become.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-white mb-2">Essential Details:</h4>
                <ul className="text-sm text-white/80 space-y-1">
                  <li>• Services & expertise you offer</li>
                  <li>• Company values and approach</li>
                  <li>• What makes you different</li>
                  <li>• Years in business</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">AI Instructions:</h4>
                <ul className="text-sm text-white/80 space-y-1">
                  <li>• What to always mention</li>
                  <li>• What to never include</li>
                  <li>• Your preferred tone</li>
                  <li>• Industry keywords</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
              <h3 className="text-xl font-semibold text-white">Contextual Information Layer</h3>
            </div>
            <p className="text-white/90 mb-4">
              Each prompt page adds specific context that makes reviews feel personal and authentic.
            </p>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">Context Includes:</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-white/80">
                <div>
                  <strong>Service Details:</strong>
                  <br />What was provided, outcomes achieved
                </div>
                <div>
                  <strong>Customer Info:</strong>
                  <br />Names, roles, specific needs
                </div>
                <div>
                  <strong>Project Specifics:</strong>
                  <br />Timeline, team members, unique aspects
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
              <h3 className="text-xl font-semibold text-white">Generation with Human Control</h3>
            </div>
            <p className="text-white/90 mb-4">
              When you click "Generate with AI," here's what happens:
            </p>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">AI</div>
                <span className="text-white/90">Analyzes your business profile + contextual information</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">AI</div>
                <span className="text-white/90">Generates a personalized, authentic-sounding review draft</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">👤</div>
                <span className="text-white/90">Presents draft to you for inspection and editing</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">👤</div>
                <span className="text-white/90">You edit, revise, or completely rewrite as needed</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">👤</div>
                <span className="text-white/90">You manually submit to your chosen platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Key Features That Keep You in Control</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {aiFeatures.map((feature) => (
            <div key={feature.name} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className={`inline-flex p-3 rounded-lg ${feature.color} mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.name}</h3>
                  <p className="text-white/80">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prompt Page Types */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Understanding Prompt Page Types</h2>
        
        <div className="bg-white/5 border border-white/20 rounded-xl p-6 mb-8">
          <p className="text-white/90">
            Different prompt page types give AI different levels of context, resulting in more targeted and authentic reviews.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {promptPageTypes.map((type, index) => (
            <div key={type.name} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <type.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{type.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-white">Context: </span>
                      <span className="text-white/80">{type.context}</span>
                    </div>
                    <div>
                      <span className="font-medium text-white">AI Training: </span>
                      <span className="text-white/80">{type.aiTraining}</span>
                    </div>
                    <div>
                      <span className="font-medium text-white">Best For: </span>
                      <span className="text-white/80">{type.bestFor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Training Your AI */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Training Your AI for Better Results</h2>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-300" />
                AI Do's - What to Include
              </h3>
              <div className="space-y-3 text-white/90">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <strong>Example:</strong> "Always mention our 24/7 customer support"
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <strong>Example:</strong> "Highlight our eco-friendly practices"
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <strong>Example:</strong> "Reference our certified technicians"
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-300" />
                AI Don'ts - What to Avoid
              </h3>
              <div className="space-y-3 text-white/90">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <strong>Example:</strong> "Never mention competitors by name"
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <strong>Example:</strong> "Don't reference pricing in reviews"
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <strong>Example:</strong> "Avoid technical jargon"
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Example Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">See AI Training in Action</h2>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Business Profile Example:</h3>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-white/90">
              <strong>Business:</strong> "Green Clean Solutions"<br />
              <strong>Service:</strong> "Eco-friendly carpet cleaning"<br />
              <strong>Values:</strong> "Environmental responsibility, family safety"<br />
              <strong>Differentiator:</strong> "100% non-toxic cleaning products"<br />
              <strong>Experience:</strong> "15 years in business"
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Generated Review Sample:</h3>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-white/90 italic">
              "I've been using Green Clean Solutions for my carpet cleaning needs and couldn't be happier! With 15 years in the business, they really know what they're doing. What I love most is their commitment to environmental responsibility—they use 100% non-toxic cleaning products, which gives me peace of mind with my young children. The family safety aspect was huge for me, and they delivered exactly what they promised. Highly recommend!"
            </div>
          </div>
          
          <div className="mt-4 text-sm text-white/70">
            <strong>Notice how AI wove in:</strong> Business experience (15 years), values (environmental responsibility), differentiator (non-toxic products), and customer context (family with children)
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Try AI-Assisted Reviews?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Start with a solid business profile, then create your first prompt page. Remember: AI suggests, you decide.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/getting-started"
              className="inline-flex items-center space-x-2 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 border border-white/30 transition-colors font-medium backdrop-blur-sm"
            >
              <span>Get Started Guide</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <a
              href="https://promptreviews.com/dashboard"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span>Try It Now</span>
              <Zap className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </>
  )
}