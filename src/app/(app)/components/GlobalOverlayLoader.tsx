"use client";

import React from "react";
import FiveStarSpinner from "./FiveStarSpinner";

interface GlobalOverlayLoaderProps {
  visible: boolean;
}

export default function GlobalOverlayLoader({ visible }: GlobalOverlayLoaderProps) {
  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      aria-busy="true"
      role="status"
      className="global-overlay fixed inset-0 z-[9999] flex items-start justify-center transition-opacity duration-150"
      style={{ paddingTop: 200, pointerEvents: 'none' }}
    >
      <div className="flex flex-col items-center select-none">
        <FiveStarSpinner size={24} />
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}
