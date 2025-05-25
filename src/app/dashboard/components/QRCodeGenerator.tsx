'use client';

import { useState, useRef } from 'react';
import QRCode from 'qrcode';

export const QR_FRAME_SIZES = [
  { label: '4x6" (postcard)', width: 1200, height: 1800 },
  { label: '5x7" (greeting card)', width: 1500, height: 2100 },
  { label: '8.5x11" (US Letter, standard printer paper)', width: 2550, height: 3300 },
  { label: '11x14" (small poster)', width: 3300, height: 4200 },
];

interface QRCodeGeneratorProps {
  url: string;
  clientName: string;
  logoUrl?: string; // Optional logo for custom design
  frameSize?: { label: string; width: number; height: number };
  onDownload?: (blob: Blob) => void;
}

export default function QRCodeGenerator({ url, clientName, logoUrl, frameSize = QR_FRAME_SIZES[0], onDownload }: QRCodeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Default logo fallback
  const defaultLogo = 'https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompt-reviews-get-reviews-online.png';

  const generateDesign = async () => {
    setIsGenerating(true);
    try {
      // Calculate all layout variables in order
      const headerHeight = Math.floor(frameSize.height * 0.12);
      const headerToStarsGap = Math.floor(frameSize.height * 0.06);
      const starsY = headerHeight + headerToStarsGap + Math.floor(frameSize.height * 0.06);
      const qrSize = Math.floor(frameSize.width * 0.45);
      const logoHeight = Math.floor(frameSize.height * 0.09);
      const spacing = Math.floor(frameSize.height * 0.04);
      const labelHeight = Math.floor(frameSize.height * 0.035) + 10;
      const contentHeight = qrSize + spacing + logoHeight;
      const availableHeight = frameSize.height - starsY - labelHeight;
      let startY = starsY + Math.floor((availableHeight - contentHeight) / 2);
      const extraOffset = Math.floor(frameSize.height * 0.04);
      startY += extraOffset;
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = frameSize.width;
      canvas.height = frameSize.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      // Fill background
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, frameSize.width, frameSize.height);
      // Draw header text
      ctx.font = `bold ${Math.floor(frameSize.height * 0.06)}px Inter, Arial, sans-serif`;
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText('Leave us a review!', frameSize.width / 2, headerHeight);
      // Draw 5 gold stars below the header
      const stars = '★★★★★';
      ctx.font = `${Math.floor(frameSize.height * 0.07)}px serif`;
      ctx.fillStyle = '#FFD700';
      ctx.fillText(stars, frameSize.width / 2, starsY);
      // Draw QR code
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: qrSize,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      const qrImg = new window.Image();
      qrImg.src = qrDataUrl;
      await new Promise(resolve => { qrImg.onload = resolve; });
      ctx.drawImage(qrImg, (frameSize.width - qrSize) / 2, startY, qrSize, qrSize);
      // Add frame size label at bottom
      ctx.font = `${Math.floor(frameSize.height * 0.035)}px Inter, Arial, sans-serif`;
      ctx.fillStyle = '#888';
      ctx.fillText(frameSize.label, frameSize.width / 2, frameSize.height - 10);
      // Draw logo at the very bottom, just above the label
      const logoImg = new window.Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = logoUrl || defaultLogo;
      await new Promise(resolve => { logoImg.onload = resolve; });
      const logoWidth = Math.floor(logoImg.width * (logoHeight / logoImg.height));
      const logoY = frameSize.height - logoHeight - labelHeight - 10; // 10px margin above label
      ctx.drawImage(logoImg, (frameSize.width - logoWidth) / 2, logoY, logoWidth, logoHeight);
      // Set preview
      setPreviewUrl(canvas.toDataURL('image/png'));
      // Draw to ref canvas for download
      if (canvasRef.current) {
        canvasRef.current.width = frameSize.width;
        canvasRef.current.height = frameSize.height;
        const refCtx = canvasRef.current.getContext('2d');
        if (refCtx) refCtx.drawImage(canvas, 0, 0);
      }
    } catch (err) {
      console.error('Error generating QR design:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDesign = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(blob => {
      if (blob) {
        if (onDownload) onDownload(blob);
        const link = document.createElement('a');
        link.download = `review-qr-${clientName.toLowerCase().replace(/\s+/g, '-')}-${frameSize.label.replace(/[^a-z0-9]/gi, '-')}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      }
    }, 'image/png');
  };

  return (
    <div className="text-center">
      <button
        onClick={generateDesign}
        disabled={isGenerating}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {isGenerating ? 'Generating...' : 'Preview QR Code'}
      </button>
      {previewUrl && (
        <div className="space-y-4">
          <img src={previewUrl} alt="QR Code Preview" className="mx-auto border rounded shadow bg-white" style={{ maxWidth: '100%', maxHeight: 400 }} />
          <button
            onClick={downloadDesign}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Download Free
          </button>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
} 