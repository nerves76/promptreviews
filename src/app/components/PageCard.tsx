import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

/*
 * USAGE INSTRUCTION:
 *
 * For consistent page layout and margin below the card, always wrap <PageCard> in a parent div with:
 *   className="min-h-screen flex justify-center items-start px-4 sm:px-0"
 * This matches the Dashboard and ensures proper spacing on all new pages.
 *
 * Example:
 *   <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
 *     <PageCard icon={<FaStar />}> ... </PageCard>
 *   </div>
 */

/**
 * PageCard component
 *
 * Usage: For main page/card layout, floating top-left icon, and card-level actions.
 * - Always use for dashboard and prompt page forms.
 * - Pass the icon prop for a floating, breaching icon in the top-left.
 * - Use topRightAction and bottomRightAction for action buttons.
 * - Use bottomLeftImage to add a decorative image at the bottom-left of the card.
 * - Use bottomRightImage to add a decorative image at the bottom-right of the card.
 * - Wrap in a parent div with min-h-screen flex justify-center for spacing.
 *
 * See DESIGN_GUIDELINES.md for visual rules and examples.
 */

interface BottomImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export default function PageCard({
  icon,
  children,
  className = "",
  topRightAction,
  bottomRightAction,
  bottomLeftImage,
  bottomRightImage,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  topRightAction?: React.ReactNode;
  bottomRightAction?: React.ReactNode;
  bottomLeftImage?: BottomImage;
  bottomRightImage?: BottomImage;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [imgHeight, setImgHeight] = useState(0);
  const [imgWidth, setImgWidth] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // Add a delay before showing the image to prevent it from appearing during initial page load
  useEffect(() => {
    if (bottomLeftImage || bottomRightImage) {
      const timer = setTimeout(() => {
        setShowImage(true);
      }, 2000); // 2 second delay
      return () => clearTimeout(timer);
    }
  }, [bottomLeftImage, bottomRightImage]);

  // Dynamically set bottom padding to match image height
  useEffect(() => {
    if (imgRef.current && imageLoaded) {
      setImgHeight(imgRef.current.offsetHeight);
      setImgWidth(imgRef.current.offsetWidth);
    }
  }, [imageLoaded, showImage]);

  // Responsive image sizing - 2-3 times larger than before
  const maxImgPx = 800; // Increased from 320 to 800 (2.5x larger)
  const imgStyle = {
    maxWidth: "60%", // Increased from 40% to 60%
    maxHeight: "60%", // Increased from 40% to 60%
    width: "auto",
    height: "auto",
    minWidth: "200px", // Increased from 120px
    minHeight: "200px", // Increased from 120px
    objectFit: "contain" as const,
    display: "block"
  };

  // Determine which image to show and its position
  const imageToShow = bottomRightImage || bottomLeftImage;
  const isRightPositioned = !!bottomRightImage;

  return (
    <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-12 md:mt-16 lg:mt-20 mb-16 flex justify-center items-start">
      <div
        className={`page relative w-full max-w-[1000px] rounded-2xl bg-white shadow-lg pt-4 px-8 md:px-12 pb-8 ${className}`}
        style={{ overflow: "visible" }} // Restore to visible for icon breaching
      >
        {icon && (
          <div key="page-card-icon" className="icon absolute -top-4 -left-4 sm:-top-6 sm:-left-6 z-10 bg-white rounded-full shadow-lg p-3 sm:p-4 flex items-center justify-center">
            {icon}
          </div>
        )}
        {/* Top-right action button */}
        {topRightAction && (
          <div className="absolute top-4 right-4 z-20 mr-4">
            {topRightAction}
          </div>
        )}
        <div
          className="content w-full px-1 pt-2 sm:pt-0"
          style={{ 
            paddingBottom: imageToShow && showImage ? "300px" : undefined
          }}
        >
          {children}
        </div>
        {/* Bottom-right action button */}
        {bottomRightAction && (
          <>
            <div className="flex justify-end mt-8 mb-2">
              {bottomRightAction}
            </div>
            <div className="h-16" />
          </>
        )}
        {/* Bottom image */}
        {imageToShow && showImage && (
          <div 
            className={`absolute bottom-0 z-0 pointer-events-none transition-opacity duration-500 ${isRightPositioned ? 'right-0' : 'left-0'}`} 
            style={{ width: "100%", maxWidth: maxImgPx }}
          >
            <Image
              ref={imgRef}
              src={imageToShow.src}
              alt={imageToShow.alt}
              width={imageToShow.maxWidth || maxImgPx}
              height={imageToShow.maxHeight || maxImgPx}
              style={{
                maxWidth: "50%", // Increased from 25% to 50% (doubled)
                maxHeight: "50%", // Increased from 25% to 50% (doubled)
                width: "auto",
                height: "auto",
                minWidth: "240px", // Increased from 120px to 240px (doubled)
                minHeight: "240px", // Increased from 120px to 240px (doubled)
                objectFit: "contain" as const,
                display: "block",
                marginLeft: isRightPositioned ? "auto" : "0", // Push image to the right if right-positioned
                marginRight: isRightPositioned ? "0" : "auto" // Ensure it's flush with the right edge if right-positioned
              }}
              onLoad={() => setImageLoaded(true)}
              priority={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
