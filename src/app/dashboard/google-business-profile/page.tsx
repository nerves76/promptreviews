/**
 * Google Business Profile Redirect Page
 * Redirects to the new Social Posting dashboard
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLoader from '@/app/components/AppLoader';

export default function GoogleBusinessProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new social posting route
    router.replace('/dashboard/google-business');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <AppLoader />
        <p className="mt-4 text-gray-600">Redirecting to Social Posting...</p>
      </div>
    </div>
  );
} 