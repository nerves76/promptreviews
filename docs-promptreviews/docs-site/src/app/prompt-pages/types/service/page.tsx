/**
 * Service Prompt Pages Documentation
 * Complete guide to creating and optimizing Service prompt pages
 */

import { Metadata } from 'next';
import { MessageCircle, Star, Users, MapPin, Clock, Phone } from 'lucide-react';
import DocsLayout from '../../../docs-layout';

export const metadata: Metadata = {
  title: 'Service Prompt Pages - Complete Guide | Prompt Reviews',
  description: 'Learn how to create effective Service prompt pages for restaurants, salons, and service-based businesses. Get more reviews with our proven approach.',
  keywords: 'service prompt pages, restaurant reviews, salon reviews, service business reviews, local business reviews',
  openGraph: {
    title: 'Service Prompt Pages - Perfect for Service-Based Businesses',
    description: 'Create effective Service prompt pages to collect better reviews from your customers.',
  },
};

// JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Create Service Prompt Pages",
  "description": "Step-by-step guide to creating effective Service prompt pages for service-based businesses",
  "image": "https://docs.promptreviews.app/images/service-prompt-page.png",
  "totalTime": "PT10M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": "0"
  },
  "supply": [
    {
      "@type": "HowToSupply",
      "name": "Business information"
    },
    {
      "@type": "HowToSupply", 
      "name": "Service details"
    }
  ],
  "step": [
    {
      "@type": "HowToStep",
      "name": "Choose Service prompt page type",
      "text": "Select 'Service' when creating your prompt page"
    },
    {
      "@type": "HowToStep",
      "name": "Add business information",
      "text": "Include your business name, address, and contact details"
    },
    {
      "@type": "HowToStep",
      "name": "Customize review prompts",
      "text": "Add service-specific questions and prompts"
    },
    {
      "@type": "HowToStep",
      "name": "Brand your page",
      "text": "Add your logo, colors, and branding elements"
    }
  ]
};

const serviceExamples = [
  {
    business: 'Restaurant',
    examples: [
      'How was the food quality and taste?',
      'How was the service and staff friendliness?',
      'How was the atmosphere and ambiance?',
      'Would you recommend us to friends and family?'
    ],
    tips: [
      'Ask about specific dishes or menu items',
      'Include questions about portion sizes and value',
      'Ask about cleanliness and hygiene',
      'Get feedback on wait times and reservations'
    ]
  },
  {
    business: 'Hair Salon',
    examples: [
      'How satisfied are you with your haircut/style?',
      'How was the stylist\'s expertise and communication?',
      'How was the salon atmosphere and cleanliness?',
      'Would you return and recommend us?'
    ],
    tips: [
      'Ask about specific services received',
      'Include questions about consultation process',
      'Get feedback on pricing and value',
      'Ask about appointment booking experience'
    ]
  },
  {
    business: 'Professional Services',
    examples: [
      'How was the quality of service provided?',
      'How was the communication and responsiveness?',
      'How was the expertise and professionalism?',
      'Would you recommend our services?'
    ],
    tips: [
      'Focus on expertise and results',
      'Ask about communication and follow-up',
      'Include questions about value and ROI',
      'Get feedback on problem-solving approach'
    ]
  }
];

const bestPractices = [
  {
    title: 'Keep Questions Specific',
    description: 'Ask about specific aspects of your service rather than general satisfaction.',
    example: 'Instead of "How was your experience?" ask "How was the food quality and presentation?"'
  },
  {
    title: 'Use Positive Language',
    description: 'Frame questions positively to encourage detailed, constructive feedback.',
    example: 'Ask "What did you enjoy most about our service?" rather than "What could we improve?"'
  },
  {
    title: 'Include Multiple Touchpoints',
    description: 'Cover different aspects of the customer journey from booking to follow-up.',
    example: 'Ask about booking experience, service delivery, and post-service follow-up'
  },
  {
    title: 'Make It Personal',
    description: 'Use your business name and personalize questions to your specific services.',
    example: 'Instead of generic questions, ask about your specific menu items or services'
  }
];

export default function ServicePromptPages() {
  return (
    <DocsLayout>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-purple-300" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Service Prompt Pages
            </h1>
          </div>
          <p className="text-xl text-white/80">
            Perfect for restaurants, salons, professional services, and any business that provides services to customers. Collect detailed, service-specific reviews that help you improve and grow.
          </p>
        </div>
        {/* Quick Overview */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Why Choose Service Prompt Pages?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-blue-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Service-Focused</h3>
              <p className="text-white/70 text-sm">Questions specifically designed for service-based businesses</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-green-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Customer-Centric</h3>
              <p className="text-white/70 text-sm">Focus on customer experience and satisfaction</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Local SEO</h3>
              <p className="text-white/70 text-sm">Optimized for local search and business visibility</p>
            </div>
          </div>
        </div>

        {/* Service Examples */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Service-Specific Examples</h2>
          <div className="space-y-8">
            {serviceExamples.map((service, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-blue to-indigo-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white">{service.business}</h3>
                </div>
                <div className="p-6">
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold text-white mb-3">Example Questions</h4>
                      <ul className="space-y-2">
                        {service.examples.map((example, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-slate-blue rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-white/80 text-sm">{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-3">Pro Tips</h4>
                      <ul className="space-y-2">
                        {service.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-white/80 text-sm">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Best Practices</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {bestPractices.map((practice, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
                <h3 className="font-semibold text-white mb-3">{practice.title}</h3>
                <p className="text-white/80 mb-3">{practice.description}</p>
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
                  <p className="text-white/80 text-sm font-medium">Example:</p>
                  <p className="text-blue-300 text-sm">{practice.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Setup Guide */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Setup Guide</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-white mb-4">Step-by-Step Process</h3>
              <ol className="space-y-4">
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-slate-blue text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">1</div>
                  <div>
                    <p className="font-medium text-white">Choose Service Type</p>
                    <p className="text-white/70 text-sm">Select "Service" when creating your prompt page</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-slate-blue text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium text-white">Add Business Info</p>
                    <p className="text-white/70 text-sm">Include name, address, hours, and contact details</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-slate-blue text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium text-white">Customize Questions</p>
                    <p className="text-white/70 text-sm">Add service-specific review prompts</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-slate-blue text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">4</div>
                  <div>
                    <p className="font-medium text-white">Brand Your Page</p>
                    <p className="text-white/70 text-sm">Add logo, colors, and custom messaging</p>
                  </div>
                </li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">What You'll Get</h3>
              <ul className="space-y-3">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-white/80">Service-optimized review questions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-white/80">Business information display</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-white/80">Local SEO optimization</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-white/80">Professional appearance</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-white/80">Easy customer engagement</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-slate-blue to-indigo-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Create Your Service Prompt Page?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Start collecting better reviews from your service customers today. It only takes a few minutes to set up.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://promptreviews.app/dashboard/create-prompt-page"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-white/20 text-white backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
            >
              Create Service Prompt Page
            </a>
            <a
              href="/prompt-pages/types"
              className="inline-flex items-center px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              View All Types
            </a>
          </div>
        </div>
      </div>

      {/* JSON-LD Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </DocsLayout>
  );
}
