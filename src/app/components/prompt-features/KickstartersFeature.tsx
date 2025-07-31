/**
 * KickstartersFeature Component
 * 
 * A reusable component for the kickstarters (prompts) feature that appears across all prompt page types.
 * This component handles the toggle for enabling/disabling kickstarters and provides management interface.
 * 
 * Features:
 * - Toggle to enable/disable kickstarters
 * - Management modal for selecting and customizing kickstarters
 * - Example implementation preview
 * - Inheritance from business-level settings with override capability
 */

"use client";
import React, { useState, useEffect } from "react";
import { FaLightbulb, FaCog } from "react-icons/fa";
import { createClient } from "@/utils/supabaseClient";
import KickstartersManagementModal from "./KickstartersManagementModal";

export interface Kickstarter {
  id: string;
  question: string;
  category: 'PROCESS' | 'EXPERIENCE' | 'OUTCOMES' | 'PEOPLE';
  is_default: boolean;
}

export interface KickstartersFeatureProps {
  /** Whether kickstarters are enabled */
  enabled: boolean;
  /** Array of selected kickstarter IDs */
  selectedKickstarters: string[];
  /** Background design option: true for background, false for no background */
  backgroundDesign?: boolean;
  /** Business name for dynamic replacement */
  businessName?: string;
  /** Whether this is inherited from business level */
  isInherited?: boolean;
  /** Business-level settings for inheritance display */
  businessSettings?: {
    enabled: boolean;
    selectedKickstarters: string[];
    backgroundDesign?: boolean;
  };
  /** Callback when the enabled state changes */
  onEnabledChange: (enabled: boolean) => void;
  /** Callback when selected kickstarters change */
  onKickstartersChange: (kickstarters: string[]) => void;
  /** Callback when background design changes (updates global business setting) */
  onBackgroundDesignChange?: (backgroundDesign: boolean) => void;
  /** Initial values for the component */
  initialData?: {
    kickstarters_enabled?: boolean;
    selected_kickstarters?: string[];
    kickstarters_background_design?: boolean;
  };
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to use edit interface styling */
  editMode?: boolean;
  /** Business profile for styling the example */
  businessProfile?: {
    primary_color?: string;
    card_bg?: string;
    card_text?: string;
    card_transparency?: number;
    background_type?: string;
    gradient_start?: string;
    gradient_end?: string;
    background_color?: string;
  };
}

export default function KickstartersFeature({
  enabled,
  selectedKickstarters = [],
  backgroundDesign = false,
  businessName = "Business Name",
  isInherited = false,
  businessSettings,
  onEnabledChange,
  onKickstartersChange,
  onBackgroundDesignChange,
  initialData,
  disabled = false,
  editMode = false,
  businessProfile,
}: KickstartersFeatureProps) {
  const supabase = createClient();
  
  // Helper function to apply card background transparency
  const applyCardTransparency = (color: string, transparency: number = 1.0) => {
    if (!color) return '#F9FAFB';
    if (transparency === 1) return color;
    
    // Convert hex to rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${transparency})`;
  };

  // Compute background style like the actual prompt page
  const getExampleBackgroundStyle = () => {
    // Default to gradient if no businessProfile or background_type is undefined
    const backgroundType = businessProfile?.background_type || 'gradient';
    
    if (backgroundType === "gradient") {
      return {
        background: `linear-gradient(to bottom, ${businessProfile?.gradient_start || '#4F46E5'} 0%, ${businessProfile?.gradient_start || '#4F46E5'} 60%, ${businessProfile?.gradient_end || '#C7D2FE'} 100%)`,
        backgroundSize: '100% 100%',
      };
    } else {
      return {
        background: businessProfile?.background_color || "#dbeafe", // Light blue fallback
      };
    }
  };
  
  // Initialize state from props and initialData
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [selected, setSelected] = useState<string[]>(selectedKickstarters);
  const [localBackgroundDesign, setLocalBackgroundDesign] = useState(backgroundDesign);
  const [showModal, setShowModal] = useState(false);

  const [allKickstarters, setAllKickstarters] = useState<Kickstarter[]>([]);
  const [loading, setLoading] = useState(false);

  // Update state when props change
  useEffect(() => {
    setIsEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    setSelected(selectedKickstarters);
  }, [selectedKickstarters]);

  useEffect(() => {
    setLocalBackgroundDesign(backgroundDesign);
  }, [backgroundDesign]);

  // Initialize from initialData if provided
  useEffect(() => {
    if (initialData) {
      if (initialData.kickstarters_enabled !== undefined) {
        setIsEnabled(initialData.kickstarters_enabled);
      }
      if (initialData.selected_kickstarters !== undefined) {
        setSelected(initialData.selected_kickstarters);
      }
    }
  }, [initialData]);

  // Fetch all kickstarters when modal opens
  useEffect(() => {
    if (showModal) {
      fetchKickstarters();
    }
  }, [showModal]);

  const fetchKickstarters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kickstarters')
        .select('*')
        .order('category', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAllKickstarters(data || []);
    } catch (error) {
      console.error('Error fetching kickstarters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    onEnabledChange(newEnabled);
  };

  const handleManageKickstarters = () => {
    setShowModal(true);
  };

  const handleSaveKickstarters = (newSelected: string[]) => {
    setSelected(newSelected);
    onKickstartersChange(newSelected);
    setShowModal(false);
  };

  // Get example kickstarter for preview
  const getExampleKickstarter = () => {
    if (selected.length === 0) {
      // When no kickstarters selected, show a sample from our defaults
      const sampleQuestions = [
        "What made the experience with [Business Name] feel simple or stress-free?",
        "What's one word you'd use to describe [Business Name]—and why?",
        "How did [Business Name] meet—or exceed—your expectations?",
        "Is there someone at [Business Name] you'd like to thank by name?"
      ];
      // Rotate through examples based on current time for variety
      const index = Math.floor(Date.now() / 10000) % sampleQuestions.length;
      return sampleQuestions[index];
    }
    
    const selectedKickstarter = allKickstarters.find(k => k.id === selected[0]);
    return selectedKickstarter?.question || "What made the experience with [Business Name] feel simple or stress-free?";
  };

  const replaceBusinessName = (question: string) => {
    return question.replace(/\[Business Name\]/g, businessName);
  };

  const getInheritanceText = () => {
    if (!isInherited || !businessSettings) return null;
    
    if (businessSettings.enabled && businessSettings.selectedKickstarters.length > 0) {
      return `Inheriting ${businessSettings.selectedKickstarters.length} kickstarters from business settings`;
    } else if (businessSettings.enabled) {
      return "Inheriting kickstarters from business settings (no specific selection)";
    } else {
      return "Business-level kickstarters are disabled";
    }
  };

  return (
    <div className={`${editMode ? 'rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-4 shadow relative mb-4' : 'bg-white rounded-lg border border-gray-200 p-6 mb-6'}`}>
      <div className={`${editMode ? 'flex flex-row justify-between items-start px-2 py-2' : 'flex items-center justify-between mb-4'}`}>
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <FaLightbulb className={`${editMode ? 'w-7 h-7 text-slate-blue' : 'text-slate-blue text-lg'}`} />
            <h3 className={`${editMode ? 'text-2xl font-bold text-[#1A237E]' : 'text-lg font-semibold text-gray-900'}`}>
              Kickstarters
            </h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              (AKA Prompts)
            </span>
          </div>
          <div className={`${editMode ? 'text-sm text-gray-700 mt-[3px] ml-10' : 'text-sm text-gray-600'}`}>
            Add a selection of questions that will inspire your client or customer to write an amazing review.
            {isInherited && getInheritanceText() && (
              <div className="text-xs text-blue-600 italic mt-1">
                {getInheritanceText()}
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            isEnabled ? "bg-slate-blue" : "bg-gray-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-pressed={isEnabled}
          disabled={disabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              isEnabled ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      
      {isEnabled && (
        <div className="px-2 space-y-4">


          {/* Controls Row - Manage button and Background options */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleManageKickstarters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
              disabled={disabled}
            >
              <FaCog className="w-4 h-4" />
              Manage
            </button>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Background:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLocalBackgroundDesign(true);
                    onBackgroundDesignChange?.(true);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    localBackgroundDesign 
                      ? 'bg-slate-blue text-white' 
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                  disabled={disabled}
                >
                  With
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocalBackgroundDesign(false);
                    onBackgroundDesignChange?.(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    !localBackgroundDesign 
                      ? 'bg-slate-blue text-white' 
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                  disabled={disabled}
                >
                  Without
                </button>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mb-4 text-right">
            Background setting affects all instances
          </p>

          {/* Example Implementation - Always Show */}
          <div className="mb-2">
            <div className="text-sm font-medium text-blue-900 mb-3">
              Example
            </div>
            <div 
              className="rounded-lg p-4 flex items-center justify-center"
              style={{
                minHeight: '120px', // Ensure gradient is visible
                border: '2px solid rgba(59, 130, 246, 0.3)', // Semi-transparent border to not interfere with gradient
                position: 'relative',
                ...getExampleBackgroundStyle(), // Apply background last to ensure it takes precedence
              }}
            >
              {/* Match current carousel design - Centered vertically */}
              <div className="relative w-full">
                {/* Left Arrow */}
                <button 
                  className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all focus:outline-none ${
                    localBackgroundDesign 
                      ? 'bg-white hover:bg-gray-50' 
                      : 'border-2 hover:opacity-80'
                  }`}
                  style={{ 
                    color: localBackgroundDesign 
                      ? (businessProfile?.primary_color || '#2563EB')
                      : applyCardTransparency(businessProfile?.card_bg || "#F9FAFB", businessProfile?.card_transparency ?? 1.0),
                    borderColor: !localBackgroundDesign 
                      ? applyCardTransparency(businessProfile?.card_bg || "#F9FAFB", businessProfile?.card_transparency ?? 1.0)
                      : undefined
                  }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Right Arrow */}
                <button 
                  className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all focus:outline-none ${
                    localBackgroundDesign 
                      ? 'bg-white hover:bg-gray-50' 
                      : 'border-2 hover:opacity-80'
                  }`}
                  style={{ 
                    color: localBackgroundDesign 
                      ? (businessProfile?.primary_color || '#2563EB')
                      : applyCardTransparency(businessProfile?.card_bg || "#F9FAFB", businessProfile?.card_transparency ?? 1.0),
                    borderColor: !localBackgroundDesign 
                      ? applyCardTransparency(businessProfile?.card_bg || "#F9FAFB", businessProfile?.card_transparency ?? 1.0)
                      : undefined
                  }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Carousel Card - Narrower design to match */}
                <div 
                  className={`rounded-lg p-2 mx-16 relative ${
                    localBackgroundDesign 
                      ? 'border border-gray-200' 
                      : ''
                  }`}
                  style={{ 
                    background: localBackgroundDesign 
                      ? applyCardTransparency(businessProfile?.card_bg || "#F9FAFB", businessProfile?.card_transparency ?? 1.0)
                      : 'transparent'
                  }}
                >
                  {/* Header with Inspiration centered */}
                  <div className="flex items-center justify-center mb-1">
                    <span 
                      className="text-xs tracking-wide font-medium"
                      style={{ 
                        color: localBackgroundDesign 
                          ? (businessProfile?.primary_color || '#2563EB')
                          : applyCardTransparency(businessProfile?.card_bg || "#F9FAFB", businessProfile?.card_transparency ?? 1.0)
                      }}
                    >
                      Inspiration
                    </span>
                  </div>

                  {/* Question - Compact, no quotes, no italics */}
                  <div 
                    className={`cursor-pointer transition-colors text-center mb-2 ${
                      localBackgroundDesign 
                        ? 'text-gray-700 hover:text-gray-900' 
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      fontSize: '1rem',
                      lineHeight: '1.5rem',
                      color: localBackgroundDesign 
                        ? undefined
                        : applyCardTransparency(businessProfile?.card_bg || "#F9FAFB", businessProfile?.card_transparency ?? 1.0)
                    }}
                  >
                    {replaceBusinessName(getExampleKickstarter())}
                  </div>

                  {/* View All centered below */}
                  <div className="flex items-center justify-center">
                    <button
                      className="text-[10px] font-medium hover:underline transition-colors focus:outline-none rounded px-1"
                      style={{ 
                        color: localBackgroundDesign 
                          ? (businessProfile?.primary_color || '#2563EB')
                          : applyCardTransparency(businessProfile?.card_bg || "#F9FAFB", businessProfile?.card_transparency ?? 1.0)
                      }}
                    >
                      View All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kickstarters Management Modal would be rendered here */}
      {showModal && (
        <KickstartersManagementModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          selectedKickstarters={selected}
          businessName={businessName}
          onSave={handleSaveKickstarters}
          allKickstarters={allKickstarters}
          loading={loading}
          onRefreshKickstarters={fetchKickstarters}
        />
      )}
    </div>
  );
}

 