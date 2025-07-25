/**
 * Service Items Editor Component
 * Handles editing of services and products for Google Business Profile
 */

'use client';

import React, { useState } from 'react';
import { FaStore, FaTimes, FaRobot } from 'react-icons/fa';

interface ServiceItem {
  name: string;
  description?: string;
}

interface ServiceItemsEditorProps {
  serviceItems: ServiceItem[];
  onServiceItemsChange: (items: ServiceItem[]) => void;
  selectedLocationCount: number;
  detailsLoaded: boolean;
  isLoadingDetails: boolean;
  detailsError: string | null;
}

export default function ServiceItemsEditor({
  serviceItems,
  onServiceItemsChange,
  selectedLocationCount,
  detailsLoaded,
  isLoadingDetails,
  detailsError
}: ServiceItemsEditorProps) {
  
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  
  const addServiceItem = () => {
    const newService: ServiceItem = {
      name: '',
      description: ''
    };
    onServiceItemsChange([...serviceItems, newService]);
  };

  const updateServiceItem = (index: number, field: 'name' | 'description', value: string) => {
    const updated = [...serviceItems];
    updated[index] = { ...updated[index], [field]: value };
    onServiceItemsChange(updated);
  };

  const removeServiceItem = (index: number) => {
    const updated = serviceItems.filter((_, i) => i !== index);
    onServiceItemsChange(updated);
  };

  const generateServiceDescription = async (index: number, serviceName: string) => {
    if (!serviceName.trim()) return;
    
    setGeneratingIndex(index);
    
    try {
      const response = await fetch('/api/ai/google-business/generate-service-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceName: serviceName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate description');
      }

      const data = await response.json();
      
      if (data.success && data.description) {
        updateServiceItem(index, 'description', data.description);
      } else {
        throw new Error('Invalid response from AI service');
      }
      
    } catch (error) {
      console.error('Error generating service description:', error);
      // Could add a toast notification here if needed
    } finally {
      setGeneratingIndex(null);
    }
  };

  const generateServiceDescription = async (index: number, serviceName: string) => {
    if (!serviceName.trim()) {
      alert('Please enter a service name first');
      return;
    }

    setGeneratingIndex(index);
    
    try {
      const response = await fetch('/api/ai/google-business/generate-service-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceName: serviceName.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate description');
      }

      const data = await response.json();
      
      if (data.success && data.descriptions) {
        // Use the medium length description as default
        const description = data.descriptions.medium || data.descriptions.short || data.descriptions.long;
        updateServiceItem(index, 'description', description);
      } else {
        throw new Error(data.error || 'Failed to generate description');
      }
    } catch (error) {
      console.error('Error generating service description:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate description. Please try again.');
    } finally {
      setGeneratingIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FaStore className="w-5 h-5 text-slate-blue" />
          <h4 className="text-md font-medium text-gray-900">Services & products</h4>
        </div>
        {/* Only show add button when details are loaded or for multi-location */}
        {(detailsLoaded || selectedLocationCount > 1) && (
          <button
            type="button"
            onClick={addServiceItem}
            className="text-sm text-slate-blue hover:text-slate-blue-dark font-medium"
          >
            + Add service
          </button>
        )}
      </div>

      {/* Services Content */}
      {!isLoadingDetails && !detailsError && (
        <>
          {selectedLocationCount > 1 && serviceItems.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">No services or products added yet.</p>
              <p className="text-xs text-gray-500 mt-1">
                Click "+ Add Service" to add services that apply to all selected locations.
              </p>
            </div>
          )}
          
          {selectedLocationCount === 1 && !detailsLoaded && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Services and products not yet loaded.</p>
              <p className="text-xs text-gray-500 mt-1">
                Click "Load Business Info" above to fetch your current services.
              </p>
            </div>
          )}
          
          {(detailsLoaded || selectedLocationCount > 1) && serviceItems.length === 0 && selectedLocationCount === 1 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">No services or products found for this location.</p>
              <p className="text-xs text-gray-500 mt-1">
                Click "+ Add Service" to add services to help customers understand what you offer.
              </p>
            </div>
          )}
        </>
      )}

      {/* Service Items List */}
      {serviceItems.length > 0 && (
        <div className="space-y-3">
          {serviceItems.map((service, index) => (
            <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={service.name || ''}
                    onChange={(e) => updateServiceItem(index, 'name', e.target.value)}
                    placeholder="Service or product name"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeServiceItem(index)}
                    className="ml-2 text-red-600 hover:text-red-800 p-1"
                    title="Remove service"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    value={service.description || ''}
                    onChange={(e) => updateServiceItem(index, 'description', e.target.value)}
                    placeholder="Description of this service or product (optional)"
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => generateServiceDescription(index, service.name)}
                    disabled={generatingIndex === index || !service.name.trim()}
                    className="absolute right-2 top-2 p-1 text-slate-blue hover:text-slate-blue-dark disabled:text-gray-400 disabled:cursor-not-allowed"
                    title="Generate AI description"
                  >
                    {generatingIndex === index ? (
                      <div className="animate-spin w-4 h-4 border-2 border-slate-blue border-t-transparent rounded-full"></div>
                    ) : (
                      <FaRobot className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        {selectedLocationCount === 1 
          ? "List the main services or products you offer. This helps customers understand your business." 
          : `Services will be applied to all ${selectedLocationCount} selected locations.`
        }
      </p>
    </div>
  );
} 