'use client';

import { KeywordManager } from '@/features/keywords/components';

/**
 * Keywords Dashboard Page
 *
 * Full-screen keyword management interface accessible from
 * the main dashboard navigation.
 */
export default function KeywordsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <KeywordManager />
      </div>
    </div>
  );
}
