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
  /** Business name for dynamic replacement */
  businessName?: string;
  /** Whether this is inherited from business level */
  isInherited?: boolean;
  /** Business-level settings for inheritance display */
  businessSettings?: {
    enabled: boolean;
    selectedKickstarters: string[];
  };
  /** Callback when the enabled state changes */
  onEnabledChange: (enabled: boolean) => void;
  /** Callback when selected kickstarters change */
  onKickstartersChange: (kickstarters: string[]) => void;
  /** Initial values for the component */
  initialData?: {
    kickstarters_enabled?: boolean;
    selected_kickstarters?: string[];
  };
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to use edit interface styling */
  editMode?: boolean;
}

export default function KickstartersFeature({
  enabled,
  selectedKickstarters = [],
  businessName = "Business Name",
  isInherited = false,
  businessSettings,
  onEnabledChange,
  onKickstartersChange,
  initialData,
  disabled = false,
  editMode = false,
}: KickstartersFeatureProps) {
  const supabase = createClient();
  
  // Initialize state from props and initialData
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [selected, setSelected] = useState<string[]>(selectedKickstarters);
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
            {isInherited && getInheritanceText() && (
              <div className="text-xs text-blue-600 italic mb-1">
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
      
      <div className="text-sm text-gray-700 mb-3 max-w-[85ch] px-2">
        Add a selection of questions that will inspire your client or customer to write an amazing review.
      </div>
      
      {isEnabled && (
        <div className="px-2 space-y-4">
          {/* Management Controls */}
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={handleManageKickstarters}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue-dark focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 transition-colors"
              disabled={disabled}
            >
              <FaCog className="w-4 h-4" />
              Manage Kickstarters
            </button>
          </div>

          {/* Example Implementation - Always Show */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-blue-900">
                  Example
                </div>
              </div>
              {/* Match current carousel design */}
              <div className="relative">
                {/* Left Arrow */}
                <button className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 text-gray-50 hover:text-gray-300 transition-colors focus:outline-none">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Right Arrow */}
                <button className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 text-gray-50 hover:text-gray-300 transition-colors focus:outline-none">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Carousel Card - Narrower design to match */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 mx-16 relative">
                  {/* Header with Inspiration centered and View All on right */}
                  <div className="relative flex items-center justify-center mb-1">
                    <span 
                      className="text-xs tracking-wide font-medium"
                      style={{ color: '#2563EB' }}
                    >
                      Inspiration
                    </span>
                    <button
                      className="absolute text-[10px] font-medium hover:underline transition-colors focus:outline-none rounded px-1"
                      style={{ 
                        color: '#2563EB',
                        right: '10px'
                      }}
                    >
                      View All
                    </button>
                  </div>

                  {/* Question - Compact, no quotes, no italics */}
                  <div className="text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition-colors leading-tight text-center mb-2">
                    {replaceBusinessName(getExampleKickstarter())}
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

 