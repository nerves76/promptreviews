"use client";

import React from 'react';

interface ButtonSpinnerProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function ButtonSpinner({
  size = 16,
  color = 'currentColor',
  className = '',
  style,
}: ButtonSpinnerProps) {
  return (
    <div
      className={`inline-block animate-spin ${className}`}
      style={{
        width: size,
        height: size,
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="31.416"
          strokeDashoffset="31.416"
          opacity="0.25"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="31.416"
          strokeDashoffset="23.562"
          className="animate-spin origin-center"
        />
      </svg>
    </div>
  );
}