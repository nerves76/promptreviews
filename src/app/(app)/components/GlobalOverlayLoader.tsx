"use client";

import React from "react";
import FiveStarSpinner from "./FiveStarSpinner";

interface GlobalOverlayLoaderProps {
  visible: boolean;
  /** When true, shows a dark overlay and blocks all interaction */
  blocking?: boolean;
  /** Spinner size - defaults to 24 for non-blocking, 48 for blocking */
  size?: number;
}

export default function GlobalOverlayLoader({
  visible,
  blocking = false,
  size,
}: GlobalOverlayLoaderProps) {
  if (!visible) return null;

  const spinnerSize = size ?? (blocking ? 48 : 24);

  if (blocking) {
    return (
      <div
        aria-live="polite"
        aria-busy="true"
        role="status"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 transition-opacity duration-150"
      >
        <div className="flex flex-col items-center select-none">
          <FiveStarSpinner size={spinnerSize} />
          <span className="sr-only">Loading</span>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-live="polite"
      aria-busy="true"
      role="status"
      className="global-overlay fixed inset-0 z-[9999] flex items-start justify-center transition-opacity duration-150"
      style={{ paddingTop: 200, pointerEvents: 'none' }}
    >
      <div className="flex flex-col items-center select-none">
        <FiveStarSpinner size={spinnerSize} />
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}
