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
  buttonRef: React.RefObject<HTMLElement>;
  className?: string;
  style?: React.CSSProperties;
  align?: 'left' | 'right';
  width?: string;
}

const DropdownPortal = forwardRef<HTMLDivElement, DropdownPortalProps>(
  ({ isOpen, mounted, children, buttonRef, className = '', style = {}, align = 'left', width = '256px' }, ref) => {
    if (!isOpen || !mounted) return null;

    const buttonRect = buttonRef.current?.getBoundingClientRect();

    // If custom positioning is provided via style, use it; otherwise use default positioning
    const hasCustomPosition = style.left !== undefined || style.right !== undefined || style.top !== undefined;

    const defaultStyle: React.CSSProperties = hasCustomPosition ? {
      zIndex: 2147483647,
      width,
      ...style
    } : {
      top: buttonRect ? buttonRect.bottom + 8 : 0,
      ...(align === 'right'
        ? { right: window.innerWidth - (buttonRect?.right || 0) }
        : { left: buttonRect?.left || 0 }
      ),
      width,
      zIndex: 2147483647,
      ...style
    };

    return createPortal(
      <div
        ref={ref}
        className={`fixed bg-gray-900/60 backdrop-blur-xl rounded-lg shadow-2xl border border-white/20 ${className}`}
        style={defaultStyle}
      >
        {children}
      </div>,
      document.body
    );
  }
);

DropdownPortal.displayName = 'DropdownPortal';

export default DropdownPortal;
