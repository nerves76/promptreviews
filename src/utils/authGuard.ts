import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
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
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

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
