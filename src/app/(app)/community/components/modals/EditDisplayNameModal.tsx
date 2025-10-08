/**
 * EditDisplayNameModal Component
 *
 * Modal for editing user's community display name and business name
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/auth/providers/supabase';

interface EditDisplayNameModalProps {
  isOpen: boolean;
  currentDisplayName: string;
  currentBusinessName: string;
  availableBusinessNames: Array<{ id: string; name: string }>;
  userId: string;
  onClose: () => void;
  onUpdate: (newDisplayName: string, newBusinessName: string) => void;
}

export function EditDisplayNameModal({
  isOpen,
  currentDisplayName,
  currentBusinessName,
  availableBusinessNames,
  userId,
  onClose,
  onUpdate,
}: EditDisplayNameModalProps) {
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [businessName, setBusinessName] = useState(currentBusinessName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    setDisplayName(currentDisplayName);
    setBusinessName(currentBusinessName);
  }, [currentDisplayName, currentBusinessName]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    if (!businessName.trim()) {
      setError('Business name cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('community_profiles')
        .update({
          display_name_override: displayName.trim(),
          business_name_override: businessName.trim()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      onUpdate(displayName.trim(), businessName.trim());
      onClose();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Edit Community Profile</h2>

        <p className="text-white/70 text-sm mb-6">
          Customize how you appear in the community. Your display name and business are shown on all your posts and comments.
        </p>

        <div className="mb-4">
          <label className="block text-white/70 text-sm font-medium mb-2">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#452F9F]"
            placeholder="e.g., Chris or C."
            maxLength={50}
          />
          <p className="text-xs text-white/50 mt-1">Your first name, initials, or nickname</p>
        </div>

        <div className="mb-6">
          <label className="block text-white/70 text-sm font-medium mb-2">Business Name</label>
          {availableBusinessNames.length > 1 ? (
            <select
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#452F9F]"
            >
              {availableBusinessNames.map((business) => (
                <option key={business.id} value={business.name} className="bg-slate-800">
                  {business.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#452F9F]"
              placeholder="Your business name"
              maxLength={100}
            />
          )}
          <p className="text-xs text-white/50 mt-1">
            {availableBusinessNames.length > 1
              ? 'Choose which business you want to represent'
              : 'The business shown on your posts'}
          </p>
        </div>

        <div className="mb-6 p-3 bg-white/5 rounded-lg border border-white/10">
          <p className="text-xs text-white/50 mb-1">Preview:</p>
          <p className="text-white font-medium">
            {displayName || 'Your Name'} • {businessName || 'Your Business'}
          </p>
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
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
