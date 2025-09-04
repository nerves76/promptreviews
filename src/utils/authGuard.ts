import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabaseClient";

// 🔧 CONSOLIDATED: Shared client instance to eliminate duplicate createClient calls
const supabase = createClient();

interface AuthGuardOptions {
  requireBusinessProfile?: boolean;
  redirectToCreateBusiness?: boolean;
}

interface AuthGuardResult {
  loading: boolean;
  shouldRedirect: boolean;
}

export function useAuthGuard(options: AuthGuardOptions = {}): AuthGuardResult {
  const { requireBusinessProfile = false, redirectToCreateBusiness = false } = options;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      try {
        // DEVELOPMENT MODE BYPASS - Check for dev bypass flag
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
          const devBypass = localStorage.getItem('dev_auth_bypass');
          if (devBypass === 'true') {
            // Mock user is authenticated, no business profile checking needed in dev mode
            setLoading(false);
            setShouldRedirect(false);
            return;
          }
        }

        // 🔧 CONSOLIDATED: Use shared client instance
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          setShouldRedirect(true);
          setLoading(false);
          return;
        }

        if (!user) {
          setShouldRedirect(true);
          setLoading(false);
          return;
        }

        // If we require business profile, check for it
        if (requireBusinessProfile) {
          // Check for existing account/business
          const { data: accounts, error: accountError } = await supabase
            .from('accounts')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

          if (accountError) {
            console.error('AuthGuard: Error checking business profile:', accountError);
            // Don't redirect on database errors, just log them
            setLoading(false);
            return;
          }

          const hasBusiness = accounts && accounts.length > 0;

          if (!hasBusiness && redirectToCreateBusiness) {
            router.push('/dashboard/create-business');
            setLoading(false);
            return;
          }
        }

        setLoading(false);
        
      } catch (error) {
        console.error('AuthGuard: Unexpected error:', error);
        setShouldRedirect(true);
        setLoading(false);
      }
    };

    checkAuthAndProfile();
  }, [requireBusinessProfile, redirectToCreateBusiness, router]);

  // Handle redirect outside of the main effect to avoid loops
  useEffect(() => {
    if (shouldRedirect && !loading) {
      router.push('/auth/sign-in');
    }
  }, [shouldRedirect, loading, router]);

  return { loading, shouldRedirect };
}

// Business profile hook - separate from auth guard for cleaner separation
export function useBusinessProfile() {
  const [loading, setLoading] = useState(true);
  const [hasBusiness, setHasBusiness] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const checkBusinessProfile = async () => {
    try {
      
      // DEVELOPMENT MODE BYPASS - Check for dev bypass flag
      if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
        const devBypass = localStorage.getItem('dev_auth_bypass');
        if (devBypass === 'true') {
                  setHasBusiness(true);
        setBusinessId('12345678-1234-5678-9abc-123456789012'); // Same mock account ID
          setLoading(false);
          return;
        }
      }
      
      // 🔧 CONSOLIDATED: Use shared client instance
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setLoading(false);
        return;
      }

      // Get the currently selected account (respects account switching)
      // NOTE: This is acceptable here since this hook is meant to determine the current account
      // and check if it has a business profile, not operate on a specific provided account
      const { getAccountIdForUser } = await import('@/auth/utils/accounts');
      const accountId = await getAccountIdForUser(user.id);

      if (accountId) {
        // Check if this account has a business profile
        const { data: businesses, error: businessError } = await supabase
          .from('businesses')
          .select('id')
          .eq('account_id', accountId)
          .limit(1);

        if (businessError) {
          console.error('BusinessProfile: Error checking businesses:', businessError);
          setLoading(false);
          return;
        }

        setHasBusiness(businesses && businesses.length > 0);
        setBusinessId(accountId);
      } else {
        setHasBusiness(false);
        setBusinessId(null);
      }

      setLoading(false);

    } catch (error) {
      console.error('BusinessProfile: Unexpected error:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBusinessProfile();
  }, [refreshCounter]);

  const refresh = () => {
    setLoading(true);
    setRefreshCounter(prev => prev + 1);
  };

  return { loading, hasBusiness, businessId, refresh };
}
