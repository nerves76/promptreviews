import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: '%s | Prompt Reviews Documentation',
    default: 'Prompt Reviews Documentation - Complete Help Center & Guides',
  },
  description: 'Complete documentation for Prompt Reviews - Learn how to collect, manage, and leverage customer reviews with our comprehensive guides, tutorials, and troubleshooting resources.',
  keywords: [
    'Prompt Reviews documentation',
    'review management help',
    'customer review software guide',
    'Google Business Profile integration',
    'review collection tutorial',
    'Prompty AI assistant',
    'review widget setup',
    'business review automation'
  ],
  authors: [{ name: 'Prompt Reviews Team' }],
  creator: 'Prompt Reviews',
  publisher: 'Prompt Reviews',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://docs.promptreviews.com',
    siteName: 'Prompt Reviews Documentation',
    title: 'Prompt Reviews Documentation - Complete Help Center & Guides',
    description: 'Learn how to maximize your online reputation with Prompt Reviews. Complete guides for prompt pages, contact management, Google Business integration, and more.',
    images: [
      {
        url: 'https://docs.promptreviews.com/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Prompt Reviews Documentation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt Reviews Documentation',
    description: 'Complete guides and tutorials for Prompt Reviews review management platform',
    images: ['https://docs.promptreviews.com/images/twitter-card.jpg'],
  },
  alternates: {
    canonical: 'https://docs.promptreviews.com',
  },
  category: 'technology',
  classification: 'Business Software Documentation',
}

// JSON-LD structured data for the entire site
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Prompt Reviews Documentation',
  description: 'Complete documentation and help center for Prompt Reviews review management platform',
  url: 'https://docs.promptreviews.com',
  publisher: {
    '@type': 'Organization',
    name: 'Prompt Reviews',
    url: 'https://promptreviews.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://promptreviews.com/images/logo.png',
    },
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://docs.promptreviews.com/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        
        {/* Additional meta tags */}
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${inter.className} text-white antialiased`}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}