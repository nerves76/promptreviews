import React, { useEffect, useState } from 'react';
import Icon from '@/components/Icon';

interface ProcessIndicatorProps {
  primaryColor?: string;
  cardBackgroundColor?: string;
}

export default function ProcessIndicator({ primaryColor = "#4F46E5", cardBackgroundColor = "#FFFFFF" }: ProcessIndicatorProps) {
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

  return (
    <div className="mb-6 px-1">
      <div className="flex items-center justify-between max-w-full">
        {steps.map((step, index) => {
          const isActive = index === activeStep && animationPhase !== 'waiting';
          const isCompleted = index < activeStep && animationPhase !== 'waiting';
          const isFadingOut = animationPhase === 'fadeOut';
          const isWaiting = animationPhase === 'waiting';
          
          return (
            <React.Fragment key={index}>
              {/* Step */}
              <div className="flex items-center flex-1 min-w-0">
                {/* Step Number Circle */}
                <div 
                  className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all ${
                    isFadingOut ? 'duration-1000' : 'duration-500'
                  } ${
                    isActive ? 'transform scale-110' : isCompleted ? 'transform scale-105' : ''
                  }`}
                  style={{ 
                    borderColor: primaryColor,
                    backgroundColor: isWaiting || isFadingOut ? cardBackgroundColor : (isActive || isCompleted) ? primaryColor : cardBackgroundColor,
                    color: isWaiting || isFadingOut ? primaryColor : (isActive || isCompleted) ? cardBackgroundColor : primaryColor,
                    boxShadow: isWaiting || isFadingOut ? 'none' : isActive ? `0 0 12px ${primaryColor}40` : isCompleted ? `0 0 8px ${primaryColor}20` : 'none'
                  }}
                >
                  {index + 1}
                </div>
                
                {/* Step Text - More compact on mobile */}
                <div className={`ml-1 sm:ml-2 text-xs font-medium transition-colors ${
                  isFadingOut ? 'duration-1000' : 'duration-500'
                } ${
                  isWaiting || isFadingOut ? 'text-gray-600' : isActive ? 'text-gray-800' : isCompleted ? 'text-gray-700' : 'text-gray-600'
                }`}>
                  {/* Mobile: Show very compact format */}
                  <span className="block sm:hidden text-xs leading-tight flex items-center">
                    {index === 0 && "Create"}
                    {index === 1 && (
                      <>
                        <Icon name="FaLink" size={10} className="mr-1" />
                        Copy &\u00A0submit
                      </>
                    )}
                    {index === 2 && "Paste &\u00A0post"}
                  </span>
                  {/* Desktop: Show full text */}
                  <span className="hidden sm:block truncate flex items-center">
                    {index === 1 && <Icon name="FaLink" size={12} className="mr-1 flex-shrink-0" />}
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