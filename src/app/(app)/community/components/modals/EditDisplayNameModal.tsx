/**
 * EditDisplayNameModal Component
 *
 * Modal for editing user's community display name, business name, and profile photo
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/auth/providers/supabase';
import imageCompression from 'browser-image-compression';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

interface EditDisplayNameModalProps {
  isOpen: boolean;
  currentDisplayName: string;
  currentBusinessName: string;
  currentProfilePhotoUrl?: string;
  availableBusinessNames: Array<{ id: string; name: string }>;
  userId: string;
  onClose: () => void;
  onUpdate: (newDisplayName: string, newBusinessName: string) => void;
}

export function EditDisplayNameModal({
  isOpen,
  currentDisplayName,
  currentBusinessName,
  currentProfilePhotoUrl,
  availableBusinessNames,
  userId,
  onClose,
  onUpdate,
}: EditDisplayNameModalProps) {
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [businessName, setBusinessName] = useState(currentBusinessName);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(currentProfilePhotoUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(currentDisplayName);
    setBusinessName(currentBusinessName);
    setProfilePhotoUrl(currentProfilePhotoUrl || null);
    setSelectedFile(null);
    setPreviewUrl(null);
  }, [currentDisplayName, currentBusinessName, currentProfilePhotoUrl]);

  // Helper to get cropped image as a blob
  const getCroppedImg = async (imageSrc: string, cropPixels: Area): Promise<Blob> => {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => {
      image.onload = resolve;
    });
    const canvas = document.createElement('canvas');
    canvas.width = cropPixels.width;
    canvas.height = cropPixels.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(
      image,
      cropPixels.x,
      cropPixels.y,
      cropPixels.width,
      cropPixels.height,
      0,
      0,
      cropPixels.width,
      cropPixels.height
    );
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/webp');
    });
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (10MB max before compression)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Compress image before cropping
      const options = {
        maxSizeMB: 1, // Larger size for cropping
        maxWidthOrHeight: 800, // Higher resolution for cropping
        useWebWorker: true,
        fileType: 'image/webp' as const,
      };

      const compressedFile = await imageCompression(file, options);

      // Create URL for cropper
      const imageUrl = URL.createObjectURL(compressedFile);
      setRawImageUrl(imageUrl);
      setShowCropper(true);
    } catch (err) {
      console.error('Error compressing image:', err);
      setError('Failed to process image. Please try a different photo.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle crop confirmation
  const handleCropConfirm = async () => {
    if (!rawImageUrl || !croppedAreaPixels) return;

    try {
      setIsUploading(true);
      const croppedBlob = await getCroppedImg(rawImageUrl, croppedAreaPixels);

      // Create file from blob
      const croppedFile = new File(
        [croppedBlob],
        'profile.webp',
        { type: 'image/webp' }
      );

      setSelectedFile(croppedFile);
      setPreviewUrl(URL.createObjectURL(croppedBlob));
      setShowCropper(false);
      setRawImageUrl(null);
    } catch (err) {
      console.error('Error cropping image:', err);
      setError('Failed to crop image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropper(false);
    setRawImageUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  // Remove selected photo
  const handleRemovePhoto = async () => {
    setSelectedFile(null);
    setPreviewUrl(null);

    // If there's an existing photo, offer to remove it
    if (profilePhotoUrl) {
      if (confirm('Remove your profile photo? Your business logo will be used instead.')) {
        setProfilePhotoUrl(null);
      }
    }
  };

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
      let uploadedPhotoUrl = profilePhotoUrl;

      // Upload new photo if selected
      if (selectedFile) {
        setIsUploading(true);

        // Generate unique filename
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${userId}/profile.${fileExt}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: true // Replace existing file
          });

        if (uploadError) {
          throw new Error(`Failed to upload photo: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);

        uploadedPhotoUrl = publicUrl;
        setIsUploading(false);
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from('community_profiles')
        .update({
          display_name_override: displayName.trim(),
          business_name_override: businessName.trim(),
          profile_photo_url: uploadedPhotoUrl
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
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  // Get the current display photo (preview, existing, or placeholder)
  const displayPhotoUrl = previewUrl || profilePhotoUrl;

  // Show cropper modal if active
  if (showCropper && rawImageUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
        <div className="bg-white rounded-xl max-w-2xl w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Crop profile photo</h3>

          {/* Cropper container */}
          <div className="relative w-full h-96 bg-gray-100 rounded-lg mb-4">
            <Cropper
              image={rawImageUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Zoom control */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zoom
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCropCancel}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCropConfirm}
              disabled={isUploading}
              className="flex-1 px-4 py-2 bg-[#452F9F] text-white rounded-lg hover:bg-[#5a3fbf] transition-colors disabled:opacity-50"
            >
              {isUploading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-4">Edit community profile</h2>

        <p className="text-white/70 text-sm mb-6">
          Customize how you appear in the community. Your display name and business are shown on all your posts and comments.
        </p>

        {/* Profile Photo Upload */}
        <div className="mb-6">
          <label className="block text-white/70 text-sm font-medium mb-2">Profile photo</label>
          <div className="flex items-center gap-4">
            {/* Avatar preview */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 border border-white/20 flex-shrink-0">
              {displayPhotoUrl ? (
                <img
                  src={displayPhotoUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Upload buttons */}
            <div className="flex flex-col gap-2 flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving || isUploading}
                className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                {isUploading ? 'Processing...' : displayPhotoUrl ? 'Change photo' : 'Upload photo'}
              </button>
              {displayPhotoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={isSaving}
                  className="px-4 py-2 text-white/70 text-sm hover:text-white transition-colors disabled:opacity-50"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-white/50 mt-2">
            Crop and adjust your photo after uploading. Automatically compressed and resized to 300×300px.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-white/70 text-sm font-medium mb-2">Display name</label>
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
          <label className="block text-white/70 text-sm font-medium mb-2">Business name</label>
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
            disabled={isSaving || isUploading}
            className="flex-1 px-4 py-2 bg-[#452F9F] text-white rounded-lg hover:bg-[#5a3fbf] transition-colors disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
