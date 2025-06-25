/**
 * FeedbackBubble component for collecting beta feedback
 * This component provides a floating button in the bottom-right corner for users to submit feedback
 */

'use client';

import { useState } from 'react';
import { FaCommentDots } from 'react-icons/fa';
import FeedbackModal from './FeedbackModal';

export default function FeedbackBubble() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-slate-blue text-white rounded-full shadow-lg hover:shadow-xl hover:bg-slate-blue/90 transition-all duration-200 flex items-center justify-center group"
        aria-label="Submit feedback"
      >
        <FaCommentDots className="w-6 h-6" />
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Send feedback
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </button>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
} 