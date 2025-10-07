/**
 * EditDisplayNameModal Component
 *
 * Modal for editing user's community display name
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/auth/providers/supabase';

interface EditDisplayNameModalProps {
  isOpen: boolean;
  currentDisplayName: string;
  businessName: string;
  userId: string;
  onClose: () => void;
  onUpdate: (newDisplayName: string) => void;
}

export function EditDisplayNameModal({
  isOpen,
  currentDisplayName,
  businessName,
  userId,
  onClose,
  onUpdate,
}: EditDisplayNameModalProps) {
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    setDisplayName(currentDisplayName);
  }, [currentDisplayName]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('community_profiles')
        .update({ display_name_override: displayName.trim() })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      onUpdate(displayName.trim());
      onClose();
    } catch (err: any) {
      console.error('Error updating display name:', err);
      setError(err.message || 'Failed to update display name');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Edit Display Name</h2>

        <p className="text-white/70 text-sm mb-4">
          This is how your name appears in posts. Use your first name, initials, or a nickname for privacy.
        </p>

        <div className="mb-4">
          <label className="block text-white/70 text-sm mb-2">Display Name</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#452F9F]"
              placeholder="e.g., Chris or C."
              maxLength={50}
            />
            <span className="text-white/70 whitespace-nowrap">@ {businessName}</span>
          </div>
          <p className="text-xs text-white/50 mt-2">This is how you'll appear in posts and mentions</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-[#452F9F] text-white rounded-lg hover:bg-[#5a3fbf] transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
