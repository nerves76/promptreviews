"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { SidebarTooltipProps } from "./types";

/**
 * Tooltip component for sidebar nav items
 * Uses portal to render outside sidebar stacking context
 * Supports optional description for expanded sidebar hover
 */
export function SidebarTooltip({
  content,
  description,
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
        let left = rect.right + 16;

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
      className={`fixed z-[9999] px-3 py-2 text-white rounded-lg shadow-lg pointer-events-none ${description ? 'max-w-xs' : 'whitespace-nowrap'}`}
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
      <div className="text-sm font-medium">{content}</div>
      {description && (
        <div className="text-xs text-white/70 mt-1">{description}</div>
      )}
      {/* Arrow pointer on left side */}
      {position === "right" && (
        <div
          className="absolute"
          style={{
            left: -8,
            top: "50%",
            transform: "translateY(-50%)",
            width: 0,
            height: 0,
            borderTop: "8px solid transparent",
            borderBottom: "8px solid transparent",
            borderRight: "8px solid rgba(46, 74, 125, 0.95)",
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
