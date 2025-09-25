import { Metadata } from 'next';
import StandardOverviewLayout from '../../components/StandardOverviewLayout';
import { pageFAQs } from '../utils/faqData';
import { BarChart3, TrendingUp, Users, Star, Calendar, Filter, Download, Eye, MousePointer, Smile, MessageSquare, Clock, ArrowRight, CheckCircle, PieChart, Activity, Target } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Analytics & Insights Guide | Prompt Reviews',
  description: 'Understand your review collection performance with comprehensive analytics, metrics tracking, and actionable insights in Prompt Reviews.',
  keywords: 'analytics, metrics, review tracking, performance insights, data analysis, prompt reviews',
};

export default function AnalyticsPage() {
  // Key features for analytics
  const keyFeatures = [
    {
      icon: BarChart3,
      title: 'Review Performance Tracking',
      description: 'Monitor review volume trends, platform distribution, and conversion rates across all your prompt pages with comprehensive visual charts.',
    },
    {
      icon: Smile,
      title: 'Sentiment Analysis',
      description: 'Track customer satisfaction through emoji feedback and sentiment trends. Identify patterns in positive and negative responses over time.',
    },
    {
      icon: MousePointer,
      title: 'Engagement Metrics',
      description: 'Analyze prompt page performance with detailed metrics on views, clicks, and conversion rates to optimize your review collection strategy.',
    },
    {
      icon: Filter,
      title: 'Advanced Filtering',
      description: 'Segment data by time periods, locations, prompt pages, and review platforms to get granular insights into your performance.',
    }
  ];

  // How analytics works
  const howItWorks = [
    {
      number: 1,
      title: 'Data Collection',
      description: 'Analytics automatically track all customer interactions with your prompt pages, review submissions, and sentiment feedback in real-time.',
      icon: Activity
    },
    {
      number: 2,
      title: 'Visual Insights',
      description: 'View comprehensive dashboards with charts, graphs, and metrics that make it easy to understand your review collection performance at a glance.',
      icon: PieChart
    },
    {
      number: 3,
      title: 'Actionable Optimization',
      description: 'Use data insights to identify top-performing content, optimize underperforming pages, and make informed decisions to improve your review strategy.',
      icon: Target
    }
  ];

  // Best practices for analytics
  const bestPractices = [
    {
      icon: Calendar,
      title: 'Regular Monitoring',
      description: 'Check analytics weekly to identify trends early and adjust your review collection strategy based on performance data.'
    },
    {
      icon: Filter,
      title: 'Use Time Comparisons',
      description: 'Compare month-over-month and year-over-year performance to understand seasonal patterns and long-term growth trends.'
    },
    {
      icon: Target,
      title: 'Focus on Conversion Rates',
      description: 'Track not just page views but actual review submissions to optimize the pages that drive the most valuable outcomes.'
    },
    {
      icon: Users,
      title: 'Share Insights with Team',
      description: 'Keep team members informed about performance metrics and use data to guide collaborative improvement efforts.'
    }
  ];


  return (
    <StandardOverviewLayout
      title="Analytics & insights"
      description="Track your review collection performance, understand customer sentiment, and make data-driven decisions to improve your review strategy."
      categoryLabel="Insights"
      categoryIcon={BarChart3}
      categoryColor="indigo"
      currentPage="Analytics"
      availablePlans={['grower', 'builder', 'maven']}
      keyFeatures={keyFeatures}
      howItWorks={howItWorks}
      bestPractices={bestPractices}
      faqs={pageFAQs['analytics']}
      callToAction={{
        secondary: {
          text: 'Optimize Prompt Pages',
          href: '/prompt-pages'
        },
        primary: {
          text: 'View Analytics',
          href: 'https://app.promptreviews.app/dashboard/analytics',
          external: true
        }
      }}
    />
  );
}