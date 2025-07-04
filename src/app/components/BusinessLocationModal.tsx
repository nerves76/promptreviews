/**
 * Business Location Modal Component
 * 
 * This component provides a modal interface for creating and editing business locations.
 * It handles all the location-specific fields including address, contact info, and AI training.
 */

"use client";

import React, { useState, useEffect } from 'react';
import { FaTimes, FaMapMarkerAlt, FaRobot, FaInfoCircle } from 'react-icons/fa';
import { BusinessLocation } from '@/types/business';
import { supabase } from '@/utils/supabaseClient';
import { getAccountIdForUser } from '@/utils/accountUtils';
import { canCreateLocation, getLocationLimit } from '@/utils/locationUtils';

interface BusinessLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: BusinessLocation) => void;
  location?: BusinessLocation | null;
  mode: 'create' | 'edit';
  accountPlan: string;
  currentLocationCount: number;
}

export default function BusinessLocationModal({
  isOpen,
  onClose,
  onSave,
  location,
  mode,
  accountPlan,
  currentLocationCount
}: BusinessLocationModalProps) {
  const [formData, setFormData] = useState<Partial<BusinessLocation>>({
    name: '',
    business_name: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    address_country: '',
    phone: '',
    email: '',
    website: '',
    business_description: '',
    unique_aspects: '',
    ai_dos: '',
    ai_donts: '',
    hours_of_operation: '',
    manager_name: '',
    manager_email: '',
    manager_phone: '',
    parking_info: '',
    accessibility_info: '',
    special_instructions: '',
    services_offered: [],
    review_platforms: [],
    primary_color: '',
    secondary_color: '',
    text_color: '',
    background_color: '',
    logo_url: '',
    custom_css: '',
    is_active: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && location) {
        setFormData(location);
      } else {
        // Reset form for create mode
        setFormData({
          name: '',
          business_name: '',
          address_street: '',
          address_city: '',
          address_state: '',
          address_zip: '',
          address_country: '',
          phone: '',
          email: '',
          website: '',
          business_description: '',
          unique_aspects: '',
          ai_dos: '',
          ai_donts: '',
          hours_of_operation: '',
          manager_name: '',
          manager_email: '',
          manager_phone: '',
          parking_info: '',
          accessibility_info: '',
          special_instructions: '',
          services_offered: [],
          review_platforms: [],
          primary_color: '',
          secondary_color: '',
          text_color: '',
          background_color: '',
          logo_url: '',
          custom_css: '',
          is_active: true
        });
      }
      setStep(1);
      setError(null);
    }
  }, [isOpen, location, mode]);

  const handleInputChange = (field: keyof BusinessLocation, value: any) => {
    setFormData((prev: Partial<BusinessLocation>) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name?.trim()) {
        throw new Error('Location name is required');
      }

      // Check tier limits for create mode
      if (mode === 'create' && !canCreateLocation(accountPlan, currentLocationCount)) {
        throw new Error(`Your ${accountPlan} plan allows up to ${getLocationLimit(accountPlan)} locations. Please upgrade to add more locations.`);
      }

      // Get user and account ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const accountId = await getAccountIdForUser(user.id, supabase);
      if (!accountId) throw new Error('Account not found');

      // Prepare location data
      const locationData = {
        ...formData,
        account_id: accountId,
        updated_at: new Date().toISOString()
      };

      let savedLocation: BusinessLocation;

      if (mode === 'create') {
        // Create new location
        const response = await fetch('/api/business-locations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(locationData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create location');
        }

        savedLocation = await response.json();
      } else {
        // Update existing location
        const response = await fetch(`/api/business-locations/${location!.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(locationData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update location');
        }

        savedLocation = await response.json();
      }

      onSave(savedLocation);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FaMapMarkerAlt className="w-6 h-6 text-slate-blue" />
        <h3 className="text-xl font-semibold text-slate-blue">Basic Information</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-blue focus:border-transparent"
            placeholder="e.g., Downtown Store, Main Campus"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name
          </label>
          <input
            type="text"
            value={formData.business_name || ''}
            onChange={(e) => handleInputChange('business_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-blue focus:border-transparent"
            placeholder="e.g., Acme Corp - Downtown"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Street Address
        </label>
        <input
          type="text"
          value={formData.address_street || ''}
          onChange={(e) => handleInputChange('address_street', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-blue focus:border-transparent"
          placeholder="123 Main St"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <input
            type="text"
            value={formData.address_city || ''}
            onChange={(e) => handleInputChange('address_city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-blue focus:border-transparent"
            placeholder="Seattle"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State
          </label>
          <input
            type="text"
            value={formData.address_state || ''}
            onChange={(e) => handleInputChange('address_state', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-blue focus:border-transparent"
            placeholder="WA"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ZIP Code
          </label>
          <input
            type="text"
            value={formData.address_zip || ''}
            onChange={(e) => handleInputChange('address_zip', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-blue focus:border-transparent"
            placeholder="98101"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-blue focus:border-transparent"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-blue focus:border-transparent"
            placeholder="location@business.com"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FaRobot className="w-6 h-6 text-slate-blue" />
        <h3 className="text-xl font-semibold text-slate-blue">AI Training & Business Details</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Description
        </label>
        <textarea
          value={formData.business_description || ''}
          onChange={(e) => handleInputChange('business_description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-blue focus:border-transparent"
          placeholder="Describe this specific location's business focus, services, and atmosphere..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Unique Aspects
        </label>
        <textarea
          value={formData.unique_aspects || ''}
          onChange={(e) => handleInputChange('unique_aspects', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-blue focus:border-transparent"
          placeholder="What makes this location special? Notable features, awards, specialties..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI Dos
          </label>
          <textarea
            value={formData.ai_dos || ''}
            onChange={(e) => handleInputChange('ai_dos', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-blue focus:border-transparent"
            placeholder="What should AI emphasize when generating content for this location?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI Don'ts
          </label>
          <textarea
            value={formData.ai_donts || ''}
            onChange={(e) => handleInputChange('ai_donts', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-blue focus:border-transparent"
            placeholder="What should AI avoid when generating content for this location?"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hours of Operation
        </label>
        <textarea
          value={formData.hours_of_operation || ''}
          onChange={(e) => handleInputChange('hours_of_operation', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-blue focus:border-transparent"
          placeholder="Mon-Fri: 9AM-5PM, Sat: 10AM-3PM, Sun: Closed"
        />
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-blue">
            {mode === 'create' ? 'Add Business Location' : 'Edit Business Location'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Step Indicators */}
          <div className="flex items-center mb-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-slate-blue' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 1 ? 'bg-slate-blue text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="font-medium">Basic Info</span>
            </div>
            <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? 'bg-slate-blue' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-slate-blue' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 2 ? 'bg-slate-blue text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="font-medium">AI Training</span>
            </div>
          </div>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 text-slate-blue hover:text-slate-blue/80 font-medium"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              
              {step < 2 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 font-medium"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Saving...' : mode === 'create' ? 'Create Location' : 'Update Location'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}