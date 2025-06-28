import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { getUserOrMock } from "@/utils/supabase";
import { getAccountIdForUser } from "@/utils/accountUtils";

interface AuthGuardOptions {
  requireBusinessProfile?: boolean;
  redirectToCreateBusiness?: boolean;
}

export function useAuthGuard(options: AuthGuardOptions = {}) {
  const { requireBusinessProfile = false, redirectToCreateBusiness = false } = options;
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await getUserOrMock(supabase);

      if (userError || !user) {
        router.push("/auth/sign-in");
        return;
      }

      // Check if user is admin
      const { data: adminData } = await supabase
        .from("admins")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (adminData) {
        router.push("/admin");
        return;
      }

      // For new users or when redirectToCreateBusiness is true, redirect to create business
      if (redirectToCreateBusiness) {
        router.push("/dashboard/create-business");
        return;
      }

      // Check if user has a business profile
      if (requireBusinessProfile) {
        const accountId = await getAccountIdForUser(user.id);
        
        if (!accountId) {
          // New user - redirect to create business page
          router.push("/dashboard/create-business");
          return;
        }

        const { data: businessData } = await supabase
          .from("businesses")
          .select("id")
          .eq("account_id", accountId)
          .single();

        if (!businessData) {
          // User has account but no business - redirect to create business page
          router.push("/dashboard/create-business");
          return;
        }
      }
    };

    checkAuthAndProfile();
  }, [router, requireBusinessProfile, redirectToCreateBusiness]);
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
          .eq("user_id", user.id)
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
