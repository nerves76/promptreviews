/*
 * PageTitle component
 * 
 * Provides consistent page title positioning across all pages in the app.
 * Matches the pattern used in business profile page for standardized layout.
 * 
 * Usage:
 * <PageTitle 
 *   title="Your Business"
 *   subCopy="Fill out your business info to help Prompty AI generate authentic reviews."
 *   rightAction={<button>Save</button>}
 * />
 */

import React from 'react';

interface PageTitleProps {
  title: string;
  subCopy?: string;
  rightAction?: React.ReactNode;
  className?: string;
}

export default function PageTitle({
  title,
  subCopy,
  rightAction,
  className = ""
}: PageTitleProps) {
  return (
    <div className={`flex items-start justify-between mt-2 mb-4 ${className}`}>
      <div className="flex flex-col mt-0 md:mt-[3px]">
        <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
          {title}
        </h1>
        {subCopy && (
          <p className="text-gray-600 text-base max-w-md mt-0 mb-10">
            {subCopy}
          </p>
        )}
      </div>
      {rightAction && (
        <div 
          className="flex items-start pr-4 md:pr-6"
          style={{ alignSelf: "flex-start" }}
        >
          <div style={{ marginTop: "0.25rem" }}>
            {rightAction}
          </div>
        </div>
      )}
    </div>
  );
} 