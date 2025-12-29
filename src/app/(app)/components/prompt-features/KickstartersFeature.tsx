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
import Icon from "@/components/Icon";
import { createClient } from "@/auth/providers/supabase";
import KickstartersManagementModal from "./KickstartersManagementModal";

export interface Kickstarter {
  id: string;
  question: string;
  category: 'PROCESS' | 'EXPERIENCE' | 'OUTCOMES' | 'PEOPLE' | 'CUSTOM';
  is_default: boolean;
}

export interface KickstartersFeatureProps {
  /** Whether kickstarters are enabled */
  enabled: boolean;
  /** Array of selected kickstarter IDs */
  selectedKickstarters: string[];
  /** Array of custom kickstarters */
  customKickstarters?: Kickstarter[];
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
    customKickstarters?: Kickstarter[];
    backgroundDesign?: boolean;
  };
  /** Callback when the enabled state changes */
  onEnabledChange: (enabled: boolean) => void;
  /** Callback when selected kickstarters change */
  onKickstartersChange: (kickstarters: string[]) => void;
  /** Callback when custom kickstarters change */
  onCustomKickstartersChange?: (customKickstarters: Kickstarter[]) => void;
  /** Callback when background design changes (updates global business setting) */
  onBackgroundDesignChange?: (backgroundDesign: boolean) => void;
  /** Callback when kickstarters color changes (updates global business setting) */
  onKickstartersColorChange?: (color: string) => void;
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
    kickstarters_primary_color?: string;
    card_bg?: string;
    card_text?: string;
    card_transparency?: number;
    background_type?: string;
    gradient_start?: string;
    gradient_end?: string;
    background_color?: string;
  };
  /** Account ID for security and data isolation */
  accountId: string;
}

export default function KickstartersFeature({
  enabled,
  selectedKickstarters = [],
  customKickstarters = [],
  backgroundDesign = false,
  businessName = "Business Name",
  isInherited = false,
  businessSettings,
  onEnabledChange,
  onKickstartersChange,
  onCustomKickstartersChange,
  onBackgroundDesignChange,
  onKickstartersColorChange,
  initialData,
  disabled = false,
  editMode = false,
  businessProfile,
  accountId,
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
        background: businessProfile?.gradient_start || '#2E4A7D', // Use only the first gradient color
      };
    } else {
      return {
        background: businessProfile?.background_color || "#dbeafe", // Light blue fallback
      };
    }
  };
  
  // Local state management
  const [allKickstarters, setAllKickstarters] = useState<Kickstarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>(selectedKickstarters || []);
  const [showModal, setShowModal] = useState(false);
  const [localBackgroundDesign, setLocalBackgroundDesign] = useState(backgroundDesign);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [showViewAll, setShowViewAll] = useState(false);
  const [localKickstartersColor, setLocalKickstartersColor] = useState(
    businessProfile?.kickstarters_primary_color || businessProfile?.primary_color || '#2563EB'
  );

  // Initialize from prop only once, then use internal state
  useEffect(() => {
    if (selectedKickstarters && selectedKickstarters.length > 0) {
      setSelected(selectedKickstarters);
    }
  }, []); // Only run once on mount

  useEffect(() => {
    setLocalBackgroundDesign(backgroundDesign);
  }, [backgroundDesign]);

  // Reset preview index when selection changes
  useEffect(() => {
    setCurrentPreviewIndex(0);
  }, [selected]);

  // Initialize from initialData if provided (only once on mount)
  useEffect(() => {
    if (initialData) {
      if (initialData.selected_kickstarters !== undefined) {
        setSelected(initialData.selected_kickstarters || []);
      }
    }
  }, []); // Only run once on mount, don't sync with initialData changes

  // Fetch all kickstarters when modal opens
  // Fetch kickstarters on component mount
  useEffect(() => {
    fetchKickstarters();
  }, []);

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
    const currentEnabled = enabled ?? false;
    const newEnabled = !currentEnabled;
    onEnabledChange(newEnabled);
  };

  const handleManageKickstarters = () => {
    setShowModal(true);
  };

  const handleSaveKickstarters = (newSelected: string[], newCustomKickstarters?: Kickstarter[]) => {
    setSelected(newSelected);
    onKickstartersChange(newSelected);
    if (newCustomKickstarters && onCustomKickstartersChange) {
      onCustomKickstartersChange(newCustomKickstarters);
    }
    setShowModal(false);
  };

  // Preview navigation handlers
  const handlePreviousPreview = () => {
    if (!allKickstarters || allKickstarters.length === 0) return;
    setCurrentPreviewIndex(prev => 
      prev === 0 ? allKickstarters.length - 1 : prev - 1
    );
  };

  const handleNextPreview = () => {
    if (!allKickstarters || allKickstarters.length === 0) return;
    setCurrentPreviewIndex(prev => 
      (prev + 1) % allKickstarters.length
    );
  };

  // Get example kickstarter for preview
  const getExampleKickstarter = () => {
    // If no specific kickstarters are selected, use all available kickstarters
    if (!selected || selected.length === 0) {
      if (!allKickstarters || allKickstarters.length === 0) {
        return "What made the experience with [Business Name] feel simple or stress-free?";
      }
      // Use currentPreviewIndex for manual navigation (with bounds checking)
      const index = currentPreviewIndex % allKickstarters.length;
      const question = allKickstarters[index]?.question || "What made the experience with [Business Name] feel simple or stress-free?";
      return question;
    }
    
    if (!allKickstarters || allKickstarters.length === 0) {
      return "What made the experience with [Business Name] feel simple or stress-free?";
    }
    
    // Get the selected kickstarters from allKickstarters
    const selectedKickstarters = allKickstarters.filter(k => selected.includes(k.id));
    
    if (selectedKickstarters.length === 0) {
      return "What made the experience with [Business Name] feel simple or stress-free?";
    }
    
    // Use currentPreviewIndex to cycle through selected kickstarters
    const index = currentPreviewIndex % selectedKickstarters.length;
    const question = selectedKickstarters[index]?.question || "What made the experience with [Business Name] feel simple or stress-free?";
    return question;
  };

  const replaceBusinessName = (question: string) => {
    return question.replace(/\[Business Name\]/g, businessName);
  };

  const getInheritanceText = () => {
    if (!isInherited || !businessSettings) return null;
    
    if (businessSettings.enabled && businessSettings.selectedKickstarters && businessSettings.selectedKickstarters.length > 0) {
      return `Inheriting ${businessSettings.selectedKickstarters.length} kickstarters from business settings`;
    } else if (businessSettings.enabled) {
      return "Inheriting kickstarters from business settings (no specific selection)";
    } else {
      return "Business-level kickstarters are disabled";
    }
  };

  const currentEnabled = enabled ?? false;

  return (
    <div className={`${editMode ? 'rounded-lg p-2 sm:p-4 bg-blue-50 border border-blue-200 flex flex-col gap-4 shadow relative mb-4' : 'bg-white rounded-lg border border-gray-200 p-6 mb-6'}`}>
      <div className={`${editMode ? 'flex flex-row justify-between items-start px-2 sm:px-2 py-2' : 'flex items-center justify-between mb-4'}`}>
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Icon name="FaLightbulb" className={`${editMode ? 'w-7 h-7 text-slate-blue' : 'text-slate-blue text-lg'}`} size={editMode ? 28 : 18} />
            <h3 className={`${editMode ? 'text-2xl font-bold text-slate-blue' : 'text-lg font-semibold text-gray-900'}`}>
              Kickstarters
            </h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              (AKA Prompts)
            </span>
          </div>
          <div className={`${editMode ? 'text-sm text-gray-700 mt-[3px] ml-10' : 'text-sm text-gray-600'}`}>
            Kickstarter questions inspire your clients to write amazing reviews. All 40+ questions are included by default, or you can select specific ones using the Manage button below.
            {isInherited && getInheritanceText() && (
              <div className="text-xs text-blue-600 italic mt-1">
                {getInheritanceText()}
              </div>
            )}
          </div>
        </div>
        

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              currentEnabled ? "bg-slate-blue" : "bg-gray-200"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-pressed={currentEnabled}
            disabled={disabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                currentEnabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      
              {currentEnabled && (
        <div className="px-2 space-y-4">


          {/* Controls Row - Manage button and Background options */}
          <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleManageKickstarters}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                disabled={disabled}
              >
                <Icon name="FaCog" className="w-4 h-4" style={{ color: "#2E4A7D" }} size={16} />
                Manage
              </button>
              <span className="text-xs text-gray-500">
                {selected && selected.length > 0
                  ? `${selected.length} selected`
                  : 'All 40+ questions included'
                }
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Color Picker */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Color:</span>
                <input
                  type="color"
                  value={localKickstartersColor}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    setLocalKickstartersColor(newColor);
                    if (onKickstartersColorChange) {
                      onKickstartersColorChange(newColor);
                    }
                  }}
                  disabled={disabled}
                  className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                  title="Kickstarters primary color"
                />
              </div>

              {/* Background Toggle */}
              <div className="flex items-center gap-2">
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
          </div>

          <p className="text-xs text-gray-500 mb-4 text-right">
            Color and background settings affect all instances
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
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePreviousPreview();
                  }}
                  className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all focus:outline-none ${
                    localBackgroundDesign
                      ? 'bg-white hover:bg-gray-50'
                      : 'border-2 hover:opacity-80'
                  }`}
                  style={{
                    color: localKickstartersColor,
                    borderColor: !localBackgroundDesign
                      ? localKickstartersColor
                      : undefined
                  }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Right Arrow */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNextPreview();
                  }}
                  className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all focus:outline-none ${
                    localBackgroundDesign
                      ? 'bg-white hover:bg-gray-50'
                      : 'border-2 hover:opacity-80'
                  }`}
                  style={{
                    color: localKickstartersColor,
                    borderColor: !localBackgroundDesign
                      ? localKickstartersColor
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
                        color: localKickstartersColor
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
                        : localKickstartersColor
                    }}
                  >
                    {replaceBusinessName(getExampleKickstarter())}
                  </div>



                  {/* View All centered below */}
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setShowViewAll(true)}
                      className="text-[10px] font-medium hover:underline transition-colors focus:outline-none rounded px-1"
                      style={{
                        color: localKickstartersColor
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
          customKickstarters={customKickstarters}
          businessName={businessName}
          onSave={handleSaveKickstarters}
          allKickstarters={allKickstarters}
          loading={loading}
          onRefreshKickstarters={fetchKickstarters}
          accountId={accountId}
        />
      )}

      {/* View All Modal */}
      {showViewAll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">All Kickstarter Questions</h3>
              <button
                onClick={() => setShowViewAll(false)}
                className="text-gray-500 hover:text-gray-600 text-xl"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              {(selected && selected.length > 0 
                ? allKickstarters.filter(k => selected.includes(k.id))
                : allKickstarters
              ).map((kickstarter, index) => (
                <div key={kickstarter.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-medium text-gray-500 min-w-[2rem]">
                      {index + 1}.
                    </span>
                    <p className="text-sm text-gray-800">
                      {replaceBusinessName(kickstarter.question)}
                    </p>
                  </div>
                  {kickstarter.category && (
                    <div className="mt-2 ml-8">
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {kickstarter.category}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowViewAll(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

 