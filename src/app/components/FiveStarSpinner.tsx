"use client";

import React, { useEffect, useState } from 'react';

interface FiveStarSpinnerProps {
  size?: number;
  color1?: string; // unfilled
  color2?: string; // filled
  style?: React.CSSProperties;
  className?: string;
}

export default function FiveStarSpinner({
  size = 18,
  color1 = '#D1D5DB',
  color2 = '#FFD700',
  style,
  className = '',
}: FiveStarSpinnerProps) {
  // 0-3: filling stars, 4: half, 5: full, 6: reset
  const [state, setState] = useState(0);
  const [filled, setFilled] = useState([false, false, false, false, false]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (state < 4) {
      // Fill stars one by one
      setFilled(f => f.map((v, i) => (i <= state ? true : v)));
      timeout = setTimeout(() => setState(state + 1), 250);
    } else if (state === 4) {
      // Pause at 4.5 (half star)
      setFilled([true, true, true, true, false]);
      timeout = setTimeout(() => setState(5), 800);
    } else if (state === 5) {
      // All 5 stars full
      setFilled([true, true, true, true, true]);
      timeout = setTimeout(() => setState(6), 800);
    } else {
      // Reset
      setFilled([false, false, false, false, false]);
      timeout = setTimeout(() => setState(0), 400);
    }
    return () => clearTimeout(timeout);
  }, [state]);

  return (
    <div
      className={`flex items-center justify-center gap-2 text-white ${className}`}
      style={{ fontSize: size, minHeight: size + 6, ...style }}
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            position: 'relative',
            display: 'inline-block',
            width: size,
            height: size,
            verticalAlign: 'middle',
          }}
        >
          <span
            style={{
              color: filled[i] ? color2 : color1,
              filter: filled[i] ? `drop-shadow(0 0 6px ${color2})` : 'none',
              transition: 'color 0.2s, filter 0.2s',
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
            }}
          >
            ★
          </span>
        </span>
      ))}
      {/* Last star: half or full */}
      <span
        style={{
          position: 'relative',
          display: 'inline-block',
          width: size,
          height: size,
          verticalAlign: 'middle',
        }}
      >
        {/* Half overlay */}
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '50%',
            height: '100%',
            overflow: 'hidden',
            color: state === 4 ? color2 : 'transparent',
            filter: state === 4 ? `drop-shadow(0 0 6px ${color2})` : 'none',
            transition: 'color 0.2s, filter 0.2s',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          ★
        </span>
        {/* Full star (gray or gold) */}
        <span
          style={{
            color: state === 5 || filled[4] ? color2 : color1,
            filter: state === 5 || filled[4] ? `drop-shadow(0 0 6px ${color2})` : 'none',
            transition: 'color 0.2s, filter 0.2s',
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
          }}
        >
          ★
        </span>
      </span>
    </div>
  );
}
