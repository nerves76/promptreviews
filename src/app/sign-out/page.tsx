'use client';

import { useEffect } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

export default function SignOut() {
  useEffect(() => {
    const signOut = async () => {
      const supabase = createPagesBrowserClient();
      await supabase.auth.signOut();
      window.location.href = '/auth/sign-in';
    };
    signOut();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Signing out...</h1>
      </div>
    </div>
  );
} 