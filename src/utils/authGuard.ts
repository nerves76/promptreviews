import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getUserOrMock } from "@/utils/supabase";
import { getAccountIdForUser } from "@/utils/accountUtils";

interface AuthGuardOptions {
  requireBusinessProfile?: boolean;
}

export function useAuthGuard(options: AuthGuardOptions = {}) {
  const { requireBusinessProfile = true } = options;
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          }
        }
      );
      const {
        data: { user },
      } = await getUserOrMock(supabase);
      if (!user) {
        await supabase.auth.signOut();
        router.push("/auth/sign-in");
        return;
      }

      // Check if user is an admin
      const { data: adminData } = await supabase
        .from("admins")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (requireBusinessProfile) {
        // Get account ID using the utility function
        const accountId = await getAccountIdForUser(user.id, supabase);
        
        if (!accountId) {
          console.error("No account found for user:", user.id);
          
          // If user is an admin, redirect to admin page instead of create-business
          if (adminData) {
            router.push("/admin");
            return;
          }
          
          router.push("/dashboard/create-business");
          return;
        }

        // Then check for business profile using the account ID
        const { data: business } = await supabase
          .from("businesses")
          .select("id")
          .eq("account_id", accountId)
          .single();
          
        if (!business) {
          // If user is an admin, redirect to admin page instead of create-business
          if (adminData) {
            router.push("/admin");
            return;
          }
          
          router.push("/dashboard/create-business");
          return;
        }
      }
    };
    checkAuthAndProfile();
    // Only run on mount
    // eslint-disable-next-line
  }, [requireBusinessProfile]);
}
