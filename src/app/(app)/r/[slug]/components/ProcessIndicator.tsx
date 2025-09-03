import React, { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { applyCardTransparency } from '@/utils/colorUtils';

interface ProcessIndicatorProps {
  primaryColor?: string;
  cardBackgroundColor?: string;
  cardTransparency?: number;
  cardTextColor?: string;
}

export default function ProcessIndicator({ primaryColor = "#4F46E5", cardBackgroundColor = "#FFFFFF", cardTransparency = 1, cardTextColor = "#1A1A1A" }: ProcessIndicatorProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<'waiting' | 'highlight' | 'drawLine' | 'pause' | 'fadeOut'>('waiting');
  const [drawnLines, setDrawnLines] = useState<number[]>([]);
  const [isFirstRun, setIsFirstRun] = useState(true);
  
  const steps = [
    "Create review",
    "Click \"Copy & submit\"", 
    "Paste & post"
  ];

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const runAnimation = () => {
      if (animationPhase === 'waiting') {
        // Wait before starting animation (2 seconds on first load, 30 seconds between cycles)
        const waitTime = isFirstRun ? 2000 : 30000;
        timeout = setTimeout(() => {
          setAnimationPhase('highlight');
          setIsFirstRun(false);
        }, waitTime);
      } else if (animationPhase === 'highlight') {
        // Highlight current step for 2 seconds
        timeout = setTimeout(() => {
          if (activeStep < steps.length - 1) {
            setAnimationPhase('drawLine');
          } else {
            setAnimationPhase('pause');
          }
        }, 2000);
      } else if (animationPhase === 'drawLine') {
        // Draw line to next step for 1 second
        setDrawnLines(prev => [...prev, activeStep]);
        timeout = setTimeout(() => {
          setActiveStep(prev => prev + 1);
          setAnimationPhase('highlight');
        }, 1000);
      } else if (animationPhase === 'pause') {
        // Immediately start fade out after step 3 highlight
        setAnimationPhase('fadeOut');
      } else if (animationPhase === 'fadeOut') {
        // Fade out for 1 second, then wait 30 seconds before restarting
        timeout = setTimeout(() => {
          setActiveStep(0);
          setDrawnLines([]);
          setAnimationPhase('waiting');
        }, 1000);
      }
    };

    runAnimation();

    return () => clearTimeout(timeout);
  }, [activeStep, animationPhase, steps.length]);

  // Helper function to determine text color based on background
  const getContrastColor = (bgColor: string): string => {
    // Remove # if present
    const color = bgColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  return (
    <div className="mb-6 px-4">
      <div className="flex items-center justify-center gap-3">
        {steps.map((step, index) => {
          const isActive = index === activeStep && animationPhase !== 'waiting';
          const isCompleted = index < activeStep && animationPhase !== 'waiting';
          const isFadingOut = animationPhase === 'fadeOut';
          const isWaiting = animationPhase === 'waiting';
          
          return (
            <React.Fragment key={index}>
              {/* Step */}
              <div className="flex items-center">
                {/* Step Number Circle */}
                <div 
                  className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all ${
                    isFadingOut ? 'duration-1000' : 'duration-500'
                  } ${
                    isActive ? 'transform scale-110' : isCompleted ? 'transform scale-105' : ''
                  }`}
                  style={{ 
                    borderColor: primaryColor,
                    backgroundColor: isWaiting || isFadingOut ? applyCardTransparency(cardBackgroundColor, cardTransparency) : (isActive || isCompleted) ? primaryColor : applyCardTransparency(cardBackgroundColor, cardTransparency),
                    color: isWaiting || isFadingOut ? primaryColor : (isActive || isCompleted) ? getContrastColor(primaryColor) : primaryColor,
                    boxShadow: isWaiting || isFadingOut ? 'none' : isActive ? `0 0 12px ${primaryColor}40` : isCompleted ? `0 0 8px ${primaryColor}20` : 'none'
                  }}
                >
                  {index + 1}
                </div>
                
                {/* Step Text - More compact on mobile */}
                <div className={`ml-1 sm:ml-2 font-medium transition-colors ${
                  isFadingOut ? 'duration-1000' : 'duration-500'
                }`}
                style={{ color: cardTextColor }}>
                  {/* Mobile: Show very compact format */}
                  <span className="block sm:hidden text-xs leading-tight whitespace-nowrap">
                    {index === 0 && "Create"}
                    {index === 1 && "Copy"}
                    {index === 2 && "Post"}
                  </span>
                  {/* Desktop: Show full text */}
                  <span className="hidden sm:block text-sm truncate">
                    {step}
                  </span>
                </div>
              </div>
              
              {/* Connecting Line - Hidden on mobile, visible on sm+ */}
              {index < steps.length - 1 && (
                <div className="hidden sm:flex flex-shrink-0 mx-2 sm:mx-3 relative">
                  <div 
                    className="h-0.5 w-8 sm:w-12"
                    style={{ 
                      backgroundColor: primaryColor, 
                      opacity: 0.2
                    }}
                  />
                  {/* Animated line that draws over the base line */}
                  <div 
                    className={`absolute top-0 left-0 h-0.5 transition-all ease-out ${
                      isFadingOut ? 'duration-1000' : 'duration-1000'
                    }`}
                    style={{ 
                      backgroundColor: primaryColor,
                      opacity: isWaiting || isFadingOut ? 0 : drawnLines.includes(index) ? 0.8 : 0,
                      width: isWaiting || isFadingOut ? '0%' : drawnLines.includes(index) ? '100%' : '0%',
                    }}
                  />
                </div>
              )}


            </React.Fragment>
          );
        })}
      </div>
      
      {/* Respect user's motion preferences */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}