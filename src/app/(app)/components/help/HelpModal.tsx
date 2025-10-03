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
import TutorialsTabNew from './TutorialsTabNew';
import FAQsTab from './FAQsTab';
import IssuesTab from './IssuesTab';
import { trackEvent } from '@/utils/analytics';

export default function HelpModal({
  isOpen,
  onClose,
  initialArticleId,
  initialKeywords,
  initialTab = 'tutorials'
}: HelpModalProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Debug logging removed to reduce console noise
  
  // Get context information from current page or use provided keywords
  const pageContext = getContextFromPath(pathname);
  const keywords = initialKeywords || pageContext.keywords;
  const pageName = pageContext.pageName;
  const helpTopics = pageContext.helpTopics;

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
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-label="Close modal"
      />
      
      {/* Modal - Larger size for desktop, responsive for mobile */}
      <div className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-visible border border-white/20 backdrop-blur-sm">
        {/* Close button */}
        <button
          className="absolute -top-3 -right-3 md:-top-4 md:-right-4 bg-white/70 backdrop-blur-sm border border-white/40 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 focus:outline-none z-10 transition-colors"
          style={{ width: 36, height: 36 }}
          onClick={handleClose}
          aria-label="Close"
        >
          <Icon name="FaTimes" className="w-5 h-5 text-red-600" size={20} />
        </button>

        {/* Header with Tabs */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 rounded-t-2xl">
          <div className="flex items-center justify-between p-4 md:p-6 pb-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Icon name="FaQuestionCircle" className="w-5 h-5 text-white" size={20} />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-white">
                  Help & Support
                </h2>
                <p className="text-xs text-white/80 hidden md:block">
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
                  ? 'text-indigo-700 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              style={activeTab === 'tutorials' ? { 
                background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #ddd6fe 100%)',
                borderBottom: '2px solid #e0e7ff'
              } : {}}
            >
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Icon name="FaFileAlt" className="w-4 h-4" size={16} />
                <span>Tutorials</span>
                {activeTab === 'tutorials' && helpTopics.length > 0 && (
                  <span className="hidden md:inline-flex ml-1 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                    {helpTopics.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => handleTabChange('faqs')}
              className={`flex-1 md:flex-initial px-3 md:px-4 py-2 text-sm font-medium rounded-t-md transition-all ${
                activeTab === 'faqs'
                  ? 'text-indigo-700 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              style={activeTab === 'faqs' ? { 
                background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #ddd6fe 100%)',
                borderBottom: '2px solid #e0e7ff'
              } : {}}
            >
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Icon name="FaQuestionCircle" className="w-4 h-4" size={16} />
                <span>FAQs</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange('issues')}
              className={`flex-1 md:flex-initial px-3 md:px-4 py-2 text-sm font-medium rounded-t-md transition-all ${
                activeTab === 'issues'
                  ? 'text-indigo-700 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              style={activeTab === 'issues' ? { 
                background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #ddd6fe 100%)',
                borderBottom: '2px solid #e0e7ff'
              } : {}}
            >
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Icon name="FaCommentDots" className="w-4 h-4" size={16} />
                <span>Report Issue</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto rounded-b-2xl">
          <div className="h-full flex flex-col rounded-b-2xl">
            <div className="flex-1">
              {activeTab === 'tutorials' && (
                <TutorialsTabNew 
                  pathname={pathname}
                  contextKeywords={keywords}
                  pageName={pageName}
                  initialArticleId={initialArticleId}
                />
              )}
              
              {activeTab === 'faqs' && (
                <FAQsTab 
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
            
            {/* Footer - simplified */}
            <div className="bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-fuchsia-600/10 border-t border-white/20 px-4 md:px-6 py-3">
              <div className="flex items-center justify-center text-xs text-white">
                <div className="flex items-center space-x-1">
                  <span>Just press</span>
                  <kbd className="px-1.5 py-0.5 bg-white/50 border border-white/30 rounded text-xs backdrop-blur-sm">?</kbd>
                  <span>to open this modal anywhere in app</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}