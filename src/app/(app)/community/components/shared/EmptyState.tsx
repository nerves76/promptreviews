/**
 * EmptyState Component
 *
 * Generic empty state display with icon, title, description, and optional action
 */

'use client';

import { Button } from '@/app/(app)/components/ui/button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="text-6xl mb-4 opacity-50">{icon}</div>

      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>

      {description && <p className="text-white/70 max-w-md mb-6">{description}</p>}

      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  );
}
