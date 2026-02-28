'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';

interface SaveTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultName: string;
  termsBody: string;
}

export function SaveTermsModal({
  isOpen,
  onClose,
  defaultName,
  termsBody,
}: SaveTermsModalProps) {
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setError(null);
    }
  }, [isOpen, defaultName]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiClient.post('/proposals/terms-templates', {
        name: name.trim(),
        body: termsBody,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save terms');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save terms to library" size="sm">
      <Modal.Body>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="terms-template-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="terms-template-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Standard terms & conditions"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
          />
          <p className="mt-1 text-xs text-gray-500">
            This name identifies the terms in your library.
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? (
            <>
              <Icon name="FaSpinner" size={14} className="animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
