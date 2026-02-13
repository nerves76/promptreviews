'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';
import { apiClient } from '@/utils/apiClient';
import { SurveyResponsePack } from '../types';

interface ResponsePackSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  surveyId?: string;
  onPurchased: () => void;
}

export function ResponsePackSelector({ isOpen, onClose, surveyId, onPurchased }: ResponsePackSelectorProps) {
  const [packs, setPacks] = useState<SurveyResponsePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    apiClient.get<{ packs: SurveyResponsePack[] }>('/surveys/response-packs')
      .then(data => setPacks(data.packs))
      .catch(() => setError('Failed to load response packs'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handlePurchase = async (packId: string) => {
    setPurchasing(packId);
    setError(null);
    try {
      const endpoint = surveyId
        ? `/surveys/${surveyId}/purchase-responses`
        : '/surveys/purchase-responses';
      await apiClient.post(endpoint, { pack_id: packId });
      onPurchased();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buy more responses" size="lg">
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading packs...</div>
      ) : (
        <div className="space-y-3">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-slate-blue/30 transition-colors"
            >
              <div>
                <h4 className="font-medium text-gray-900">{pack.name}</h4>
                <p className="text-sm text-gray-600">
                  {pack.response_count.toLocaleString()} responses
                </p>
              </div>
              <Button
                onClick={() => handlePurchase(pack.id)}
                disabled={purchasing !== null}
                size="sm"
              >
                {purchasing === pack.id ? 'Purchasing...' : `${pack.credit_cost} credits`}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
