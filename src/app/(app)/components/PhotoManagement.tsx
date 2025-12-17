/**
 * Google Business Profile Optimization Component
 * Handles bulk photo uploads and management across multiple Google Business Profile locations
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Icon from '@/components/Icon';
import { createClient } from '@/auth/providers/supabase';
import LocationPicker from '@/components/GoogleBusinessProfile/LocationPicker';

interface GoogleBusinessLocation {
  id: string;
  name: string;
  address: string;
  status?: string; // Optional, not displayed
}

interface PhotoManagementProps {
  locations: GoogleBusinessLocation[];
  isConnected: boolean;
}

interface PhotoCategory {
  id: string;
  name: string;
  description: string;
  maxFiles: number;
  acceptedTypes: string[];
}

interface UploadedPhoto {
  file: File;
  url: string;
  category: string;
  description?: string;
}

interface UploadProgress {
  locationId: string;
  locationName: string;
  photoIndex: number;
  photoName: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

const photoCategories: PhotoCategory[] = [
  {
    id: 'cover',
    name: 'Cover Photos',
    description: 'Main banner images for your business profile',
    maxFiles: 10,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'logo',
    name: 'Logo',
    description: 'Your business logo or brand image',
    maxFiles: 1,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'interior',
    name: 'Interior Photos',
    description: 'Inside your business location',
    maxFiles: 20,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'exterior',
    name: 'Exterior Photos',
    description: 'Outside views of your business',
    maxFiles: 10,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'products',
    name: 'Products & Services',
    description: 'Photos of your products or services',
    maxFiles: 50,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'team',
    name: 'Team Photos',
    description: 'Photos of your staff and team members',
    maxFiles: 20,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp']
  }
];

export default function PhotoManagement({ locations, isConnected }: PhotoManagementProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('cover');
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  // Auto-select single location
  const [selectedLocations, setSelectedLocations] = useState<string[]>(() => {
    return locations.length === 1 ? [locations[0].id] : [];
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number; total: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const currentCategory = photoCategories.find(cat => cat.id === selectedCategory);
  const categoryPhotos = uploadedPhotos.filter(photo => photo.category === selectedCategory);

  // Auto-select single location when locations change
  useEffect(() => {
    if (locations.length === 1 && selectedLocations.length === 0) {
      setSelectedLocations([locations[0].id]);
    }
  }, [locations]);

  // Handle location selection
  // Handle file uploads
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || !currentCategory) return;

    const newPhotos: UploadedPhoto[] = [];
    const remainingSlots = currentCategory.maxFiles - categoryPhotos.length;

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      
      // Validate file type
      if (!currentCategory.acceptedTypes.includes(file.type)) {
        alert(`File "${file.name}" is not a supported image type.`);
        continue;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
        continue;
      }

      const url = URL.createObjectURL(file);
      newPhotos.push({
        file,
        url,
        category: selectedCategory
      });
    }

    setUploadedPhotos(prev => [...prev, ...newPhotos]);
  }, [currentCategory, categoryPhotos.length, selectedCategory]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removePhoto = (index: number) => {
    const photoToRemove = categoryPhotos[index];
    URL.revokeObjectURL(photoToRemove.url);
    setUploadedPhotos(prev => prev.filter(photo => photo !== photoToRemove));
  };

  const clearAllPhotos = () => {
    categoryPhotos.forEach(photo => URL.revokeObjectURL(photo.url));
    setUploadedPhotos(prev => prev.filter(photo => photo.category !== selectedCategory));
  };

  const handleBulkUpload = async () => {
    if (categoryPhotos.length === 0 || selectedLocations.length === 0) {
      alert('Please select photos and locations to upload to.');
      return;
    }

    setIsUploading(true);
    setUploadResults(null);

    const totalUploads = categoryPhotos.length * selectedLocations.length;
    const progressItems: UploadProgress[] = [];

    // Initialize progress tracking
    selectedLocations.forEach(locationId => {
      const location = locations.find(loc => loc.id === locationId);
      categoryPhotos.forEach((photo, photoIndex) => {
        progressItems.push({
          locationId,
          locationName: location?.name || locationId,
          photoIndex,
          photoName: photo.file.name,
          status: 'pending',
          progress: 0
        });
      });
    });

    setUploadProgress(progressItems);

    let successCount = 0;
    let failedCount = 0;

    try {
      // Upload photos one by one to respect rate limits
      for (const progressItem of progressItems) {
        try {
          // Update status to uploading
          setUploadProgress(prev => 
            prev.map(item => 
              item.locationId === progressItem.locationId && 
              item.photoIndex === progressItem.photoIndex
                ? { ...item, status: 'uploading', progress: 0 }
                : item
            )
          );

          const photo = categoryPhotos[progressItem.photoIndex];
          
          // Create FormData for file upload
          const formData = new FormData();
          formData.append('file', photo.file);
          formData.append('locationId', progressItem.locationId);
          formData.append('category', selectedCategory);
          if (photo.description) {
            formData.append('description', photo.description);
          }

          // Get auth token for API request
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            throw new Error('Authentication required');
          }

          const response = await fetch('/api/social-posting/photos/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            },
            body: formData
          });

          if (response.ok) {
            successCount++;
            setUploadProgress(prev => 
              prev.map(item => 
                item.locationId === progressItem.locationId && 
                item.photoIndex === progressItem.photoIndex
                  ? { ...item, status: 'completed', progress: 100 }
                  : item
              )
            );
          } else {
            failedCount++;
            const errorData = await response.json();
            setUploadProgress(prev => 
              prev.map(item => 
                item.locationId === progressItem.locationId && 
                item.photoIndex === progressItem.photoIndex
                  ? { 
                      ...item, 
                      status: 'failed', 
                      progress: 0,
                      error: errorData.message || 'Upload failed'
                    }
                  : item
              )
            );
          }

          // Add delay between uploads to respect rate limits
          if (progressItems.indexOf(progressItem) < progressItems.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
          }

        } catch (error) {
          failedCount++;
          setUploadProgress(prev => 
            prev.map(item => 
              item.locationId === progressItem.locationId && 
              item.photoIndex === progressItem.photoIndex
                ? { 
                    ...item, 
                    status: 'failed', 
                    progress: 0,
                    error: error instanceof Error ? error.message : 'Upload failed'
                  }
                : item
            )
          );
        }
      }

      setUploadResults({
        success: successCount,
        failed: failedCount,
        total: totalUploads
      });

    } finally {
      setIsUploading(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  const hasSingleLocation = locations.length <= 1;
  const resolvedSingleLocation = hasSingleLocation ? locations[0] : undefined;

  return (
    <div className="space-y-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Google Business Photos</h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload fresh images or review what&apos;s already live to keep your profile engaging.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Locations:</p>
          {hasSingleLocation ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Google Business Profile: {resolvedSingleLocation?.name || 'No locations connected'}
            </div>
          ) : (
            <LocationPicker
              className="bg-gray-50 rounded-lg p-4"
              mode="multi"
              locations={locations}
              selectedIds={selectedLocations}
              onChange={(ids) => setSelectedLocations(ids)}
              includeSelectAll
              helperText="Photos will be uploaded to every selected location."
            />
          )}
        </div>
      </div>

      {/* Photo Categories */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-blue">Photo Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photoCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                selectedCategory === category.id
                  ? 'border-slate-blue bg-slate-blue/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="font-medium text-slate-blue mb-2">{category.name}</h4>
              <p className="text-sm text-gray-600">{category.description}</p>
            </button>
          ))}
        </div>
      </div>



      {/* Photo Upload Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-blue">
            {currentCategory?.name} 
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({categoryPhotos.length}/{currentCategory?.maxFiles})
            </span>
          </h3>
          {categoryPhotos.length > 0 && (
            <button
              onClick={clearAllPhotos}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear All Photos
            </button>
          )}
        </div>

        {/* Drag & Drop Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
        >
                            <Icon name="FaUpload" className="w-8 h-8 text-gray-400 mx-auto mb-4" size={32} />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drag and drop images here
          </p>
          <p className="text-gray-600 mb-4">
            or
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 transition-colors"
          >
            Choose Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <p className="text-sm text-gray-500 mt-4">
            Maximum {currentCategory?.maxFiles} files, 10MB each. 
            Supported formats: JPEG, PNG, WebP
          </p>
        </div>

        {/* Photo Preview Grid */}
        {categoryPhotos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categoryPhotos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo.url}
                  alt={`${currentCategory?.name} ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md border"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove photo"
                >
                  <Icon name="FaTrash" className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-50 text-white text-xs p-1 rounded truncate">
                  {photo.file.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {categoryPhotos.length > 0 && selectedLocations.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-slate-blue">Ready to Upload</h4>
                <p className="text-sm text-gray-600">
                  {categoryPhotos.length} photo{categoryPhotos.length !== 1 ? 's' : ''} to {selectedLocations.length} location{selectedLocations.length !== 1 ? 's' : ''} 
                  ({categoryPhotos.length * selectedLocations.length} total uploads)
                </p>
              </div>
              <button
                onClick={handleBulkUpload}
                disabled={isUploading}
                className="px-6 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Icon name="FaUpload" className="w-4 h-4" />
                    <span>Upload Photos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-slate-blue mb-4">Upload Progress</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uploadProgress.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate">
                    {item.photoName} → {item.locationName}
                  </span>
                  <div className="flex items-center space-x-2">
                    {item.status === 'pending' && (
                      <span className="text-gray-500">Pending</span>
                    )}
                    {item.status === 'uploading' && (
                      <>
                        <Icon name="FaSpinner" className="w-3 h-3 animate-spin text-blue-600" />
                        <span className="text-blue-600">Uploading</span>
                      </>
                    )}
                    {item.status === 'completed' && (
                      <>
                        <Icon name="FaCheck" className="w-3 h-3 text-green-600" />
                        <span className="text-green-600">Complete</span>
                      </>
                    )}
                    {item.status === 'failed' && (
                      <>
                        <Icon name="FaExclamationTriangle" className="w-3 h-3 text-red-600" />
                        <span className="text-red-600" title={item.error}>Failed</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Results */}
        {uploadResults && (
          <div className={`rounded-lg p-4 ${
            uploadResults.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-start space-x-3">
              {uploadResults.failed === 0 ? (
                <Icon name="FaCheck" className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <Icon name="FaExclamationTriangle" className="w-5 h-5 text-yellow-600 mt-0.5" />
              )}
              <div>
                <h4 className={`text-sm font-medium ${
                  uploadResults.failed === 0 ? 'text-green-800' : 'text-yellow-800'
                } mb-1`}>
                  Upload Complete
                </h4>
                <p className={`text-sm ${
                  uploadResults.failed === 0 ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {uploadResults.success} of {uploadResults.total} photos uploaded successfully
                  {uploadResults.failed > 0 && `, ${uploadResults.failed} failed`}
                </p>
                {uploadResults.success > 0 && (
                  <button
                    onClick={() => {
                      // Clear completed uploads
                      clearAllPhotos();
                      setUploadProgress([]);
                      setUploadResults(null);
                    }}
                    className="mt-2 text-sm text-slate-600 hover:text-slate-800 underline"
                  >
                    Clear completed uploads
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
