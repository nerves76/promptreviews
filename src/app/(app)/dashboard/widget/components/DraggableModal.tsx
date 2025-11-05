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
      // Center modal on screen with a medium size
      const modalWidth = 576; // Corresponds to max-w-xl
      const modalHeight = 600;
      const x = Math.max(0, (window.innerWidth - modalWidth) / 2);
      const y = Math.max(0, (window.innerHeight - modalHeight) / 2);
      setModalPos({ x, y });
    }
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
            ? 'bg-white/95 border border-gray-200'
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
        {/* Circular close button that exceeds modal borders */}
          <button
          className="absolute -top-3 -right-3 bg-white/70 backdrop-blur-sm border border-white/40 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 focus:outline-none z-20 transition-colors p-2"
          style={{ width: 36, height: 36 }}
            onClick={onClose}
          aria-label="Close modal"
          >
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

        <div className="modal-header flex items-center justify-between p-4 cursor-move bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 rounded-t-2xl">
          <div className="w-1/3">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
          </div>
          <div className="w-1/3 flex justify-center">
             <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
               <Icon name="FaArrowsAlt" className="text-white" size={16} />
             </div>
          </div>
          <div className="w-1/3 flex justify-end items-center gap-2 pr-8">
             {onReset && (
                <button
                   onClick={onReset}
                   className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition text-sm border border-white/30"
                >
                   {resetLabel}
               </button>
             )}
             {onSave && (
                <button
                  onClick={onSave}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition text-sm border border-white/30"
                >
                  {saveLabel}
                </button>
             )}
          </div>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}; 