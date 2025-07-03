import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabaseClient";

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
        console.log('🔐 useAuthGuard: Starting authentication check...');
        
        // Use the new SSR-compatible client
        const supabase = createClient();
        
        // Get the current user using the same method as the server
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          console.log('❌ useAuthGuard: Authentication check failed:', error.message);
          setShouldRedirect(true);
          setLoading(false);
          return;
        }

        if (!user) {
          console.log('ℹ️  useAuthGuard: No authenticated user found, redirecting to sign-in');
          setShouldRedirect(true);
          setLoading(false);
          return;
        }

        console.log('✅ useAuthGuard: User authenticated:', user.id);

        // If we require business profile, check for it
        if (requireBusinessProfile) {
          console.log('📊 useAuthGuard: Checking business profile requirement...');
          
          // Check for existing account/business
          const { data: accounts, error: accountError } = await supabase
            .from('accounts')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

          if (accountError) {
            console.error('❌ useAuthGuard: Error checking business profile:', accountError);
            // Don't redirect on database errors, just log them
            setLoading(false);
            return;
          }

          const hasBusiness = accounts && accounts.length > 0;
          console.log('📊 useAuthGuard: Business profile check result:', { hasBusiness });

          if (!hasBusiness && redirectToCreateBusiness) {
            console.log('🔄 useAuthGuard: No business profile found, redirecting to create business');
            router.push('/dashboard/create-business');
            setLoading(false);
            return;
          }
        }

        console.log('✅ useAuthGuard: Authentication and profile checks passed');
        setLoading(false);
        
      } catch (error) {
        console.error('💥 useAuthGuard: Unexpected error:', error);
        setShouldRedirect(true);
        setLoading(false);
      }
    };

    checkAuthAndProfile();
  }, [requireBusinessProfile, redirectToCreateBusiness, router]);

  // Handle redirect outside of the main effect to avoid loops
  useEffect(() => {
    if (shouldRedirect && !loading) {
      console.log('🔄 useAuthGuard: Redirecting to sign-in page');
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

  useEffect(() => {
    const checkBusinessProfile = async () => {
      try {
        console.log('📊 useBusinessProfile: Checking business profile...');
        
        const supabase = createClient();
        
        // Get current user first
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.log('❌ useBusinessProfile: No authenticated user');
          setLoading(false);
          return;
        }

        console.log('📊 useBusinessProfile: User found:', user.id);

        // Check for business account
        const { data: accounts, error: accountError } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (accountError) {
          console.error('❌ useBusinessProfile: Error checking accounts:', accountError);
          setLoading(false);
          return;
        }

        if (accounts && accounts.length > 0) {
          console.log('✅ useBusinessProfile: Business profile found:', accounts[0].id);
          setHasBusiness(true);
          setBusinessId(accounts[0].id);
        } else {
          console.log('📊 useBusinessProfile: No account found, setting hasBusiness to false');
          setHasBusiness(false);
          setBusinessId(null);
        }

        setLoading(false);

      } catch (error) {
        console.error('💥 useBusinessProfile: Unexpected error:', error);
        setLoading(false);
      }
    };

    checkBusinessProfile();
  }, []);

  return { loading, hasBusiness, businessId };
}
