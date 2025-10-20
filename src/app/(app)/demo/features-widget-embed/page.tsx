/**
 * Features Comparison Widget - Embed Version
 *
 * Clean embed version without demo content for iframe embedding
 */

import FeaturesComparisonWidget from '@/components/marketing/FeaturesComparisonWidget';

export default function FeaturesWidgetEmbed() {
  return (
    <div className="py-12 px-4" style={{ overflow: 'hidden' }}>
      <div className="max-w-6xl mx-auto">
        <FeaturesComparisonWidget />
      </div>
    </div>
  );
}
