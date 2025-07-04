import { useEffect, useState } from 'react';

/**
 * Centralized hook to handle client-side only rendering
 * This prevents hydration mismatches by ensuring consistent behavior
 */
export function useClientOnly() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}