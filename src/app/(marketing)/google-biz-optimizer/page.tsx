import { Metadata } from 'next';
import GoogleBizOptimizerLandingPage from './GoogleBizOptimizerLandingPage';

export const metadata: Metadata = {
  title: 'Free Google Business Profile Optimizer - Get Your Optimization Report | PromptReviews',
  description: 'Get your free Google Business Profile optimization report in under 2 minutes. Discover 10+ specific recommendations to improve your local search visibility and attract more customers.',
  keywords: 'Google Business Profile, optimization, local SEO, business listing, Google My Business, free report, business optimization',
  openGraph: {
    title: 'Free Google Business Profile Optimization Report',
    description: 'Get 10+ specific recommendations to optimize your Google Business Profile and attract more customers. Takes less than 2 minutes.',
    type: 'website',
    url: 'https://app.promptreviews.app/google-biz-optimizer',
    images: [
      {
        url: '/images/google-biz-optimizer-og.png',
        width: 1200,
        height: 630,
        alt: 'Google Business Profile Optimizer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Google Business Profile Optimization Report',
    description: 'Get 10+ specific recommendations to optimize your Google Business Profile and attract more customers.',
    images: ['/images/google-biz-optimizer-twitter.png'],
  },
};

export default function GoogleBizOptimizerPage() {
  return <GoogleBizOptimizerLandingPage />;
}