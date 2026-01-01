'use client';

import type { GoogleBusinessTab } from '../types/google-business';

interface MobileTabMenuProps {
  activeTab: GoogleBusinessTab;
  isConnected: boolean;
  isOpen: boolean;
  onTabChange: (tab: GoogleBusinessTab) => void;
}

export function MobileTabMenu({
  activeTab,
  isConnected,
  isOpen,
  onTabChange,
}: MobileTabMenuProps) {
  if (!isOpen) return null;

  const getMobileTabClasses = (tab: GoogleBusinessTab, requiresConnection: boolean = true) => {
    const isActive = activeTab === tab;
    const isDisabled = requiresConnection && !isConnected;
    const activeWhenConnected = isActive && (!requiresConnection || isConnected);

    if (activeWhenConnected) {
      return 'w-full text-left px-3 py-2 rounded-md text-sm font-medium bg-slate-blue text-white';
    }
    if (isDisabled) {
      return 'w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-500 cursor-not-allowed';
    }
    return 'w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100';
  };

  return (
    <div className="md:hidden bg-gray-50 border-t border-gray-200">
      <div className="px-2 py-3 space-y-1">
        <button
          onClick={() => onTabChange('connect')}
          className={getMobileTabClasses('connect', false)}
        >
          Connect
        </button>
        <button
          onClick={() => onTabChange('overview')}
          className={getMobileTabClasses('overview', false)}
        >
          Overview
        </button>
        <button
          onClick={() => onTabChange('business-info')}
          disabled={!isConnected}
          className={getMobileTabClasses('business-info')}
        >
          Business Info
        </button>
        <button
          onClick={() => onTabChange('services')}
          disabled={!isConnected}
          className={getMobileTabClasses('services')}
        >
          Services
        </button>
        <button
          onClick={() => onTabChange('more')}
          disabled={!isConnected}
          className={getMobileTabClasses('more')}
        >
          More
        </button>
        <button
          onClick={() => onTabChange('protection')}
          className={getMobileTabClasses('protection', false)}
        >
          Protection
        </button>
        <button
          onClick={() => onTabChange('create-post')}
          disabled={!isConnected}
          className={getMobileTabClasses('create-post')}
        >
          Post
        </button>
        <button
          onClick={() => onTabChange('photos')}
          disabled={!isConnected}
          className={getMobileTabClasses('photos')}
        >
          Photos
        </button>
        <button
          onClick={() => onTabChange('reviews')}
          disabled={!isConnected}
          className={getMobileTabClasses('reviews')}
        >
          Reviews
        </button>
      </div>
    </div>
  );
}
