"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export interface TooltipProps {
  /** The tooltip content */
  content: string;
  /** The element that triggers the tooltip */
  children: React.ReactNode;
  /** Position of the tooltip relative to the trigger */
  position?: "top" | "bottom" | "left" | "right";
  /** Whether the tooltip is disabled */
  disabled?: boolean;
  /** Delay before showing tooltip in ms */
  delay?: number;
}

/**
 * Generic tooltip component using portal for proper z-index handling.
 * Styled with slate-blue background and arrow pointer.
 */
export function Tooltip({
  content,
  children,
  position = "top",
  disabled = false,
  delay = 200,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (disabled || !content) return;

    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (position) {
          case "top":
            top = rect.top - 8;
            left = rect.left + rect.width / 2;
            break;
          case "bottom":
            top = rect.bottom + 8;
            left = rect.left + rect.width / 2;
            break;
          case "left":
            top = rect.top + rect.height / 2;
            left = rect.left - 8;
            break;
          case "right":
            top = rect.top + rect.height / 2;
            left = rect.right + 8;
            break;
        }

        setCoords({ top, left });
        setIsVisible(true);
      }
    }, delay);
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

  const getTransform = () => {
    switch (position) {
      case "top":
        return "translate(-50%, -100%)";
      case "bottom":
        return "translateX(-50%)";
      case "left":
        return "translate(-100%, -50%)";
      case "right":
        return "translateY(-50%)";
    }
  };

  const getArrowStyles = () => {
    const base = {
      position: "absolute" as const,
      width: 8,
      height: 8,
      backgroundColor: "rgba(46, 74, 125, 0.95)",
      transform: "rotate(45deg)",
    };

    switch (position) {
      case "top":
        return { ...base, bottom: -4, left: "50%", marginLeft: -4 };
      case "bottom":
        return { ...base, top: -4, left: "50%", marginLeft: -4 };
      case "left":
        return { ...base, right: -4, top: "50%", marginTop: -4 };
      case "right":
        return { ...base, left: -4, top: "50%", marginTop: -4 };
    }
  };

  const tooltipContent = isVisible && (
    <div
      className="fixed z-[9999] px-3 py-2 text-sm font-medium text-white rounded-lg shadow-lg max-w-xs whitespace-normal pointer-events-none"
      style={{
        top: coords.top,
        left: coords.left,
        transform: getTransform(),
        backgroundColor: "rgba(46, 74, 125, 0.95)",
        backdropFilter: "blur(8px)",
      }}
    >
      {content}
      {/* Arrow */}
      <div style={getArrowStyles()} />
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

export default Tooltip;
