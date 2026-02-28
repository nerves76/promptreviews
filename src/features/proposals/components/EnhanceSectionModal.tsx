'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';
import { LoadingSpinner } from '@/app/(app)/components/ui/loading-spinner';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';

interface EnhanceSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  sectionBody: string;
  onAccept: (enhancedText: string) => void;
}

export function EnhanceSectionModal({
  isOpen,
  onClose,
  sectionTitle,
  sectionBody,
  onAccept,
}: EnhanceSectionModalProps) {
  const [enhancedText, setEnhancedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiClient.post<{ text: string }>(
        '/proposals/enhance-section',
        { sectionTitle, sectionBody },
      );
      setEnhancedText(data.text || '');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to enhance section';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [sectionTitle, sectionBody]);

  // Auto-generate when modal opens
  useEffect(() => {
    if (isOpen) {
      setEnhancedText('');
      setError('');
      generate();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setEnhancedText('');
    setError('');
    setIsLoading(false);
    onClose();
  };

  const handleAccept = () => {
    onAccept(enhancedText);
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Enhance: ${sectionTitle}`}
      size="3xl"
    >
      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <Icon name="FaExclamationTriangle" size={14} className="mt-0.5 shrink-0" />
        <p>
          AI-generated text is a suggestion. Always review legal content with a qualified
          professional before sending.
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <LoadingSpinner size="md" className="text-slate-blue" />
          <p className="text-sm text-gray-500">Enhancing your section...</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" size="sm" onClick={generate}>
            Try again
          </Button>
        </div>
      )}

      {/* Side-by-side comparison */}
      {enhancedText && !isLoading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Original</h3>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 whitespace-pre-wrap max-h-80 overflow-y-auto">
                {sectionBody}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Enhanced</h3>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-800 whitespace-pre-wrap max-h-80 overflow-y-auto">
                {enhancedText}
              </div>
            </div>
          </div>

          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="outline" onClick={generate}>
              <Icon name="FaRedo" size={12} className="mr-1.5" />
              Try again
            </Button>
            <Button onClick={handleAccept}>
              <Icon name="FaCheck" size={12} className="mr-1.5" />
              Accept changes
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
}
