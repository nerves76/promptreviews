import React, { useState, useEffect } from 'react';

interface DraggableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave?: () => void;
  saveLabel?: string;
  maxWidth?: string;
}

export const DraggableModal: React.FC<DraggableModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  saveLabel = 'Save',
  maxWidth = 'max-w-xl',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className={`bg-white rounded-lg shadow-xl w-full ${maxWidth} pointer-events-auto relative`}
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
          className="absolute -top-4 -right-4 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 focus:outline-none z-20 transition-colors"
          style={{ width: 40, height: 40 }}
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="modal-header flex items-center justify-between p-6 border-b cursor-move">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <div className="p-6">
          {children}
        </div>
        {onSave && (
          <div className="p-6 border-t flex justify-end">
            <button
              onClick={onSave}
              className="px-6 py-2 bg-slate-blue text-white rounded hover:bg-slate-700 transition"
            >
              {saveLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 