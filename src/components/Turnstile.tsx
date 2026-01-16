"use client";

import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  className?: string;
}

export default function Turnstile({
  onVerify,
  onError,
  onExpire,
  theme = "light",
  size = "normal",
  className = "",
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptLoadedRef = useRef(false);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return;

    // Remove existing widget if any
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Widget may already be removed
      }
    }

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      console.error("Turnstile: NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set");
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: onVerify,
      "error-callback": onError,
      "expired-callback": onExpire,
      theme,
      size,
    });
  }, [onVerify, onError, onExpire, theme, size]);

  useEffect(() => {
    // Check if script is already loaded
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Check if script is already being loaded
    if (scriptLoadedRef.current) return;

    // Load the Turnstile script
    const existingScript = document.querySelector(
      'script[src*="challenges.cloudflare.com/turnstile"]'
    );

    if (existingScript) {
      // Script exists, wait for it to load
      existingScript.addEventListener("load", renderWidget);
      return;
    }

    scriptLoadedRef.current = true;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = renderWidget;
    script.onerror = () => {
      console.error("Failed to load Turnstile script");
      onError?.();
    };
    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Widget may already be removed
        }
      }
    };
  }, [renderWidget, onError]);

  // Fixed height container to prevent layout shifts during loading/verification
  // Normal size: 65px height, Compact size: 65px height
  const minHeight = size === "compact" ? "65px" : "65px";
  const minWidth = size === "compact" ? "130px" : "300px";

  return (
    <div
      style={{ minHeight, minWidth }}
      className={`flex items-center justify-center ${className}`}
    >
      <div ref={containerRef} />
    </div>
  );
}

/**
 * Reset the Turnstile widget (call after form submission failure)
 */
export function resetTurnstile(widgetId: string) {
  if (window.turnstile && widgetId) {
    window.turnstile.reset(widgetId);
  }
}
