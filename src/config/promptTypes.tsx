/**
 * Centralized Prompt Types Configuration
 * 
 * This file defines all prompt page types and their icons in one place to ensure
 * consistency across the application and simplify maintenance.
 * 
 * Used by:
 * - Dashboard (DashboardContent.tsx)
 * - Create Prompt Page (CreatePromptPageClient.tsx)
 * - Prompt Pages (/prompt-pages/page.tsx)
 * - Individual Prompt Pages (/prompt-pages/individual/page.tsx)
 * - Contacts Page (/dashboard/contacts/page.tsx)
 */

import React from "react";
import Icon from '@/components/Icon';

export interface PromptType {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  comingSoon?: boolean;
}

/**
 * All available prompt page types with consistent icon implementation
 * using the SVG sprite system for optimal performance.
 */
export const promptTypes: PromptType[] = [
  {
    key: "service",
    label: "Service review",
    icon: <Icon name="FaHandshake" className="w-7 h-7 text-slate-blue" size={28} />,
    description: "Capture a review from a customer or client who loves what you do",
  },
  {
    key: "photo",
    label: "Photo + testimonial",
    icon: <Icon name="FaCamera" className="w-7 h-7 text-slate-blue" size={28} />,
    description: "Capture a headshot and testimonial to display on your website or in marketing materials.",
  },
  {
    key: "product",
    label: "Product review",
    icon: <Icon name="FaBoxOpen" className="w-7 h-7 text-slate-blue" size={28} />,
    description: "Get a review from a customer who fancies your products",
  },
  {
    key: "employee",
    label: "Employee spotlight",
    icon: <Icon name="FaUser" className="w-7 h-7 text-slate-blue" size={28} />,
    description: "Create a review page to showcase individual team members and inspire competition",
  },
  {
    key: "event",
    label: "Events & spaces",
    icon: <Icon name="FaCalendarAlt" className="w-7 h-7 text-slate-blue" size={28} />,
    description: "For events, rentals, tours, and more.",
  },
  {
    key: "video",
    label: "Video testimonial",
    icon: <Icon name="FaVideo" className="w-7 h-7 text-slate-blue" size={28} />,
    description: "Request a video testimonial from your client.",
    comingSoon: true,
  },
];

/**
 * Alternative color variant for specific use cases (e.g., darker backgrounds)
 */
export const promptTypesWithDarkIcons: PromptType[] = promptTypes.map(type => ({
  ...type,
  icon: React.cloneElement(type.icon as React.ReactElement, {
    className: "w-7 h-7 text-[#1A237E]",
    style: { color: "#1A237E" }
  })
}));

/**
 * Get a specific prompt type by key
 */
export const getPromptTypeByKey = (key: string): PromptType | undefined => {
  return promptTypes.find(type => type.key === key);
};

/**
 * Get all non-coming-soon prompt types
 */
export const getAvailablePromptTypes = (): PromptType[] => {
  return promptTypes.filter(type => !type.comingSoon);
}; 