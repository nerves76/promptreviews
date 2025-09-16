"use client";

/**
 * StandardLoader (legacy shim)
 *
 * Converts existing in-page/full-page loader usages into the global overlay
 * without rendering duplicate spinners. When `isLoading` is true, we raise
 * a reference in the GlobalLoaderProvider and render null.
 */

import { useEffect } from "react";
import { useGlobalLoader } from "./GlobalLoaderProvider";

interface StandardLoaderProps {
  isLoading: boolean;
  mode?: "fullPage" | "inline";
}

export default function StandardLoader({ isLoading, mode = "fullPage" }: StandardLoaderProps) {
  const loader = useGlobalLoader();

  useEffect(() => {
    if (mode !== "fullPage") return; // Only globalize full-page loaders
    if (isLoading) loader.show("legacy");
    return () => loader.hide("legacy");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, mode]);

  return null;
}
