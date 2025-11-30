import React, { useEffect, useState } from 'react';
import { applyCardTransparency } from '@/utils/colorUtils';

// Animated line-drawing icons for each step
const StepAnimation = ({ step, color }: { step: number; color: string }) => {
  const strokeStyle = {
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  if (step === 0) {
    // Step 1: Prompt Page UI - same window size as all steps (76x62)
    return (
      <svg viewBox="0 0 94 78" className="w-28 h-20">
        <style>{`
          @keyframes textAppear0 {
            0% { opacity: 0; }
            100% { opacity: 0.6; }
          }
          @keyframes aiButtonPulse0 {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
          }
          .text-line0 {
            animation: textAppear0 0.7s ease-out forwards;
            opacity: 0;
          }
          .ai-btn0 {
            animation: aiButtonPulse0 1.5s ease-in-out 1s infinite;
          }
        `}</style>
        {/* Browser window - 76x62, centered */}
        <rect x="9" y="4" width="76" height="62" rx="3" {...strokeStyle} />
        <line x1="9" y1="13" x2="85" y2="13" {...strokeStyle} opacity={0.3} />
        {/* Review text box - larger */}
        <rect x="15" y="18" width="64" height="28" rx="2" {...strokeStyle} opacity={0.5} />
        {/* Text lines in box */}
        <line className="text-line0" x1="19" y1="26" x2="64" y2="26" {...strokeStyle} style={{ animationDelay: '1.2s' }} />
        <line className="text-line0" x1="19" y1="34" x2="54" y2="34" {...strokeStyle} style={{ animationDelay: '1.5s' }} />
        <line className="text-line0" x1="19" y1="42" x2="59" y2="42" {...strokeStyle} style={{ animationDelay: '1.8s' }} />
        {/* Copy & open button - full width with more padding */}
        <rect x="15" y="52" width="64" height="10" rx="2" fill={color} fillOpacity={0.3} />
        <rect x="15" y="52" width="64" height="10" rx="2" {...strokeStyle} />
        <text x="47" y="59" textAnchor="middle" fill={color} fontSize="5">Copy & open</text>
      </svg>
    );
  }

  if (step === 1) {
    // Step 2: Click button, "Copied!" appears, new window slides completely in front
    // Both windows are 76x62 to match step 1 and step 3
    return (
      <svg viewBox="0 0 94 78" className="w-28 h-20">
        <style>{`
          @keyframes buttonClick1 {
            0% { transform: scale(1); }
            50% { transform: scale(0.85); }
            100% { transform: scale(1); }
          }
          @keyframes copiedAppear1 {
            0% { opacity: 0; transform: translateY(2px); }
            15% { opacity: 1; transform: translateY(0); }
            85% { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes newWindowSlide1 {
            0% { transform: translateX(100%); }
            100% { transform: translateX(0); }
          }
          .copy-btn1 {
            animation: buttonClick1 0.7s ease-out 1.2s forwards;
            transform-origin: center;
          }
          .copied-msg1 {
            animation: copiedAppear1 1.8s ease-out 2s forwards;
            opacity: 0;
          }
          .new-window1 {
            animation: newWindowSlide1 0.8s ease-out 4s forwards;
            transform: translateX(100%);
          }
        `}</style>
        {/* Original Prompt Page window (76x62, centered) - same layout as step 1 */}
        <g>
          <rect x="9" y="4" width="76" height="62" rx="3" {...strokeStyle} />
          <line x1="9" y1="13" x2="85" y2="13" {...strokeStyle} opacity={0.3} />
          {/* Text box */}
          <rect x="15" y="18" width="64" height="28" rx="2" {...strokeStyle} opacity={0.3} />
          <line x1="19" y1="26" x2="64" y2="26" {...strokeStyle} opacity={0.4} />
          <line x1="19" y1="34" x2="54" y2="34" {...strokeStyle} opacity={0.4} />
          <line x1="19" y1="42" x2="59" y2="42" {...strokeStyle} opacity={0.4} />
          {/* Copy & open button - full width */}
          <g className="copy-btn1">
            <rect x="15" y="52" width="64" height="10" rx="2" fill={color} fillOpacity={0.3} />
            <rect x="15" y="52" width="64" height="10" rx="2" {...strokeStyle} />
            <text x="47" y="59" textAnchor="middle" fill={color} fontSize="5">Copy & open</text>
          </g>
          {/* "Copied!" message */}
          <g className="copied-msg1">
            <rect x="27" y="30" width="40" height="12" rx="2" fill="#FFFFFF" />
            <rect x="27" y="30" width="40" height="12" rx="2" {...strokeStyle} opacity={0.3} />
            <text x="47" y="39" textAnchor="middle" fill={color} fontSize="6" fontWeight="bold">Copied!</text>
          </g>
        </g>
        {/* New Google review window sliding completely in front (76x62) - opaque background */}
        <g className="new-window1">
          {/* Solid opaque background */}
          <rect x="9" y="4" width="76" height="62" rx="3" fill="#FFFFFF" />
          <rect x="9" y="4" width="76" height="62" rx="3" {...strokeStyle} />
          <line x1="9" y1="13" x2="85" y2="13" {...strokeStyle} opacity={0.5} />
          {/* Browser dots */}
          <circle cx="16" cy="8.5" r="1.5" fill={color} opacity={0.5} />
          <circle cx="22" cy="8.5" r="1.5" fill={color} opacity={0.5} />
          <circle cx="28" cy="8.5" r="1.5" fill={color} opacity={0.5} />
          {/* 5 Stars row - centered, properly spaced */}
          {[0, 1, 2, 3, 4].map((i) => (
            <polygon
              key={i}
              points={`${27 + i * 10},18 ${28.5 + i * 10},22 ${32.5 + i * 10},22 ${29.5 + i * 10},25 ${30.5 + i * 10},29 ${27 + i * 10},26.5 ${23.5 + i * 10},29 ${24.5 + i * 10},25 ${21.5 + i * 10},22 ${25.5 + i * 10},22`}
              {...strokeStyle}
              fill={color}
              fillOpacity={0.5}
            />
          ))}
          {/* Review text box */}
          <rect x="15" y="34" width="64" height="18" rx="2" {...strokeStyle} opacity={0.5} />
          {/* Submit button below text box */}
          <rect x="57" y="56" width="22" height="8" rx="2" fill={color} opacity={0.3} />
          <rect x="57" y="56" width="22" height="8" rx="2" {...strokeStyle} />
          <text x="68" y="62" textAnchor="middle" fill={color} fontSize="5">Post</text>
        </g>
      </svg>
    );
  }

  if (step === 2) {
    // Step 3: Google review page - same window size (76x62) as steps 1 and 2
    return (
      <svg viewBox="0 0 94 78" className="w-28 h-20">
        <style>{`
          @keyframes cursorMove2 {
            0% { opacity: 0; transform: translate(0, 0); }
            20% { opacity: 1; transform: translate(0, 0); }
            80% { opacity: 1; transform: translate(15px, -20px); }
            100% { opacity: 0; transform: translate(15px, -20px); }
          }
          @keyframes pasteMsg2 {
            0% { opacity: 0; transform: translateY(3px); }
            20% { opacity: 1; transform: translateY(0); }
            70% { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes pasteText2 {
            0% { opacity: 0; }
            100% { opacity: 0.6; }
          }
          @keyframes postBtnClick2 {
            0% { transform: scale(1); }
            50% { transform: scale(0.9); }
            100% { transform: scale(1); }
          }
          @keyframes starSparkle2 {
            0% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
            100% { opacity: 0.8; transform: scale(1); }
          }
          @keyframes contentFadeOut2 {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes successMsg2 {
            0% { opacity: 0; transform: scale(0.8); }
            30% { opacity: 1; transform: scale(1); }
            100% { opacity: 1; transform: scale(1); }
          }
          .cursor2 {
            animation: cursorMove2 1s ease-out forwards;
            opacity: 0;
          }
          .paste-msg2 {
            animation: pasteMsg2 1.2s ease-out 1s forwards;
            opacity: 0;
          }
          .pasted-text2 {
            animation: pasteText2 0.5s ease-out 1.8s forwards, contentFadeOut2 0.4s ease-out 4s forwards;
            opacity: 0;
          }
          .post-btn2 {
            animation: postBtnClick2 0.5s ease-out 2.6s forwards, contentFadeOut2 0.4s ease-out 4s forwards;
            transform-origin: center;
          }
          .text-box2 {
            animation: contentFadeOut2 0.4s ease-out 4s forwards;
          }
          .star2 {
            animation: starSparkle2 0.6s ease-in-out forwards, contentFadeOut2 0.4s ease-out 4s forwards;
          }
          .success-msg2 {
            animation: successMsg2 0.6s ease-out 4.4s forwards;
            opacity: 0;
          }
        `}</style>
        {/* Browser window - 76x62, centered */}
        <rect x="9" y="4" width="76" height="62" rx="3" {...strokeStyle} />
        <line x1="9" y1="13" x2="85" y2="13" {...strokeStyle} opacity={0.3} />
        {/* Browser dots */}
        <circle cx="16" cy="8.5" r="1.5" fill={color} opacity={0.5} />
        <circle cx="22" cy="8.5" r="1.5" fill={color} opacity={0.5} />
        <circle cx="28" cy="8.5" r="1.5" fill={color} opacity={0.5} />
        {/* Stars row - centered, sparkle after post button click */}
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} className="star2" style={{ animationDelay: `${3.2 + i * 0.12}s`, color }}>
            <polygon
              points={`${27 + i * 10},18 ${28.5 + i * 10},22 ${32.5 + i * 10},22 ${29.5 + i * 10},25 ${30.5 + i * 10},29 ${27 + i * 10},26.5 ${23.5 + i * 10},29 ${24.5 + i * 10},25 ${21.5 + i * 10},22 ${25.5 + i * 10},22`}
              {...strokeStyle}
              fill={color}
              fillOpacity={0.5}
            />
          </g>
        ))}
        {/* Review text box - same position as step 2 */}
        <rect className="text-box2" x="15" y="34" width="64" height="18" rx="2" {...strokeStyle} />
        {/* Cursor - moves up from bottom to input area then disappears */}
        <g className="cursor2">
          <polygon points="25,62 25,72 29,68 32,74 34,73 31,67 36,67" fill={color} />
        </g>
        {/* "Paste!" message - appears briefly with solid background */}
        <g className="paste-msg2">
          <rect x="29" y="38" width="36" height="11" rx="3" fill="#FFFFFF" />
          <rect x="29" y="38" width="36" height="11" rx="3" {...strokeStyle} opacity={0.3} />
          <text x="47" y="46" textAnchor="middle" fill={color} fontSize="7" fontWeight="bold">Paste!</text>
        </g>
        {/* Pasted text lines */}
        <g className="pasted-text2">
          <line x1="19" y1="40" x2="52" y2="40" {...strokeStyle} opacity={0.6} />
          <line x1="19" y1="47" x2="42" y2="47" {...strokeStyle} opacity={0.6} />
        </g>
        {/* Submit button below text box - same position as step 2 */}
        <g className="post-btn2">
          <rect x="57" y="56" width="22" height="8" rx="2" fill={color} opacity={0.3} />
          <rect x="57" y="56" width="22" height="8" rx="2" {...strokeStyle} />
          <text x="68" y="62" textAnchor="middle" fill={color} fontSize="5">Post</text>
        </g>
        {/* Success message - centered in window */}
        <g className="success-msg2">
          <rect x="27" y="32" width="40" height="14" rx="3" fill="#FFFFFF" />
          <rect x="27" y="32" width="40" height="14" rx="3" {...strokeStyle} opacity={0.3} />
          <text x="47" y="42" textAnchor="middle" fill={color} fontSize="7" fontWeight="bold">Success!</text>
        </g>
      </svg>
    );
  }

  return null;
};

// Tooltip messages for each step (step 2 handled separately with animation)
const stepTooltips = [
  "Fill out form",
  "", // Step 2 has animated text
  "Paste & done!"
];

// Animated tooltip text component with fade-in delay
const TooltipText = ({ text, color, delay = 0.5 }: { text: string; color: string; delay?: number }) => {
  return (
    <span
      style={{
        color,
        opacity: 0,
        animation: `tooltipTextFadeIn 0.4s ease-out ${delay}s forwards`
      }}
    >
      <style>{`
        @keyframes tooltipTextFadeIn {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {text}
    </span>
  );
};

// Animated tooltip text for step 2
const Step2TooltipText = ({ color }: { color: string }) => {
  return (
    <span style={{ color }}>
      <style>{`
        @keyframes step2Text1 {
          0% { opacity: 0; }
          8% { opacity: 0; }
          12% { opacity: 1; }
          45% { opacity: 1; }
          52% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes step2Text2 {
          0% { opacity: 0; }
          45% { opacity: 0; }
          52% { opacity: 1; }
          75% { opacity: 1; }
          82% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes step2Text3 {
          0% { opacity: 0; }
          75% { opacity: 0; }
          82% { opacity: 1; }
          100% { opacity: 1; }
        }
        .step2-text1 {
          animation: step2Text1 7s ease-in-out forwards;
        }
        .step2-text2 {
          animation: step2Text2 7s ease-in-out forwards;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }
        .step2-text3 {
          animation: step2Text3 7s ease-in-out forwards;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }
      `}</style>
      <span className="relative">
        <span className="step2-text1">Copy review and...</span>
        <span className="step2-text2">open review site.</span>
        <span className="step2-text3">(Log in if needed.)</span>
      </span>
    </span>
  );
};

interface ProcessIndicatorProps {
  primaryColor?: string;
  cardBackgroundColor?: string;
  cardTransparency?: number;
  cardTextColor?: string;
  platformName?: string;
}

export default function ProcessIndicator({ primaryColor = "#4F46E5", cardBackgroundColor = "#FFFFFF", cardTransparency = 1, cardTextColor = "#1A1A1A", platformName }: ProcessIndicatorProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<'waiting' | 'highlight' | 'drawLine' | 'pause' | 'fadeOut'>('waiting');
  const [drawnLines, setDrawnLines] = useState<number[]>([]);
  const [isFirstRun, setIsFirstRun] = useState(true);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const steps = [
    "Create review",
    platformName ? `Copy & open ${platformName}` : "Copy & open",
    "Paste & submit"
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
      <div className="flex items-center justify-center gap-6 sm:gap-8 md:gap-10">
        {steps.map((step, index) => {
          const isActive = index === activeStep && animationPhase !== 'waiting';
          const isCompleted = index < activeStep && animationPhase !== 'waiting';
          const isFadingOut = animationPhase === 'fadeOut';
          const isWaiting = animationPhase === 'waiting';
          
          return (
            <React.Fragment key={index}>
              {/* Step */}
              <div
                className="flex items-center relative cursor-pointer"
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
                onClick={() => setHoveredStep(hoveredStep === index ? null : index)}
              >
                {/* Animated Tooltip - appears on hover or click */}
                {hoveredStep === index && (
                  <div
                    className="absolute -top-28 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 pointer-events-none"
                    style={{
                      animation: 'tooltipFadeIn 0.3s ease-out forwards',
                    }}
                  >
                    <div
                      className="rounded-lg p-3 shadow-lg flex flex-col items-center"
                      style={{
                        backgroundColor: cardBackgroundColor,
                        border: `1px solid ${primaryColor}40`,
                      }}
                    >
                      <StepAnimation step={index} color={getContrastColor(cardBackgroundColor)} />
                      <span className="text-xs font-medium mt-1 whitespace-nowrap">
                        {index === 1 ? (
                          <Step2TooltipText color={getContrastColor(cardBackgroundColor)} />
                        ) : (
                          <TooltipText text={stepTooltips[index]} color={getContrastColor(cardBackgroundColor)} />
                        )}
                      </span>
                    </div>
                    {/* Triangle pointer */}
                    <div
                      className="w-0 h-0 -mt-px"
                      style={{
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderTop: `8px solid ${primaryColor}40`,
                      }}
                    />
                  </div>
                )}

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
                
                {/* Step Text - Responsive sizing */}
                <div className={`ml-1 sm:ml-1.5 md:ml-2 font-medium transition-colors ${
                  isFadingOut ? 'duration-1000' : 'duration-500'
                }`}
                style={{ color: cardTextColor }}>
                  {/* Very small screens only (<550px): Show compact format */}
                  <span className="block min-[550px]:hidden text-xs leading-tight whitespace-nowrap">
                    {index === 0 && "Create"}
                    {index === 1 && "Copy"}
                    {index === 2 && "Post"}
                  </span>
                  {/* Medium screens (550px-1024px): Show medium text without platform name */}
                  <span className="hidden min-[550px]:block lg:hidden text-sm whitespace-nowrap">
                    {index === 0 && "Create review"}
                    {index === 1 && "Copy & open"}
                    {index === 2 && "Paste & submit"}
                  </span>
                  {/* Large desktop (1024px+): Show full text with platform name */}
                  <span className="hidden lg:block text-sm whitespace-nowrap">
                    {step}
                  </span>
                </div>
              </div>
              
              {/* Connecting Line - Hidden on small screens, visible on md+ */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex flex-shrink-0 mx-1 md:mx-2 relative">
                  <div
                    className="h-0.5 w-6 md:w-10 lg:w-12"
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
      
      {/* Animations and motion preferences */}
      <style jsx>{`
        @keyframes tooltipFadeIn {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
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