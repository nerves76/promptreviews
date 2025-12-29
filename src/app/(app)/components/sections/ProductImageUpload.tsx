/**
 * ProductImageUpload component
 * 
 * Handles product image upload with compression and cropping functionality.
 * Includes file validation, image compression, and a cropping interface.
 */

"use client";
import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import imageCompression from 'browser-image-compression';
import { getCroppedImg } from "@/utils/cropImage";

interface ProductImageUploadProps {
  productPhotoUrl: string | null;
  onPhotoUrlChange: (url: string | null) => void;
  productPhotoFile: File | null;
  onPhotoFileChange: (file: File | null) => void;
  businessProfile: any;
  supabase: any;
}

function Tooltip(props: { text: string }) {
  const [show, setShow] = React.useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="ml-1 text-gray-500 hover:text-gray-600"
      >
        <span className="inline-block w-4 h-4 rounded-full border border-gray-300 text-xs leading-4 text-center">
          ?
        </span>
      </button>
      {show && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-56 p-2 bg-white border border-gray-200 rounded shadow text-xs text-gray-700">
          {props.text}
        </div>
      )}
    </span>
  );
}

export default function ProductImageUpload({ 
  productPhotoUrl, 
  onPhotoUrlChange, 
  productPhotoFile, 
  onPhotoFileChange,
  businessProfile,
  supabase 
}: ProductImageUploadProps) {
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [productPhotoError, setProductPhotoError] = useState<string | null>(null);
  const [rawProductPhotoFile, setRawProductPhotoFile] = useState<File | null>(null);

  const handleProductPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProductPhotoError(null);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setProductPhotoError("Please select a valid image file.");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setProductPhotoError("Image must be smaller than 10MB.");
      return;
    }

    try {
      // Compress the image
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 600,
        useWebWorker: true,
        fileType: 'image/webp', // Always convert to webp
      });
      setRawProductPhotoFile(compressedFile);
      setShowCropper(true);
      onPhotoUrlChange(URL.createObjectURL(compressedFile));
    } catch (err) {
      setProductPhotoError("Failed to compress image. Please try another file.");
      return;
    }
  };

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleCropConfirm = async () => {
    if (!productPhotoUrl || !croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(productPhotoUrl, croppedAreaPixels);
    const croppedFile = new File(
      [croppedBlob],
      (rawProductPhotoFile?.name?.replace(/\.[^.]+$/, '') || "product") + ".webp",
      { type: "image/webp" },
    );
    onPhotoFileChange(croppedFile);
    onPhotoUrlChange(URL.createObjectURL(croppedFile));
    setShowCropper(false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    onPhotoFileChange(null);
    onPhotoUrlChange(null);
    setRawProductPhotoFile(null);
  };

  return (
    <div className="custom-space-y">
      {/* Product Image */}
      <label
        htmlFor="product_photo"
        className="block text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1"
      >
        Product image
        <Tooltip text="Upload a photo of the product. This will be shown on the public page. Recommended size: 600x600px." />
      </label>
      {productPhotoUrl && (
        <img
          src={productPhotoUrl}
          alt="Product preview"
          className="mb-2 rounded w-40 h-40 object-cover border"
        />
      )}
      <input
        type="file"
        id="product_photo"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleProductPhotoChange}
        className="mb-2"
      />
      {productPhotoError && (
        <div className="text-red-600 mb-2">{productPhotoError}</div>
      )}
      
      {showCropper && productPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 overflow-y-auto">
          <div className="bg-white p-6 rounded shadow-lg relative max-w-2xl w-full">
            <div className="w-full h-96 relative mb-8">
              <Cropper
                image={productPhotoUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={handleCropCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-slate-blue text-white rounded"
                onClick={handleCropConfirm}
              >
                Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 