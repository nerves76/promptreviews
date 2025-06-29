import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { getUserOrMock } from "@/utils/supabase";
import { getAccountIdForUser } from "@/utils/accountUtils";

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
      setLoading(true);
      setShouldRedirect(false);
      
      try {
        // First check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.log("Auth guard: Session error:", sessionError);
          // Don't redirect immediately on session error, give it more time
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try again
          const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();
          if (retryError || !retrySession) {
            console.log("Auth guard: Still no session after retry, redirecting to sign-in");
            setShouldRedirect(true);
            router.push("/auth/sign-in");
            setLoading(false);
            return;
          }
        }

        if (!session) {
          console.log("Auth guard: No session found, redirecting to sign-in");
          setShouldRedirect(true);
          router.push("/auth/sign-in");
          setLoading(false);
          return;
        }

        // Get user data
        const {
          data: { user },
          error: userError,
        } = await getUserOrMock(supabase);

        if (userError) {
          console.log("Auth guard: User error:", userError);
          // If it's an AuthSessionMissingError, wait a bit more
          if (userError && typeof userError === 'object' && 'message' in userError && 
              typeof userError.message === 'string' && userError.message.includes('Auth session missing')) {
            console.log("Auth guard: Auth session missing, waiting...");
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Try again
            const {
              data: { user: retryUser },
              error: retryError,
            } = await getUserOrMock(supabase);
            
            if (retryError || !retryUser) {
              console.log("Auth guard: Still no user after retry, redirecting to sign-in");
              setShouldRedirect(true);
              router.push("/auth/sign-in");
              setLoading(false);
              return;
            }
          } else {
            console.log("Auth guard: User error, redirecting to sign-in");
            setShouldRedirect(true);
            router.push("/auth/sign-in");
            setLoading(false);
            return;
          }
        }

        if (!user) {
          console.log("Auth guard: No user found, redirecting to sign-in");
          setShouldRedirect(true);
          router.push("/auth/sign-in");
          setLoading(false);
          return;
        }

        // If we need to check for business profile
        if (requireBusinessProfile || redirectToCreateBusiness) {
          try {
            // Get account ID
            const accountId = await getAccountIdForUser(user.id, supabase);
            
            if (!accountId) {
              console.log("Auth guard: No account found, redirecting to create business");
              setShouldRedirect(true);
              router.push("/dashboard/create-business");
              setLoading(false);
              return;
            }

            // Check for businesses
            const { data: businesses, error: businessError } = await supabase
              .from("businesses")
              .select("id")
              .eq("account_id", accountId);

            if (businessError) {
              console.log("Auth guard: Business check error:", businessError);
              // Don't redirect on error, let the user continue
              setLoading(false);
              return;
            }

            if (!businesses || businesses.length === 0) {
              console.log("Auth guard: No businesses found, redirecting to create business");
              setShouldRedirect(true);
              router.push("/dashboard/create-business");
              setLoading(false);
              return;
            }
          } catch (error) {
            console.log("Auth guard: Error checking business profile:", error);
            // Don't redirect on error, let the user continue
            setLoading(false);
            return;
          }
        }

        // User is authenticated and has required profile
        setLoading(false);
      } catch (error) {
        console.log("Auth guard: Unexpected error:", error);
        // Don't redirect on unexpected errors, let the user continue
        setLoading(false);
      }
    };

    checkAuthAndProfile();
  }, [router, requireBusinessProfile, redirectToCreateBusiness]);

  return { loading, shouldRedirect };
}

/**
 * Hook to check if user has a business profile
 * Returns loading state and whether user has business
 */
export function useBusinessProfile() {
  const [hasBusiness, setHasBusiness] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBusinessProfile = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await getUserOrMock(supabase);

        if (userError || !user) {
          setHasBusiness(false);
          setLoading(false);
          return;
        }

        // Check if user is admin
        const { data: adminData } = await supabase
          .from("admins")
          .select("id")
          .eq("account_id", user.id)
          .single();

        if (adminData) {
          setHasBusiness(true); // Admins can access everything
          setLoading(false);
          return;
        }

        const accountId = await getAccountIdForUser(user.id);
        
        if (!accountId) {
          setHasBusiness(false);
          setLoading(false);
          return;
        }

        const { data: businessData } = await supabase
          .from("businesses")
          .select("id")
          .eq("account_id", accountId)
          .single();

        setHasBusiness(!!businessData);
        setLoading(false);
      } catch (error) {
        console.error("Error checking business profile:", error);
        setHasBusiness(false);
        setLoading(false);
      }
    };

    checkBusinessProfile();
  }, []);

  return { hasBusiness, loading };
}

/**
 * Hook to check if user is a new user (no account or no business)
 * Returns loading state and whether user is new
 */
export function useNewUserCheck() {
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkNewUser = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await getUserOrMock(supabase);

        if (userError || !user) {
          setIsNewUser(false);
          setLoading(false);
          return;
        }

        // Check if user is admin
        const { data: adminData } = await supabase
          .from("admins")
          .select("id")
          .eq("account_id", user.id)
          .single();

        if (adminData) {
          setIsNewUser(false); // Admins are not new users
          setLoading(false);
          return;
        }

        const accountId = await getAccountIdForUser(user.id);
        
        if (!accountId) {
          setIsNewUser(true);
          setLoading(false);
          return;
        }

        const { data: businessData } = await supabase
          .from("businesses")
          .select("id")
          .eq("account_id", accountId)
          .single();

        setIsNewUser(!businessData);
        setLoading(false);
      } catch (error) {
        console.error("Error checking if user is new:", error);
        setIsNewUser(false);
        setLoading(false);
      }
    };

    checkNewUser();
  }, []);

  return { isNewUser, loading };
}
