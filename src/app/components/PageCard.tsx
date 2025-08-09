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
  topMargin = "mt-16", // Increased from mt-8 to mt-16 for more space on other pages
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  topRightAction?: React.ReactNode;
  bottomRightAction?: React.ReactNode;
  bottomLeftImage?: BottomImage;
  bottomRightImage?: BottomImage;
  topMargin?: string; // Add to interface
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [imgHeight, setImgHeight] = useState(0);
  const [imgWidth, setImgWidth] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // Show image immediately when props are available
  useEffect(() => {
    if (bottomLeftImage || bottomRightImage) {
      setShowImage(true);
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
    <div className={`w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 ${topMargin} mb-16 flex justify-center items-start`}>
      <div
        className={`page relative w-full max-w-[1000px] rounded-2xl bg-white shadow-lg pt-4 px-8 md:px-12 pb-8 ${className}`}
        style={{ overflow: "visible" }} // Restore to visible for icon breaching
      >
        {icon && (
          <div key="page-card-icon" className="icon absolute -top-4 -left-4 sm:-top-6 sm:-left-6 z-10 bg-white rounded-full shadow-lg w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
            {icon}
          </div>
        )}
        {/* Top-right action button */}
        {topRightAction && (
          <div className="absolute top-4 right-4 sm:right-8 z-20 hidden sm:block">
            {topRightAction}
          </div>
        )}
        <div
          className="content w-full px-1 pt-2 sm:pt-0"
          style={{ 
            paddingBottom: imageToShow && showImage ? "400px" : undefined
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
            className={`absolute bottom-0 z-10 pointer-events-none transition-opacity duration-500 ${isRightPositioned ? 'right-0' : 'left-0'}`} 
            style={{ width: "auto", maxWidth: "40%" }}
          >
            <Image
              ref={imgRef}
              src={imageToShow.src}
              alt={imageToShow.alt}
              width={imageToShow.maxWidth || maxImgPx}
              height={imageToShow.maxHeight || maxImgPx}
              style={{
                maxWidth: "390px", // Increased from 300px to 390px (30% larger)
                maxHeight: "390px", // Increased from 300px to 390px (30% larger)
                width: "auto",
                height: "auto",
                minWidth: "200px", // Reasonable minimum
                minHeight: "200px", // Reasonable minimum
                objectFit: "contain" as const,
                display: "block"
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
