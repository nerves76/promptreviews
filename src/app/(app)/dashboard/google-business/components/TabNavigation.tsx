'use client';

import type { GoogleBusinessTab } from '../types/google-business';

interface TabNavigationProps {
  activeTab: GoogleBusinessTab;
  isConnected: boolean;
  hasLocations: boolean;
  onTabChange: (tab: GoogleBusinessTab) => void;
}

export function TabNavigation({
  activeTab,
  isConnected,
  hasLocations,
  onTabChange,
}: TabNavigationProps) {
  const isTabDisabled = !isConnected || !hasLocations;

  const getTabClasses = (tab: GoogleBusinessTab, requiresConnection: boolean = true) => {
    const isActive = activeTab === tab;
    const isDisabled = requiresConnection && isTabDisabled;
    const activeWhenConnected = isActive && (!requiresConnection || (isConnected && hasLocations));

    return `py-2 px-3 border-b-2 font-medium text-sm rounded-t-md transition-colors whitespace-nowrap ${
      activeWhenConnected
        ? 'border-slate-blue text-slate-blue bg-white shadow-sm'
        : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`;
  };

  return (
    <nav className="hidden md:flex -mb-px flex-wrap gap-2">
      <button
        onClick={() => onTabChange('connect')}
        className={getTabClasses('connect', false)}
      >
        Connect
      </button>
      <button
        onClick={() => onTabChange('overview')}
        className={getTabClasses('overview', false)}
      >
        Overview
      </button>
      <button
        onClick={() => onTabChange('business-info')}
        disabled={isTabDisabled}
        className={getTabClasses('business-info')}
      >
        Business Info
      </button>
      <button
        onClick={() => onTabChange('services')}
        disabled={isTabDisabled}
        className={getTabClasses('services')}
      >
        Services
      </button>
      <button
        onClick={() => onTabChange('create-post')}
        disabled={isTabDisabled}
        className={getTabClasses('create-post')}
      >
        Post
      </button>
      <button
        onClick={() => onTabChange('photos')}
        disabled={isTabDisabled}
        className={getTabClasses('photos')}
      >
        Photos
      </button>
      <button
        onClick={() => onTabChange('reviews')}
        disabled={isTabDisabled}
        className={getTabClasses('reviews')}
      >
        Reviews
      </button>
      <button
        onClick={() => onTabChange('more')}
        disabled={isTabDisabled}
        className={getTabClasses('more')}
      >
        More
      </button>
      <button
        onClick={() => onTabChange('protection')}
        className={getTabClasses('protection', false)}
      >
        Protection
      </button>
    </nav>
  );
}
