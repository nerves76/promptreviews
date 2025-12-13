'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/Icon';
import { KeywordManager } from '@/features/keywords/components';

/**
 * Keywords Dashboard Page
 *
 * Full-screen keyword management interface with subnav
 * for Library and Research tabs.
 */
export default function KeywordsPage() {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Subnav */}
      <div className="bg-gradient-to-r from-slate-blue to-slate-blue/80 pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-white mb-6">Keywords</h1>

          {/* Subnav Tabs */}
          <div className="flex gap-1 bg-white/10 backdrop-blur-sm border border-white/30 rounded-full p-1 w-fit">
            <Link
              href="/dashboard/keywords"
              className={`px-6 py-2 font-medium text-sm rounded-full flex items-center gap-2 transition-all duration-200 ${
                pathname === '/dashboard/keywords'
                  ? 'bg-white text-slate-blue'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Icon name="FaBook" className="w-4 h-4" size={16} />
              Library
            </Link>
            <Link
              href="/dashboard/keywords/research"
              className={`px-6 py-2 font-medium text-sm rounded-full flex items-center gap-2 transition-all duration-200 ${
                pathname === '/dashboard/keywords/research'
                  ? 'bg-white text-slate-blue'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Icon name="FaSearch" className="w-4 h-4" size={16} />
              Research
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <KeywordManager />
      </div>
    </div>
  );
}
