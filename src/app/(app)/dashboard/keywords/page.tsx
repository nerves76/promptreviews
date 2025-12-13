'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/Icon';
import PageCard from '@/app/(app)/components/PageCard';
import { KeywordManager } from '@/features/keywords/components';

/**
 * Keywords Dashboard Page
 *
 * Full-screen keyword management interface with subnav
 * for Library and Research tabs.
 * Design matches Prompt Pages convention with PageCard.
 */
export default function KeywordsPage() {
  const pathname = usePathname();

  return (
    <div>
      {/* Page Title */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center mb-3">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Keywords
          </h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center w-full mt-0 mb-0 z-20 px-4">
        <div className="flex bg-white/10 backdrop-blur-sm border border-white/30 rounded-full p-1 shadow-lg gap-0">
          <Link
            href="/dashboard/keywords"
            className={`px-6 py-2 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center gap-2
              ${pathname === '/dashboard/keywords'
                ? 'bg-slate-blue text-white'
                : 'bg-transparent text-white hover:bg-white/10'}
            `}
          >
            <Icon name="FaBook" className="w-4 h-4" size={16} />
            Library
          </Link>
          <Link
            href="/dashboard/keywords/research"
            className={`px-6 py-2 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center gap-2
              ${pathname === '/dashboard/keywords/research'
                ? 'bg-slate-blue text-white'
                : 'bg-transparent text-white hover:bg-white/10'}
            `}
          >
            <Icon name="FaSearch" className="w-4 h-4" size={16} />
            Research
          </Link>
        </div>
      </div>

      {/* Content in PageCard */}
      <PageCard
        icon={<Icon name="FaBook" className="w-6 h-6 text-slate-blue" size={24} />}
        topMargin="mt-8"
      >
        <KeywordManager />
      </PageCard>
    </div>
  );
}
