'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/Icon';

/**
 * Shared pill-shaped subnav for Research pages
 */
export default function ResearchSubnav() {
  const pathname = usePathname();

  const tabs = [
    {
      href: '/dashboard/research',
      label: 'Keywords',
      icon: 'FaSearch',
      isActive: pathname === '/dashboard/research' || pathname === '/dashboard/research/keywords',
    },
    {
      href: '/dashboard/research/domains',
      label: 'Domains',
      icon: 'FaGlobe',
      isActive: pathname === '/dashboard/research/domains',
    },
    {
      href: '/dashboard/research/backlinks',
      label: 'Backlinks',
      icon: 'FaLink',
      isActive: pathname === '/dashboard/research/backlinks',
    },
  ];

  return (
    <div className="flex justify-center w-full mt-0 mb-0 z-20 px-4">
      <div className="flex bg-white/10 backdrop-blur-sm border border-white/30 rounded-full p-1 shadow-lg gap-0">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-6 py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center gap-2
              ${tab.isActive
                ? 'bg-slate-blue text-white'
                : 'bg-transparent text-white hover:bg-white/10'}
            `}
          >
            <Icon name={tab.icon as any} className="w-[18px] h-[18px]" size={18} />
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
