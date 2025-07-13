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
  excludeAreas: { x: number, y: number, width: number, height: number }[]
): { x: number, y: number }[] {
  const positions: { x: number, y: number }[] = [];
  const margin = 50; // Minimum distance from edges
  const minDistance = 40; // Minimum distance between icons
  
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let validPosition = false;
    
    while (!validPosition && attempts < 100) {
      const x = margin + Math.random() * (canvasWidth - 2 * margin);
      const y = margin + Math.random() * (canvasHeight - 2 * margin);
      
      // Check if position conflicts with exclude areas
      let conflictsWithExcludeArea = false;
      for (const area of excludeAreas) {
        if (x >= area.x - margin && x <= area.x + area.width + margin &&
            y >= area.y - margin && y <= area.y + area.height + margin) {
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

      // Draw dotted cutout line for small sizes
      const smallSizes = ['4x6"', '5x7"', '5x8"'];
      if (smallSizes.includes(frameSize.label)) {
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(10, 10, frameSize.width - 20, frameSize.height - 20);
        ctx.setLineDash([]);
      }

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
      if (showClientLogo && clientLogoUrl && clientLogoUrl.trim() !== '') {
        try {
          const clientLogoImg = new window.Image();
          clientLogoImg.crossOrigin = 'anonymous';
          clientLogoImg.src = clientLogoUrl;
          await new Promise((resolve, reject) => {
            clientLogoImg.onload = resolve;
            clientLogoImg.onerror = reject;
          });
          
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
        } catch (error) {
          console.error('Error loading client logo:', error);
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
      await new Promise((resolve) => {
        qrImg.onload = resolve;
      });
      
      // Ensure QR code is always perfectly centered
      const qrCenterY = (frameSize.height - qrSize) / 2;
      ctx.drawImage(qrImg, qrX, qrCenterY, qrSize, qrSize);

      // Draw decorative icons if enabled
      if (showDecorativeIcons && decorativeIconCount > 0) {
        // Define areas to exclude (where we don't want decorative icons)
        const excludeAreas = [
          // QR code area
          { x: qrX - 20, y: qrCenterY - 20, width: qrSize + 40, height: qrSize + 40 },
          // Headline area (approximate)
          { x: 0, y: y - headlineFontSize, width: frameSize.width, height: headlineFontSize * lines.length + 60 },
          // Star area (if stars are shown)
          ...(showStars ? [{ x: 0, y: y, width: frameSize.width, height: starSize + 40 }] : []),
          // Client logo area (if shown)
          ...(showClientLogo && clientLogoUrl ? [{ x: 0, y: padding, width: frameSize.width, height: clientLogoHeight + 40 }] : []),
          // Bottom logo and text area
          { x: 0, y: frameSize.height - logoHeight - websiteFontSize - padding - 60, width: frameSize.width, height: logoHeight + websiteFontSize + 60 }
        ];

        // Generate random positions for decorative icons
        const iconPositions = generateDecorativeIconPositions(
          decorativeIconCount,
          frameSize.width,
          frameSize.height,
          excludeAreas
        );

        // Get the color for the decorative icons (use star color as default)
        const iconConfig = getFallingIcon(decorativeIconType);
        const iconColor = iconConfig ? iconConfig.color.replace(/text-([^-]*)-(\d+)/, '#') : starColor;
        
        // Convert Tailwind color classes to hex colors (simplified mapping)
        const colorMap: { [key: string]: string } = {
          'text-yellow-500': '#EAB308',
          'text-red-500': '#EF4444',
          'text-green-500': '#22C55E',
          'text-blue-500': '#3B82F6',
          'text-orange-500': '#F97316',
          'text-purple-500': '#A855F7',
          'text-pink-500': '#EC4899',
          'text-amber-500': '#F59E0B',
          'text-teal-500': '#14B8A6',
          'text-lime-500': '#84CC16',
        };
        
        const finalIconColor = iconConfig && colorMap[iconConfig.color] ? colorMap[iconConfig.color] : starColor;

        // Draw decorative icons at generated positions
        iconPositions.forEach(position => {
          drawDecorativeIcon(ctx, decorativeIconType, position.x, position.y, decorativeIconSize, finalIconColor);
        });
      }

      // Draw Prompt Reviews logo (smaller, towards bottom)
      const logoImg = new window.Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = 'https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompt-reviews-get-more-reviews-logo.png';
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });
      
      // Calculate logo dimensions to maintain aspect ratio
      const logoAspectRatio = logoImg.width / logoImg.height;
      const logoWidth = logoHeight * logoAspectRatio;
      const logoX = (frameSize.width - logoWidth) / 2;
      const logoY = frameSize.height - logoHeight - websiteFontSize - padding - 20; // Position towards bottom
      
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

  const downloadQRCode = useCallback(() => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
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
