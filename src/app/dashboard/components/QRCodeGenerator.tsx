'use client';

import { useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  url: string;
  clientName: string;
}

export default function QRCodeGenerator({ url, clientName }: QRCodeGeneratorProps) {
  const [qrCode, setQRCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQRCode(qrDataUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;

    const link = document.createElement('a');
    link.download = `review-qr-${clientName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = qrCode;
    link.click();
  };

  return (
    <div className="text-center">
      {!qrCode ? (
        <button
          onClick={generateQRCode}
          disabled={isGenerating}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate QR Code'}
        </button>
      ) : (
        <div className="space-y-4">
          <img src={qrCode} alt="QR Code" className="mx-auto" />
          <button
            onClick={downloadQRCode}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Download QR Code
          </button>
        </div>
      )}
    </div>
  );
} 