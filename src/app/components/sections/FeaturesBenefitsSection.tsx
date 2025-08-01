/**
 * FeaturesBenefitsSection component
 * 
 * Handles the features or benefits section with dynamic add/remove functionality.
 * Allows users to add multiple features/benefits for their product.
 */

"use client";
import React from "react";
import Icon from "@/components/Icon";
import RobotTooltip from "../RobotTooltip";

interface FeaturesBenefitsSectionProps {
  formData: any;
  onFormDataChange: (data: any) => void;
}

export default function FeaturesBenefitsSection({ 
  formData, 
  onFormDataChange 
}: FeaturesBenefitsSectionProps) {
  
  const updateFormData = (field: string, value: any) => {
    onFormDataChange({ [field]: value });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...(formData.features_or_benefits || [])];
    newFeatures[index] = value;
    updateFormData("features_or_benefits", newFeatures);
  };

  const removeFeature = (index: number) => {
    const newFeatures = (formData.features_or_benefits || []).filter((_: any, i: number) => i !== index);
    updateFormData("features_or_benefits", newFeatures);
  };

  const addFeature = () => {
    updateFormData("features_or_benefits", [
      ...(formData.features_or_benefits || []),
      "",
    ]);
  };

  return (
    <div className="custom-space-y">
      <div className="mt-8 mb-2 flex items-center gap-3">
        <Icon name="star" className="w-7 h-7 text-[#1A237E]" />
        <h2 className="text-2xl font-bold text-slate-blue flex items-center gap-1">
          Features or benefits
          <RobotTooltip text="This field is passed to AI for prompt generation." />
        </h2>
      </div>
      
      <div className="space-y-2">
        {(formData.features_or_benefits || [""]).map(
          (feature: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                className="w-full border px-3 py-2 rounded"
                value={feature}
                onChange={(e) => updateFeature(idx, e.target.value)}
                required
                placeholder="e.g., Long battery life"
              />
              {formData.features_or_benefits?.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFeature(idx)}
                  className="text-red-600 font-bold"
                >
                  &times;
                </button>
              )}
            </div>
          ),
        )}
        <button
          type="button"
          onClick={addFeature}
          className="text-blue-600 underline mt-2"
        >
          + Add Feature/Benefit
        </button>
      </div>
    </div>
  );
} 