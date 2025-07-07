/**
 * ProductModule Component
 * 
 * Displays product information for product-type prompt pages.
 * This component is extracted from the main prompt page to improve maintainability.
 */

import React from 'react';
import { getFontClass } from '../utils/fontUtils';

interface BusinessProfile {
  primary_font?: string;
  secondary_font?: string;
}

interface PromptPage {
  review_type?: string;
  product_name?: string;
  product_photo?: string;
  product_description?: string;
  features_or_benefits?: string[];
}

interface ProductModuleProps {
  promptPage: PromptPage;
  businessProfile: BusinessProfile;
  sentiment?: string | null;
}

export default function ProductModule({ 
  promptPage, 
  businessProfile, 
  sentiment 
}: ProductModuleProps) {
  // Only render if this is a product page with a product name
  if (promptPage?.review_type !== "product" || !promptPage.product_name) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow p-8 mb-8 flex flex-col md:flex-row items-center md:items-start max-w-[1000px] mx-auto animate-slideup relative mt-12 gap-8">
      {promptPage.product_photo && (
        <div className="flex-shrink-0 mb-4 md:mb-0">
          <img
            src={promptPage.product_photo}
            alt={promptPage.product_name}
            className="rounded-2xl w-[300px] h-[300px] object-cover border"
          />
        </div>
      )}
      
      <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left">
        <h2 className={`text-2xl font-bold text-slate-blue mb-2 ${getFontClass(businessProfile?.primary_font || "")}`}>
          {promptPage.product_name}
        </h2>
        
        {/* Only show details if not neutral/frustrated sentiment */}
        {(!sentiment || (sentiment !== "neutral" && sentiment !== "frustrated")) && (
          <>
            {promptPage.product_description && (
              <div className={`text-lg text-gray-700 mb-3 ${getFontClass(businessProfile?.secondary_font || "")}`}>
                {promptPage.product_description}
              </div>
            )}
            
            {promptPage.features_or_benefits && promptPage.features_or_benefits.length > 0 && (
              <ul className="mb-3 text-gray-700 text-base list-disc list-inside">
                {promptPage.features_or_benefits.map(
                  (feature: string, index: number) =>
                    feature && <li key={index}>{feature}</li>
                )}
              </ul>
            )}
            
            <div className={`text-sm text-gray-500 ${getFontClass(businessProfile?.secondary_font || "")}`}>
              Share your experience with this product below!
            </div>
          </>
        )}
      </div>
    </div>
  );
} 