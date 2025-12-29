"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { SidebarTooltipProps } from "./types";

/**
 * Tooltip component for sidebar nav items when collapsed
 * Uses portal to render outside sidebar stacking context
 */
export function SidebarTooltip({
  content,
  children,
  position = "right",
  disabled = false,
}: SidebarTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();

        let top = rect.top + rect.height / 2;
        let left = rect.right + 8;

        if (position === "top") {
          top = rect.top - 8;
          left = rect.left + rect.width / 2;
        } else if (position === "bottom") {
          top = rect.bottom + 8;
          left = rect.left + rect.width / 2;
        }

        setCoords({ top, left });
        setIsVisible(true);
      }
    }, 200); // 200ms delay
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipContent = isVisible && (
    <div
      className="fixed z-[9999] px-3 py-2 text-sm font-medium text-white rounded-lg shadow-lg whitespace-nowrap pointer-events-none"
      style={{
        top: coords.top,
        left: coords.left,
        transform:
          position === "right"
            ? "translateY(-50%)"
            : position === "top"
              ? "translate(-50%, -100%)"
              : "translateX(-50%)",
        backgroundColor: "rgba(46, 74, 125, 0.95)",
        backdropFilter: "blur(8px)",
      }}
    >
      {content}
      {/* Arrow */}
      {position === "right" && (
        <div
          className="absolute w-2 h-2 rotate-45"
          style={{
            left: -4,
            top: "50%",
            transform: "translateY(-50%)",
            backgroundColor: "rgba(46, 74, 125, 0.95)",
          }}
        />
      )}
    </div>
  );

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-flex"
      >
        {children}
      </div>
      {typeof document !== "undefined" &&
        createPortal(tooltipContent, document.body)}
    </>
  );
}

export default SidebarTooltip;
