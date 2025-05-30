import React from 'react';

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function DashboardCard({ children }: DashboardCardProps) {
  return children;
} 