import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { getUserOrMock } from '@/utils/supabase';

interface AuthGuardOptions {
  requireBusinessProfile?: boolean;
}

export function useAuthGuard(options: AuthGuardOptions = {}) {
  const { requireBusinessProfile = true } = options;
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await getUserOrMock(supabase);
      if (!user) {
        await supabase.auth.signOut();
        router.push('/auth/sign-in');
        return;
      }
      if (requireBusinessProfile) {
        // Check for business profile
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('account_id', user.id)
          .single();
        if (!business) {
          router.push('/dashboard/create-business');
          return;
        }
      }
    };
    checkAuthAndProfile();
    // Only run on mount
    // eslint-disable-next-line
  }, [requireBusinessProfile]);
} 