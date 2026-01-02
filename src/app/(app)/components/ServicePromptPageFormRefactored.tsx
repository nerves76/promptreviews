/**
 * ServicePromptPageFormRefactored Component
 * 
 * A refactored version of ServicePromptPageForm that uses the new BasePromptPageForm
 * and shared feature components. This demonstrates the new architecture and shows
 * how much code can be reduced by using the shared components.
 * 
 * Features:
 * - Uses BasePromptPageForm for common functionality
 * - Only contains service-specific fields
 * - Much smaller and more maintainable
 * - Consistent behavior with other form types
 */

"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BasePromptPageForm from "./BasePromptPageForm";
import { Input } from "@/app/(app)/components/ui/input";
import { Textarea } from "@/app/(app)/components/ui/textarea";
import Icon from "@/components/Icon";

interface ServicePromptPageFormRefactoredProps {
  mode: "create" | "edit";
  initialData: any;
  onSave: (data: any) => void;
  onPublish?: (data: any) => void;
  pageTitle: string;
  supabase: any;
  businessProfile: any;
  isUniversal?: boolean;
  onPublishSuccess?: (slug: string) => void;
  campaignType: string;
  onGenerateReview?: (index: number) => void;
}

export default function ServicePromptPageFormRefactored({
  mode,
  initialData,
  onSave,
  onPublish,
  pageTitle,
  supabase,
  businessProfile,
  isUniversal = false,
  onPublishSuccess,
  campaignType,
  onGenerateReview,
}: ServicePromptPageFormRefactoredProps) {
  const router = useRouter();
  
  // Service-specific state
  const [servicesOffered, setServicesOffered] = useState<string[]>(
    initialData?.services_offered || []
  );
  const [featuresOrBenefits, setFeaturesOrBenefits] = useState<string[]>(
    initialData?.features_or_benefits || []
  );
  const [customerName, setCustomerName] = useState(initialData?.customer_name || "");
  const [customerEmail, setCustomerEmail] = useState(initialData?.customer_email || "");
  const [campaignName, setCampaignName] = useState(initialData?.campaign_name || "");

  // Update state when initialData changes
  useEffect(() => {
    if (initialData) {
      setServicesOffered(initialData.services_offered || []);
      setFeaturesOrBenefits(initialData.features_or_benefits || []);
      setCustomerName(initialData.customer_name || "");
      setCustomerEmail(initialData.customer_email || "");
      setCampaignName(initialData.campaign_name || "");
    }
  }, [initialData]);

  // Service-specific validation
  const validateServiceFields = (): string[] => {
    const errors: string[] = [];
    
    if (campaignType === "public" && !campaignName.trim()) {
      errors.push("Campaign name is required for public campaigns");
    }
    
    if (campaignType === "individual" && !customerName.trim()) {
      errors.push("Customer name is required for individual campaigns");
    }
    
    if (campaignType === "individual" && !customerEmail.trim()) {
      errors.push("Customer email is required for individual campaigns");
    }
    
    if (servicesOffered.length === 0) {
      errors.push("At least one service must be provided");
    }
    
    return errors;
  };

  // Enhanced save handler that includes service-specific data
  const handleSave = async (baseFormData: any) => {
    const serviceData = {
      ...baseFormData,
      services_offered: servicesOffered,
      features_or_benefits: featuresOrBenefits,
      customer_name: customerName,
      customer_email: customerEmail,
      campaign_name: campaignName,
      page_type: "service",
      campaign_type: campaignType,
    };

    // Add service-specific validation
    const serviceErrors = validateServiceFields();
    if (serviceErrors.length > 0) {
      throw new Error(serviceErrors.join(", "));
    }

    await onSave(serviceData);
  };

  // Enhanced publish handler
  const handlePublish = async (baseFormData: any) => {
    const serviceData = {
      ...baseFormData,
      services_offered: servicesOffered,
      features_or_benefits: featuresOrBenefits,
      customer_name: customerName,
      customer_email: customerEmail,
      campaign_name: campaignName,
      page_type: "service",
      campaign_type: campaignType,
    };

    // Add service-specific validation
    const serviceErrors = validateServiceFields();
    if (serviceErrors.length > 0) {
      throw new Error(serviceErrors.join(", "));
    }

    if (onPublish) {
      await onPublish(serviceData);
    }
  };

  // Add service to the list
  const addService = () => {
    setServicesOffered([...servicesOffered, ""]);
  };

  // Remove service from the list
  const removeService = (index: number) => {
    setServicesOffered(servicesOffered.filter((_, i) => i !== index));
  };

  // Update service in the list
  const updateService = (index: number, value: string) => {
    const newServices = [...servicesOffered];
    newServices[index] = value;
    setServicesOffered(newServices);
  };

  // Add feature/benefit to the list
  const addFeature = () => {
    setFeaturesOrBenefits([...featuresOrBenefits, ""]);
  };

  // Remove feature/benefit from the list
  const removeFeature = (index: number) => {
    setFeaturesOrBenefits(featuresOrBenefits.filter((_, i) => i !== index));
  };

  // Update feature/benefit in the list
  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...featuresOrBenefits];
    newFeatures[index] = value;
    setFeaturesOrBenefits(newFeatures);
  };

  return (
    <BasePromptPageForm
      mode={mode}
      initialData={initialData}
      onSave={handleSave}
      onPublish={handlePublish}
      pageTitle={pageTitle}
      supabase={supabase}
      businessProfile={businessProfile}
      isUniversal={isUniversal}
      onPublishSuccess={onPublishSuccess}
      campaignType={campaignType}
      onGenerateReview={onGenerateReview}
    >
      {/* Service-specific fields */}
      <div className="space-y-6">
        {/* Customer Details Section (for individual campaigns) */}
        {campaignType === "individual" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Icon name="FaCheckCircle" className="text-slate-blue text-lg" size={18} />
              <h3 className="text-lg font-semibold text-gray-900">
                Customer Details
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name
                </label>
                <Input
                  id="customer-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="block w-full"
                />
              </div>
              <div>
                <label htmlFor="customer-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Email
                </label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter customer email"
                  className="block w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Campaign Name Section (for public campaigns) */}
        {campaignType === "public" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Icon name="FaCog" className="text-slate-blue text-lg" size={18} />
              <h3 className="text-lg font-semibold text-gray-900">
                Campaign Name
              </h3>
            </div>
            <div>
              <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name
              </label>
              <Input
                id="campaign-name"
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
                className="block w-full"
              />
            </div>
          </div>
        )}

        {/* Services Provided Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Icon name="FaCog" className="text-slate-blue text-lg" size={18} />
            <h3 className="text-lg font-semibold text-gray-900">
              Services Provided
            </h3>
          </div>
          <div className="space-y-3">
            {servicesOffered.map((service, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Input
                  type="text"
                  value={service}
                  onChange={(e) => updateService(index, e.target.value)}
                  placeholder={`Service ${index + 1}`}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addService}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-slate-blue bg-slate-blue/10 hover:bg-slate-blue/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
            >
              Add Service
            </button>
          </div>
        </div>

        {/* Features or Benefits Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <svg className="w-5 h-5" style={{ color: "#2E4A7D" }}><use href="/icons-sprite.svg#FaBoxOpen" /></svg>
            <h3 className="text-lg font-semibold text-gray-900">
              Features or Benefits
            </h3>
          </div>
          <div className="space-y-3">
            {featuresOrBenefits.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Input
                  type="text"
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  placeholder={`Feature/Benefit ${index + 1}`}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addFeature}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-slate-blue bg-slate-blue/10 hover:bg-slate-blue/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
            >
              Add Feature/Benefit
            </button>
          </div>
        </div>
      </div>
    </BasePromptPageForm>
  );
} 