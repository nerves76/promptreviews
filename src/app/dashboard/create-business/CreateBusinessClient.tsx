"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/utils/authGuard";
import { FaStore } from "react-icons/fa";
import { getUserOrMock } from "@/utils/supabase";
import { useAdmin } from "@/contexts/AdminContext";
import SimpleBusinessForm from "../components/SimpleBusinessForm";
import AppLoader from "@/app/components/AppLoader";
import PageCard from "@/app/components/PageCard";
import WelcomePopup from "@/app/components/WelcomePopup";
import { supabase } from "@/utils/supabaseClient";
import { ensureAccountExists } from "@/utils/accountUtils";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import Image from "next/image";

export default function CreateBusinessClient() {
  // Use the singleton Supabase client instead of creating a new instance
  // This prevents "Multiple GoTrueClient instances" warnings and ensures proper session persistence

  useAuthGuard();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    industry: "",
    business_website: "",
    phone: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    country: "United States",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const router = useRouter();
  
  // Use the centralized admin context instead of local state
  const { isAdminUser, isLoading: adminLoading } = useAdmin();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler for the test welcome button
  const handleTestWelcome = () => {
    setShowWelcomePopup(true);
  };

  // Handler for closing the welcome popup
  const handleCloseWelcome = () => {
    setShowWelcomePopup(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const {
      data: { user },
      error: userError,
    } = await getUserOrMock(supabase);

    if (userError || !user) {
      setError("You must be signed in to create a business.");
      setLoading(false);
      return;
    }

    try {
      // Ensure account exists before creating business
      const accountCreated = await ensureAccountExists(user);
      
      if (!accountCreated) {
        setError("Failed to set up account. Please try again.");
        setLoading(false);
        return;
      }

      // Get account ID for the user
      const { getAccountIdForUser } = await import("@/utils/accountUtils");
      const accountId = await getAccountIdForUser(user.id);
      
      if (!accountId) {
        setError("Failed to get account information. Please try again.");
        setLoading(false);
        return;
      }

      // Create business
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .insert([
          {
            account_id: accountId,
            name: formData.name,
            description: formData.description,
            industry: formData.industry,
            business_website: formData.business_website,
            phone: formData.phone,
            address_street: formData.address_street,
            address_city: formData.address_city,
            address_state: formData.address_state,
            address_zip: formData.address_zip,
            country: formData.country,
          },
        ])
        .select()
        .single();

      if (businessError) {
        console.error("Business creation error:", businessError);
        setError("Failed to create business. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess("Business created successfully! Redirecting to dashboard...");
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);

    } catch (err) {
      console.error("Error creating business:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Ensure no invisible characters or syntax issues before return
  return (
    <div className="min-h-screen flex flex-col justify-start px-4 sm:px-0">
      {/* Welcome message for new users */}
      <div className="flex justify-center items-center pt-12 pb-6">
        <div className="max-w-2xl w-full bg-white shadow-lg rounded-lg p-6 border-2 border-slate-500">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/images/prompty-catching-stars.png"
                alt="Prompty catching stars"
                width={120}
                height={120}
                className="rounded-lg"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to PromptReviews! 🎉</h2>
            <p className="text-gray-600 mb-6">
              We're excited to help you get more reviews for your business. Let's start by setting up your basic business information.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>What's next?</strong> After you create your business profile, you'll be able to:
              </p>
              <ul className="text-blue-700 text-sm mt-2 space-y-1">
                <li>• Create review collection widgets for your website</li>
                <li>• Upload your customer contact list</li>
                <li>• Generate beautiful review pages</li>
                <li>• Track your review performance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Business Creation Form */}
      <div className="flex justify-center items-start pb-8">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Business Information</CardTitle>
            <p className="text-gray-600">Tell us about your business to get started</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Business Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Your Business Name"
                  />
                </div>

                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={formData.industry} onValueChange={(value) => handleSelectChange("industry", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant & Food</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="services">Professional Services</SelectItem>
                      <SelectItem value="automotive">Automotive</SelectItem>
                      <SelectItem value="beauty">Beauty & Wellness</SelectItem>
                      <SelectItem value="fitness">Fitness & Recreation</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of your business"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business_website">Website</Label>
                  <Input
                    id="business_website"
                    name="business_website"
                    type="url"
                    value={formData.business_website}
                    onChange={handleInputChange}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address_street">Address</Label>
                <Input
                  id="address_street"
                  name="address_street"
                  value={formData.address_street}
                  onChange={handleInputChange}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="address_city">City</Label>
                  <Input
                    id="address_city"
                    name="address_city"
                    value={formData.address_city}
                    onChange={handleInputChange}
                    placeholder="City"
                  />
                </div>

                <div>
                  <Label htmlFor="address_state">State</Label>
                  <Input
                    id="address_state"
                    name="address_state"
                    value={formData.address_state}
                    onChange={handleInputChange}
                    placeholder="State"
                  />
                </div>

                <div>
                  <Label htmlFor="address_zip">ZIP Code</Label>
                  <Input
                    id="address_zip"
                    name="address_zip"
                    value={formData.address_zip}
                    onChange={handleInputChange}
                    placeholder="12345"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-slate-600 hover:bg-slate-700"
                >
                  {loading ? "Creating..." : "Create Business"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {showWelcomePopup && (
        <WelcomePopup
          isOpen={showWelcomePopup}
          onClose={handleCloseWelcome}
          title="Oh hi there—I'm Prompty!"
          message={`Welcome to Prompt Reviews!

Did you know you're a miracle? Carl Sagan said it best:
"The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself."

Beautiful right! There is a flaming gas giant in you too! Wait, that didn't come out right . . . Anyway, I am here to help you get the stars you deserve—on Google, Facebook, TripAdvisor, Clutch—you name it.

Here's your first tip: [icon] <----Click here

OK, that's it for now—let's go get some stars! 🌟`}
          imageUrl="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompty-600kb.png"
          imageAlt="Prompty - Get Reviews"
          buttonText="Let's Go Get Some Stars! 🌟"
          onButtonClick={handleCloseWelcome}
        />
      )}
    </div>
  );
}