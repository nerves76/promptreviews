'use client';

import { Fragment, ReactNode, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { cn } from '@/lib/utils';
import Icon from '@/components/Icon';

// ============================================
// Types
// ============================================

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
type ModalTheme = 'light' | 'dark';

interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title (optional - omit for custom headers) */
  title?: string;
  /** Modal content */
  children: ReactNode;
  /** Modal width - defaults to 'md' */
  size?: ModalSize;
  /** Show close button in header - defaults to true */
  showCloseButton?: boolean;
  /** Additional classes for the modal panel */
  className?: string;
  /** Allow overflow (for dropdowns inside modal) - defaults to false */
  allowOverflow?: boolean;
  /** Modal theme - defaults to 'light' */
  theme?: ModalTheme;
  /** Enable drag-to-move functionality */
  draggable?: boolean;
  /** Use lighter backdrop (for draggable modals on public pages) */
  lightBackdrop?: boolean;
  /** Header action buttons for draggable modals */
  headerActions?: ReactNode;
}

interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
}

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

// ============================================
// Size Classes
// ============================================

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  full: 'max-w-full mx-4',
};

// Size in pixels for centering draggable modals
const sizePixels: Record<ModalSize, number> = {
  sm: 384,
  md: 448,
  lg: 512,
  xl: 576,
  '2xl': 672,
  '3xl': 768,
  '4xl': 896,
  full: 1024,
};

// ============================================
// Sub-components for composition
// ============================================

/** Optional header section for custom headers */
function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

/** Body section with standard spacing */
function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  );
}

/** Footer section for actions - stacks on mobile, inline on larger screens */
function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3', className)}>
      {children}
    </div>
  );
}

// ============================================
// Standard Modal Component (non-draggable)
// ============================================

function StandardModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className,
  allowOverflow = false,
  theme = 'light',
}: Omit<ModalProps, 'draggable' | 'lightBackdrop' | 'headerActions'>) {
  const isDark = theme === 'dark';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} aria-label={title || "Modal dialog"}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className={isDark ? "fixed inset-0 bg-black/50 backdrop-blur-sm" : "fixed inset-0 bg-black/30 backdrop-blur-sm"} />
        </Transition.Child>

        {/* Panel container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              {/* Wrapper div: positions close button outside Panel so Panel can scroll */}
              <div className={cn('relative w-full my-auto', sizeClasses[size])}>
                {/* Close button - in wrapper so it's not clipped by Panel overflow */}
                {showCloseButton && (
                  <button
                    className={cn(
                      "absolute top-2 right-2 sm:-top-3 sm:-right-3 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-50",
                      isDark
                        ? "bg-white/20 border border-white/30 hover:bg-white/30"
                        : "bg-white/50 backdrop-blur-md border border-white/40 hover:bg-white/70"
                    )}
                    style={{ width: 48, height: 48 }}
                    onClick={onClose}
                    aria-label="Close modal"
                  >
                    <svg className={cn("w-4 h-4", isDark ? "text-white" : "text-red-600")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <Dialog.Panel
                  className={cn(
                    'w-full transform rounded-2xl p-4 sm:p-6 shadow-xl transition-all',
                    'max-h-[calc(100vh_-_4rem)] flex flex-col',
                    allowOverflow ? 'overflow-visible' : 'overflow-y-auto',
                    isDark
                      ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white'
                      : 'bg-white/70 backdrop-blur-xl border border-white/30',
                    className
                  )}
                >
                  {/* Title */}
                  {title && (
                    <Dialog.Title className={cn(
                      "text-lg font-semibold mb-4",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      {title}
                    </Dialog.Title>
                  )}
                  {children}
                </Dialog.Panel>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// ============================================
// Draggable Modal Component
// ============================================

function DraggableModalInner({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className,
  lightBackdrop = false,
  headerActions,
}: Omit<ModalProps, 'theme' | 'allowOverflow' | 'draggable'>) {
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      // Center modal on screen
      const modalWidth = sizePixels[size];
      const modalHeight = 600;
      const x = Math.max(0, (window.innerWidth - modalWidth) / 2);
      const y = Math.max(0, (window.innerHeight - modalHeight) / 2);
      setModalPos({ x, y });

      // Lock body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, size]);

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

    // Touch events for mobile support
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        setModalPos({
          x: touch.clientX - dragOffset.x,
          y: touch.clientY - dragOffset.y,
        });
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('.modal-header') && e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragOffset({
        x: touch.clientX - modalPos.x,
        y: touch.clientY - modalPos.y,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50" aria-label={title || "Draggable modal dialog"}>
      {/* Backdrop */}
      <div
        className={lightBackdrop ? "fixed inset-0 bg-black/20" : "fixed inset-0 bg-black/50 backdrop-blur-sm"}
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div
        className={cn(
          'rounded-2xl shadow-2xl w-full relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-white/20 backdrop-blur-sm',
          sizeClasses[size],
          className
        )}
        style={{
          position: 'absolute',
          left: modalPos.x,
          top: modalPos.y,
          transform: 'none',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Close button - inside on mobile, outside on larger screens */}
        {showCloseButton && (
          <button
            className="absolute top-2 right-2 sm:-top-3 sm:-right-3 bg-white/50 backdrop-blur-md border border-white/40 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-50"
            style={{ width: 48, height: 48 }}
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Draggable header */}
        <div className="modal-header flex items-center justify-between p-4 cursor-move bg-white/10 backdrop-blur-md rounded-t-2xl">
          <div className="w-1/3">
            {title && (
              <h2 className="text-xl font-semibold text-slate-600">{title}</h2>
            )}
          </div>
          <div className="w-1/3 flex justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
              <Icon name="FaArrowsAlt" className="text-white" size={16} />
            </div>
          </div>
          <div className="w-1/3 flex justify-end items-center gap-2 pr-8">
            {headerActions}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 bg-white/70 backdrop-blur-xl rounded-b-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Modal Component (router)
// ============================================

function Modal({
  draggable = false,
  ...props
}: ModalProps) {
  if (draggable) {
    return <DraggableModalInner {...props} />;
  }
  return <StandardModal {...props} />;
}

// Attach sub-components
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export { Modal };
export type { ModalProps, ModalSize, ModalTheme };
