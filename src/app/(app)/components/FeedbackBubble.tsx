/**
 * FeedbackBubble component - Enhanced help & support bubble
 * Provides context-aware tutorials and feedback submission
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/Icon';
import HelpModal from './help/HelpModal';
import { usePathname } from 'next/navigation';

export default function FeedbackBubble() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  // Trigger shimmer animation on page navigation (not on first load)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setShowShimmer(true);
    const timer = setTimeout(() => setShowShimmer(false), 1500);
    return () => clearTimeout(timer);
  }, [pathname]);

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
      {/* Floating Help Button with Glass Effect */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 backdrop-blur-md bg-white/10 border border-white/20 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-white/20 hover:-translate-y-0.5 hover:scale-105 transition-all duration-200 flex items-center justify-center group"
        style={{
          background: 'rgba(99, 102, 241, 0.15)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.18)'
        }}
        aria-label="Help & Support"
      >
        {/* Light sweep animation on page navigation */}
        {showShimmer && (
          <div
            className="absolute inset-[-2px] rounded-full pointer-events-none"
            style={{
              animation: 'light-sweep 1.2s ease-in-out forwards',
            }}
          >
            <div
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                top: '0px',
                left: '50%',
                transform: 'translateX(-50%)',
                filter: 'blur(0.5px)',
              }}
            />
          </div>
        )}
        <div className="w-[34px] h-[34px] rounded-full bg-white/40 flex items-center justify-center drop-shadow-sm transition-all duration-200 group-hover:bg-white/60">
          <span className="text-slate-700 text-[22px] font-semibold leading-none">?</span>
        </div>
        
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