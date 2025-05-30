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
          <div className="icon absolute -top-2 -left-2 sm:-top-[21px] sm:-left-[21px] z-10 bg-white rounded-full shadow p-2 sm:p-3 flex items-center justify-center w-10 h-10 sm:w-16 sm:h-16">
            {React.cloneElement(icon, { className: 'w-6 h-6 sm:w-9 sm:h-9 text-slate-blue' })}
          </div>
        )}
        <div className={`content w-full px-1 pt-2 sm:pt-0${icon ? ' pl-2 sm:pl-0' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
} 