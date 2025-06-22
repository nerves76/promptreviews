import React, { useState } from 'react';

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

      // Use the API route for photo upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('widgetId', selectedWidget);

      const response = await fetch('/api/upload-widget-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[DEBUG] Error uploading photo:', errorData);
        setPhotoUploadError(errorData.error || 'Failed to upload photo');
        return;
      }

      const { url } = await response.json();

      // Update the review with the photo URL using the API
      const updateResponse = await fetch('/api/widgets/upload-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          widgetId: selectedWidget,
          photoUrl: url,
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('[DEBUG] Error updating review with photo URL:', errorData);
        setPhotoUploadError('Failed to update review with photo');
        return;
      }

      setPhotoUrl(url);
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