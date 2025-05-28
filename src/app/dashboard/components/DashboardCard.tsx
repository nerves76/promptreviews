import React from 'react';

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function DashboardCard({ children, className = '' }: DashboardCardProps) {
  return (
    <div className={`min-h-screen pt-6 pb-12 px-6 md:px-8 max-w-[1000px] w-full mx-auto bg-white rounded-lg shadow-lg p-8 relative mt-0 md:mt-[30px] ${className}`}>
      {children}
    </div>
  );
} 