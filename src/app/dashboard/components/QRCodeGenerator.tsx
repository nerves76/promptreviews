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

      // Draw dotted cutout line for small sizes
      const smallSizes = ['4x6"', '5x7"', '5x8"'];
      if (smallSizes.includes(frameSize.label)) {
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(10, 10, frameSize.width - 20, frameSize.height - 20);
        ctx.setLineDash([]);
      }

      // Layout constants
      const padding = 60;
      const logoHeight = Math.floor(frameSize.height * 0.06); // Reduced from 0.10 to make smaller
      const websiteFontSize = 20; // Slightly bigger than 16px (about 15pt)
      const headlineFontSize = Math.floor(frameSize.height * 0.065);
      const starSpacing = Math.floor(starSize * 0.7);
      const clientLogoHeight = Math.floor(frameSize.height * 0.08); // Client logo height
      const qrSize = Math.min(frameSize.width, frameSize.height) * 0.38;
      const qrX = (frameSize.width - qrSize) / 2;
      
      // Start layout from top
      let y = padding;

      // Draw client logo if enabled (at the very top)
      if (showClientLogo && clientLogoUrl) {
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
          
          ctx.drawImage(clientLogoImg, clientLogoX, y, clientLogoWidth, clientLogoHeight);
          y += clientLogoHeight + 20;
        } catch (error) {
          console.error('Error loading client logo:', error);
          // Continue without client logo if it fails to load
        }
      }

      // Draw stars if enabled (after logo)
      if (showStars) {
        const totalStarWidth = 5 * starSize + 4 * starSpacing;
        const starStartX = (frameSize.width - totalStarWidth) / 2 + starSize / 2;
        for (let i = 0; i < 5; i++) {
          drawStar(ctx, starStartX + i * (starSize + starSpacing), y + starSize / 2, starSize, starColor);
        }
        y += starSize + 20;
      }

      // Calculate center area for QR and headline
      const centerAreaHeight = headlineFontSize + qrSize + 40;
      const centerY = y + 20;
      
      // Draw headline text
      ctx.fillStyle = mainColor;
      ctx.font = `bold ${headlineFontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const lines = headline.split('\n');
      lines.forEach((line, index) => {
        ctx.fillText(line, frameSize.width / 2, centerY + index * (headlineFontSize + 8));
      });
      let qrY = centerY + lines.length * (headlineFontSize + 8) + 24;

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
  }, [frameSize, headline, starColor, mainColor, showStars, url, clientLogoUrl, showClientLogo, starSize]);

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
