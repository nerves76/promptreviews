/**
 * DropdownPortal - Shared dropdown component with consistent styling
 */

"use client";

import React, { forwardRef } from "react";
import { createPortal } from "react-dom";

interface DropdownPortalProps {
  isOpen: boolean;
  mounted: boolean;
  children: React.ReactNode;
  buttonRef: React.RefObject<HTMLElement | null>;
  className?: string;
  style?: React.CSSProperties;
  align?: 'left' | 'right';
  width?: string;
}

const DropdownPortal = forwardRef<HTMLDivElement, DropdownPortalProps>(
  ({
    isOpen,
    mounted,
    children,
    buttonRef,
    className = '',
    style = {},
    align = 'left',
    width = '256px'
  }, ref) => {
    if (!isOpen || !mounted) return null;

    const buttonRect = buttonRef.current?.getBoundingClientRect();
    const { backgroundColor: providedBackground, ...positionalOverrides } = style;

    // Parse width for boundary calculations
    const widthNum = parseInt(width) || 256;
    const viewportPadding = 8;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

    // Calculate safe width that fits viewport
    const safeWidth = Math.min(widthNum, viewportWidth - (viewportPadding * 2));

    // Calculate left position with viewport bounds checking
    let leftPos = buttonRect?.left || 0;
    if (align === 'right' && buttonRect) {
      leftPos = buttonRect.right - safeWidth;
    }
    // Ensure dropdown doesn't overflow right edge
    leftPos = Math.min(leftPos, viewportWidth - safeWidth - viewportPadding);
    // Ensure dropdown doesn't overflow left edge
    leftPos = Math.max(leftPos, viewportPadding);

    // Calculate top position with viewport bounds checking
    let topPos = buttonRect ? buttonRect.bottom + 8 : 0;
    // If dropdown would overflow bottom, position above button instead
    const estimatedHeight = 300; // Reasonable estimate for dropdown height
    if (topPos + estimatedHeight > viewportHeight && buttonRect) {
      topPos = Math.max(viewportPadding, buttonRect.top - estimatedHeight - 8);
    }

    const basePosition: React.CSSProperties = {
      top: topPos,
      left: leftPos
    };

    const customStyle: React.CSSProperties = { ...positionalOverrides };

    if (positionalOverrides.top === undefined) {
      customStyle.top = basePosition.top;
    }

    if (positionalOverrides.left === undefined && positionalOverrides.right === undefined) {
      customStyle.left = basePosition.left;
    }

    const defaultStyle: React.CSSProperties = {
      width: `${safeWidth}px`,
      maxWidth: `calc(100vw - ${viewportPadding * 2}px)`,
      maxHeight: `calc(100vh - ${topPos + viewportPadding}px)`,
      overflowY: 'auto' as const,
      zIndex: 2147483647,
      ...customStyle
    };

    return createPortal(
      <div
        ref={ref}
        className={`fixed backdrop-blur-xl rounded-lg shadow-2xl border border-white/20 ${className}`}
        style={{
          ...defaultStyle,
          backgroundColor: providedBackground || 'rgba(46, 74, 125, 0.7)' // slate-blue brand color at 70% opacity
        }}
      >
        {children}
      </div>,
      document.body
    );
  }
);

DropdownPortal.displayName = 'DropdownPortal';

export default DropdownPortal;
