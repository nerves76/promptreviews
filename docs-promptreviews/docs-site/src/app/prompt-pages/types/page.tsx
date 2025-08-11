/**
 * Prompt Page Types Documentation
 * Comprehensive guide to all prompt page types and their features
 */

import { Metadata } from 'next';
import { 
  MessageCircle, 
  Star, 
  Camera, 
  Video, 
  Heart, 
  Brain, 
  QrCode, 
  Palette,
  Calendar,
  User,
  Globe,
  FileText
} from 'lucide-react';
import DocsLayout from '../../docs-layout';
import PageHeader from '../../components/PageHeader';

export const metadata: Metadata = {
  title: 'Prompt Page Types - Service, Product, Photo, Video & More | Prompt Reviews',
  description: 'Learn about all prompt page types: Service, Product, Photo, Video, and Universal. Choose the right type for your business needs.',
  keywords: 'prompt page types, service reviews, product reviews, photo reviews, video reviews, universal prompt page',
  openGraph: {
    title: 'Prompt Page Types - Choose the Right Review Collection Method',
    description: 'Comprehensive guide to Service, Product, Photo, Video, and Universal prompt page types.',
  },
};

// JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "Prompt Page Types: Complete Guide",
  "description": "Learn about all prompt page types and choose the right one for your business",
  "author": {
    "@type": "Organization",
    "name": "Prompt Reviews"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Prompt Reviews"
  },
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Service Prompt Pages"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Product Prompt Pages"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Photo Prompt Pages"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Video Prompt Pages"
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": "Universal Prompt Pages"
      }
    ]
  }
};

const promptPageTypes = [
  {
    id: 'service',
    title: 'Service Prompt Pages',
    icon: MessageCircle,
    description: 'Perfect for restaurants, salons, and service-based businesses',
    url: '/prompt-pages/types/service',
    features: ['Service-specific questions', 'Business information', 'Local SEO optimized'],
    useCases: ['Restaurants', 'Hair salons', 'Professional services', 'Consultants'],
    benefits: ['Higher review quality', 'Service-specific context', 'Better customer engagement'],
    example: 'A restaurant creates a service prompt page asking "How was your dining experience?" with specific questions about food quality, service, and atmosphere.'
  },
  {
    id: 'product',
    title: 'Product Prompt Pages',
    icon: Star,
    description: 'Ideal for product-based businesses and e-commerce stores',
    url: '/prompt-pages/types/product',
    features: ['Product-focused reviews', 'Purchase verification', 'E-commerce integration'],
    useCases: ['E-commerce stores', 'Retail businesses', 'Product manufacturers', 'Online marketplaces'],
    benefits: ['Product-specific feedback', 'Purchase context', 'Better conversion tracking'],
    example: 'An online store creates a product prompt page for a specific item, asking customers about their purchase experience and product satisfaction.'
  },
  {
    id: 'photo',
    title: 'Photo Prompt Pages',
    icon: Camera,
    description: 'Collect reviews with customer photos for visual social proof',
    url: '/prompt-pages/types/photo',
    features: ['Photo upload capability', 'Visual reviews', 'Social media sharing'],
    useCases: ['Hair salons', 'Tattoo artists', 'Interior designers', 'Fashion retailers'],
    benefits: ['Visual social proof', 'Higher engagement', 'Better marketing content'],
    example: 'A hair salon creates a photo prompt page where customers can upload photos of their new haircut along with their review.'
  },
  {
    id: 'video',
    title: 'Video Prompt Pages',
    icon: Video,
    description: 'Collect video reviews for maximum engagement and authenticity',
    url: '/prompt-pages/types/video',
    features: ['Video recording', 'High engagement', 'Authentic testimonials'],
    useCases: ['Personal trainers', 'Coaches', 'Consultants', 'Service providers'],
    benefits: ['Maximum authenticity', 'Higher engagement', 'Compelling testimonials'],
    example: 'A personal trainer creates a video prompt page where clients can record short video testimonials about their fitness journey.'
  },
  {
    id: 'event',
    title: 'Event Prompt Pages',
    icon: Calendar,
    description: 'Perfect for events, workshops, and special occasions',
    url: '/prompt-pages/types/event',
    features: ['Event-specific context', 'Date tracking', 'Attendee feedback'],
    useCases: ['Event planners', 'Venues', 'Workshop hosts', 'Conference organizers'],
    benefits: ['Event-specific feedback', 'Date-based tracking', 'Attendee engagement'],
    example: 'A wedding venue creates an event prompt page for each wedding, asking guests about their experience at the specific event.'
  },
  {
    id: 'employee',
    title: 'Employee Prompt Pages',
    icon: User,
    description: 'Spotlight individual team members with dedicated review pages',
    url: '/prompt-pages/types/employee',
    features: ['Employee recognition', 'Personal touch', 'Team building'],
    useCases: ['Service businesses', 'Sales teams', 'Consulting firms', 'Healthcare practices'],
    benefits: ['Employee recognition', 'Personal connection', 'Team motivation'],
    example: 'A consulting firm creates individual prompt pages for each consultant, allowing clients to leave specific feedback about their experience.'
  },
  {
    id: 'universal',
    title: 'Universal Prompt Pages',
    icon: Globe,
    description: 'One-page solution for any type of review collection',
    url: '/prompt-pages/types/universal',
    features: ['Works for any business', 'QR code generation', 'Universal compatibility'],
    useCases: ['Any business type', 'General review collection', 'Business cards', 'Email signatures'],
    benefits: ['Universal compatibility', 'Easy sharing', 'Always ready'],
    example: 'A small business creates a universal prompt page that works for all customers, perfect for business cards and general use.'
  }
];

export default function PromptPageTypes() {
  return (
    <DocsLayout>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' },
            { label: 'Prompt Pages', href: '/prompt-pages' }
          ]}
          currentPage="Page Types"
          categoryLabel="Page Types"
          categoryIcon={FileText}
          categoryColor="blue"
          title="Prompt page types"
          description="Choose the perfect prompt page type for your business. Each type is designed for specific use cases and offers unique features to help you collect better reviews."
        />
        {/* Quick Navigation */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {promptPageTypes.map((type) => (
              <a
                key={type.id}
                href={`#${type.id}`}
                className="flex flex-col items-center p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <type.icon className="w-8 h-8 text-slate-blue mb-2" />
                <span className="text-sm font-medium text-white text-center">
                  {type.title}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Detailed Types */}
        <div className="space-y-16">
          {promptPageTypes.map((type, index) => (
            <section key={type.id} id={type.id} className="scroll-mt-20">
              <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-blue to-indigo-600 px-6 py-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <type.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white">{type.title}</h2>
                      <p className="text-white/90 mt-1">{type.description}</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Key Features</h3>
                        <ul className="space-y-2">
                          {type.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-slate-blue rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-white/80">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Perfect For</h3>
                        <ul className="space-y-2">
                          {type.useCases.map((useCase, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-white/80">{useCase}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Benefits</h3>
                        <ul className="space-y-2">
                          {type.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-white/80">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-300 mb-2">Real Example</h4>
                        <p className="text-white/80 text-sm">{type.example}</p>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-8 pt-6 border-t border-white/20">
                    <div className="flex flex-col sm:flex-row items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white">Ready to create your {type.title}?</h4>
                        <p className="text-white/70 text-sm mt-1">Get started in just a few minutes</p>
                      </div>
                      <a
                        href="https://promptreviews.app/dashboard/create-prompt-page"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-slate-blue text-white font-medium rounded-lg hover:bg-slate-blue/90 transition-colors"
                      >
                        Create {type.title}
                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Comparison</h2>
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Feature
                    </th>
                    {promptPageTypes.map((type) => (
                      <th key={type.id} className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                        {type.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white/5 divide-y divide-white/10">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      Photo Upload
                    </td>
                    {promptPageTypes.map((type) => (
                      <td key={type.id} className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                        {type.id === 'photo' ? '✅' : type.id === 'video' ? '✅' : '❌'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      Video Recording
                    </td>
                    {promptPageTypes.map((type) => (
                      <td key={type.id} className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                        {type.id === 'video' ? '✅' : '❌'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      QR Code
                    </td>
                    {promptPageTypes.map((type) => (
                      <td key={type.id} className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                        {type.id === 'universal' ? '✅' : '✅'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      AI-Powered Content
                    </td>
                    {promptPageTypes.map((type) => (
                      <td key={type.id} className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                        ✅
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-16 bg-gradient-to-r from-slate-blue to-indigo-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Choose the prompt page type that best fits your business and start collecting better reviews today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://promptreviews.app/dashboard/create-prompt-page"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 backdrop-blur-sm transition-colors"
            >
              Create Your First Prompt Page
            </a>
            <a
              href="/prompt-pages/features"
              className="inline-flex items-center px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              Learn About Features
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
