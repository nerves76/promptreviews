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
 * - PDF generation with proper print dimensions and cut-out lines
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
import jsPDF from 'jspdf';

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
  { label: '8.5x11" (Table tent template)', width: 2550, height: 3300 },
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
  // NFC text support
  showNfcText?: boolean;
  nfcTextSize?: number;
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

// Helper functions for drawing simple flat icons that match FontAwesome aesthetic
function drawSimpleStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  ctx.beginPath();
  ctx.fillStyle = color;
  const points = 5;
  const outerRadius = radius * 0.8;
  const innerRadius = radius * 0.35;
  
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const px = x + Math.cos(angle - Math.PI / 2) * r;
    const py = y + Math.sin(angle - Math.PI / 2) * r;
    
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
}

function drawSimpleHeart(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  ctx.beginPath();
  ctx.fillStyle = color;
  const width = radius * 1.2;
  const height = radius * 1.1;
  const topCurveHeight = height * 0.3;
  
  ctx.moveTo(x, y + topCurveHeight);
  ctx.bezierCurveTo(x, y, x - width / 2, y, x - width / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x - width / 2, y + (height + topCurveHeight) / 2, x, y + (height + topCurveHeight) / 2, x, y + height);
  ctx.bezierCurveTo(x, y + (height + topCurveHeight) / 2, x + width / 2, y + (height + topCurveHeight) / 2, x + width / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x + width / 2, y, x, y, x, y + topCurveHeight);
  ctx.fill();
}



function drawSimpleBolt(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.3, y - radius * 0.8);
  ctx.lineTo(x + radius * 0.2, y - radius * 0.8);
  ctx.lineTo(x - radius * 0.1, y - radius * 0.1);
  ctx.lineTo(x + radius * 0.3, y - radius * 0.1);
  ctx.lineTo(x - radius * 0.2, y + radius * 0.8);
  ctx.lineTo(x + radius * 0.1, y + radius * 0.1);
  ctx.lineTo(x - radius * 0.3, y + radius * 0.1);
  ctx.closePath();
  ctx.fill();
}

function drawSimpleSun(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, radius / 8);
  
  // Center circle
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.4, 0, 2 * Math.PI);
  ctx.fill();
  
  // Rays (thicker for better visibility)
  const rays = 8;
  for (let i = 0; i < rays; i++) {
    const angle = (i * 2 * Math.PI) / rays;
    const startX = x + Math.cos(angle) * radius * 0.6;
    const startY = y + Math.sin(angle) * radius * 0.6;
    const endX = x + Math.cos(angle) * radius * 0.9;
    const endY = y + Math.sin(angle) * radius * 0.9;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}

function drawSimpleMoon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  ctx.fillStyle = color;
  
  // Draw full circle
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.8, 0, 2 * Math.PI);
  ctx.fill();
  
  // Create crescent by removing a portion
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x + radius * 0.3, y - radius * 0.1, radius * 0.7, 0, 2 * Math.PI);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}







function drawDefaultIcon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  // Fallback to a simple circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.6, 0, 2 * Math.PI);
  ctx.fill();
}

// Print-optimized decorative icon functions



function drawDecorativeIcon(ctx: CanvasRenderingContext2D, iconKey: string, x: number, y: number, size: number, color: string) {
  const iconConfig = getFallingIcon(iconKey);
  
  ctx.save();
  const radius = size / 2;
  
  // Draw simple geometric shapes that match FontAwesome's flat aesthetic
  switch (iconKey) {
    case 'star':
      drawSimpleStar(ctx, x, y, radius, color);
      break;
    case 'heart':
      drawSimpleHeart(ctx, x, y, radius, color);
      break;
    case 'bolt':
      drawSimpleBolt(ctx, x, y, radius, color);
      break;
    case 'sun':
      drawSimpleSun(ctx, x, y, radius, color);
      break;
    case 'moon':
      drawSimpleMoon(ctx, x, y, radius, color);
      break;
    default:
      drawDefaultIcon(ctx, x, y, radius, color);
      break;
  }
  
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
  // NFC text support
  showNfcText = false,
  nfcTextSize = 18,
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

      // Detect specific frame sizes for custom layouts
      const isBusinessCard = frameSize.label.includes('business card');
      const isPostcard = frameSize.label.includes('postcard');
      const isTableTent = frameSize.label.includes('Table Tent');
      const is5x7 = frameSize.label.includes('5x7');
      const is8x10 = frameSize.label.includes('8x10');
      const is8p5x11 = frameSize.label.includes('8.5x11') && !frameSize.label.includes('Table Tent');
      const is11x14 = frameSize.label.includes('11x14');
      const is2x3 = frameSize.label.includes('2x3');
      const is3x3 = frameSize.label.includes('3x3');
      const is6x2 = frameSize.label.includes('6x2');
      const isSmallCard = frameSize.width <= 1200 || frameSize.height <= 1800; // Postcard and smaller
      const isLargeCard = frameSize.width >= 2400 || frameSize.height >= 3000; // Letter size and larger
      const isSmallSize = frameSize.width <= 1050 || frameSize.height <= 600; // Business card and smaller

      // Calculate proportional sizing based on frame dimensions
      const baseSize = Math.min(frameSize.width, frameSize.height);
      
      // Layout constants with proportional sizing
      const padding = Math.floor(baseSize * 0.08); // 8% of base size
      const logoHeight = Math.floor(frameSize.height * 0.06); // 6% of height
      const websiteFontSize = Math.floor(baseSize * 0.022); // 2.2% of base size (was fixed 16-20px)
      
      // Calculate headline font size with custom sizing for specific frame sizes
      let headlineFontSize;
      if (is5x7) {
        // 5x7: Default headline size of 88px
        headlineFontSize = Math.min(fontSize, 88);
      } else if (is8p5x11) {
        // 8.5x11: Header 170px
        headlineFontSize = Math.min(fontSize, 170);
      } else if (is11x14) {
        // 11x14: Header 180px
        headlineFontSize = Math.min(fontSize, 180);
      } else if (isBusinessCard) {
        // Business cards need very small text
        headlineFontSize = Math.min(fontSize, Math.floor(baseSize * 0.06)); // Cap at 6% of base size
      } else if (isPostcard || isSmallCard) {
        // Postcards and small cards need moderate text
        headlineFontSize = Math.min(fontSize, Math.floor(baseSize * 0.08)); // Cap at 8% of base size
      } else if (isTableTent) {
        // Table tents need larger text for visibility
        headlineFontSize = Math.min(fontSize, Math.floor(baseSize * 0.12)); // Cap at 12% of base size
      } else if (isLargeCard) {
        // Large cards can handle bigger text
        headlineFontSize = Math.min(fontSize, Math.floor(baseSize * 0.12)); // Cap at 12% of base size
      } else {
        // Medium cards (default)
        headlineFontSize = Math.min(fontSize, Math.floor(baseSize * 0.1)); // Cap at 10% of base size
      }
      
      const starSpacing = Math.floor(starSize * 0.7);
      const clientLogoHeight = Math.floor((logoSize / 60) * baseSize * 0.08); // Scale user's logo size proportionally 
      
      // Calculate QR size with custom sizing for specific frame sizes
      let qrSize;
      if (is8x10 || is8p5x11 || is11x14) {
        // 8x10, 8.5x11, 11x14: Make QR code smaller
        qrSize = baseSize * 0.28;
      } else if (is3x3) {
        // 3x3: Make QR code smaller
        qrSize = baseSize * 0.30;
      } else if (isTableTent) {
        // Table tent: Make QR code smaller
        qrSize = baseSize * 0.25;
      } else {
        // Default sizing
        qrSize = baseSize * (isSmallSize ? 0.35 : 0.38);
      }
      const qrX = (frameSize.width - qrSize) / 2;
      
      // Pre-calculate proportional star size for use in exclusion areas
      const proportionalStarSize = Math.floor((starSize / 48) * baseSize * 0.06); // Scale user's star size proportionally (6% of base size when starSize is 48)
      const proportionalStarSpacing = Math.floor(proportionalStarSize * 0.7);
      
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
              
              // Custom positioning for specific frame sizes
              let logoPositionX, logoPositionY;
              const clientLogoAspectRatio = clientLogoImg.width / clientLogoImg.height;
              let actualClientLogoWidth = clientLogoHeight * clientLogoAspectRatio;
              let actualClientLogoHeight = clientLogoHeight;
              
              // Special positioning for specific sizes
              if (isBusinessCard || is6x2) {
                // 3.5x2" and 6x2": Put logo in top left corner
                logoPositionX = padding;
                logoPositionY = padding;
                // Don't advance y for horizontal layouts
              } else if (is3x3) {
                // 3x3": Make logo smaller and keep centered  
                actualClientLogoHeight = clientLogoHeight * 0.7; // Make 30% smaller
                actualClientLogoWidth = actualClientLogoHeight * clientLogoAspectRatio;
                logoPositionX = (frameSize.width - actualClientLogoWidth) / 2;
                logoPositionY = y;
              } else if (isTableTent) {
                // Table tent: Make logo smaller
                actualClientLogoHeight = clientLogoHeight * 0.7; // Make 30% smaller
                actualClientLogoWidth = actualClientLogoHeight * clientLogoAspectRatio;
                logoPositionX = (frameSize.width - actualClientLogoWidth) / 2;
                logoPositionY = y;
              } else {
                // Default centered positioning
                logoPositionX = (frameSize.width - actualClientLogoWidth) / 2;
                logoPositionY = y;
              }
              
              if (circularLogo) {
                // Save the current state
                ctx.save();
                
                // Create circular clipping path
                const radius = actualClientLogoHeight / 2;
                const centerX = logoPositionX + actualClientLogoWidth / 2;
                const centerY = logoPositionY + actualClientLogoHeight / 2;
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.clip();
                
                // Calculate dimensions for object-fit: contain behavior (like prompt page)
                const containerSize = actualClientLogoHeight; // Circular container size
                const imgAspectRatio = clientLogoImg.width / clientLogoImg.height;
                
                let drawWidth, drawHeight;
                if (imgAspectRatio > 1) {
                  // Wide image - fit to width
                  drawWidth = containerSize;
                  drawHeight = containerSize / imgAspectRatio;
                } else {
                  // Tall image - fit to height  
                  drawHeight = containerSize;
                  drawWidth = containerSize * imgAspectRatio;
                }
                
                // Center the image within the circular container
                const drawX = centerX - drawWidth / 2;
                const drawY = centerY - drawHeight / 2;
                
                // Draw the image with proper centering and aspect ratio (like object-fit: contain)
                ctx.drawImage(clientLogoImg, drawX, drawY, drawWidth, drawHeight);
                
                // Restore the state to remove the clipping path
                ctx.restore();
              } else {
                // Draw logo normally (rectangular)
                ctx.drawImage(clientLogoImg, logoPositionX, logoPositionY, actualClientLogoWidth, actualClientLogoHeight);
              }
              
              // Proportional spacing after client logo (adjust for horizontal layouts)
              if (isBusinessCard || is6x2) {
                // For horizontal layouts, don't advance Y since logo is in corner
                // Keep original Y for the rest of the content
              } else {
                y += actualClientLogoHeight + Math.floor(baseSize * 0.05);
              }
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
            
            // Custom positioning for specific frame sizes
            let logoPositionX, logoPositionY;
            const clientLogoAspectRatio = clientLogoImg.width / clientLogoImg.height;
            let actualClientLogoWidth = clientLogoHeight * clientLogoAspectRatio;
            let actualClientLogoHeight = clientLogoHeight;
            
            // Special positioning for specific sizes
            if (isBusinessCard || is6x2) {
              // 3.5x2" and 6x2": Put logo in top left corner
              logoPositionX = padding;
              logoPositionY = padding;
              // Don't advance y for horizontal layouts
            } else if (is3x3) {
              // 3x3": Make logo smaller and keep centered  
              actualClientLogoHeight = clientLogoHeight * 0.7; // Make 30% smaller
              actualClientLogoWidth = actualClientLogoHeight * clientLogoAspectRatio;
              logoPositionX = (frameSize.width - actualClientLogoWidth) / 2;
              logoPositionY = y;
            } else if (isTableTent) {
              // Table tent: Make logo smaller
              actualClientLogoHeight = clientLogoHeight * 0.7; // Make 30% smaller
              actualClientLogoWidth = actualClientLogoHeight * clientLogoAspectRatio;
              logoPositionX = (frameSize.width - actualClientLogoWidth) / 2;
              logoPositionY = y;
            } else {
              // Default centered positioning
              logoPositionX = (frameSize.width - actualClientLogoWidth) / 2;
              logoPositionY = y;
            }
            
            if (circularLogo) {
              // Save the current state
              ctx.save();
              
              // Create circular clipping path
              const radius = actualClientLogoHeight / 2;
              const centerX = logoPositionX + actualClientLogoWidth / 2;
              const centerY = logoPositionY + actualClientLogoHeight / 2;
              
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
              ctx.clip();
              
              // Calculate dimensions for object-fit: contain behavior (like prompt page)
              const containerSize = actualClientLogoHeight; // Circular container size
              const imgAspectRatio = clientLogoImg.width / clientLogoImg.height;
              
              let drawWidth, drawHeight;
              if (imgAspectRatio > 1) {
                // Wide image - fit to width
                drawWidth = containerSize;
                drawHeight = containerSize / imgAspectRatio;
              } else {
                // Tall image - fit to height  
                drawHeight = containerSize;
                drawWidth = containerSize * imgAspectRatio;
              }
              
              // Center the image within the circular container
              const drawX = centerX - drawWidth / 2;
              const drawY = centerY - drawHeight / 2;
              
              // Draw the image with proper centering and aspect ratio (like object-fit: contain)
              ctx.drawImage(clientLogoImg, drawX, drawY, drawWidth, drawHeight);
              
              // Restore the state to remove the clipping path
              ctx.restore();
            } else {
              // Draw logo normally (rectangular)
              ctx.drawImage(clientLogoImg, logoPositionX, logoPositionY, actualClientLogoWidth, actualClientLogoHeight);
            }
            
            // Proportional spacing after client logo (adjust for horizontal layouts)
            if (isBusinessCard || is6x2) {
              // For horizontal layouts, don't advance Y since logo is in corner
              // Keep original Y for the rest of the content
            } else {
              y += actualClientLogoHeight + Math.floor(baseSize * 0.05);
            }
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
        const totalStarWidth = 5 * proportionalStarSize + 4 * proportionalStarSpacing;
        const starStartX = (frameSize.width - totalStarWidth) / 2 + proportionalStarSize / 2;
        for (let i = 0; i < 5; i++) {
          drawStar(ctx, starStartX + i * (proportionalStarSize + proportionalStarSpacing), y + proportionalStarSize / 2, proportionalStarSize, starColor);
        }
        y += proportionalStarSize + Math.floor(baseSize * 0.025); // Proportional spacing after stars
      }

      // Calculate center area for QR and headline with proportional spacing
      let centerY;
      if (is5x7) {
        // 5x7: Move headline up a little bit
        centerY = y + Math.floor(baseSize * 0.015);
      } else {
        centerY = y + Math.floor(baseSize * 0.025);
      }
      
      // Draw headline text
      ctx.fillStyle = mainColor;
      ctx.font = `bold ${headlineFontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const lines = headline.split('\n');
      const lineSpacing = Math.floor(headlineFontSize * 0.2); // 20% of font size for line spacing
      
      // Proportional spacing between headline and QR code
      const headlineToQRSpacing = Math.floor(baseSize * 0.04);
      
      // Calculate total text height to ensure it fits
      const totalTextHeight = lines.length * headlineFontSize + (lines.length - 1) * lineSpacing;
      const availableHeight = frameSize.height - padding * 2 - qrSize - headlineToQRSpacing;
      
      // If text is too tall, reduce font size proportionally
      let adjustedFontSize = headlineFontSize;
      let adjustedLineSpacing = lineSpacing;
      if (totalTextHeight > availableHeight * 0.4) { // Text shouldn't take more than 40% of available height
        const scaleFactor = (availableHeight * 0.4) / totalTextHeight;
        adjustedFontSize = Math.floor(headlineFontSize * scaleFactor);
        adjustedLineSpacing = Math.floor(lineSpacing * scaleFactor);
      }
      
      // Use adjusted font size
      ctx.font = `bold ${adjustedFontSize}px Arial, sans-serif`;
      
      // Draw headline text (skip for table tents as they have their own layout)
      if (!isTableTent) {
        lines.forEach((line, index) => {
          ctx.fillText(line, frameSize.width / 2, centerY + index * (adjustedFontSize + adjustedLineSpacing));
        });
      }
      
      let qrY = centerY + lines.length * (adjustedFontSize + adjustedLineSpacing) + headlineToQRSpacing;

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
        qrImg.onload = () => resolve();
      });
      
      if (isTableTent) {
        // Table tent layout: Show just one side of the design for simplicity
        // This will be printed on both sides when downloaded
        
        // Draw the single panel structure
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        
        // Draw panel border
        ctx.strokeRect(0, 0, frameSize.width, frameSize.height * 0.6);
        
        // Reset line style
        ctx.setLineDash([]);
        
        // Position QR code and headline in the single panel
        const panelWidth = frameSize.width;
        const panelHeight = frameSize.height * 0.6;
        const qrX = panelWidth / 2;
        const qrY = panelHeight * 0.7; // Lower in panel
        const headlineY = panelHeight * 0.3; // Upper in panel
        
        // Draw headline
        ctx.font = `bold ${adjustedFontSize}px Arial, sans-serif`;
        ctx.fillStyle = mainColor;
        ctx.textAlign = 'center';
        lines.forEach((line, index) => {
          ctx.fillText(line, qrX, headlineY + index * (adjustedFontSize + adjustedLineSpacing));
        });
        
        // Draw QR code (make smaller for table tent)
        const qrSize = Math.min(panelWidth * 0.3, panelHeight * 0.25); // Reduced from 0.4/0.3 to 0.3/0.25
        const qrLeft = qrX - qrSize / 2;
        const qrTop = qrY - qrSize / 2 + Math.floor(baseSize * 0.05); // Move down a little
        
        // Create QR code using the same approach as the rest of the file
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: qrSize,
          margin: 1,
          color: {
            dark: mainColor,
            light: '#FFFFFF'
          }
        });
        
        // Draw QR code
        const qrImage = new Image();
        qrImage.onload = () => {
          ctx.drawImage(qrImage, qrLeft, qrTop, qrSize, qrSize);
        };
        qrImage.src = qrDataUrl;
        
        // Add note that this will be printed on both sides
        ctx.font = '14px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'center';
        ctx.fillText('(This design will be printed on both sides)', frameSize.width / 2, frameSize.height - 40);
        
        // Add visual example below the main preview
        const exampleY = frameSize.height + 20;
        const exampleWidth = 300;
        const exampleHeight = 120;
        const exampleX = (frameSize.width - exampleWidth) / 2;
        
        // Draw example rectangle
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(exampleX, exampleY, exampleWidth, exampleHeight);
        
        // Draw cut lines on example
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(exampleX - 2, exampleY - 2, exampleWidth + 4, exampleHeight + 4);
        
        // Draw fold lines on example (3 panels)
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(exampleX + exampleWidth / 3, exampleY);
        ctx.lineTo(exampleX + exampleWidth / 3, exampleY + exampleHeight);
        ctx.moveTo(exampleX + (exampleWidth / 3) * 2, exampleY);
        ctx.lineTo(exampleX + (exampleWidth / 3) * 2, exampleY + exampleHeight);
        ctx.stroke();
        
        // Reset line style
        ctx.setLineDash([]);
        
        // Add labels to example
        ctx.font = '12px Arial, sans-serif';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText('Cut along red lines', exampleX + exampleWidth / 2, exampleY + exampleHeight + 20);
        ctx.fillText('Fold along dashed lines', exampleX + exampleWidth / 2, exampleY + exampleHeight + 35);
        ctx.fillText('Glue tab to back panel', exampleX + exampleWidth / 2, exampleY + exampleHeight + 50);
        
        return; // Skip the rest of the drawing for table tents
      }

      // Standard layout for other sizes with custom positioning
      let qrCenterY;
      
      if (is5x7) {
        // 5x7: Move headline up a little, move QR code down so 5 stars fit when turned on
        qrCenterY = (frameSize.height - qrSize) / 2 + Math.floor(baseSize * 0.08);
      } else if (is8x10 || is8p5x11 || is11x14) {
        // 8x10, 8.5x11, 11x14: Move QR code down so there is more room for header and stars
        qrCenterY = (frameSize.height - qrSize) / 2 + Math.floor(baseSize * 0.12);
      } else if (is2x3) {
        // 2x3: Move QR code down so there is more room for header and 5 stars
        qrCenterY = (frameSize.height - qrSize) / 2 + Math.floor(baseSize * 0.10);
      } else if (is3x3) {
        // 3x3: Move QR code down
        qrCenterY = (frameSize.height - qrSize) / 2 + Math.floor(baseSize * 0.08);
      } else {
        // Default centered positioning
        qrCenterY = (frameSize.height - qrSize) / 2;
      }
      
      ctx.drawImage(qrImg, qrX, qrCenterY, qrSize, qrSize);

      // Pre-calculate logo dimensions for exclusion areas
      const logoAspectRatio = 2.5; // Approximate aspect ratio of the Prompt Reviews logo
      const logoWidth = logoHeight * logoAspectRatio;
      const logoX = (frameSize.width - logoWidth) / 2;
      const logoY = frameSize.height - logoHeight - websiteFontSize - padding - Math.floor(baseSize * 0.025);

      // Draw decorative icons if enabled
      if (showDecorativeIcons && decorativeIconCount > 0) {
        // Define areas to exclude (where we don't want decorative icons)
        // Made more targeted to allow icons above text and below logo
        const excludeAreas = [
          // QR code area (keep generous margin around QR code)
          { x: qrX - Math.floor(baseSize * 0.04), y: qrCenterY - Math.floor(baseSize * 0.04), width: qrSize + Math.floor(baseSize * 0.08), height: qrSize + Math.floor(baseSize * 0.08) },
          // Headline area (more targeted - only the actual text area)
          { x: frameSize.width * 0.1, y: centerY - Math.floor(baseSize * 0.015), width: frameSize.width * 0.8, height: headlineFontSize * lines.length + Math.floor(baseSize * 0.03) },
          // Star area (if stars are shown) - more targeted
          ...(showStars ? [{ x: frameSize.width * 0.2, y: y - Math.floor(baseSize * 0.015), width: frameSize.width * 0.6, height: proportionalStarSize + Math.floor(baseSize * 0.03) }] : []),
          // Client logo area (if shown) - more targeted around actual logo
          ...(showClientLogo && clientLogoUrl ? [{ x: frameSize.width * 0.3, y: padding - Math.floor(baseSize * 0.015), width: frameSize.width * 0.4, height: clientLogoHeight + Math.floor(baseSize * 0.03) }] : []),
          // Bottom logo area - more targeted around actual logo
          { x: logoX - Math.floor(baseSize * 0.025), y: logoY - Math.floor(baseSize * 0.015), width: logoWidth + Math.floor(baseSize * 0.05), height: logoHeight + Math.floor(baseSize * 0.03) },
          // Bottom text area - more targeted around actual text
          { x: frameSize.width * 0.2, y: logoY + logoHeight + Math.floor(baseSize * 0.008), width: frameSize.width * 0.6, height: websiteFontSize + Math.floor(baseSize * 0.015) }
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
        logoImg.onload = () => resolve();
        logoImg.onerror = () => reject(new Error('Failed to load Prompt Reviews logo'));
      });
      
      // Use pre-calculated logo dimensions
      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

      // Draw NFC text if enabled (below QR code)
      if (showNfcText) {
        const proportionalNfcTextSize = Math.floor((nfcTextSize / 18) * baseSize * 0.03); // Scale user's NFC text size proportionally (3% of base size when nfcTextSize is 18)
        ctx.font = `${proportionalNfcTextSize}px Arial, sans-serif`;
        ctx.fillStyle = mainColor; // Use main color to match other text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const nfcTextY = qrCenterY + qrSize + Math.floor(baseSize * 0.03); // Proportional spacing below QR code
        ctx.fillText('Tap with phone or scan with camera', frameSize.width / 2, nfcTextY);
      }

      // Draw website text (below logo, at bottom)
      ctx.font = `bold ${websiteFontSize}px Arial, sans-serif`;
      ctx.fillStyle = mainColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const websiteTextY = logoY + logoHeight + Math.floor(baseSize * 0.015);
      ctx.fillText('promptreviews.app', frameSize.width / 2, websiteTextY);

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
    
    try {
      // Convert frame size from pixels at 300 DPI to inches
      const dpi = 300;
      const widthInches = frameSize.width / dpi;
      const heightInches = frameSize.height / dpi;
      
      // Detect card types for PDF generation (redefined for this scope)
      const isTableTentPDF = frameSize.label.includes('Table Tent');
      
      // Create PDF with standard letter size (8.5" x 11") for proper printing
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'letter'
      });
      
      // Calculate centering position on letter-size page
      const letterWidth = 8.5;
      const letterHeight = 11;
      const centerX = (letterWidth - widthInches) / 2;
      const centerY = (letterHeight - heightInches) / 2;
      
      // Generate high-quality canvas for PDF
      const pdfCanvas = document.createElement('canvas');
      const pdfCtx = pdfCanvas.getContext('2d');
      if (!pdfCtx) return;
      
      // Use higher resolution for PDF (600 DPI for crisp printing)
      const pdfDpi = 600;
      const pdfScale = pdfDpi / 300; // Scale factor from our 300 DPI canvas
      pdfCanvas.width = frameSize.width * pdfScale;
      pdfCanvas.height = frameSize.height * pdfScale;
      pdfCtx.scale(pdfScale, pdfScale);
      
      // Copy the original canvas content
      pdfCtx.drawImage(canvasRef.current, 0, 0, frameSize.width, frameSize.height);
      
      // Determine if this size needs cut-out lines
      const sizesNeedingCutLines = [
        '4x6"', '5x7"', '5x8"', '3.5x2"', '2x3"', '3x3"', 
        '4x4"', '2.5x1.5"', '6x2"', 'business card', 'sticker', 
        'badge', 'tent', 'cling'
      ];
      
      const needsCutLines = sizesNeedingCutLines.some(size => 
        frameSize.label.toLowerCase().includes(size.toLowerCase()) ||
        frameSize.width <= 1800 || // 6 inches at 300 DPI
        frameSize.height <= 1800
      );
      
      // Convert canvas to image and add to PDF at centered position
      const imgData = pdfCanvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', centerX, centerY, widthInches, heightInches);
      
      // Add cut-out guide lines directly to PDF for small sizes
      if (needsCutLines) {
        pdf.setDrawColor(200, 200, 200); // Light gray
        pdf.setLineWidth(0.01); // Thin line
        
        // Draw rectangle around the QR code with small margin
        const cutMargin = 0.125; // 1/8 inch margin
        pdf.rect(
          centerX - cutMargin, 
          centerY - cutMargin, 
          widthInches + (cutMargin * 2), 
          heightInches + (cutMargin * 2)
        );
        
        // Add corner marks for precise cutting
        const markLength = 0.1; // Small corner marks
        const corners = [
          [centerX - cutMargin, centerY - cutMargin], // Top left
          [centerX + widthInches + cutMargin, centerY - cutMargin], // Top right
          [centerX - cutMargin, centerY + heightInches + cutMargin], // Bottom left
          [centerX + widthInches + cutMargin, centerY + heightInches + cutMargin] // Bottom right
        ];
        
        corners.forEach(([x, y]) => {
          // Draw small L-shaped corner marks
          pdf.line(x - markLength, y, x + markLength, y); // Horizontal line
          pdf.line(x, y - markLength, x, y + markLength); // Vertical line
        });
      }
      
      // Special handling for table tents - create proper 3-panel layout
      if (isTableTentPDF) {
        // Create new PDF for table tent
        pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'in',
          format: 'letter'
        });
        
        // Define table tent layout - 3 panels side by side with tab
        const panelWidth = 2.5;
        const panelHeight = 3.5;
        const tabHeight = 0.5;
        const startX = 0.25; // Start near left edge
        const startY = 1.5; // Center vertically
        
        // Panel positions: Left (back), Middle (bottom), Right (front)
        const leftPanelX = startX;
        const middlePanelX = startX + panelWidth;
        const rightPanelX = startX + (panelWidth * 2);
        
        // Get the original QR design
        const originalImgData = pdfCanvas.toDataURL('image/jpeg', 0.95);
        
        // Right panel (front face) - normal orientation
        pdf.addImage(originalImgData, 'JPEG', rightPanelX, startY, panelWidth, panelHeight);
        
        // Left panel (back face) - horizontally flipped
        // jsPDF doesn't support transformations, so we'll create a flipped version manually
        // For now, just add the same image (we'll enhance this later)
        pdf.addImage(originalImgData, 'JPEG', leftPanelX, startY, panelWidth, panelHeight);
        
        // Middle panel stays blank for folding (bottom of tent)
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.005);
        pdf.rect(middlePanelX, startY, panelWidth, panelHeight);
        
        // Tab for gluing
        pdf.setFillColor(240, 240, 240);
        pdf.rect(leftPanelX, startY + panelHeight, panelWidth * 3, tabHeight, 'F');
        
        // Cut lines (red)
        pdf.setDrawColor(255, 0, 0);
        pdf.setLineWidth(0.01);
        pdf.rect(leftPanelX, startY, panelWidth * 3, panelHeight + tabHeight);
        
        // Fold lines (dashed gray)
        pdf.setDrawColor(100, 100, 100);
        pdf.setLineDashPattern([0.03, 0.03]);
        
        // Vertical fold lines
        pdf.line(middlePanelX, startY, middlePanelX, startY + panelHeight);
        pdf.line(rightPanelX, startY, rightPanelX, startY + panelHeight);
        
        // Horizontal fold line for tab
        pdf.line(leftPanelX, startY + panelHeight, leftPanelX + (panelWidth * 3), startY + panelHeight);
        
        pdf.setLineDashPattern([]);
        
        // Instructions
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Table Tent Assembly Instructions:', leftPanelX, startY - 0.8);
        pdf.setFontSize(9);
        pdf.text('1. Cut along red outline', leftPanelX, startY - 0.5);
        pdf.text('2. Fold along gray dashed lines', leftPanelX, startY - 0.3);
        pdf.text('3. Apply glue to gray tab area', leftPanelX, startY - 0.1);
        pdf.text('4. Attach tab to back of left panel to form tent', leftPanelX, startY + 0.1);
      } else {
        // Add size indicator text at bottom of page
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128); // Gray color
        const sizeText = `Actual size: ${frameSize.label} | Cut along dotted lines if shown | Print at 100% scale`;
        const textWidth = pdf.getTextWidth(sizeText);
        pdf.text(sizeText, (letterWidth - textWidth / 72) / 2, letterHeight - 0.3); // 0.3" from bottom
      }
      
      // Generate PDF blob
      const pdfBlob = pdf.output('blob');
      
      // Trigger download
      if (onDownload) onDownload(pdfBlob);
      
      const link = document.createElement("a");
      link.download = `review-qr-${clientName.toLowerCase().replace(/\s+/g, "-")}-${frameSize.label.replace(/[^a-z0-9]/gi, "-")}-print-ready.pdf`;
      link.href = URL.createObjectURL(pdfBlob);
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to PNG if PDF generation fails
      const downloadCanvas = document.createElement('canvas');
      const downloadCtx = downloadCanvas.getContext('2d');
      if (!downloadCtx) return;
      
      downloadCanvas.width = canvasRef.current.width;
      downloadCanvas.height = canvasRef.current.height;
      downloadCtx.drawImage(canvasRef.current, 0, 0);
      
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
    }
  }, [canvasRef, onDownload, clientName, frameSize.label, frameSize.width, frameSize.height]);

  // Generate QR code when component mounts or props change
  useEffect(() => {
    generateQRCode();
  }, [frameSize, headline, starColor, mainColor, showStars, url, clientLogoUrl, showClientLogo, starSize, circularLogo, logoSize, fontSize, showDecorativeIcons, decorativeIconType, decorativeIconCount, decorativeIconSize, decorativeIconColor, showNfcText, nfcTextSize]);

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