import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface PhotoUploadProps {
  reviewId: string;
  selectedWidget: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  reviewId,
  selectedWidget,
}) => {
  const [photoUploadProgress, setPhotoUploadProgress] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const handlePhotoUpload = async (file: File) => {
    try {
      setPhotoUploadProgress(true);
      setPhotoUploadError(null);

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${reviewId}-${Date.now()}.${fileExt}`;
      const filePath = `${selectedWidget}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('review-photos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('[DEBUG] Error uploading photo:', uploadError);
        setPhotoUploadError('Failed to upload photo');
        return;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('review-photos')
        .getPublicUrl(filePath);

      // Update the review with the photo URL
      const { error: updateError } = await supabase
        .from('widget_reviews')
        .update({ photo_url: publicUrl })
        .eq('review_id', reviewId)
        .eq('widget_id', selectedWidget);

      if (updateError) {
        console.error('[DEBUG] Error updating review with photo URL:', updateError);
        setPhotoUploadError('Failed to update review with photo');
        return;
      }

      setPhotoUrl(publicUrl);
    } catch (error) {
      console.error('[DEBUG] Unexpected error in handlePhotoUpload:', error);
      setPhotoUploadError(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setPhotoUploadProgress(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Photo</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handlePhotoUpload(file);
          }
        }}
        className="w-full"
      />
      {photoUploadProgress && <span className="text-xs text-blue-600">Uploading...</span>}
      {photoUploadError && <span className="text-xs text-red-600">{photoUploadError}</span>}
      {photoUrl && (
        <img src={photoUrl} alt="Uploaded" className="mt-2 h-20 w-20 object-cover" />
      )}
    </div>
  );
}; 