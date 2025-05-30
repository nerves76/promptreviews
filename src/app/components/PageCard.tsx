import React from 'react';

export default function PageCard({
  icon,
  children,
  className = '',
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-12 md:mt-16 lg:mt-20 mb-16 flex justify-center items-start">
      <div className={`page relative w-full max-w-[1000px] rounded-2xl bg-white shadow-lg pt-4 px-8 md:px-12 ${className}`}>
        {icon && (
          <div className="icon absolute -top-[21px] -left-[21px] z-10 bg-white rounded-full shadow p-3 flex items-center justify-center w-16 h-16">
            {icon}
          </div>
        )}
        <div className="content w-full px-1">
          {children}
        </div>
      </div>
    </div>
  );
} 