/**
 * StarfallCelebration Component
 * 
 * Displays a celebratory starfall animation to congratulate users
 * on completing important actions like choosing their plan.
 */

import React, { useEffect, useState } from "react";
import Icon from "@/components/Icon";

interface StarfallCelebrationProps {
  isVisible: boolean;
  onComplete?: () => void;
  duration?: number; // Duration in milliseconds
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  delay: number;
  opacity: number;
}

const StarfallCelebration: React.FC<StarfallCelebrationProps> = ({
  isVisible,
  onComplete,
  duration = 3000
}) => {
  const [stars, setStars] = useState<Star[]>([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isVisible && !isActive) {
      setIsActive(true);
      
      // Generate random stars
      const newStars: Star[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // 0-100% of screen width
        y: -10, // Start above screen
        size: Math.random() * 20 + 10, // 10-30px
        speed: Math.random() * 2 + 1, // 1-3 seconds to fall
        delay: Math.random() * 1000, // 0-1 second delay
        opacity: Math.random() * 0.5 + 0.5 // 0.5-1 opacity
      }));

      setStars(newStars);

      // Trigger completion callback after animation
      const timer = setTimeout(() => {
        setIsActive(false);
        setStars([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, isActive, duration, onComplete]);

  if (!isVisible || !isActive) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        @keyframes starfall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {/* Stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: `${star.delay}ms`,
              animationDuration: `${star.speed}s`,
              animationFillMode: 'forwards',
              animationName: 'starfall',
              animationTimingFunction: 'ease-in'
            }}
          >
                          <Icon name="FaStar" className="w-full h-full text-yellow-400 drop-shadow-lg animate-spin" size={star.size} style={{ animationDuration: `${star.speed * 2}s` }} />
          </div>
        ))}
      </div>
    </>
  );
};

export default StarfallCelebration; 