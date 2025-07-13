/**
 * QRCodeGenerator Component
 * 
 * This component generates QR codes for prompt pages with customizable styling options.
 * 
 * Features:
 * - Customizable headline text (up to 2 lines, 40 characters max)
 * - Color pickers for star and main colors
 * - Show/hide stars toggle
 * - Multiple frame sizes with dotted cutout lines for small sizes
 * - High DPI canvas generation for print quality
 * - Decorative falling stars/icons scattered around the QR code
 * 
 * Usage:
 * - Parent components pass headline, colors, and showStars props
 * - onDownload callback receives the generated blob for download
 * - Component generates QR code and provides preview URL via onPreview callback
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import React from "react";
import { FALLING_STARS_ICONS, getFallingIcon } from "../../components/prompt-modules/fallingStarsConfig";

export const QR_FRAME_SIZES = [
  { label: '4x6" (postcard)', width: 1200, height: 1800 },
  { label: '5x7" (greeting card)', width: 1500, height: 2100 },
  { label: '5x8"', width: 1500, height: 2400 },
  { label: '8x10"', width: 2400, height: 3000 },
  {
    label: '8.5x11" (US Letter, standard printer paper)',
    width: 2550,
    height: 3300,
  },
  { label: '11x14" (small poster)', width: 3300, height: 4200 },
  // Additional sizes for various display ideas
  { label: '3.5x2" (business card)', width: 1050, height: 600 },
  { label: '2x3" (lanyard badge)', width: 600, height: 900 },
  { label: '3x3" (square sticker)', width: 900, height: 900 },
  { label: '4x4" (table tent)', width: 1200, height: 1200 },
  { label: '2.5x1.5" (small sticker)', width: 750, height: 450 },
  { label: '6x2" (window cling)', width: 1800, height: 600 },
];

interface QRCodeGeneratorProps {
  url: string;
  clientName: string;
  frameSize?: { label: string; width: number; height: number };
  onDownload?: (blob: Blob) => void;
  onPreview?: (previewUrl: string) => void;
  headline: string;
  starColor?: string;
  mainColor?: string;
  showStars?: boolean;
  clientLogoUrl?: string;
  showClientLogo?: boolean;
  starSize?: number;
  circularLogo?: boolean;
  logoSize?: number;
  fontSize?: number;
  // Decorative icons props
  showDecorativeIcons?: boolean;
  decorativeIconType?: string;
  decorativeIconCount?: number;
  decorativeIconSize?: number;
  decorativeIconColor?: string;
}

// Helper function to draw a star
function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', x, y);
  ctx.restore();
}

// Helper function to draw decorative icons using Unicode symbols
function drawDecorativeIcon(ctx: CanvasRenderingContext2D, iconKey: string, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Map common icon keys to Unicode symbols
  const iconMap: { [key: string]: string } = {
    'star': '★',
    'heart': '♥',
    'smile': '😊',
    'bolt': '⚡',
    'fire': '🔥',
    'sun': '☀️',
    'moon': '🌙',
    'peace': '☮',
    'gem': '💎',
    'trophy': '🏆',
    'snowflake': '❄️',
    'gift': '🎁',
    'coffee': '☕',
    'utensils': '🍴',
    'wine-glass': '🍷',
    'beer': '🍺',
    'pizza': '🍕',
    'pepper': '🌶️',
    'cat': '🐱',
    'dog': '🐶',
    'seedling': '🌱',
    'leaf': '🍃',
    'tree': '🌳',
    'wrench': '🔧',
    'hammer': '🔨',
    'briefcase': '💼',
    'key': '🔑',
    'camera': '📷',
    'music': '🎵',
    'anchor': '⚓',
    'crown': '👑',
    'magic': '✨',
    'rocket': '🚀',
    'plane': '✈️',
    'car': '🚗',
    'bicycle': '🚲',
    'umbrella': '☔',
    'diamond': '♦',
    'club': '♣',
    'spade': '♠',
    'flower': '🌸',
    'butterfly': '🦋',
  };
  
  const symbol = iconMap[iconKey] || '★'; // Default to star if not found
  ctx.fillText(symbol, x, y);
  ctx.restore();
}

// Helper function to generate random decorative icon positions
function generateDecorativeIconPositions(
  count: number,
  canvasWidth: number,
  canvasHeight: number,
  excludeAreas: { x: number, y: number, width: number, height: number }[],
  iconSize: number
): { x: number, y: number }[] {
  const positions: { x: number, y: number }[] = [];
  // Allow icons to go partially off-page for dynamic look
  const topMargin = -iconSize * 0.3; // Allow icons to go above canvas
  const sideMargin = -iconSize * 0.3; // Allow icons to go off the sides
  const bottomMargin = -iconSize * 0.3; // Allow icons to go below canvas
  const minDistance = Math.max(iconSize * 0.8, 30); // Reduced minimum distance for denser placement
  
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let validPosition = false;
    
    while (!validPosition && attempts < 200) { // Increased attempts for better placement
      const x = sideMargin + Math.random() * (canvasWidth - 2 * sideMargin);
      const y = topMargin + Math.random() * (canvasHeight - topMargin - bottomMargin);
      
      // Check if position conflicts with exclude areas (only check center of icon)
      let conflictsWithExcludeArea = false;
      for (const area of excludeAreas) {
        // Only check if the center of the icon is within the exclude area
        // This allows icons to appear at the edges of excluded areas
        if (x >= area.x && x <= area.x + area.width &&
            y >= area.y && y <= area.y + area.height) {
          conflictsWithExcludeArea = true;
          break;
        }
      }
      
      // Check if position conflicts with other icons
      let conflictsWithOtherIcons = false;
      for (const pos of positions) {
        const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (distance < minDistance) {
          conflictsWithOtherIcons = true;
          break;
        }
      }
      
      if (!conflictsWithExcludeArea && !conflictsWithOtherIcons) {
        positions.push({ x, y });
        validPosition = true;
      }
      
      attempts++;
    }
  }
  
  return positions;
}

export default function QRCodeGenerator({
  url,
  clientName,
  frameSize = QR_FRAME_SIZES[0],
  onDownload,
  onPreview,
  headline,
  starColor = "#FFD700",
  mainColor = "#2E4A7D",
  showStars = true,
  clientLogoUrl,
  showClientLogo = false,
  starSize = 20, // Default star size
  circularLogo = false,
  logoSize = 60, // Default logo size
  fontSize = 48, // Default font size
  // Decorative icons
  showDecorativeIcons = false,
  decorativeIconType = "star",
  decorativeIconCount = 8,
  decorativeIconSize = 24,
  decorativeIconColor = "#FFD700",
}: QRCodeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size based on frame size
      const scale = 2; // For high DPI
      canvas.width = frameSize.width * scale;
      canvas.height = frameSize.height * scale;
      ctx.scale(scale, scale);

      // Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, frameSize.width, frameSize.height);

      // Detect small sizes for better spacing
      const isBusinessCard = frameSize.label.includes('business card');
      const isSmallSize = frameSize.width <= 1050 || frameSize.height <= 600; // Business card and smaller

      // Layout constants with size-specific adjustments
      const padding = isSmallSize ? 40 : 60; // Smaller padding for small sizes
      const logoHeight = Math.floor(frameSize.height * 0.06); // Reduced from 0.10 to make smaller
      const websiteFontSize = isSmallSize ? 16 : 20; // Smaller website text for small sizes
      const headlineFontSize = isSmallSize ? Math.min(fontSize, 36) : fontSize; // Cap font size for small formats
      const starSpacing = Math.floor(starSize * 0.7);
      const clientLogoHeight = isSmallSize ? Math.min(logoSize, 40) : logoSize; // Cap logo size for small formats
      const qrSize = Math.min(frameSize.width, frameSize.height) * (isSmallSize ? 0.35 : 0.38); // Slightly smaller QR for small sizes
      const qrX = (frameSize.width - qrSize) / 2;
      
      // Start layout from top
      let y = padding;

      // Draw client logo if enabled (at the very top)
      if (showClientLogo && clientLogoUrl && typeof clientLogoUrl === 'string' && clientLogoUrl.trim() !== '') {
        try {
          // For blob URLs, check if they're still valid
          if (clientLogoUrl.startsWith('blob:')) {
            // Test if blob URL is still valid by trying to create an image
            const testImg = new window.Image();
            const isValidBlob = await new Promise<boolean>((resolve) => {
              testImg.onload = () => resolve(true);
              testImg.onerror = () => resolve(false);
              testImg.src = clientLogoUrl;
              // Quick timeout for blob validation
              setTimeout(() => resolve(false), 1000);
            });
            
            if (!isValidBlob) {
              console.log('Blob URL is invalid, skipping logo');
              // Continue without logo - don't process this logo section
              // The rest of the QR code generation will continue
            } else {
              // Blob is valid, proceed with logo loading
              const clientLogoImg = new window.Image();
              // Only set crossOrigin for external URLs, not for blob URLs
              if (!clientLogoUrl.startsWith('blob:')) {
                clientLogoImg.crossOrigin = 'anonymous';
              }
              clientLogoImg.src = clientLogoUrl;
              
              await Promise.race([
                new Promise<void>((resolve, reject) => {
                  clientLogoImg.onload = () => {
                    resolve();
                  };
                  clientLogoImg.onerror = (event) => {
                    reject(new Error(`Failed to load logo from URL: ${clientLogoUrl}`));
                  };
                }),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Logo loading timeout')), 5000)
                )
              ]);
              
              // Calculate client logo dimensions to maintain aspect ratio
              const clientLogoAspectRatio = clientLogoImg.width / clientLogoImg.height;
              const clientLogoWidth = clientLogoHeight * clientLogoAspectRatio;
              const clientLogoX = (frameSize.width - clientLogoWidth) / 2;
              
              if (circularLogo) {
                // Save the current state
                ctx.save();
                
                // Create circular clipping path
                const radius = clientLogoHeight / 2;
                const centerX = clientLogoX + clientLogoWidth / 2;
                const centerY = y + clientLogoHeight / 2;
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.clip();
                
                // Draw the image within the circular clip
                ctx.drawImage(clientLogoImg, clientLogoX, y, clientLogoWidth, clientLogoHeight);
                
                // Restore the state to remove the clipping path
                ctx.restore();
              } else {
                // Draw logo normally (rectangular)
                ctx.drawImage(clientLogoImg, clientLogoX, y, clientLogoWidth, clientLogoHeight);
              }
              
              // Adjusted spacing after client logo - smaller for small sizes
              y += clientLogoHeight + (isSmallSize ? 20 : 40);
            }
          } else {
            // Non-blob URL processing
            const clientLogoImg = new window.Image();
            // Only set crossOrigin for external URLs, not for blob URLs
            if (!clientLogoUrl.startsWith('blob:')) {
              clientLogoImg.crossOrigin = 'anonymous';
            }
            clientLogoImg.src = clientLogoUrl;
            
            await Promise.race([
              new Promise<void>((resolve, reject) => {
                clientLogoImg.onload = () => {
                  resolve();
                };
                clientLogoImg.onerror = (event) => {
                  reject(new Error(`Failed to load logo from URL: ${clientLogoUrl}`));
                };
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Logo loading timeout')), 5000)
              )
            ]);
            
            // Calculate client logo dimensions to maintain aspect ratio
            const clientLogoAspectRatio = clientLogoImg.width / clientLogoImg.height;
            const clientLogoWidth = clientLogoHeight * clientLogoAspectRatio;
            const clientLogoX = (frameSize.width - clientLogoWidth) / 2;
            
            if (circularLogo) {
              // Save the current state
              ctx.save();
              
              // Create circular clipping path
              const radius = clientLogoHeight / 2;
              const centerX = clientLogoX + clientLogoWidth / 2;
              const centerY = y + clientLogoHeight / 2;
              
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
              ctx.clip();
              
              // Draw the image within the circular clip
              ctx.drawImage(clientLogoImg, clientLogoX, y, clientLogoWidth, clientLogoHeight);
              
              // Restore the state to remove the clipping path
              ctx.restore();
            } else {
              // Draw logo normally (rectangular)
              ctx.drawImage(clientLogoImg, clientLogoX, y, clientLogoWidth, clientLogoHeight);
            }
            
            // Adjusted spacing after client logo - smaller for small sizes
            y += clientLogoHeight + (isSmallSize ? 20 : 40);
          }
        } catch (error) {
          console.error('Error loading client logo:', {
            message: error instanceof Error ? error.message : String(error),
            logoUrl: clientLogoUrl,
            showClientLogo,
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            isBlob: clientLogoUrl?.startsWith('blob:'),
            urlValid: !!clientLogoUrl
          });
          // Continue without client logo if it fails to load
        }
      }

      // Draw stars if enabled (after logo)
      if (showStars) {
        // Business cards need larger stars to be visible, other small sizes can be smaller
        let adjustedStarSize;
        if (isBusinessCard) {
          adjustedStarSize = Math.max(Math.min(starSize, 28), 20); // Business cards: min 20px, max 28px
        } else if (isSmallSize) {
          adjustedStarSize = Math.min(starSize, 16); // Other small formats: max 16px
        } else {
          adjustedStarSize = starSize; // Normal sizes: use full star size
        }
        
        const totalStarWidth = 5 * adjustedStarSize + 4 * starSpacing;
        const starStartX = (frameSize.width - totalStarWidth) / 2 + adjustedStarSize / 2;
        for (let i = 0; i < 5; i++) {
          drawStar(ctx, starStartX + i * (adjustedStarSize + starSpacing), y + adjustedStarSize / 2, adjustedStarSize, starColor);
        }
        y += adjustedStarSize + (isSmallSize ? 15 : 20); // Less spacing for small sizes
      }

      // Calculate center area for QR and headline with size-specific spacing
      const centerY = y + (isSmallSize ? 15 : 20);
      
      // Draw headline text
      ctx.fillStyle = mainColor;
      ctx.font = `bold ${headlineFontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const lines = headline.split('\n');
      lines.forEach((line, index) => {
        ctx.fillText(line, frameSize.width / 2, centerY + index * (headlineFontSize + 8));
      });
      
      // Increased spacing between headline and QR code for business cards and small sizes
      const headlineToQRSpacing = isBusinessCard ? 40 : isSmallSize ? 32 : 24;
      let qrY = centerY + lines.length * (headlineFontSize + 8) + headlineToQRSpacing;

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: qrSize,
        margin: 1,
        color: {
          dark: mainColor,
          light: '#FFFFFF'
        }
      });
      // Draw QR code (perfectly centered)
      const qrImg = new window.Image();
      qrImg.src = qrDataUrl;
      await new Promise<void>((resolve) => {
        qrImg.onload = resolve;
      });
      
      // Ensure QR code is always perfectly centered
      const qrCenterY = (frameSize.height - qrSize) / 2;
      ctx.drawImage(qrImg, qrX, qrCenterY, qrSize, qrSize);

      // Pre-calculate logo dimensions for exclusion areas
      const logoAspectRatio = 2.5; // Approximate aspect ratio of the Prompt Reviews logo
      const logoWidth = logoHeight * logoAspectRatio;
      const logoX = (frameSize.width - logoWidth) / 2;
      const logoY = frameSize.height - logoHeight - websiteFontSize - padding - 20;

      // Draw decorative icons if enabled
      if (showDecorativeIcons && decorativeIconCount > 0) {
        // Define areas to exclude (where we don't want decorative icons)
        // Made more targeted to allow icons above text and below logo
        const excludeAreas = [
          // QR code area (keep generous margin around QR code)
          { x: qrX - 30, y: qrCenterY - 30, width: qrSize + 60, height: qrSize + 60 },
          // Headline area (more targeted - only the actual text area)
          { x: frameSize.width * 0.1, y: centerY - 10, width: frameSize.width * 0.8, height: headlineFontSize * lines.length + 20 },
          // Star area (if stars are shown) - more targeted
          ...(showStars ? [{ x: frameSize.width * 0.2, y: y - 10, width: frameSize.width * 0.6, height: starSize + 20 }] : []),
          // Client logo area (if shown) - more targeted around actual logo
          ...(showClientLogo && clientLogoUrl ? [{ x: frameSize.width * 0.3, y: padding - 10, width: frameSize.width * 0.4, height: clientLogoHeight + 20 }] : []),
          // Bottom logo area - more targeted around actual logo
          { x: logoX - 20, y: logoY - 10, width: logoWidth + 40, height: logoHeight + 20 },
          // Bottom text area - more targeted around actual text
          { x: frameSize.width * 0.2, y: logoY + logoHeight + 5, width: frameSize.width * 0.6, height: websiteFontSize + 10 }
        ];

        // Generate random positions for decorative icons
        const iconPositions = generateDecorativeIconPositions(
          decorativeIconCount,
          frameSize.width,
          frameSize.height,
          excludeAreas,
          decorativeIconSize
        );

        // Draw decorative icons at generated positions
        iconPositions.forEach(position => {
          drawDecorativeIcon(ctx, decorativeIconType, position.x, position.y, decorativeIconSize, decorativeIconColor);
        });
      }

      // Draw Prompt Reviews logo (smaller, towards bottom)
      const logoImg = new window.Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = 'https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompt-reviews-get-more-reviews-logo.png';
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });
      
      // Use pre-calculated logo dimensions
      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

      // Draw website text (below logo, at bottom)
      ctx.font = `bold ${websiteFontSize}px Arial, sans-serif`;
      ctx.fillStyle = mainColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('promptreviews.app', frameSize.width / 2, logoY + logoHeight + 10);

      // Store canvas for download
      if (canvasRef.current) {
        const previewCanvas = canvasRef.current;
        const previewCtx = previewCanvas.getContext('2d');
        if (previewCtx) {
          previewCanvas.width = canvas.width;
          previewCanvas.height = canvas.height;
          previewCtx.drawImage(canvas, 0, 0);
        }
      }

      // Provide preview URL to parent
      const previewDataUrl = canvas.toDataURL('image/png');
      if (onPreview) {
        onPreview(previewDataUrl);
      }
      
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setIsGenerating(false);
    }
  };

  const downloadQRCode = useCallback(async () => {
    if (!canvasRef.current) return;
    
    // Generate a new canvas with dotted lines for download
    const downloadCanvas = document.createElement('canvas');
    const downloadCtx = downloadCanvas.getContext('2d');
    if (!downloadCtx) return;
    
    // Copy the current canvas
    downloadCanvas.width = canvasRef.current.width;
    downloadCanvas.height = canvasRef.current.height;
    downloadCtx.drawImage(canvasRef.current, 0, 0);
    
    // Add dotted cutout line for small sizes on the download version
    const scale = 2; // Match the scale used in generateQRCode
    downloadCtx.scale(1/scale, 1/scale); // Adjust for the scale
    downloadCtx.scale(scale, scale); // Re-apply scale for drawing
    
    const smallSizes = ['4x6"', '5x7"', '5x8"'];
    if (smallSizes.includes(frameSize.label)) {
      downloadCtx.strokeStyle = '#CCCCCC';
      downloadCtx.lineWidth = 1;
      downloadCtx.setLineDash([5, 5]);
      downloadCtx.strokeRect(10, 10, frameSize.width - 20, frameSize.height - 20);
      downloadCtx.setLineDash([]);
    }
    
    // Create blob from the download canvas with dotted lines
    downloadCanvas.toBlob((blob) => {
      if (blob) {
        if (onDownload) onDownload(blob);
        const link = document.createElement("a");
        link.download = `review-qr-${clientName.toLowerCase().replace(/\s+/g, "-")}-${frameSize.label.replace(/[^a-z0-9]/gi, "-")}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      }
    }, "image/png");
  }, [canvasRef, onDownload, clientName, frameSize.label]);

  // Generate QR code when component mounts or props change
  useEffect(() => {
    generateQRCode();
  }, [frameSize, headline, starColor, mainColor, showStars, url, clientLogoUrl, showClientLogo, starSize, circularLogo, logoSize, fontSize, showDecorativeIcons, decorativeIconType, decorativeIconCount, decorativeIconSize]);

  // Expose download function via ref
  useEffect(() => {
    if (canvasRef.current) {
      (canvasRef.current as any).downloadQRCode = downloadQRCode;
    }
  }, [downloadQRCode]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ display: 'none' }}
      data-qr-generator
    />
  );
}
