/**
 * Guard hook to prevent cancelled accounts from accessing protected pages
 * Redirects cancelled/no-plan accounts to the dashboard for reactivation
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/auth';

interface UseCancelledAccountGuardOptions {
  allowedPaths?: string[];
  redirectTo?: string;
}

export function useCancelledAccountGuard(options: UseCancelledAccountGuardOptions = {}) {
  const { 
    allowedPaths = ['/dashboard', '/dashboard/plan', '/auth', '/'], 
    redirectTo = '/dashboard?reactivation=true' 
  } = options;
  
  const router = useRouter();
  const { account, isInitialized } = useAuth();
  
  useEffect(() => {
    if (!isInitialized || !account) return;
    
    // Check if account is cancelled or has no plan
    const isCancelled = account.deleted_at !== null && account.deleted_at !== undefined;
    const hasNoPlan = !account.plan || account.plan === 'no_plan' || account.plan === 'NULL';
    
    if (isCancelled || hasNoPlan) {
      // Check if current path is allowed
      const currentPath = window.location.pathname;
      const isAllowed = allowedPaths.some(path => 
        currentPath === path || currentPath.startsWith(path + '/')
      );
      
      if (!isAllowed) {
        console.log('🚫 Cancelled account accessing protected route:', currentPath);
        router.push(redirectTo);
      }
    }
  }, [account, isInitialized, router, allowedPaths, redirectTo]);
  
  // Return status for components that want to show custom UI
  return {
    isCancelled: account?.deleted_at !== null && account?.deleted_at !== undefined,
    hasNoPlan: !account?.plan || account?.plan === 'no_plan' || account?.plan === 'NULL',
    isBlocked: (account?.deleted_at !== null && account?.deleted_at !== undefined) || 
               (!account?.plan || account?.plan === 'no_plan' || account?.plan === 'NULL')
  };
}