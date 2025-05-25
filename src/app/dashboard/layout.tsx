'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import Header from '@/app/components/Header';
import { Dialog } from '@headlessui/react';
import { isAccountBlocked } from '@/utils/accountLimits';
import { getUserOrMock } from '@/utils/supabase';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBlocked = async () => {
      const { data: { user } } = await getUserOrMock(supabase);
      if (!user) {
        setBlocked(false);
        setLoading(false);
        return;
      }
      const blockedResult = await isAccountBlocked(supabase, user.id);
      setBlocked(blockedResult);
      setLoading(false);
    };
    checkBlocked();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/sign-in');
  };

  if (loading) return null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-blue to-[#FFDAB9]">
      <Header />
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="w-full px-4 mt-16 mb-12">
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </div>
      </main>
      <Dialog open={blocked} onClose={() => {}} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto p-8 z-10">
            <Dialog.Title className="text-lg font-bold mb-4">
              Trial Ended
            </Dialog.Title>
            <Dialog.Description className="mb-6 text-gray-700 whitespace-pre-line">
              Your free trial has ended. To continue using PromptReviews, please upgrade your plan.
            </Dialog.Description>
            <button
              className="w-full py-2 px-4 bg-dustyPlum text-white rounded-md hover:bg-lavenderHaze font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dustyPlum"
              onClick={() => router.push('/upgrade')}
            >
              Upgrade now
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
} 