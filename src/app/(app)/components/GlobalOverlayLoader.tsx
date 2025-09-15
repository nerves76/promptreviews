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
      className="fixed inset-0 z-[9999] flex items-start justify-center"
      style={{ background: "rgba(10, 18, 40, 0.35)", backdropFilter: "blur(2px)", paddingTop: 200 }}
    >
      <div className="flex flex-col items-center select-none">
        <FiveStarSpinner size={24} />
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}

