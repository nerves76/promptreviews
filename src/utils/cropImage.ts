/**
 * getCroppedImg utility function
 * 
 * Crops an image based on the provided crop area pixels.
 * Used by the ProductImageUpload component for image cropping functionality.
 */

import type { Area } from "react-easy-crop";

export const getCroppedImg = async (imageSrc: string, cropPixels: Area): Promise<Blob> => {
  const image = new window.Image();
  image.src = imageSrc;
  
  await new Promise((resolve) => {
    image.onload = resolve;
  });
  
  const canvas = document.createElement("canvas");
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  
  const ctx = canvas.getContext("2d");
  
  ctx?.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height,
  );
  
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
    }, "image/webp");
  });
}; 