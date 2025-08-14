/**
 * FeedbackBubble component - Enhanced help & support bubble
 * Provides context-aware tutorials and feedback submission
 */

'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import HelpModal from './help/HelpModal';

export default function FeedbackBubble() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add keyboard shortcut for help (?)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check for ? key (shift + /)
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger if user is typing in an input
        const activeElement = document.activeElement;
        if (activeElement?.tagName === 'INPUT' || 
            activeElement?.tagName === 'TEXTAREA' || 
            activeElement?.getAttribute('contenteditable') === 'true') {
          return;
        }
        e.preventDefault();
        setIsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-slate-blue text-white rounded-full shadow-lg hover:shadow-xl hover:bg-slate-blue/90 transition-all duration-200 flex items-center justify-center group"
        aria-label="Help & Support"
      >
        <Icon name="FaQuestionCircle" className="w-6 h-6" size={24} />
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            <span>Help & Support</span>
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">?</kbd>
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </button>

      {/* Help Modal */}
      <HelpModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
} 