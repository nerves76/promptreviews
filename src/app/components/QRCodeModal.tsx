/**
 * QRCodeModal.tsx
 * 
 * A reusable QR code generation and download modal component.
 * This component handles QR code generation, customization, and download functionality.
 * 
 * Features:
 * - Marketing copy display before generation
 * - Frame size selection
 * - Customizable headline, colors, and star display
 * - Live preview after generation
 * - Download functionality
 * - Responsive design with edge-to-edge marketing image
 */

import React, { useState } from 'react';
import QRCodeGenerator, { QR_FRAME_SIZES } from '../dashboard/components/QRCodeGenerator';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  clientName: string;
  logoUrl?: string;
}

export default function QRCodeModal({ isOpen, onClose, url, clientName, logoUrl }: QRCodeModalProps) {
  const [selectedFrameSize, setSelectedFrameSize] = useState(QR_FRAME_SIZES[0]);
  const [showPreview, setShowPreview] = useState(false);
  const [headline, setHeadline] = useState('Leave us a review!');
  const [starColor, setStarColor] = useState('#FFD700');
  const [mainColor, setMainColor] = useState('#2E4A7D');
  const [showStars, setShowStars] = useState(true);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const maxChars = 50;
  const maxLines = 2;

  const handleHeadlineChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value.replace(/\r/g, "");
    let lines = value.split("\n").slice(0, maxLines);
    lines = lines.map(l => l.slice(0, maxChars));
    setHeadline(lines.join("\n"));
  };

  const handleFrameSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = QR_FRAME_SIZES.find(size => size.label === e.target.value);
    if (selected) {
      setSelectedFrameSize(selected);
      // Regenerate preview when frame size changes
      if (showPreview) {
        setIsGenerating(true);
      }
    }
  };

  const handleGenerateQRCode = () => {
    setShowPreview(true);
    setIsGenerating(true);
  };

  const handlePreviewGenerated = (previewUrl: string) => {
    setQrPreviewUrl(previewUrl);
    setIsGenerating(false);
  };

  const handleDownload = (blob: Blob) => {
    const link = document.createElement("a");
    link.download = `review-qr-${clientName.toLowerCase().replace(/\s+/g, "-")}-${selectedFrameSize.label.replace(/[^a-z0-9]/gi, "-")}.png`;
    link.href = URL.createObjectURL(blob);
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white shadow-lg p-0 max-w-4xl w-full relative flex flex-col md:flex-row gap-8 text-left rounded-xl mx-2 md:mx-0">
        {/* Standardized circular close button */}
        <button
          className="absolute top-2 right-2 md:-top-4 md:-right-4 bg-white border border-gray-200 rounded-full shadow-lg shadow-[inset_0_0_8px_0_rgba(0,0,0,0.25)] flex items-center justify-center hover:bg-gray-100 focus:outline-none z-20 transition-colors p-4"
          style={{ width: 64, height: 64 }}
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Left side: Controls */}
        <div className="flex-1 space-y-4 py-6 px-8">
          <div>
            {/* Marketing Copy - Show when preview is not generated */}
            {!showPreview && (
              <div className="mb-6">
                <h4 className="text-xl font-bold text-slate-blue mb-2">
                  Turn Everyday Moments Into 5-Star Reviews
                </h4>
                <p className="text-sm text-gray-700 mb-3 leading-tight">
                  Make it easy for happy customers and clients to share their experience—right when it matters most. A simple scan is all it takes. Frame it, wear it, prop it up on a table—wherever you show up, let your QR code invite the feedback you've earned.
                </p>
                
                <div className="mb-3">
                  <h5 className="font-semibold text-gray-800 mb-1 text-sm">Display Ideas:</h5>
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    <li>• Framed countertop signs</li>
                    <li>• Table tents</li>
                    <li>• Badges or lanyards</li>
                    <li>• Business cards</li>
                    <li>• "Review Me" T-Shirts or Aprons</li>
                    <li>• Stickers</li>
                    <li>• Window clings or decals</li>
                  </ul>
                </div>
              </div>
            )}
            
            {/* Frame Size Selector - Always visible */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frame Size
              </label>
              <select
                value={selectedFrameSize.label}
                onChange={handleFrameSizeChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-blue focus:border-transparent"
              >
                {QR_FRAME_SIZES.map((size) => (
                  <option key={size.label} value={size.label}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Design Controls - Only show after generating */}
            {showPreview && (
              <>
                {/* Headline Input */}
                <div className="mb-4 mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Headline Text
                  </label>
                  <textarea
                    value={headline}
                    onChange={handleHeadlineChange}
                    rows={2}
                    maxLength={maxChars}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-blue focus:border-transparent resize-none"
                    placeholder="Leave us a review!"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {headline.length}/{maxChars} characters
                  </div>
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Star Color
                    </label>
                    <input
                      type="color"
                      value={starColor}
                      onChange={(e) => setStarColor(e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Main Color
                    </label>
                    <input
                      type="color"
                      value={mainColor}
                      onChange={(e) => setMainColor(e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                </div>

                {/* Show Stars Toggle */}
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showStars}
                      onChange={(e) => setShowStars(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Show Stars</span>
                  </label>
                </div>

                {/* Print Note */}
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                  <p className="font-medium mb-1">Printing Tips:</p>
                  <p>• Select your desired frame size above</p>
                  <p>• Print at 300 DPI for best quality</p>
                  {['4x6"', '5x7"', '5x8"'].includes(selectedFrameSize.label) && (
                    <p>• Cut along the dotted line for perfect fit</p>
                  )}
                </div>
              </>
            )}

            {/* Generate/Download Button - Moved to bottom */}
            <button
              onClick={showPreview ? () => {
                // Trigger download from QRCodeGenerator
                const qrGenerator = document.querySelector('[data-qr-generator]') as HTMLElement;
                if (qrGenerator && (qrGenerator as any).downloadQRCode) {
                  (qrGenerator as any).downloadQRCode();
                }
              } : handleGenerateQRCode}
              disabled={isGenerating}
              className="w-full bg-slate-blue text-white py-2 px-4 rounded-md hover:bg-slate-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!showPreview ? 'Generate QR Code' : 'Download QR Code'}
            </button>
          </div>
        </div>

        {/* Right side: Preview */}
        <div className="flex-1 bg-gray-50 p-8 rounded-r-xl">
          {showPreview ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
              {qrPreviewUrl ? (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <img 
                    src={qrPreviewUrl} 
                    alt="QR Code Preview" 
                    className="w-full h-auto max-w-md mx-auto"
                  />
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-blue mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Generating preview...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                  </svg>
                </div>
                <p className="text-gray-500">Click "Generate QR Code" to see a preview</p>
              </div>
            </div>
          )}
        </div>

        {/* Hidden QR Code Generator Component */}
        {showPreview && (
          <QRCodeGenerator
            url={url}
            clientName={clientName}
            frameSize={selectedFrameSize}
            onDownload={handleDownload}
            onPreview={handlePreviewGenerated}
            headline={headline}
            starColor={starColor}
            mainColor={mainColor}
            showStars={showStars}
          />
        )}
      </div>
    </div>
  );
} 