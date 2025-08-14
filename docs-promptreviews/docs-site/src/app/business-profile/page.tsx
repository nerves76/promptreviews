import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../docs-layout';
import PageHeader from '../components/PageHeader';
import { Building, Upload, Image, Info, Users, Star, Share, FileText, Brain, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Business Profile Setup Guide | Prompt Reviews',
  description: 'Complete guide to setting up and optimizing your business profile in Prompt Reviews for better AI-generated reviews and customer engagement.',
  keywords: 'business profile, company information, branding, logo upload, AI optimization, prompt reviews',
};

export default function BusinessProfilePage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' }
          ]}
          currentPage="Business Profile"
          categoryLabel="Configuration"
          categoryIcon={Building}
          categoryColor="blue"
          title="Business profile setup"
          description="Create a comprehensive business profile that powers AI-generated content and provides essential information across all your prompt pages."
        />

        {/* Plan Indicator */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-white/60">Available on:</span>
            <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full font-medium">Grower</span>
            <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full font-medium">Builder</span>
            <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full font-medium">Maven</span>
          </div>
        </div>

        {/* Why Business Profile Matters */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Why Your Business Profile Matters</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <p className="text-white/90 mb-6">
              Your business profile is the foundation of your Prompt Reviews experience. It provides crucial information 
              that our AI uses to generate authentic, personalized review content and helps customers connect with your brand.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <Brain className="w-8 h-8 text-purple-300 mb-2" />
                <h4 className="text-sm font-semibold text-white mb-1">AI Optimization</h4>
                <p className="text-xs text-white/70">Powers personalized content</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <Star className="w-8 h-8 text-yellow-300 mb-2" />
                <h4 className="text-sm font-semibold text-white mb-1">Better Reviews</h4>
                <p className="text-xs text-white/70">More authentic feedback</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <Building className="w-8 h-8 text-blue-300 mb-2" />
                <h4 className="text-sm font-semibold text-white mb-1">Brand Consistency</h4>
                <p className="text-xs text-white/70">Unified presence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Sections */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Profile Sections</h2>
          
          <div className="space-y-6">
            {/* Logo Section */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <Image className="w-6 h-6 text-blue-300 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Logo Upload</h3>
                  <p className="text-white/80 mb-4">
                    Your logo appears on prompt pages, review widgets, and QR code templates.
                  </p>
                  
                  <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-white mb-2">Logo Requirements:</h4>
                    <ul className="space-y-1 text-white/80 text-sm">
                      <li>• <strong>Formats:</strong> PNG, JPG, or WebP</li>
                      <li>• <strong>Size:</strong> Maximum 10MB</li>
                      <li>• <strong>Recommended:</strong> 1200x1200px for print quality</li>
                      <li>• <strong>Optimization:</strong> Automatically creates web and print versions</li>
                    </ul>
                  </div>
                  
                  <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-4">
                    <p className="text-sm text-white/80">
                      <strong>Pro Tip:</strong> Upload a square logo for best results. The built-in cropper lets you 
                      adjust positioning after upload.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Info Section */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <Info className="w-6 h-6 text-green-300 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Business Information</h3>
                  <p className="text-white/80 mb-4">
                    Core details about your business that appear across the platform.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-1">Basic Info</h4>
                      <ul className="space-y-1 text-white/80 text-sm">
                        <li>• <strong>Business Name:</strong> Your official business name</li>
                        <li>• <strong>Website:</strong> Your main website URL</li>
                        <li>• <strong>Phone:</strong> Primary contact number</li>
                        <li>• <strong>Email:</strong> Business email address</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-1">Address</h4>
                      <ul className="space-y-1 text-white/80 text-sm">
                        <li>• Complete physical address</li>
                        <li>• City and state (used by AI for local context)</li>
                        <li>• ZIP code and country</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-1">Industry</h4>
                      <ul className="space-y-1 text-white/80 text-sm">
                        <li>• Select your primary industry</li>
                        <li>• Choose B2B, B2C, or Both</li>
                        <li>• Specify industries you serve (if B2B)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Section */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <Users className="w-6 h-6 text-purple-300 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Services & Offerings</h3>
                  <p className="text-white/80 mb-4">
                    List your products or services to help AI generate relevant review content.
                  </p>
                  
                  <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Examples:</h4>
                    <ul className="space-y-1 text-white/80 text-sm">
                      <li>• Restaurant: "Dine-in", "Takeout", "Catering", "Private Events"</li>
                      <li>• Salon: "Haircuts", "Color Services", "Styling", "Treatments"</li>
                      <li>• Consultant: "Strategy", "Implementation", "Training", "Audits"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Unique Value Section */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <Star className="w-6 h-6 text-yellow-300 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">What Makes You Unique</h3>
                  <p className="text-white/80 mb-4">
                    Help AI understand your competitive advantages and brand personality.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-1">About Us</h4>
                      <p className="text-white/80 text-sm">
                        Your story, mission, and what customers should know about you.
                      </p>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-1">Differentiators</h4>
                      <p className="text-white/80 text-sm">
                        Unique selling points that set you apart from competitors.
                      </p>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-1">Years in Business</h4>
                      <p className="text-white/80 text-sm">
                        Establishes credibility and experience level.
                      </p>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-1">Taglines</h4>
                      <p className="text-white/80 text-sm">
                        Memorable phrases that capture your brand essence.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Optimization Section */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <Brain className="w-6 h-6 text-pink-300 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">AI Optimization</h3>
                  <p className="text-white/80 mb-4">
                    Fine-tune how AI generates review content for your business.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-1">Keywords</h4>
                      <p className="text-white/80 text-sm mb-2">
                        Important phrases you want in reviews for SEO and discovery.
                      </p>
                      <p className="text-white/60 text-xs italic">
                        Example: "best coffee in Seattle", "organic ingredients", "family-owned"
                      </p>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-1">AI Dos</h4>
                      <p className="text-white/80 text-sm mb-2">
                        Things you want AI to emphasize or mention.
                      </p>
                      <p className="text-white/60 text-xs italic">
                        Example: "Mention our 24/7 support", "Highlight eco-friendly practices"
                      </p>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-1">AI Don'ts</h4>
                      <p className="text-white/80 text-sm mb-2">
                        Things to avoid in AI-generated content.
                      </p>
                      <p className="text-white/60 text-xs italic">
                        Example: "Don't mention old location", "Avoid competitor comparisons"
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
                    <p className="text-sm text-white/80">
                      <strong>💡 Tip:</strong> Test and refine these settings over time based on the reviews generated.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Section */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <Share className="w-6 h-6 text-indigo-300 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Social Media Links</h3>
                  <p className="text-white/80 mb-4">
                    Connect your social profiles to display on prompt pages.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/80 text-sm">• Facebook</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/80 text-sm">• Instagram</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/80 text-sm">• LinkedIn</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/80 text-sm">• YouTube</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/80 text-sm">• TikTok</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/80 text-sm">• Pinterest</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Review Platforms Section */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <FileText className="w-6 h-6 text-teal-300 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Review Platforms</h3>
                  <p className="text-white/80 mb-4">
                    Configure where customers can leave reviews for your business.
                  </p>
                  
                  <div className="bg-teal-500/20 border border-teal-400/30 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Platform Setup:</h4>
                    <ul className="space-y-1 text-white/80 text-sm">
                      <li>• Add multiple review platforms (Google, Yelp, Facebook, etc.)</li>
                      <li>• Include direct URLs to your business profiles</li>
                      <li>• Set word count limits for each platform</li>
                      <li>• Platforms become available across all prompt pages</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Best Practices</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <CheckCircle className="w-8 h-8 text-green-300 mb-3" />
              <h3 className="font-semibold text-white mb-2">Complete All Sections</h3>
              <p className="text-white/80 text-sm">
                The more information you provide, the better AI can generate authentic, relevant reviews.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <CheckCircle className="w-8 h-8 text-green-300 mb-3" />
              <h3 className="font-semibold text-white mb-2">Use Specific Keywords</h3>
              <p className="text-white/80 text-sm">
                Include location-based and service-specific keywords for better SEO impact.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <CheckCircle className="w-8 h-8 text-green-300 mb-3" />
              <h3 className="font-semibold text-white mb-2">Update Regularly</h3>
              <p className="text-white/80 text-sm">
                Keep information current, especially services, taglines, and AI preferences.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <CheckCircle className="w-8 h-8 text-green-300 mb-3" />
              <h3 className="font-semibold text-white mb-2">Test AI Output</h3>
              <p className="text-white/80 text-sm">
                Review generated content and refine your AI dos and don'ts accordingly.
              </p>
            </div>
          </div>
        </div>

        {/* Common Questions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Common Questions</h2>
          
          <div className="space-y-4">
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                How does my business profile affect AI-generated reviews?
              </summary>
              <p className="text-white/80 text-sm mt-3">
                The AI uses your business information to create contextually relevant, authentic-sounding reviews. 
                Your keywords, services, and unique value propositions are woven into the content naturally.
              </p>
            </details>
            
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                Can I have different profiles for multiple locations?
              </summary>
              <p className="text-white/80 text-sm mt-3">
                Currently, each account has one business profile. For multiple locations, you can create separate 
                prompt pages with location-specific information.
              </p>
            </details>
            
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                What happens if I don't complete all sections?
              </summary>
              <p className="text-white/80 text-sm mt-3">
                The system will still work, but AI-generated content may be less specific and personalized. 
                We recommend completing at least the basic info and services sections.
              </p>
            </details>
            
            <details className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                How do I optimize for local SEO?
              </summary>
              <p className="text-white/80 text-sm mt-3">
                Include location-specific keywords (city, neighborhood, landmarks), complete your address information, 
                and mention local differentiators in your unique value section.
              </p>
            </details>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Complete Your Profile?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            A complete business profile enhances every aspect of your Prompt Reviews experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard/business-profile"
              className="inline-flex items-center px-6 py-3 bg-white/20 text-white backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
            >
              Go to Business Profile
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link
              href="/prompt-pages"
              className="inline-flex items-center px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              Learn About Prompt Pages
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}