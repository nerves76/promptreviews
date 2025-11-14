"use client";

import React, { useEffect, useState } from 'react';
import Icon from '@/components/Icon';

interface CommunicationProcessIndicatorProps {
  communicationType: 'email' | 'sms';
  primaryColor?: string;
  cardBackgroundColor?: string;
}

export default function CommunicationProcessIndicator({ 
  communicationType,
  primaryColor = "#4F46E5", 
  cardBackgroundColor = "#FFFFFF" 
}: CommunicationProcessIndicatorProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<'waiting' | 'highlight' | 'drawLine' | 'pause' | 'fadeOut'>('waiting');
  const [drawnLines, setDrawnLines] = useState<number[]>([]);
  const [isFirstRun, setIsFirstRun] = useState(true);
  
  // Customize steps based on communication type
  const steps = communicationType === 'sms'
    ? [
        "Edit message",
        "Click \"Copy & Send\"",
        "Finish in your SMS app"
      ]
    : [
        "Edit message",
        "Choose send method",
        "Finish in your email app"
      ];

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const runAnimation = () => {
      if (animationPhase === 'waiting') {
        // Wait before starting animation (1 second on first load, 20 seconds between cycles)
        const waitTime = isFirstRun ? 1000 : 20000;
        timeout = setTimeout(() => {
          setAnimationPhase('highlight');
          setIsFirstRun(false);
        }, waitTime);
      } else if (animationPhase === 'highlight') {
        // Highlight current step for 1.5 seconds
        timeout = setTimeout(() => {
          if (activeStep < steps.length - 1) {
            setAnimationPhase('drawLine');
          } else {
            setAnimationPhase('pause');
          }
        }, 1500);
      } else if (animationPhase === 'drawLine') {
        // Draw line to next step for 0.8 seconds
        setDrawnLines(prev => [...prev, activeStep]);
        timeout = setTimeout(() => {
          setActiveStep(prev => prev + 1);
          setAnimationPhase('highlight');
        }, 800);
      } else if (animationPhase === 'pause') {
        // Immediately start fade out after step 3 highlight
        setAnimationPhase('fadeOut');
      } else if (animationPhase === 'fadeOut') {
        // Fade out for 1 second, then wait before restarting
        timeout = setTimeout(() => {
          setActiveStep(0);
          setDrawnLines([]);
          setAnimationPhase('waiting');
        }, 1000);
      }
    };

    runAnimation();

    return () => clearTimeout(timeout);
  }, [activeStep, animationPhase, steps.length, isFirstRun]);

  // Reset animation when communication type changes
  useEffect(() => {
    setActiveStep(0);
    setDrawnLines([]);
    setAnimationPhase('waiting');
    setIsFirstRun(true);
  }, [communicationType]);

  return (
    <div className="mb-4">
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
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all ${
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
                
                {/* Step Text */}
                <div className={`ml-2 text-xs font-medium transition-colors ${
                  isFadingOut ? 'duration-1000' : 'duration-500'
                } ${
                  isWaiting || isFadingOut ? 'text-gray-500' : isActive ? 'text-gray-800 font-semibold' : isCompleted ? 'text-gray-700' : 'text-gray-500'
                }`}>
                  {step}
                </div>
              </div>
              
              {/* Line between steps */}
              {index < steps.length - 1 && (
                <div className="relative w-8 sm:w-12 mx-1">
                  {/* Background line */}
                  <div 
                    className="absolute top-1/2 w-full h-0.5 -translate-y-1/2"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  />
                  {/* Animated line */}
                  {drawnLines.includes(index) && (
                    <div 
                      className="absolute top-1/2 h-0.5 -translate-y-1/2 animate-draw-line"
                      style={{ 
                        backgroundColor: primaryColor,
                        width: '100%',
                        transformOrigin: 'left',
                      }}
                    />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Add CSS animation */}
      <style jsx>{`
        @keyframes draw-line {
          from {
            transform: scaleX(0) translateY(-50%);
          }
          to {
            transform: scaleX(1) translateY(-50%);
          }
        }
        .animate-draw-line {
          animation: draw-line 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
