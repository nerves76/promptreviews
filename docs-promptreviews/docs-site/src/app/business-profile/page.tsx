import { Metadata } from 'next';
import DocsLayout from '../docs-layout';
import PageHeader from '../components/PageHeader';
import StandardOverviewLayout from '../components/StandardOverviewLayout';
import { Building, Upload, Image, Info, Users, Star, Share, FileText, Brain, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Business Profile Setup Guide | Prompt Reviews',
  description: 'Complete guide to setting up and optimizing your business profile in Prompt Reviews for better AI-generated reviews and customer engagement.',
  keywords: 'business profile, company information, branding, logo upload, AI optimization, prompt reviews',
};

export default function BusinessProfilePage() {
  // Key features data
  const keyFeatures = [
    {
      icon: Image,
      title: 'Logo & Branding',
      description: 'Upload your logo for consistent branding across prompt pages, review widgets, and QR code templates. Automatic optimization for web and print.',
      link: '#logo-requirements'
    },
    {
      icon: Info,
      title: 'Business Information',
      description: 'Complete business details including name, address, contact info, and industry. Powers AI content generation and builds customer trust.',
      link: '#business-info'
    },
    {
      icon: Users,
      title: 'Services & Offerings',
      description: 'List your products or services to help AI generate relevant, specific review content that resonates with customers.',
      link: '#services'
    },
    {
      icon: Brain,
      title: 'AI Optimization',
      description: 'Fine-tune how AI generates review content with keywords, dos and don\'ts, and personalization preferences.',
      link: '#ai-optimization'
    }
  ];

  // Key points for the overview
  const keyPoints = [
    {
      title: 'Foundation of AI Content',
      description: 'Your business profile powers personalized review generation and customer communications'
    },
    {
      title: 'Consistent Brand Experience',
      description: 'Logo and business details appear across all customer touchpoints for professional consistency'
    },
    {
      title: 'Better Review Quality',
      description: 'More complete profiles lead to more authentic, detailed, and relevant AI-generated reviews'
    },
    {
      title: 'Local SEO Benefits',
      description: 'Business information helps generate location-specific content for better local search performance'
    }
  ];

  // How it works steps
  const howItWorks = (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
          <h3 className="text-xl font-semibold text-white">Complete Basic Information</h3>
        </div>
        <p className="text-white/90 mb-4">
          Add your business name, address, phone number, email, and website. This core information appears on all prompt pages and helps customers trust your business.
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
          <h3 className="text-xl font-semibold text-white">Upload Your Logo & Assets</h3>
        </div>
        <p className="text-white/90 mb-4">
          Upload your logo (PNG, JPG, or WebP up to 10MB). We automatically create web and print versions, and you can adjust positioning with our built-in cropper.
        </p>
        <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">Logo Requirements:</h4>
          <ul className="space-y-1 text-white/80 text-sm">
            <li>• Formats: PNG, JPG, or WebP</li>
            <li>• Maximum size: 10MB</li>
            <li>• Recommended: 1200x1200px for print quality</li>
            <li>• Square format works best</li>
          </ul>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
          <h3 className="text-xl font-semibold text-white">Define Services & Uniqueness</h3>
        </div>
        <p className="text-white/90 mb-4">
          List your services, describe what makes you unique, and add your years in business. This information helps AI create authentic, personalized review content.
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-semibold">4</div>
          <h3 className="text-xl font-semibold text-white">Optimize AI Settings</h3>
        </div>
        <p className="text-white/90 mb-4">
          Add keywords you want in reviews, specify what AI should emphasize or avoid, and set up review platform preferences.
        </p>
        <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
          <p className="text-sm text-white/80">
            <strong>💡 Tip:</strong> Test and refine these settings over time based on the reviews generated.
          </p>
        </div>
      </div>
    </div>
  );

  // Best practices section
  const bestPractices = (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">✓</span>
          Complete All Sections
        </h3>
        <p className="text-white/80 text-sm">
          The more information you provide, the better AI can generate authentic, relevant reviews that resonate with potential customers.
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">✓</span>
          Use Specific Keywords
        </h3>
        <p className="text-white/80 text-sm">
          Include location-based and service-specific keywords for better SEO impact and more targeted review content.
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">✓</span>
          Update Regularly
        </h3>
        <p className="text-white/80 text-sm">
          Keep information current, especially services, taglines, and AI preferences as your business evolves.
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">✓</span>
          Test AI Output
        </h3>
        <p className="text-white/80 text-sm">
          Review generated content regularly and refine your AI dos and don'ts based on results.
        </p>
      </div>
    </div>
  );

  // Custom sections for detailed profile information
  const customSections = (
    <div className="max-w-4xl mx-auto">
      {/* Profile Sections Details */}
      <div className="mb-12" id="profile-sections">
        <h2 className="text-3xl font-bold text-white mb-8">Profile Configuration</h2>

        <div className="space-y-6">
          {/* Business Info Section */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6" id="business-info">
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
                      <li>• Business Name: Your official business name</li>
                      <li>• Website: Your main website URL</li>
                      <li>• Phone: Primary contact number</li>
                      <li>• Email: Business email address</li>
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
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6" id="services">
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

          {/* AI Optimization Section */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6" id="ai-optimization">
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
              </div>
            </div>
          </div>

          {/* Social Media & Platforms */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <Share className="w-6 h-6 text-indigo-300 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Social Media Links</h3>
                  <p className="text-white/80 mb-4">
                    Connect your social profiles to display on prompt pages.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {['Facebook', 'Instagram', 'LinkedIn', 'YouTube', 'TikTok', 'Pinterest'].map(platform => (
                      <div key={platform} className="bg-white/5 rounded-lg p-2">
                        <p className="text-white/80 text-sm">• {platform}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <FileText className="w-6 h-6 text-teal-300 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Review Platforms</h3>
                  <p className="text-white/80 mb-4">
                    Configure where customers can leave reviews.
                  </p>

                  <div className="bg-teal-500/20 border border-teal-400/30 rounded-lg p-4">
                    <ul className="space-y-1 text-white/80 text-sm">
                      <li>• Add multiple platforms (Google, Yelp, Facebook, etc.)</li>
                      <li>• Include direct URLs to profiles</li>
                      <li>• Set word count limits</li>
                      <li>• Available across all prompt pages</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // FAQ data - using generic business/profile questions since there's no specific business-profile section
  const faqs = [
    {
      question: 'How does my business profile affect AI-generated reviews?',
      answer: 'The AI uses your business information to create contextually relevant, authentic-sounding reviews. Your keywords, services, and unique value propositions are woven into the content naturally.',
      plans: ['grower', 'builder', 'maven']
    },
    {
      question: 'Can I have different profiles for multiple locations?',
      answer: 'Currently, each account has one business profile. For multiple locations, you can create separate prompt pages with location-specific information.',
      plans: ['grower', 'builder', 'maven']
    },
    {
      question: 'What happens if I don\'t complete all sections?',
      answer: 'The system will still work, but AI-generated content may be less specific and personalized. We recommend completing at least the basic info and services sections.',
      plans: ['grower', 'builder', 'maven']
    },
    {
      question: 'How do I optimize for local SEO?',
      answer: 'Include location-specific keywords (city, neighborhood, landmarks), complete your address information, and mention local differentiators in your unique value section.',
      plans: ['grower', 'builder', 'maven']
    }
  ];

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

        <StandardOverviewLayout
          title="Business Profile Setup"
          description="Your business profile is the foundation of your Prompt Reviews experience, powering AI-generated content and building customer trust."
          icon={Building}
          iconColor="blue"
          availablePlans={['grower', 'builder', 'maven']}

          introduction={
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
          }

          keyFeatures={keyFeatures}
          keyPoints={keyPoints}
          howItWorks={howItWorks}
          bestPractices={bestPractices}
          customSections={customSections}

          faqs={faqs}

          ctaTitle="Ready to Complete Your Profile?"
          ctaDescription="A complete business profile enhances every aspect of your Prompt Reviews experience."
          ctaButtons={[
            {
              text: 'Learn About Prompt Pages',
              href: '/prompt-pages',
              variant: 'secondary'
            },
            {
              text: 'Go to Business Profile',
              href: 'https://app.promptreviews.app/dashboard/business-profile',
              variant: 'primary',
              icon: ArrowRight
            }
          ]}
        />
      </div>
    </DocsLayout>
  );
}