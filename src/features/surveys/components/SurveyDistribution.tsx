'use client';

import { useState } from 'react';
import { Button } from '@/app/(app)/components/ui/button';
import Icon from '@/components/Icon';

interface SurveyDistributionProps {
  slug: string;
  title: string;
  onOpenQR?: () => void;
}

export function SurveyDistribution({ slug, title, onOpenQR }: SurveyDistributionProps) {
  const [copied, setCopied] = useState(false);
  const surveyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = surveyUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">Share your survey</h3>

      {/* Link copy */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={surveyUrl}
          className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700"
          aria-label="Survey URL"
        />
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Icon name={copied ? 'FaCheck' : 'FaCopy'} size={14} className="mr-1" />
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      {/* QR code */}
      {onOpenQR && (
        <Button variant="secondary" size="sm" onClick={onOpenQR}>
          <Icon name="FaImage" size={14} className="mr-2" />
          Generate QR code
        </Button>
      )}
    </div>
  );
}
