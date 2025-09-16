import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useRequirePlan(account: any, business: any = null, exemptPaths: string[] = []) {
  const router = useRouter();

  useEffect(() => {
    if (!account) return;
    if (typeof window === "undefined") return;
    
    const currentPath = window.location.pathname;
    
    // Default exempt paths for business setup
    const defaultExemptPaths = [
      "/dashboard/create-business",
      "/dashboard/business-profile",
      "/auth",
      "/sign-in",
      "/sign-up"
    ];
    
    const allExemptPaths = [...defaultExemptPaths, ...exemptPaths];
    
    // Only require plan if:
    // 1. User has no plan AND
    // 2. User has a business (business setup is complete) AND
    // 3. Current path is not exempt
    if (
      account.plan == null &&
      business && // Only require plan if business exists
      !allExemptPaths.some((path) => currentPath.startsWith(path))
    ) {
      router.replace("/dashboard/plan");
    }
  }, [account, business, router, exemptPaths]);
}
