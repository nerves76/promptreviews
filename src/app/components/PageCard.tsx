import React from 'react';

/*
 * USAGE INSTRUCTION:
 *
 * For consistent page layout and margin below the card, always wrap <PageCard> in a parent div with:
 *   className="min-h-screen flex justify-center items-start px-4 sm:px-0"
 * This matches the Dashboard and ensures proper spacing on all new pages.
 *
 * Example:
 *   <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
 *     <PageCard icon={<FaStar />}> ... </PageCard>
 *   </div>
 */

/**
 * PageCard component
 *
 * Usage: For main page/card layout, floating top-left icon, and card-level actions.
 * - Always use for dashboard and prompt page forms.
 * - Pass the icon prop for a floating, breaching icon in the top-left.
 * - Use topRightAction and bottomRightAction for action buttons.
 * - Wrap in a parent div with min-h-screen flex justify-center for spacing.
 *
 * See DESIGN_GUIDELINES.md for visual rules and examples.
 */

export default function PageCard({
  icon,
  children,
  className = '',
  topRightAction,
  bottomRightAction,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  topRightAction?: React.ReactNode;
  bottomRightAction?: React.ReactNode;
}) {
  return (
    <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-12 md:mt-16 lg:mt-20 mb-16 flex justify-center items-start">
      <div className={`page relative w-full max-w-[1000px] rounded-2xl bg-white shadow-lg pt-4 px-8 md:px-12 pb-8 ${className}`}>
        {icon && (
          <div className="icon absolute -top-2 -left-2 sm:-top-[21px] sm:-left-[21px] z-10 bg-white rounded-full shadow p-2 sm:p-3 flex items-center justify-center w-10 h-10 sm:w-16 sm:h-16">
            {React.isValidElement(icon) && typeof icon.type === 'string'
              ? React.cloneElement(icon as React.ReactElement<any>, {
                  className: [
                    (icon.props as any).className || '',
                    'w-6 h-6 sm:w-9 sm:h-9 text-slate-blue'
                  ].filter(Boolean).join(' ')
                })
              : icon}
          </div>
        )}
        {/* Top-right action button */}
        {topRightAction && (
          <div className="absolute top-4 right-4 z-20 mr-4">{topRightAction}</div>
        )}
        <div className={`content w-full px-1 pt-2 sm:pt-0${icon ? ' pl-2 sm:pl-0' : ''}`}>
          {children}
        </div>
        {/* Bottom-right action button */}
        {bottomRightAction && (
          <>
            <div className="flex justify-end mt-8 mb-2">
              {bottomRightAction}
            </div>
            <div className="h-16" />
          </>
        )}
      </div>
    </div>
  );
} 