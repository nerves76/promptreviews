/**
 * LoadPhotosButton Component
 * Loads existing photos from Google Business Profile for a selected location
 * Similar to LoadBusinessInfoButton but for photos/media
 */

'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';

interface LoadedPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  category: string;
  mediaFormat: string;
  createTime?: string;
  dimensions?: {
    widthPixels: number;
    heightPixels: number;
  };
  attribution?: any;
}

interface LoadPhotosButtonProps {
  selectedLocationIds: string[];
  locations: Array<{
    id: string;
    name: string;
    address: string;
  }>;
  photosLoaded: boolean;
  onPhotosLoaded: (photos: LoadedPhoto[]) => void;
  onLoadingStateChange: (loading: boolean) => void;
  onPhotosLoadedChange: (loaded: boolean) => void;
  onErrorChange: (error: string | null) => void;
}

export default function LoadPhotosButton({
  selectedLocationIds,
  locations,
  photosLoaded,
  onPhotosLoaded,
  onLoadingStateChange,
  onPhotosLoadedChange,
  onErrorChange
}: LoadPhotosButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Loads photos from Google Business Profile for the selected location
   */
  const loadCurrentPhotos = async () => {
    if (selectedLocationIds.length !== 1) {
      onErrorChange('Photo loading is only available for single locations');
      return;
    }

    setIsLoading(true);
    onLoadingStateChange(true);
    onErrorChange(null);

    try {
      const locationId = selectedLocationIds[0];
      const selectedLocation = locations.find(loc => loc.id === locationId);
      console.log('🔍 Loading photos for location:', {
        requestedId: locationId,
        selectedLocation: selectedLocation,
        allLocations: locations.map(loc => ({ id: loc.id, name: loc.name }))
      });

      const response = await fetch('/api/social-posting/photos/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locationId }),
      });

      const data = await response.json();
      console.log('📦 Photos API Response:', { 
        status: response.status, 
        ok: response.ok, 
        success: data.success, 
        photoCount: data.photos?.length 
      });

      if (response.ok && data.success) {
        console.log(`✅ Successfully loaded ${data.photos.length} photos for location`);
        
        // Transform the photos data
        const loadedPhotos: LoadedPhoto[] = data.photos || [];
        
        onPhotosLoaded(loadedPhotos);
        onPhotosLoadedChange(true);
        
        if (loadedPhotos.length === 0) {
          onErrorChange('No photos found for this location. You can upload some using the form below.');
        }
      } else {
        const errorMessage = data.message || 'Failed to load photos';
        console.error('❌ Photos API error:', errorMessage);
        onErrorChange(errorMessage);
      }
    } catch (error) {
      console.error('💥 Error loading photos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load photos';
      onErrorChange(`Failed to load photos: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      onLoadingStateChange(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={loadCurrentPhotos}
        disabled={isLoading || selectedLocationIds.length !== 1}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
          isLoading || selectedLocationIds.length !== 1
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : photosLoaded
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-slate-600 text-white hover:bg-slate-700'
        }`}
      >
        {isLoading ? (
          <>
            <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
            <span>Loading Photos...</span>
          </>
        ) : photosLoaded ? (
          <>
            <Icon name="FaCheck" className="w-4 h-4" />
            <span>Photos Loaded</span>
          </>
        ) : (
          <>
            <Icon name="MdDownload" className="w-4 h-4" />
            <span>Load photos</span>
          </>
        )}
      </button>
      
      {selectedLocationIds.length !== 1 && (
        <span className="text-sm text-gray-500">
          Select one location to load photos
        </span>
      )}
    </div>
  );
}