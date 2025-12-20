"use client";

import { useState } from "react";
import { Button } from "@/app/(app)/components/ui/button";
import { apiClient } from "@/utils/apiClient";
import clsx from "clsx";

interface DeployDocsButtonProps {
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  buttonClassName?: string;
  messageFullWidth?: boolean;
}

export default function DeployDocsButton({
  size = "default",
  className,
  buttonClassName,
  messageFullWidth = false,
}: DeployDocsButtonProps) {
  const [deploying, setDeploying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerDeploy = async () => {
    try {
      setDeploying(true);
      setMessage(null);
      setError(null);

      const data = await apiClient.post<{ deployment?: { url?: string; inspectUrl?: string } }>("/admin/help-content/deploy", {});

      const deployment = data?.deployment;
      const inspectUrl = deployment?.url || deployment?.inspectUrl || null;

      setMessage(
        inspectUrl
          ? `Deployment started. Track progress at ${inspectUrl}.`
          : "Deployment started. Changes will go live when Vercel finishes building."
      );
    } catch (err: any) {
      setError(err?.message || "Failed to trigger deploy");
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className={clsx("flex flex-col items-start gap-2", className)}>
      <Button
        onClick={triggerDeploy}
        disabled={deploying}
        variant="outline"
        size={size}
        className={clsx(
          "border-white/30 text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/40",
          buttonClassName
        )}
      >
        {deploying ? "Triggering deploy..." : "Push updates live"}
      </Button>
      {(message || error) && (
        <div
          className={clsx(
            "rounded-lg border px-3 py-2 text-sm",
            messageFullWidth ? "w-full" : "max-w-sm",
            error
              ? "border-red-500/60 bg-red-500/20 text-red-100"
              : "border-white/30 bg-white/10 text-white"
          )}
        >
          {error || message}
        </div>
      )}
    </div>
  );
}
