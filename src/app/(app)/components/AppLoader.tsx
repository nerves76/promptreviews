"use client";

/**
 * AppLoader (legacy shim)
 * Signals the global overlay and renders nothing. Keeps API compatibility
 * while unifying page-level loading UI.
 */

import { useEffect } from "react";
import { useGlobalLoader } from "./GlobalLoaderProvider";

interface AppLoaderProps {
  size?: number; // Deprecated
  variant?: 'default' | 'centered' | 'compact'; // Deprecated
  showText?: boolean; // Deprecated
  className?: string; // Deprecated
}

export default function AppLoader({}: AppLoaderProps = {}) {
  const loader = useGlobalLoader();
  useEffect(() => {
    loader.show("legacy-app");
    return () => loader.hide("legacy-app");
  }, [loader]);
  return null;
}
