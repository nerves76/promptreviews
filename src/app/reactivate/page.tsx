/**
 * Account Reactivation Page
 * 
 * CRITICAL: Standalone page for account reactivation
 * Used when users access a direct link or are redirected here
 * 
 * @route /reactivate
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AccountReactivation from '@/components/AccountReactivation';

export default function ReactivatePage() {
  const router = useRouter();
  const { isAuthenticated, account } = useAuth();

  // ============================================
  // CHECK AUTH STATUS
  // ============================================
  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (!isAuthenticated) {
      router.push('/sign-in?redirect=/reactivate');
    }
  }, [isAuthenticated, router]);

  // ============================================
  // HANDLE EVENTS
  // ============================================
  const handleReactivated = () => {
    console.log('✅ Account reactivated, redirecting to pricing...');
    // The component handles the redirect
  };

  const handleSkip = () => {
    console.log('⏭️ User skipped reactivation');
    router.push('/dashboard');
  };

  // ============================================
  // RENDER
  // ============================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <AccountReactivation 
      onReactivated={handleReactivated}
      onSkip={handleSkip}
    />
  );
}