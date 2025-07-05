// -----------------------------------------------------------------------------
// Location-Specific Prompt Page Edit Screen
// This file implements the edit UI for location-specific prompt pages.
// It uses the same 2-step wizard interface as the creation modal for consistency.
// -----------------------------------------------------------------------------

"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaMapMarkerAlt } from "react-icons/fa";
import PageCard from "@/app/components/PageCard";
import { supabase } from "@/utils/supabaseClient";
import AppLoader from "@/app/components/AppLoader";
import { getAccountIdForUser } from "@/utils/accountUtils";
import { BusinessLocation } from "@/types/business";
import { formatLocationAddress, getLocationDisplayName } from "@/utils/locationUtils";
import BusinessLocationModal from "@/app/components/BusinessLocationModal";

export default function EditLocationPromptPage() {
  const params = useParams();
  const router = useRouter();
  const locationId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<BusinessLocation | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");
        
        const accountId = await getAccountIdForUser(user.id, supabase);
        if (!accountId) throw new Error("No account found");

        // Fetch business profile
        const { data: businessData } = await supabase
          .from("businesses")
          .select("*")
          .eq("account_id", accountId)
          .single();
        setBusiness(businessData);

        // Fetch location data
        const response = await fetch(`/api/business-locations/${locationId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch location");
        }
        const { location: locationData } = await response.json();
        setLocation(locationData);

      } catch (err) {
        console.error("Error loading location:", err);
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [locationId]);

  const handleUpdateLocation = async (locationData: Partial<BusinessLocation>) => {
    try {
      const response = await fetch(`/api/business-locations/${locationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      // Redirect back to prompt pages
      router.push('/prompt-pages');
    } catch (err) {
      console.error('Error updating location:', err);
      alert('Failed to update location: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  if (error || !location || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Failed to load location"}</p>
          <button
            onClick={() => router.push("/prompt-pages")}
            className="text-slate-blue underline"
          >
            Back to Prompt Pages
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageCard 
        icon={<FaMapMarkerAlt className="w-8 h-8 text-slate-blue" />}
      >
        <h1 className="text-3xl font-bold text-slate-blue mb-2">
          Edit Location
        </h1>
        
        {/* Location Info Banner */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-1">
            {getLocationDisplayName(location)}
          </h2>
          <p className="text-sm text-gray-600">
            {formatLocationAddress(location)}
          </p>
        </div>

        <p className="text-gray-600 mb-8">
          Edit your location information and prompt page settings using the same interface as creation.
        </p>

        {/* Edit Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="bg-slate-blue text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-slate-blue/90 transition"
          >
            Edit Location
          </button>
        </div>
      </PageCard>

      {/* Edit Modal */}
      {showEditModal && (
        <BusinessLocationModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdateLocation}
          location={location}
          canCreateMore={true} // Not relevant for editing
          currentCount={0} // Not relevant for editing
          maxLocations={0} // Not relevant for editing
          businessLogoUrl={business?.logo_url || null}
          businessReviewPlatforms={business?.review_platforms || []}
        />
      )}
    </>
  );
} 