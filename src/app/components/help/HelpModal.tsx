/**
 * Enhanced HelpModal component with tabbed interface
 * Provides context-aware tutorials and feedback/issue submission
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Icon from '@/components/Icon';
import { TabType, HelpModalProps } from './types';
import { getContextFromPath } from './contextMapper';
import TutorialsTab from './TutorialsTab';
import IssuesTab from './IssuesTab';
import { trackEvent } from '../../../utils/analytics';

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabType>('tutorials');
  
  // Get context information from current page
  const { keywords, pageName, helpTopics } = getContextFromPath(pathname);

  // Track modal open
  useEffect(() => {
    if (isOpen) {
      trackEvent('help_modal_opened', {
        initial_tab: activeTab,
        context: pathname,
        page_name: pageName
      });
    }
  }, [isOpen]);

  // Track tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    trackEvent('help_tab_changed', {
      new_tab: tab,
      context: pathname
    });
  };

  const handleClose = () => {
    onClose();
    // Reset to tutorials tab for next open
    setTimeout(() => setActiveTab('tutorials'), 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Close modal"
      />
      
      {/* Modal - Larger size for desktop, responsive for mobile */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col">
        {/* Close button */}
        <button
          className="absolute -top-3 -right-3 md:-top-4 md:-right-4 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 focus:outline-none z-10 transition-colors"
          style={{ width: 36, height: 36 }}
          onClick={handleClose}
          aria-label="Close"
        >
          <Icon name="FaTimes" className="w-5 h-5 text-red-600" size={20} />
        </button>

        {/* Header with Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between p-4 md:p-6 pb-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-blue/10 rounded-lg flex items-center justify-center">
                <Icon name="FaLifeRing" className="w-5 h-5 text-slate-blue" size={20} />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                  Help & Support
                </h2>
                <p className="text-xs text-gray-500 hidden md:block">
                  Get help, find tutorials, or report issues
                </p>
              </div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 px-4 md:px-6 pt-4">
            <button
              onClick={() => handleTabChange('tutorials')}
              className={`flex-1 md:flex-initial px-3 md:px-4 py-2 text-sm font-medium rounded-t-md transition-all ${
                activeTab === 'tutorials'
                  ? 'bg-white text-slate-blue border-b-2 border-slate-blue shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Icon name="FaBook" className="w-4 h-4" size={16} />
                <span>Tutorials</span>
                {activeTab === 'tutorials' && helpTopics.length > 0 && (
                  <span className="hidden md:inline-flex ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {helpTopics.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => handleTabChange('issues')}
              className={`flex-1 md:flex-initial px-3 md:px-4 py-2 text-sm font-medium rounded-t-md transition-all ${
                activeTab === 'issues'
                  ? 'bg-white text-slate-blue border-b-2 border-slate-blue shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Icon name="FaCommentDots" className="w-4 h-4" size={16} />
                <span>Report Issue</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="bg-white">
            {activeTab === 'tutorials' && (
              <TutorialsTab 
                pathname={pathname}
                contextKeywords={keywords}
                pageName={pageName}
              />
            )}
            
            {activeTab === 'issues' && (
              <IssuesTab 
                pathname={pathname}
                contextKeywords={keywords}
                onClose={handleClose}
              />
            )}
          </div>
        </div>

        {/* Footer (optional - for quick links) */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 md:px-6 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4 mb-2 md:mb-0">
              <a 
                href="https://docs.promptreviews.app"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-blue transition-colors flex items-center space-x-1"
                onClick={() => trackEvent('help_footer_docs_clicked')}
              >
                <Icon name="FaBook" className="w-3 h-3" size={12} />
                <span>Documentation</span>
              </a>
              <a 
                href="mailto:support@promptreviews.app"
                className="hover:text-slate-blue transition-colors flex items-center space-x-1"
                onClick={() => trackEvent('help_footer_email_clicked')}
              >
                <Icon name="FaEnvelope" className="w-3 h-3" size={12} />
                <span>Email Support</span>
              </a>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="FaKeyboard" className="w-3 h-3" size={12} />
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">?</kbd>
              <span>for help</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}