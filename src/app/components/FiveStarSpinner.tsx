import React, { useEffect, useState } from 'react';

export default function FiveStarSpinner() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 5);
    }, 650); // slower speed
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2" style={{ fontSize: 24, minHeight: 30, marginTop: -390, marginBottom: 64 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          style={{
            color: i <= activeIndex ? '#FFD700' : '#D1D5DB', // gold or gray
            transition: 'color 0.2s',
            filter: i === activeIndex ? 'drop-shadow(0 0 6px #FFD700)' : 'none',
          }}
          aria-label={i === 0 ? 'Loading' : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );
} 