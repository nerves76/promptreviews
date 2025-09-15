"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, Suspense } from "react";
import GlobalOverlayLoader from "./GlobalOverlayLoader";
import { usePathname, useSearchParams } from "next/navigation";

type LoaderKey = "router" | "network" | string;

interface LoaderAPI {
  show: (key?: LoaderKey, opts?: { minVisibleMs?: number }) => void;
  hide: (key?: LoaderKey) => void;
  wrap: <T>(promise: Promise<T>, key?: LoaderKey) => Promise<T>;
  isActive: boolean;
}

const LoaderContext = createContext<LoaderAPI | null>(null);

const DEFAULT_DEBOUNCE_MS = 300; // increased to reduce quick-flash overlays
const DEFAULT_MIN_VISIBLE_MS = 300; // keep shown at least this long

export function useGlobalLoader() {
  const ctx = useContext(LoaderContext);
  if (!ctx) throw new Error("useGlobalLoader must be used within GlobalLoaderProvider");
  return ctx;
}

interface ProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
  interceptNetwork?: boolean;
}

function GlobalLoaderProviderInner({
  children,
  enabled = true,
  interceptNetwork = false,
}: ProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reference counts per key
  const countsRef = useRef<Record<string, number>>({});
  const [active, setActive] = useState(false);
  const visibleRef = useRef(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minVisibleUntilRef = useRef<number>(0);
  const routerSafetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failsafeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const longTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LONG_DIM_MS = 900; // add dimmer only after sustained loading

  const recomputeActive = useCallback(() => {
    const total = Object.values(countsRef.current).reduce((a, b) => a + b, 0);
    const nextActive = total > 0;
    if (nextActive === visibleRef.current) return;

    if (nextActive) {
      // schedule show with debounce
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      showTimerRef.current = setTimeout(() => {
        visibleRef.current = true;
        minVisibleUntilRef.current = Date.now() + DEFAULT_MIN_VISIBLE_MS;
        setActive(true);
        document.documentElement.setAttribute("data-global-loading", "true");
        // Apply dimmer only after LONG_DIM_MS
        if (longTimerRef.current) clearTimeout(longTimerRef.current);
        longTimerRef.current = setTimeout(() => {
          if (visibleRef.current) {
            document.documentElement.setAttribute("data-global-loading-long", "true");
          }
        }, LONG_DIM_MS);
        // Start a failsafe to prevent being stuck indefinitely
        if (failsafeTimerRef.current) clearTimeout(failsafeTimerRef.current);
        failsafeTimerRef.current = setTimeout(() => {
          // If still active after long duration, force clear
          if (visibleRef.current) {
            countsRef.current = {};
            visibleRef.current = false;
            setActive(false);
            document.documentElement.removeAttribute("data-global-loading");
            document.documentElement.removeAttribute("data-global-loading-long");
          }
        }, 10000); // 10s failsafe
      }, DEFAULT_DEBOUNCE_MS);
    } else {
      // hide respecting minimum visible time
      const delay = Math.max(0, minVisibleUntilRef.current - Date.now());
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      setTimeout(() => {
        visibleRef.current = false;
        setActive(false);
        document.documentElement.removeAttribute("data-global-loading");
        document.documentElement.removeAttribute("data-global-loading-long");
        if (failsafeTimerRef.current) {
          clearTimeout(failsafeTimerRef.current);
          failsafeTimerRef.current = null;
        }
        if (longTimerRef.current) {
          clearTimeout(longTimerRef.current);
          longTimerRef.current = null;
        }
      }, delay);
    }
  }, []);

  const show = useCallback((key: LoaderKey = "network", opts?: { minVisibleMs?: number }) => {
    const k = String(key);
    if (k === "router" && (countsRef.current[k] || 0) > 0) {
      // Avoid accumulating router shows from repeated history calls
      return;
    }
    countsRef.current[k] = (countsRef.current[k] || 0) + 1;
    if (opts?.minVisibleMs) {
      minVisibleUntilRef.current = Math.max(minVisibleUntilRef.current, Date.now() + opts.minVisibleMs);
    }
    lastActivityRef.current = Date.now();
    recomputeActive();

    // Safety auto-hide for router if URL doesn't change (e.g., pushState to same URL)
    if (k === "router") {
      if (routerSafetyTimerRef.current) clearTimeout(routerSafetyTimerRef.current);
      routerSafetyTimerRef.current = setTimeout(() => {
        // Only hide if still active due to router key
        if ((countsRef.current[k] || 0) > 0) {
          hide("router");
        }
      }, 7000);
    }
  }, [recomputeActive]);

  const hide = useCallback((key: LoaderKey = "network") => {
    const k = String(key);
    const current = countsRef.current[k] || 0;
    countsRef.current[k] = Math.max(0, current - 1);
    if (k === "router" && routerSafetyTimerRef.current) {
      clearTimeout(routerSafetyTimerRef.current);
      routerSafetyTimerRef.current = null;
    }
    lastActivityRef.current = Date.now();
    recomputeActive();
  }, [recomputeActive]);

  const wrap = useCallback(async <T,>(promise: Promise<T>, key: LoaderKey = "network") => {
    show(key);
    try {
      return await promise;
    } finally {
      hide(key);
    }
  }, [show, hide]);

  // Router activity: show on navigation intent (history changes), hide when URL actually changes
  useEffect(() => {
    if (!enabled) return;

    const originalPush = history.pushState;
    const originalReplace = history.replaceState;

    function withShow<T extends (...args: any[]) => any>(fn: T): T {
      // @ts-ignore
      return function (...args: any[]) {
        show("router");
        // @ts-ignore
        return fn.apply(this, args);
      } as T;
    }

    history.pushState = withShow(originalPush);
    history.replaceState = withShow(originalReplace);
    const onPop = () => show("router");
    window.addEventListener("popstate", onPop);

    return () => {
      history.pushState = originalPush;
      history.replaceState = originalReplace;
      window.removeEventListener("popstate", onPop);
    };
  }, [enabled, show]);

  // When the URL actually changes, consider navigation completed and hide router key
  const lastUrlRef = useRef<string>("");
  useEffect(() => {
    if (!enabled) return;
    const currentUrl = `${pathname || ""}?${searchParams?.toString() || ""}`;
    if (currentUrl !== lastUrlRef.current) {
      lastUrlRef.current = currentUrl;
      // give the new view a tick to paint, and allow network interceptor to keep it visible if needed
      requestAnimationFrame(() => setTimeout(() => hide("router"), 100));
    }
  }, [enabled, pathname, searchParams, hide]);

  // Optional: network interception to auto-show on fetch calls
  useEffect(() => {
    if (!enabled || !interceptNetwork || typeof window === "undefined") return;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : (input as any)?.url || "";
      const method = (init?.method || (typeof input !== "string" && (input as Request).method) || "GET").toUpperCase();
      // Skip static asset fetches
      const isStatic = /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|map|woff2?|ttf|otf)(\?|$)/i.test(url);
      const isPreload = (init as any)?.mode === "navigate";
      const shouldTrack = !isStatic && !isPreload;
      if (shouldTrack) show("network");
      try {
        const res = await originalFetch(input as any, init as any);
        return res;
      } finally {
        if (shouldTrack) hide("network");
      }
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [enabled, interceptNetwork, show, hide]);

  // Expose imperative API for debugging/integration
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as any).__GlobalLoader = { show, hide };
  }, [show, hide]);

  const api: LoaderAPI = useMemo(() => ({ show, hide, wrap, isActive: active }), [show, hide, wrap, active]);

  return (
    <LoaderContext.Provider value={api}>
      {children}
      {/* Overlay at root */}
      {enabled && <GlobalOverlayLoader visible={active} />}
    </LoaderContext.Provider>
  );
}

export default function GlobalLoaderProvider(props: ProviderProps) {
  return (
    <Suspense fallback={null}>
      <GlobalLoaderProviderInner {...props} />
    </Suspense>
  );
}
