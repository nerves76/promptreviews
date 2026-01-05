/**
 * FunFactsFeature Component
 *
 * A reusable component for the fun facts feature that displays business
 * information as key-value pairs on prompt pages.
 *
 * Features:
 * - Toggle to enable/disable fun facts display
 * - Management modal for creating and selecting facts
 * - Preview of selected facts
 * - Inheritance from business-level settings
 */

"use client";
import React, { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import FunFactsManagementModal from "./FunFactsManagementModal";
import { FunFact } from "@/types/funFacts";
import { apiClient } from "@/utils/apiClient";

export interface FunFactsFeatureProps {
  /** Whether fun facts are enabled */
  enabled: boolean;
  /** Array of selected fun fact IDs */
  selectedFactIds: string[];
  /** All fun facts in the account library */
  allFacts: FunFact[];
  /** Business name for context */
  businessName?: string;
  /** Whether this is inherited from business level */
  isInherited?: boolean;
  /** Business-level settings for inheritance display */
  businessSettings?: {
    enabled: boolean;
    selectedFactIds: string[];
    allFacts: FunFact[];
  };
  /** Callback when the enabled state changes */
  onEnabledChange: (enabled: boolean) => void;
  /** Callback when selected facts change */
  onSelectedChange: (factIds: string[]) => void;
  /** Callback when the facts library changes */
  onFactsChange: (facts: FunFact[]) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to use edit interface styling */
  editMode?: boolean;
  /** Account ID for security and data isolation */
  accountId: string;
}

export default function FunFactsFeature({
  enabled,
  selectedFactIds = [],
  allFacts = [],
  businessName = "Business Name",
  isInherited = false,
  businessSettings,
  onEnabledChange,
  onSelectedChange,
  onFactsChange,
  disabled = false,
  editMode = false,
  accountId,
}: FunFactsFeatureProps) {
  // Ensure we always have arrays, even if null is passed
  const safeAllFacts = allFacts || [];
  const safeSelectedFactIds = selectedFactIds || [];

  const [localFacts, setLocalFacts] = useState<FunFact[]>(safeAllFacts);
  const [localSelected, setLocalSelected] = useState<string[]>(safeSelectedFactIds);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Sync with props
  useEffect(() => {
    setLocalFacts(allFacts || []);
  }, [allFacts]);

  useEffect(() => {
    setLocalSelected(selectedFactIds || []);
  }, [selectedFactIds]);

  // Fetch facts from API if not provided
  useEffect(() => {
    if (accountId && localFacts.length === 0 && !loading) {
      fetchFacts();
    }
  }, [accountId]);

  const fetchFacts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ facts: FunFact[] }>("/fun-facts");
      setLocalFacts(response.facts);
      onFactsChange(response.facts);
    } catch (error) {
      console.error("[FunFactsFeature] Error fetching facts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalSave = (selectedIds: string[], updatedFacts: FunFact[]) => {
    setLocalSelected(selectedIds);
    setLocalFacts(updatedFacts);
    onSelectedChange(selectedIds);
    onFactsChange(updatedFacts);
  };

  // Memoize selected facts with defensive null checks
  const selectedFacts = React.useMemo(() => {
    const facts = localFacts ?? [];
    const selected = localSelected ?? [];
    if (!Array.isArray(facts) || !Array.isArray(selected)) return [];
    return facts.filter((f) => f?.id && selected.includes(f.id));
  }, [localFacts, localSelected]);

  return (
    <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Icon name="FaLightbulb" className="text-amber-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Fun facts</h3>
            <p className="text-sm text-gray-600">
              Display interesting facts about your business
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={disabled}
          onClick={() => onEnabledChange(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 ${
            enabled ? "bg-slate-blue" : "bg-gray-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Inheritance Badge */}
      {isInherited && (
        <div className="mb-4 flex items-center gap-2 text-sm text-amber-700">
          <Icon name="FaInfoCircle" size={14} />
          <span>Using account-level settings. Toggle to override.</span>
        </div>
      )}

      {/* Content when enabled */}
      {enabled && (
        <div className="space-y-4">
          {/* Manage Button */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            disabled={disabled}
            className="w-full px-4 py-2.5 border border-amber-300 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Icon name="FaCog" size={14} />
            <span>Manage fun facts</span>
            {localSelected && localSelected.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-amber-200 rounded-full text-xs">
                {localSelected.length} selected
              </span>
            )}
          </button>

          {/* Preview of Selected Facts */}
          {selectedFacts.length > 0 && (
            <div className="bg-white rounded-lg border border-amber-200 p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Preview
              </h4>
              <div className="space-y-2">
                {selectedFacts.slice(0, 3).map((fact) => (
                  <div
                    key={fact.id}
                    className="flex justify-between py-1.5 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm font-medium text-gray-600">
                      {fact.label}
                    </span>
                    <span className="text-sm text-gray-800">{fact.value}</span>
                  </div>
                ))}
                {selectedFacts.length > 3 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    +{selectedFacts.length - 3} more facts
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {localFacts.length === 0 && !loading && (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No fun facts created yet.</p>
              <p className="text-xs mt-1">
                Click "Manage fun facts" to add your first fact.
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Icon name="FaSpinner" className="animate-spin text-amber-600" size={20} />
              <span className="ml-2 text-sm text-gray-600">Loading facts...</span>
            </div>
          )}
        </div>
      )}

      {/* Management Modal */}
      <FunFactsManagementModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        allFacts={localFacts}
        selectedFactIds={localSelected}
        onSave={handleModalSave}
        loading={loading}
        accountId={accountId}
      />
    </div>
  );
}
