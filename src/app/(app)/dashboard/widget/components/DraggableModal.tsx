import React, { useState, useEffect } from 'react';
import Icon from '@/components/Icon';

interface DraggableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  onSave?: () => void;
  onReset?: () => void;
  saveLabel?: string;
  resetLabel?: string;
  maxWidth?: string;
  /** Optional: Make body opaque white instead of glassmorphic gradient */
  opaqueBody?: boolean;
  /** Optional: Reduce backdrop blur for better readability */
  lightBackdrop?: boolean;
}

export const DraggableModal: React.FC<DraggableModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  onReset,
  saveLabel = 'Save',
  resetLabel = 'Reset',
  maxWidth = 'max-w-xl',
  opaqueBody = false,
  lightBackdrop = false,
}) => {
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      // Center modal on screen with responsive sizing
      const isMobile = window.innerWidth < 640;
      const modalWidth = isMobile ? Math.min(576, window.innerWidth - 32) : 576; // 16px margin on each side for mobile
      const modalHeight = isMobile ? Math.min(600, window.innerHeight - 100) : 600;
      const x = Math.max(16, (window.innerWidth - modalWidth) / 2);
      const y = Math.max(50, (window.innerHeight - modalHeight) / 2);
      setModalPos({ x, y });

      // Lock body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      // Restore body scroll when modal closes
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setModalPos({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('.modal-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - modalPos.x,
        y: e.clientY - modalPos.y,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={lightBackdrop ? "fixed inset-0 bg-black/20" : "fixed inset-0 bg-black/50 backdrop-blur-sm"}
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div
        className={`rounded-2xl shadow-2xl w-full ${maxWidth} relative ${
          opaqueBody
            ? 'border border-gray-200'
            : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-white/20 backdrop-blur-sm'
        }`}
        style={{
          position: 'absolute',
          left: modalPos.x,
          top: modalPos.y,
          transform: 'none',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Circular close button - inside on mobile, centered on corner on desktop */}
        <button
          className="absolute top-2 right-2 sm:-top-4 sm:-right-4 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-50"
          style={{ width: 36, height: 36 }}
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="modal-header flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 cursor-move bg-white/10 backdrop-blur-md rounded-t-2xl gap-2 sm:gap-0">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-600 flex items-center flex-wrap gap-2">{title}</h2>
          </div>
          <div className="hidden sm:flex flex-shrink-0 mx-2">
             <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
               <Icon name="FaArrowsAlt" className="text-white" size={16} />
             </div>
          </div>
          <div className="flex flex-shrink-0 justify-start sm:justify-end items-center gap-2 sm:pr-8">
             {onReset && (
                <button
                   onClick={onReset}
                   className="px-3 sm:px-4 py-2 min-h-[44px] bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition text-sm border border-white/30 whitespace-nowrap"
                >
                   {resetLabel}
               </button>
             )}
             {onSave && (
                <button
                  onClick={onSave}
                  className="px-3 sm:px-4 py-2 min-h-[44px] bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition text-sm border border-white/30 whitespace-nowrap"
                >
                  {saveLabel}
                </button>
             )}
          </div>
        </div>
        <div className={`p-4 sm:p-6 rounded-b-2xl ${opaqueBody ? 'bg-white/95' : 'bg-slate-700/80 backdrop-blur-md'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}; 