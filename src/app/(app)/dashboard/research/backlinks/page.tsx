'use client';

import PageCard from '@/app/(app)/components/PageCard';
import Icon from '@/components/Icon';
import ResearchSubnav from '../ResearchSubnav';

/**
 * Research - Backlinks Page (Coming Soon)
 */
export default function ResearchBacklinksPage() {
  return (
    <div>
      {/* Page Title */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center mb-3">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Research
          </h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <ResearchSubnav />

      {/* Content */}
      <PageCard
        icon={<Icon name="FaLink" className="w-8 h-8 text-slate-blue" size={32} />}
        topMargin="mt-8"
      >
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-blue/10 rounded-full mb-6">
            <Icon name="FaLink" className="w-10 h-10 text-slate-blue" size={40} />
          </div>

          <div className="inline-block px-4 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-4">
            Coming soon
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Backlink analysis
          </h2>

          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            Track your backlink profile, discover referring domains, analyze anchor text distribution, and monitor new and lost links over time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <FeatureCard
              icon="FaChartLine"
              title="Backlink trends"
              description="Track total backlinks over time"
            />
            <FeatureCard
              icon="FaGlobe"
              title="Referring domains"
              description="See which sites link to you"
            />
            <FeatureCard
              icon="FaLink"
              title="Anchor text"
              description="Analyze anchor distribution"
            />
            <FeatureCard
              icon="FaPlus"
              title="New & lost"
              description="Monitor backlink changes"
            />
          </div>
        </div>
      </PageCard>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg text-left">
      <Icon name={icon as any} className="w-5 h-5 text-slate-blue mb-2" size={20} />
      <h4 className="font-medium text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
