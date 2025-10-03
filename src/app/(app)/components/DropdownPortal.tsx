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

    const basePosition: React.CSSProperties = {
      top: buttonRect ? buttonRect.bottom + 8 : 0,
      ...(align === 'right'
        ? { right: window.innerWidth - (buttonRect?.right || 0) }
        : { left: buttonRect?.left || 0 }
      )
    };

    const customStyle: React.CSSProperties = { ...positionalOverrides };

    if (positionalOverrides.top === undefined) {
      customStyle.top = basePosition.top;
    }

    if (positionalOverrides.left === undefined && positionalOverrides.right === undefined) {
      customStyle.left = basePosition.left;
      customStyle.right = basePosition.right;
    }

    const defaultStyle: React.CSSProperties = {
      width,
      zIndex: 2147483647,
      ...customStyle
    };

    return createPortal(
      <div
        ref={ref}
        className={`fixed backdrop-blur-xl rounded-lg shadow-2xl border border-white/20 ${className}`}
        style={{
          ...defaultStyle,
          backgroundColor: providedBackground || 'rgba(15, 23, 42, 0.97)' // slate-900 with higher opacity for consistency
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
