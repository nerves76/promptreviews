import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useRedirectManager() {
  const router = useRouter();

  const redirectToDashboard = useCallback((reason?: string) => {
    console.log(`[useRedirectManager] Redirecting to dashboard${reason ? `: ${reason}` : ''}`);
    router.push('/dashboard');
  }, [router]);

  const redirectToSignIn = useCallback((reason?: string) => {
    console.log(`[useRedirectManager] Redirecting to sign-in${reason ? `: ${reason}` : ''}`);
    router.push('/auth/sign-in');
  }, [router]);

  return {
    redirectToDashboard,
    redirectToSignIn,
  };
}