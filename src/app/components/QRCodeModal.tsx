/**
 * QRCodeModal.tsx
 * 
 * A reusable QR code generation and download modal component.
 * This component handles QR code generation, customization, and download functionality.
 * 
 * Features:
 * - Marketing copy display before generation
 * - Frame size selection
 * - Client logo toggle
 * - Customizable headline, colors, and star display
 * - Live preview after generation
 * - Download functionality
 * - Responsive design with edge-to-edge marketing image
 */

import React, { useState, useRef, useEffect } from 'react';
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
  const [showClientLogo, setShowClientLogo] = useState(false);
  const [starSize, setStarSize] = useState(40);
  const [circularLogo, setCircularLogo] = useState(false);
  const [logoSize, setLogoSize] = useState(60);
  const [fontSize, setFontSize] = useState(48);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showBrandingPopup, setShowBrandingPopup] = useState(false);
  const qrGeneratorRef = useRef<HTMLCanvasElement>(null);

  const maxChars = 50;
  const maxLines = 2;

  // Handle body scroll lock when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

  const handleDownloadClick = () => {
    setIsDownloading(true);
    // Add a small delay to ensure QR code is fully generated
    setTimeout(() => {
      // Try to find the QR generator canvas and trigger download
      const qrGenerator = document.querySelector('[data-qr-generator]') as HTMLCanvasElement;
      if (qrGenerator && (qrGenerator as any).downloadQRCode) {
        try {
          (qrGenerator as any).downloadQRCode();
        } catch (error) {
          console.error('Error downloading QR code:', error);
          // Fallback: try to download the preview image
          if (qrPreviewUrl) {
            const link = document.createElement("a");
            link.download = `review-qr-${clientName.toLowerCase().replace(/\s+/g, "-")}-${selectedFrameSize.label.replace(/[^a-z0-9]/gi, "-")}.png`;
            link.href = qrPreviewUrl;
            link.click();
          }
        }
      } else {
        console.error('QR Generator not found or download function not available');
        // Fallback: try to download the preview image
        if (qrPreviewUrl) {
          const link = document.createElement("a");
          link.download = `review-qr-${clientName.toLowerCase().replace(/\s+/g, "-")}-${selectedFrameSize.label.replace(/[^a-z0-9]/gi, "-")}.png`;
          link.href = qrPreviewUrl;
          link.click();
        }
      }
      setIsDownloading(false);
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white shadow-lg p-0 max-w-4xl w-full relative flex flex-col md:flex-row gap-8 text-left rounded-xl max-h-[90vh] overflow-y-auto">
        {/* Standardized circular close button */}
        <button
          className="absolute top-3 right-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-20"
          style={{ width: 48, height: 48 }}
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Left side: Controls */}
        <div className="flex-1 space-y-4 py-6 px-8 min-h-0">
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
              
              {/* Warning for small sizes */}
              {(selectedFrameSize.label.includes('business card') || 
                selectedFrameSize.width <= 1050 || 
                selectedFrameSize.height <= 600) && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="text-amber-600 mt-0.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 mb-1">Limited space at this size</p>
                      <p className="text-amber-700">
                        {selectedFrameSize.label.includes('business card') ? (
                          <>For business cards, enabling logo and stars may make the design too crowded. Consider using larger sizes for full branding.</>
                        ) : (
                          <>This small format works best with <strong>simple layouts</strong>. 
                          Consider reducing logo/star sizes or using headline + QR code only.</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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

                {/* Star Size Control */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Star Size: {starSize}px
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    step="5"
                    value={starSize}
                    onChange={(e) => setStarSize(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>20px</span>
                    <span>85px</span>
                    <span>150px</span>
                  </div>
                </div>

                {/* Logo Size Control */}
                {showClientLogo && logoUrl && logoUrl.trim() !== '' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo Size: {logoSize}px
                    </label>
                    <input
                      type="range"
                      min="30"
                      max="200"
                      step="5"
                      value={logoSize}
                      onChange={(e) => setLogoSize(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>30px</span>
                      <span>115px</span>
                      <span>200px</span>
                    </div>
                  </div>
                )}

                {/* Font Size Control */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Headline Font Size: {fontSize}px
                  </label>
                  <input
                    type="range"
                    min="24"
                    max="200"
                    step="4"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>24px</span>
                    <span>112px</span>
                    <span>200px</span>
                  </div>
                </div>

                {/* Toggle Controls */}
                <div className="mb-4 space-y-3">
                  {/* Show Stars Toggle */}
                  <div>
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

                  {/* Show Client Logo Toggle */}
                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showClientLogo}
                        onChange={(e) => setShowClientLogo(e.target.checked)}
                        className="w-4 h-4 text-slate-blue border-gray-300 rounded focus:ring-slate-blue"
                        disabled={!logoUrl || logoUrl.trim() === ''}
                      />
                      <span className={`text-sm font-medium ${!logoUrl || logoUrl.trim() === '' ? 'text-gray-400' : 'text-gray-700'}`}>
                        Show Your Logo
                      </span>
                    </label>
                    {!logoUrl || logoUrl.trim() === '' ? (
                      <p className="text-xs text-gray-500 mt-1">
                        Upload a logo in Your Business section to use this feature
                      </p>
                    ) : showClientLogo && (
                        <>
                          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-xs text-amber-700">
                              If your logo appears pixelated or blurry, consider uploading a higher quality logo in{" "}
                              <a 
                                href="/dashboard/business-profile" 
                                className="text-amber-800 underline hover:text-amber-900"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Your Business
                              </a>
                              .
                            </p>
                          </div>
                          
                          {/* Circular Logo Option */}
                          <div className="mt-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={circularLogo}
                                onChange={(e) => setCircularLogo(e.target.checked)}
                                className="w-4 h-4 text-slate-blue border-gray-300 rounded focus:ring-slate-blue"
                              />
                              <span className="text-sm font-medium text-gray-700">Display logo in circle</span>
                            </label>
                          </div>
                        </>
                      )}
                  </div>
                </div>

                {/* Logo Size Control */}
                {showClientLogo && logoUrl && logoUrl.trim() !== '' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo Size: {logoSize}px
                    </label>
                    <input
                      type="range"
                      min="30"
                      max="200"
                      step="5"
                      value={logoSize}
                      onChange={(e) => setLogoSize(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>30px</span>
                      <span>115px</span>
                      <span>200px</span>
                    </div>
                  </div>
                )}

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
              onClick={showPreview ? handleDownloadClick : handleGenerateQRCode}
              disabled={isGenerating || isDownloading}
              className="w-full bg-slate-blue text-white py-2 px-4 rounded-md hover:bg-slate-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!showPreview ? 'Generate QR Code' : (isDownloading ? 'Downloading...' : 'Download QR Code')}
            </button>
          </div>
        </div>

        {/* Right side: Preview */}
        <div className="flex-1 bg-blue-50 p-8 rounded-r-xl min-h-0">
          {showPreview ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
              {qrPreviewUrl ? (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <img 
                    src={qrPreviewUrl} 
                    alt="QR Code Preview" 
                    className="w-full h-auto max-w-md mx-auto rounded-lg shadow-sm"
                  />
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                  <p className="text-gray-500">Preview will appear here</p>
                </div>
              )}
              

            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <p className="text-gray-500">Preview will appear here after you generate your QR code</p>
            </div>
          )}
        </div>

        {/* Branding Removal Popup */}
        {showBrandingPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md mx-4 relative">
              {/* Standardized circular close button */}
              <button
                onClick={() => setShowBrandingPopup(false)}
                className="absolute -top-3 -right-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-20"
                style={{ width: 48, height: 48 }}
                aria-label="Close modal"
              >
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Remove Prompt Reviews branding?</h3>
              <div className="text-gray-700 mb-4">
                <p className="mb-3">
                  You most certainly can. Just open up your downloaded PDF in any design program and remove the Prompt Reviews logo, BUT you also might not want to.
                </p>
                <p className="mb-3">
                  This is because people who have used Prompt Reviews before, will know that reviews are easier and quicker to submit with Prompt Reviews. It might just lead to more reviews!
                </p>
                <p className="text-right text-sm text-gray-600 mt-4">
                  - Chris
                </p>
              </div>
              <button
                onClick={() => setShowBrandingPopup(false)}
                className="w-full bg-slate-blue text-white py-2 px-4 rounded-md hover:bg-slate-blue/90 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        )}

        {/* Branding Removal Link - Bottom of Modal */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-left">
          <button
            onClick={() => setShowBrandingPopup(true)}
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            Remove Prompt Reviews branding?
          </button>
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
            clientLogoUrl={logoUrl}
            showClientLogo={showClientLogo}
            starSize={starSize}
            circularLogo={circularLogo}
            logoSize={logoSize}
            fontSize={fontSize}
          />
        )}
      </div>
    </div>
  );
} 