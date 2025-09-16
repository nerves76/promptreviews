import React, { useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';

interface PhotoUploadProps {
  reviewId: string;
  selectedWidget: string;
  onPhotoUpload?: (reviewId: string, photoUrl: string) => void;
  initialPhotoUrl?: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  reviewId,
  selectedWidget,
  onPhotoUpload,
  initialPhotoUrl,
}) => {
  const [photoUploadProgress, setPhotoUploadProgress] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl || null);

  // Update photo URL when initialPhotoUrl changes
  useEffect(() => {
    setPhotoUrl(initialPhotoUrl || null);
  }, [initialPhotoUrl]);

  const handlePhotoUpload = async (file: File) => {
    try {
      setPhotoUploadProgress(true);
      setPhotoUploadError(null);

      // Validate file size (10MB limit before compression)
      if (file.size > 10 * 1024 * 1024) {
        setPhotoUploadError("Please upload an image under 10MB. Large images may fail to process.");
        return;
      }

      // Validate file type
      if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
        setPhotoUploadError("Only PNG, JPG, or WebP images are allowed.");
        return;
      }

      // Compress the image before upload
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.3, // 300KB
        maxWidthOrHeight: 800, // Support larger images for better quality on larger screens
        useWebWorker: true,
        fileType: 'image/webp', // Always convert to webp for better compression
      });

      // Use the API route for photo upload
      const formData = new FormData();
      formData.append('file', compressedFile);
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
      
      // Call the callback to update parent state
      if (onPhotoUpload) {
        onPhotoUpload(reviewId, url);
      }
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
      <div className="text-xs text-gray-500 mb-2">Up to 800x800px supported (PNG, JPG, or WEBP) - automatically compressed for optimal performance</div>
      <input
        type="file"
        accept="image/png, image/jpeg, image/webp"
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
        <div className="mt-2">
          <img src={photoUrl} alt="Uploaded" className="h-20 w-20 object-cover rounded" />
          <p className="text-xs text-gray-500 mt-1">Photo uploaded successfully</p>
        </div>
      )}
    </div>
  );
}; 