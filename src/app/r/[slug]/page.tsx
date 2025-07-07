"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AppLoader from "@/app/components/AppLoader";
import BusinessInfoCard from "./components/BusinessInfoCard";
import ProductModule from "./components/ProductModule";

interface BusinessProfile {
  business_name?: string;
  logo_url?: string | null;
  primary_font?: string;
  secondary_font?: string;
  primary_color?: string;
  card_bg?: string;
  card_text?: string;
  card_transparency?: number;
  address_city?: string;
  address_state?: string;
}

interface PromptPage {
  review_type?: string;
  product_name?: string;
  product_photo?: string;
  product_description?: string;
  features_or_benefits?: string[];
}

export default function PromptPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({});
  const [promptPage, setPromptPage] = useState<PromptPage>({});
  const params = useParams();
  const slug = params?.slug as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!slug) {
          setError("Invalid page URL");
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/prompt-pages/${slug}`);
        if (!response.ok) {
          throw new Error("Failed to load page");
        }

        const data = await response.json();
        setBusinessProfile(data.businessProfile || {});
        setPromptPage(data.promptPage || {});
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load page");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader variant="centered" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <div className="min-h-screen flex justify-center items-start">
        <div className="relative w-full">
          <div className="max-w-[1000px] w-full mx-auto px-4">
            {/* Business Info */}
            <BusinessInfoCard businessProfile={businessProfile} />
            
            {/* Product Module (if product type) */}
            {promptPage.review_type === "product" && (
              <ProductModule 
                promptPage={promptPage} 
                businessProfile={businessProfile}
              />
            )}
            
            {/* Review Platform Cards - Placeholder for now */}
            <div className="mt-8 bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Leave a Review
              </h2>
              <p className="text-gray-600">
                Review platform functionality will be restored soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
