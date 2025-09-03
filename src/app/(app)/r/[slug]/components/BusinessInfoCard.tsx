/**
 * BusinessInfoCard Component
 * 
 * Displays the business information card with logo, name, and location.
 * This component is extracted from the main prompt page to improve maintainability.
 */

import React from 'react';
import Image from 'next/image';
import { getFontClass } from '../utils/fontUtils';
import RecentReviewsButton from '../../../components/RecentReviewsButton';
import { applyCardTransparency } from '@/utils/colorUtils';

interface BusinessProfile {
  business_name?: string;
  logo_url?: string | null;
  primary_font?: string;
  secondary_font?: string;
  primary_color?: string;
  card_bg?: string;
  card_text?: string;
  card_transparency?: number;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  card_inner_shadow?: boolean;
  card_shadow_color?: string;
  card_shadow_intensity?: number;
  card_border_width?: number;
  card_border_color?: string;
  card_border_transparency?: number;
}

interface BusinessInfoCardProps {
  businessProfile: BusinessProfile;
  reviewType?: string;
  promptPage?: any; // Add prompt page data for employee-specific logic
  onOpenRecentReviews?: () => void; // Callback to open recent reviews modal
}

export default function BusinessInfoCard({ businessProfile, reviewType, promptPage, onOpenRecentReviews }: BusinessInfoCardProps) {
  // For service pages, only show City, State. For location pages, show full address
  const shouldShowFullAddress = reviewType === 'location' || reviewType === 'universal';
  
  // Helper function to get card border style
  const getCardBorderStyle = () => {
    if (businessProfile?.card_border_width && businessProfile.card_border_width > 0) {
      // Use rgba format for better browser compatibility
      const borderColor = businessProfile.card_border_color || '#222222';
      const borderOpacity = businessProfile.card_border_transparency || 1;
      
      // Convert hex to RGB
      const hex = borderColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      return `${businessProfile.card_border_width}px solid rgba(${r}, ${g}, ${b}, ${borderOpacity})`;
    }
    return 'none';
  };
  
  const getAddressDisplay = () => {
    if (shouldShowFullAddress) {
      // Show full address for location pages
      return [
        businessProfile.address_street,
        businessProfile.address_city,
        businessProfile.address_state,
      ]
        .filter(Boolean)
        .join(", ");
    } else {
      // Show only City, State for service pages
      return [
        businessProfile.address_city,
        businessProfile.address_state,
      ]
        .filter(Boolean)
        .join(", ");
    }
  };
  return (
    <div 
      className={`rounded-2xl shadow-lg px-6 pt-6 pb-12 mb-8 flex flex-col items-center max-w-xl mx-auto animate-slideup relative mt-32 backdrop-blur-sm ${getFontClass(businessProfile?.primary_font || "")}`} 
      style={{
        background: applyCardTransparency(businessProfile?.card_bg || "#FFFFFF", businessProfile?.card_transparency ?? 0.95),
        color: businessProfile?.card_text || "#1A1A1A",
        border: getCardBorderStyle(),
        backdropFilter: 'blur(8px)'
      }}
    >
      {businessProfile?.card_inner_shadow && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            boxShadow: `inset 0 0 32px 0 ${businessProfile.card_shadow_color || '#222222'}${Math.round((businessProfile.card_shadow_intensity || 0.2) * 255).toString(16).padStart(2, '0')}`,
            borderRadius: '1rem',
            zIndex: 0,
          }}
        />
      )}
      {/* Business Logo - No drop-down animation */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-52 h-52 aspect-square flex items-center justify-center mb-10"
        style={{ pointerEvents: "none", top: "-100px" }}
      >
        <div 
          className="rounded-full p-0.5 shadow-lg flex items-center justify-center w-full h-full aspect-square"
          style={{ 
            backgroundColor: applyCardTransparency(businessProfile?.card_bg || '#FFFFFF', businessProfile.card_transparency ?? 0.95),
            backdropFilter: 'blur(4px)'
          }}
        >
          {businessProfile?.logo_url ? (
            <Image
              src={businessProfile.logo_url}
              alt={`${businessProfile?.business_name || "Business"} logo`}
              width={192}
              height={192}
              priority={true}
              quality={85}
              className="h-48 w-48 aspect-square object-contain rounded-full"
              style={{ objectFit: 'contain' }}
              sizes="(max-width: 768px) 160px, 192px"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
          ) : (
            <div className="h-48 w-48 aspect-square bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-5xl text-gray-500">
                {businessProfile?.business_name?.[0] || "B"}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Content Area with Title/Location */}
      <div className="mt-24">
        {/* Employee Name or Business Name */}
        <h1
          className={`text-3xl font-bold text-center mb-1 ${getFontClass(businessProfile?.primary_font || "")}`}
          style={{ color: businessProfile?.primary_color || "#4F46E5" }}
        >
          {reviewType === 'employee' && promptPage?.emp_first_name && promptPage?.emp_last_name ? (
            `${promptPage.emp_first_name} ${promptPage.emp_last_name}`
          ) : (
            businessProfile?.business_name || "Business Name"
          )}
        </h1>
        
        {/* Employee Role or Address under name */}
        {reviewType === 'employee' && promptPage?.emp_position && businessProfile?.business_name ? (
          <div className={`text-center text-base text-gray-600 font-medium ${getFontClass(businessProfile?.secondary_font || "")}`}>
            {promptPage.emp_position} at {businessProfile.business_name}
          </div>
        ) : (
          (businessProfile?.address_street || businessProfile?.address_city || businessProfile?.address_state) && (
            <div className={`text-center text-base text-gray-600 font-medium ${getFontClass(businessProfile?.secondary_font || "")}`}>
              {getAddressDisplay()}
            </div>
          )
        )}
      </div>
      
      {/* Recent Reviews Button - Positioned separately at bottom-right */}
      {promptPage?.id && promptPage?.recent_reviews_enabled && onOpenRecentReviews && (
        <div className="absolute bottom-4 right-4 sm:bottom-4 sm:right-4" style={{
          bottom: 'calc(1rem - 6px)',
          right: 'calc(1rem - 6px)',
        }}>
          <RecentReviewsButton
            promptPageId={promptPage.id}
            enabled={promptPage.recent_reviews_enabled}
            businessProfile={businessProfile}
            onOpenModal={onOpenRecentReviews}
          />
        </div>
      )}
    </div>
  );
} 