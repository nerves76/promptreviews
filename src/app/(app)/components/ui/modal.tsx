'use client';

import { Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';

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

/** Footer section for actions */
function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('mt-6 flex justify-end gap-3', className)}>
      {children}
    </div>
  );
}

// ============================================
// Main Modal Component
// ============================================

function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className,
  allowOverflow = false,
}: ModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        {/* Panel container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'relative w-full transform rounded-2xl bg-white p-6 shadow-xl transition-all',
                  sizeClasses[size],
                  (allowOverflow || showCloseButton) ? 'overflow-visible' : 'overflow-hidden',
                  className
                )}
              >
                {/* Standardized red X close button */}
                {showCloseButton && (
                  <button
                    className="absolute -top-3 -right-3 bg-white/90 border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-50"
                    style={{ width: 48, height: 48 }}
                    onClick={onClose}
                    aria-label="Close modal"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {/* Title */}
                {title && (
                  <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
                    {title}
                  </Dialog.Title>
                )}
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Attach sub-components
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export { Modal };
export type { ModalProps, ModalSize };
