/**
 * Features Comparison Widget - Embed Version
 *
 * Clean embed version without demo content for iframe embedding
 */

import FeaturesComparisonWidget from '@/components/marketing/FeaturesComparisonWidget';

export default function FeaturesWidgetEmbed() {
  return (
    <>
      <style jsx global>{`
        body {
          overflow: hidden;
        }
      `}</style>
      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <FeaturesComparisonWidget />
        </div>
      </div>
    </>
  );
}
