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

  const redirectToHome = useCallback((reason?: string) => {
    console.log(`[useRedirectManager] Redirecting to home${reason ? `: ${reason}` : ''}`);
    router.push('/');
  }, [router]);

  const redirectToCreateBusiness = useCallback((reason?: string) => {
    console.log(`[useRedirectManager] Redirecting to create-business${reason ? `: ${reason}` : ''}`);
    router.push('/dashboard/create-business');
  }, [router]);

  const redirectToPlan = useCallback((reason?: string) => {
    console.log(`[useRedirectManager] Redirecting to plan${reason ? `: ${reason}` : ''}`);
    router.push('/dashboard/plan');
  }, [router]);

  return {
    redirectToDashboard,
    redirectToSignIn,
    redirectToHome,
    redirectToCreateBusiness,
    redirectToPlan,
  };
}