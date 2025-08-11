import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../../docs-layout'
import PageHeader from '../../components/PageHeader'
import { 
  Lightbulb, 
  ArrowRight, 
  ArrowLeft,
  Star,
  MessageSquare,
  FileText,
  Users,
  CheckCircle,
  Sparkles,
  TrendingUp
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Review Writing Help: Templates, Examples & Tips for Customers',
  description: 'Learn how to help customers write better reviews without AI. Use templates, examples, and tips to improve review quality and increase response rates.',
  keywords: [
    'review writing help',
    'review templates for customers',
    'review examples for customers',
    'help customers write reviews',
    'review writing tips',
    'review templates examples',
    'how to help customers write reviews'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/strategies/non-ai-strategies',
  },
}

// JSON-LD structured data
const pageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Non-AI Review Strategies',
  description: 'How to help customers write better reviews using kickstarters, templates, and other non-AI techniques',
  image: 'https://docs.promptreviews.com/images/non-ai-strategies.jpg',
  estimatedCost: {
    '@type': 'MonetaryAmount',
    currency: 'USD',
    value: '0.00',
  },
  supply: [
    {
      '@type': 'HowToSupply',
      name: 'Review Templates',
    },
    {
      '@type': 'HowToSupply',
      name: 'Customer Examples',
    },
    {
      '@type': 'HowToSupply',
      name: 'Prompt Reviews Account',
    },
  ],
  step: [
    {
      '@type': 'HowToStep',
      name: 'Create Review Kickstarters',
      text: 'Provide customers with starting points and examples to help them write reviews',
    },
    {
      '@type': 'HowToStep',
      name: 'Use Recent Reviews as Examples',
      text: 'Show customers what good reviews look like from similar experiences',
    },
    {
      '@type': 'HowToStep',
      name: 'Provide Personalized Templates',
      text: 'Give customers structured templates that make review writing easier',
    },
  ],
}

export default function NonAIStrategiesPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' },
            { label: 'Strategies', href: '/strategies' }
          ]}
          currentPage="Non-AI Strategies"
          categoryLabel="Review Collection"
          categoryIcon={Lightbulb}
          categoryColor="yellow"
          title="Review writing help"
          description="Learn how to help customers write better reviews without AI. Use templates, examples, and tips to improve review quality and increase response rates."
        />

        {/* Strategy Overview */}
        <div className="mb-12">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="text-center mb-8">
              <Lightbulb className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
                             <h2 className="text-2xl font-bold text-white mb-4">How to Help Customers Write Better Reviews</h2>
               <p className="text-white/90 text-lg">
                 While AI is powerful, sometimes the best way to help customers write reviews is through simple, 
                 human-centered approaches. These review writing help strategies provide structure, examples, and guidance without 
                 relying on artificial intelligence.
               </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Review Kickstarters</h3>
                <p className="text-white/80 text-sm">
                  Provide starting points and prompts to help customers begin their review
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-blue-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Recent Examples</h3>
                <p className="text-white/80 text-sm">
                  Show customers what good reviews look like from similar experiences
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-green-300" />
                </div>
                <h3 className="font-semibold text-white mb-2">Personalized Templates</h3>
                <p className="text-white/80 text-sm">
                  Give customers structured templates that make review writing easier
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Non-AI Strategies Work */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Why Non-AI Strategies Work</h2>
          
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Lower the Barrier</h3>
                  <p className="text-white/90 mb-4">
                    Many customers want to leave reviews but don't know where to start. Non-AI strategies provide 
                    the structure and examples they need to overcome writer's block and get started.
                  </p>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-white/80">
                      <strong>Pro tip:</strong> Even bullet points instead of full reviews can be incredibly valuable for your business.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Human Connection</h3>
                  <p className="text-white/90 mb-4">
                    Non-AI strategies feel more personal and authentic. Customers appreciate the human touch and 
                    are more likely to engage with content that feels genuine rather than automated.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-2">Benefits:</h4>
                      <ul className="text-white/80 space-y-1">
                        <li>• More authentic customer voice</li>
                        <li>• Personal touch and connection</li>
                        <li>• Higher trust and engagement</li>
                        <li>• Better customer relationships</li>
                      </ul>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-2">When to Use:</h4>
                      <ul className="text-white/80 space-y-1">
                        <li>• Customers prefer human interaction</li>
                        <li>• You want authentic customer voice</li>
                        <li>• Building personal relationships</li>
                        <li>• AI isn't available or preferred</li>
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
                  <h3 className="text-xl font-semibold text-white mb-2">Proven Effectiveness</h3>
                  <p className="text-white/90 mb-4">
                    These strategies have been used successfully for decades. They're simple, reliable, and 
                    don't require complex technology or algorithms to work effectively.
                  </p>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-white/80">
                      <strong>Pro tip:</strong> Sometimes the simplest solutions are the most effective. Don't overcomplicate what works.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy 1: Review Kickstarters */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Strategy 1: Review Kickstarters</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="text-center mb-8">
              <Sparkles className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-4">What are Review Kickstarters?</h3>
              <p className="text-white/90">
                Review kickstarters are prompts, questions, or starting points that help customers begin writing their review. 
                They provide structure and inspiration without being overly prescriptive.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-white mb-3">Example Kickstarters:</h4>
                <ul className="space-y-3 text-white/80">
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>"What was the best part of your experience with us?"</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>"How did our service solve your problem?"</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>"What would you tell a friend about us?"</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>"What surprised you most about our service?"</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>"How did we exceed your expectations?"</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-3">How to Use:</h4>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <h5 className="font-semibold text-white mb-2">In Prompt Pages:</h5>
                    <p className="text-white/80 text-sm">
                      Include 2-3 kickstarter questions in your prompt page to give customers multiple starting points.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <h5 className="font-semibold text-white mb-2">In Follow-up Emails:</h5>
                    <p className="text-white/80 text-sm">
                      Send kickstarter questions to customers who haven't left reviews yet.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <h5 className="font-semibold text-white mb-2">In Person:</h5>
                    <p className="text-white/80 text-sm">
                      Ask kickstarter questions during follow-up calls or in-person interactions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy 2: Recent Reviews as Examples */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Strategy 2: Recent Reviews as Examples</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="text-center mb-8">
              <Star className="w-16 h-16 text-blue-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-4">Show Customers What Good Reviews Look Like</h3>
              <p className="text-white/90">
                Share recent, high-quality reviews from similar customers to show what makes a great review and 
                inspire others to write their own.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white/5 rounded-lg p-6">
                <h4 className="font-semibold text-white mb-4">Example Review to Share:</h4>
                <div className="bg-white/10 rounded-lg p-4 border-l-4 border-blue-400">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-blue-400">★★★★★</span>
                    <span className="text-white/80 text-sm">Recent Customer - 2 weeks ago</span>
                  </div>
                  <p className="text-white/90 italic">
                    "I was hesitant about hiring a contractor for our kitchen remodel, but this team exceeded all expectations. 
                    They were professional, on time, and the quality of work is outstanding. The project manager kept us updated 
                    every step of the way, and they finished on schedule and under budget. The attention to detail is incredible 
                    - they even noticed and fixed a small issue we hadn't mentioned. I would absolutely recommend them to anyone 
                    looking for quality work and great service."
                  </p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-3">What Makes This Review Great:</h4>
                  <ul className="space-y-2 text-white/80 text-sm">
                    <li>• Specific details about the experience</li>
                    <li>• Mentions of professionalism and quality</li>
                    <li>• Addresses common concerns (timing, budget)</li>
                    <li>• Shows attention to detail</li>
                    <li>• Includes a clear recommendation</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-white mb-3">How to Use Examples:</h4>
                  <ul className="space-y-2 text-white/80 text-sm">
                    <li>• Share in follow-up emails</li>
                    <li>• Include in prompt pages</li>
                    <li>• Post on social media</li>
                    <li>• Use in customer conversations</li>
                    <li>• Feature on your website</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy 3: Personalized Templates */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Strategy 3: Personalized Templates</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="text-center mb-8">
              <FileText className="w-16 h-16 text-green-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-4">Provide Structure Without Being Generic</h3>
              <p className="text-white/90">
                Create personalized templates that give customers a framework for writing reviews while maintaining 
                their authentic voice and specific experience.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white/5 rounded-lg p-6">
                <h4 className="font-semibold text-white mb-4">Template Example:</h4>
                <div className="bg-white/10 rounded-lg p-4 border-l-4 border-green-400">
                  <p className="text-white/90 text-sm mb-3">
                    <strong>Hi [Customer Name],</strong>
                  </p>
                  <p className="text-white/90 text-sm mb-3">
                    We're so glad you chose us for your [specific service]. Here's a simple template to help you write your review:
                  </p>
                  <div className="bg-white/5 rounded-lg p-3 mb-3">
                    <p className="text-white/80 text-sm">
                      <strong>Your Experience:</strong><br/>
                      • What service did you receive?<br/>
                      • What was the best part?<br/>
                      • How did we solve your problem?<br/>
                      • What surprised you most?<br/>
                      • Would you recommend us to others?
                    </p>
                  </div>
                  <p className="text-white/90 text-sm">
                    Feel free to use this as a starting point or write your review however feels most natural to you!
                  </p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-3">Template Best Practices:</h4>
                  <ul className="space-y-2 text-white/80 text-sm">
                    <li>• Keep it simple and flexible</li>
                    <li>• Use bullet points for easy scanning</li>
                    <li>• Include specific details about their service</li>
                    <li>• Encourage authentic voice</li>
                    <li>• Make it optional, not required</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-white mb-3">When to Use Templates:</h4>
                  <ul className="space-y-2 text-white/80 text-sm">
                    <li>• Customers ask for help writing</li>
                    <li>• Complex or technical services</li>
                    <li>• First-time review writers</li>
                    <li>• Customers who seem stuck</li>
                    <li>• High-value customers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bullet Points Strategy */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">The Power of Bullet Points</h2>
          
          <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-8">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-4">Sometimes Less is More</h3>
              <p className="text-white/90">
                Don't underestimate the value of simple bullet points. Many customers prefer to share quick thoughts 
                rather than write lengthy reviews, and that's perfectly fine!
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-white mb-3">Bullet Point Examples:</h4>
                <div className="bg-white/10 rounded-lg p-4">
                  <ul className="space-y-2 text-white/80 text-sm">
                    <li>• Professional and on time</li>
                    <li>• Great communication throughout</li>
                    <li>• Quality work exceeded expectations</li>
                    <li>• Fair pricing and honest estimates</li>
                    <li>• Would definitely recommend</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-3">Why Bullet Points Work:</h4>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li>• Lower barrier to entry</li>
                  <li>• Easy to scan and read</li>
                  <li>• Highlight key points quickly</li>
                  <li>• Perfect for mobile users</li>
                  <li>• Still valuable for SEO and reputation</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-white/90 font-semibold">
                <strong>Pro tip:</strong> Even bullet points instead of full reviews can be incredibly valuable to your business!
              </p>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Best Practices</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Keep It Simple</h3>
              <p className="text-white/80 text-sm mb-4">
                Don't overwhelm customers with too many options or complex instructions. Simple, clear guidance works best.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Offer 2-3 options maximum to avoid decision paralysis.
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Make It Optional</h3>
              <p className="text-white/80 text-sm mb-4">
                Always present these strategies as helpful suggestions, not requirements. Let customers choose what works for them.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> "Feel free to use this as a starting point" works better than "Use this template."
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Personalize Everything</h3>
              <p className="text-white/80 text-sm mb-4">
                Customize kickstarters, examples, and templates to match each customer's specific experience and service.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Reference specific details from their service in your suggestions.
                </p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Follow Up Personally</h3>
              <p className="text-white/80 text-sm mb-4">
                When customers use these strategies, thank them personally and acknowledge their effort.
              </p>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/70">
                  <strong>Pro tip:</strong> Personal acknowledgment encourages future engagement.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-white/20">
          <div className="flex-1">
            <Link
              href="/strategies/personal-outreach"
              className="inline-flex items-center space-x-2 px-4 py-2 text-white/80 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous: Personal Outreach</span>
            </Link>
          </div>
          
          <div className="flex-1 text-center">
            <span className="text-sm text-white/60">Strategy 4 of 6</span>
          </div>
          
          <div className="flex-1 text-right">
            <Link
              href="/strategies/novelty"
              className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <span>Next: Novelty Factor</span>
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
