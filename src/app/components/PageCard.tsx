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
    <div className="page-container flex justify-center items-start w-full mt-10 mb-10 pl-24 pl-8 pt-8 -ml-8">
      <div className={`page relative w-full max-w-[1000px] rounded-lg bg-white shadow-lg p-8 md:p-12 ${className}`}>
        {icon && (
          <div className="icon absolute -top-[21px] -left-[21px] z-10 bg-white rounded-full shadow p-3 flex items-center justify-center w-16 h-16">
            {icon}
          </div>
        )}
        <div className="content w-full px-1 pt-1">
          {children}
        </div>
      </div>
    </div>
  );
} 