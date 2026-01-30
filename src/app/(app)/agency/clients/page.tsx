"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

/**
 * Redirects /agency/clients to /agency/work-manager.
 * The clients table has been replaced by the agency kanban board.
 * Note: /agency/clients/[clientId] detail pages still work.
 */
export default function AgencyClientsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/agency/work-manager");
  }, [router]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-center py-12">
        <Icon name="FaSpinner" className="animate-spin text-white w-8 h-8" size={32} />
      </div>
    </div>
  );
}
