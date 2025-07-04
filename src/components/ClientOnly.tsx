import React from 'react';
import { useClientOnly } from '@/hooks/useClientOnly';

/**
 * Higher-order component to wrap client-only components
 * This ensures they only render on the client side to prevent hydration mismatches
 */
export function ClientOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isClient = useClientOnly();
  
  if (!isClient) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export default ClientOnly;