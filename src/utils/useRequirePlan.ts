import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useRequirePlan(account: any, exemptPaths: string[] = []) {
  const router = useRouter();

  useEffect(() => {
    if (!account) return;
    if (typeof window === "undefined") return;
    const currentPath = window.location.pathname;
    if (
      account.plan == null &&
      !exemptPaths.some((path) => currentPath.startsWith(path))
    ) {
      router.replace("/dashboard/plan");
    }
  }, [account, router, exemptPaths]);
}
