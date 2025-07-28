/**
 * EmployeePromptPageForm component
 * 
 * Handles the employee-specific prompt page form with all its sections:
 * - Customer details (for individual campaigns)
 * - Campaign name (for public campaigns)  
 * - Employee information (name, pronouns, headshot, position, etc.)
 * - Review platforms
 * - Additional settings (offers, notes, emoji sentiment, etc.)
 */

"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CustomerDetailsSection from "./sections/CustomerDetailsSection";
import ReviewWriteSection from "../dashboard/edit-prompt-page/components/ReviewWriteSection";
import OfferSection from "../dashboard/edit-prompt-page/components/OfferSection";
import EmojiSentimentSection from "../dashboard/edit-prompt-page/components/EmojiSentimentSection";
import DisableAIGenerationSection from "./DisableAIGenerationSection";
import FallingStarsSection from "@/app/components/FallingStarsSection";
import { useFallingStars } from "@/hooks/useFallingStars";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import SectionHeader from "./SectionHeader";
import { TopNavigation, BottomNavigation } from "./sections/StepNavigation";
import { generateContextualReview } from "../../utils/aiReviewGeneration";
import {
  FaInfoCircle,
  FaStar,
  FaGift,
  FaSmile,
  FaUser,
  FaPlus,
  FaTrash,
  FaStickyNote,
  FaCamera,
  FaMapMarkerAlt,
  FaRobot,
} from "react-icons/fa";


/**
 * EmployeePromptPageForm component
 *
 * Purpose: Handles the creation and editing of employee-specific prompt pages.
 * This component allows businesses to create review pages focused on individual employees
 * to inspire team competition and showcase team members.
 */

interface EmployeePromptPageFormProps {
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

export default function EmployeePromptPageForm({
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
}: EmployeePromptPageFormProps) {
  const router = useRouter();
  
  // Initialize form data state from initialData with safety checks
  const safeInitialData = {
    ...initialData,
    review_platforms: Array.isArray(initialData.review_platforms) ? initialData.review_platforms : [],
    fallingEnabled: initialData.fallingEnabled ?? initialData.falling_enabled ?? true,
    show_friendly_note: initialData.show_friendly_note ?? false,
    // Offer fields
    offer_enabled: initialData.offer_enabled ?? false,
    offer_title: initialData.offer_title || '',
    offer_body: initialData.offer_body || '',
    offer_url: initialData.offer_url || '',
    // Employee-specific fields (using emp_ prefix)
    emp_first_name: initialData.emp_first_name || '',
    emp_last_name: initialData.emp_last_name || '',
    emp_pronouns: initialData.emp_pronouns || '',
    emp_headshot_url: initialData.emp_headshot_url || '',
    emp_position: initialData.emp_position || '',
    emp_location: initialData.emp_location || '',
    emp_years_at_business: initialData.emp_years_at_business || '',
    emp_bio: initialData.emp_bio || '',
    emp_fun_facts: Array.isArray(initialData.emp_fun_facts) ? initialData.emp_fun_facts : [''],
    emp_skills: Array.isArray(initialData.emp_skills) ? initialData.emp_skills : [''],
    emp_review_guidance: initialData.emp_review_guidance || '',
  };
  
  const [formData, setFormData] = useState(safeInitialData);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [headshotUploading, setHeadshotUploading] = useState(false);
  
  // AI settings state
  const [aiGenerationEnabled, setAiGenerationEnabled] = useState(
    initialData?.aiButtonEnabled !== false
  );
  const [fixGrammarEnabled, setFixGrammarEnabled] = useState(
    initialData?.fix_grammar_enabled !== false
  );

  // Initialize form data only once on mount or when initialData changes significantly
  useEffect(() => {
    const isInitialLoad = !formData || Object.keys(formData).length === 0;
    const isDifferentRecord = initialData?.id && formData?.id && initialData.id !== formData.id;
    
    if (!isSaving && initialData && (isInitialLoad || isDifferentRecord)) {
      setFormData(safeInitialData);
    }
  }, [initialData, isSaving]);

  // Form data update helper
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle headshot upload
  const handleHeadshotUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !supabase) return;

    setHeadshotUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `employee-headshots/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-assets')
        .getPublicUrl(filePath);

              updateFormData('emp_headshot_url', publicUrl);
    } catch (error) {
      console.error('Error uploading headshot:', error);
      setFormError('Failed to upload headshot');
    } finally {
      setHeadshotUploading(false);
    }
  };

  // Handle array field updates (fun facts, skills)
  const updateArrayField = (fieldName: string, index: number, value: string) => {
    const currentArray = formData[fieldName] || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    updateFormData(fieldName, newArray);
  };

  const addArrayItem = (fieldName: string) => {
    const currentArray = formData[fieldName] || [];
    updateFormData(fieldName, [...currentArray, '']);
  };

  const removeArrayItem = (fieldName: string, index: number) => {
    const currentArray = formData[fieldName] || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    updateFormData(fieldName, newArray);
  };

  // Generate AI review with employee context
  const handleGenerateAIReview = async (idx: number) => {
    if (!businessProfile) {
      console.error("Business profile not loaded");
      return;
    }

    const platforms = formData.review_platforms || [];
    if (!platforms[idx]) {
      console.error("Platform not found at index", idx);
      return;
    }

    const platform = platforms[idx];

    // Create comprehensive employee page context
    const employeePageData = {
      review_type: 'employee',
      employee_name: `${formData.emp_first_name} ${formData.emp_last_name}`.trim(),
      employee_position: formData.emp_position,
      employee_location: formData.emp_location,
      employee_years_at_business: formData.emp_years_at_business,
      employee_skills: formData.emp_skills?.filter(skill => skill.trim()),
      employee_review_guidance: formData.emp_review_guidance,
      client_name: formData.first_name || '',
      client_role: formData.role || '',
      friendly_note: formData.friendly_note || '',
    };

    try {
      const generatedReview = await generateContextualReview(
        businessProfile,
        employeePageData,
        platform.name
      );

      const updatedPlatforms = [...platforms];
      updatedPlatforms[idx] = {
        ...updatedPlatforms[idx],
        review_text: generatedReview,
      };
      updateFormData('review_platforms', updatedPlatforms);
    } catch (error) {
      console.error("Error generating AI review:", error);
      alert("Failed to generate AI review. Please try again.");
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = [];
    
    if (!formData.emp_first_name?.trim()) {
      errors.push('Employee first name is required');
    }
    
    if (!formData.emp_last_name?.trim()) {
      errors.push('Employee last name is required');
    }
    
    if (!formData.emp_position?.trim()) {
      errors.push('Employee position/job title is required');
    }
    
    if (formData.campaign_type === 'public' && !formData.name?.trim()) {
      errors.push('Prompt page name is required for public campaigns');
    }
    
    if (formData.campaign_type === 'individual') {
      if (!formData.first_name?.trim()) {
        errors.push('Customer first name is required for individual campaigns');
      }
      if (!formData.last_name?.trim()) {
        errors.push('Customer last name is required for individual campaigns');
      }
    }
    
    return errors;
  };

  // Handle form submission
  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    setFormError(null);
    
    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setFormError(errors.join('. '));
      setIsSaving(false);
      return;
    }
    
    try {
      const saveData = {
        ...formData,
        aiButtonEnabled: aiGenerationEnabled,
        fix_grammar_enabled: fixGrammarEnabled,
      };
      const result = await onSave(saveData);
      if (onPublishSuccess && result?.slug) {
        onPublishSuccess(result.slug);
      }
    } catch (error) {
      console.error('Error saving employee prompt page:', error);
      setFormError(
        error instanceof Error 
          ? error.message 
          : 'Failed to save employee prompt page. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Falling stars setup
  const { startCelebration, submitted } = useFallingStars();

  return (
    <>
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-blue">
          {mode === 'create' ? 'Create' : 'Edit'} Employee Prompt Page
        </h1>
        <p className="text-gray-600 mt-2">
          {mode === 'create' 
            ? 'Create a review page to showcase individual team members and inspire competition.'
            : 'Edit your employee spotlight page settings and content.'
          }
        </p>
      </div>

      {/* Falling stars animation */}
      {submitted && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {[...Array(40)].map((_, i) => {
            const left = Math.random() * 98 + Math.random() * 2;
            const animationDelay = Math.random() * 2;
            const animationDuration = 3 + Math.random() * 2;
            return (
              <div
                key={i}
                className="absolute text-yellow-400 text-2xl animate-bounce"
                style={{
                  left: `${left}%`,
                  animationDelay: `${animationDelay}s`,
                  animationDuration: `${animationDuration}s`,
                  top: "-50px",
                }}
              >
                ⭐
              </div>
            );
          })}
        </div>
      )}

      {/* Error Display */}
      {formError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="text-sm text-red-700">
              <strong>Please fix the following errors:</strong>
              <div className="mt-1">{formError}</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">
        {/* Top Navigation */}
        <TopNavigation
          handleClick={handleSave}
          isSaving={isSaving}
        />

        {/* Campaign Name (Public campaigns only) */}
        {campaignType === 'public' && (
          <div className="mb-6">
            <div className="mb-6 flex items-center gap-3">
              <FaUser className="w-7 h-7 text-slate-blue" />
              <h2 className="text-2xl font-bold text-slate-blue">
                Prompt page name
              </h2>
            </div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Campaign name <span className="text-red-600">(required)</span>
            </label>
            <Input
              type="text"
              id="name"
              placeholder="Employee spotlight page for [Employee Name]"
              value={formData.name || ''}
              onChange={(e) => updateFormData('name', e.target.value)}
              className="mt-1 block w-full max-w-md"
              required={campaignType === 'public'}
            />
          </div>
        )}

        {/* Customer Details (Individual campaigns only) */}
        {campaignType === 'individual' && (
          <CustomerDetailsSection
            formData={formData}
            onFormDataChange={(updates) => {
              if (typeof updates === 'function') {
                setFormData(updates);
              } else {
                setFormData(prev => ({ ...prev, ...updates }));
              }
            }}
            campaignType={campaignType}
          />
        )}

        {/* Employee Information */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <FaUser className="w-5 h-5 text-[#1A237E]" />
            <h2 className="text-xl font-semibold text-slate-blue">
              Employee Information
            </h2>
          </div>
          <div className="mb-4">
            <p className="text-gray-600">Provide details about the employee this page is showcasing.</p>
          </div>
          
          <div className="space-y-6">
            {/* Name and Pronouns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-600">(required)</span>
                  <div className="group relative">
                    <FaRobot className="w-4 h-4 text-blue-500 cursor-help" />
                    <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      AI uses this for personalized review suggestions
                    </div>
                  </div>
                </label>
                <Input
                  placeholder="First name"
                  value={formData.emp_first_name}
                  onChange={(e) => updateFormData('emp_first_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-600">(required)</span>
                  <div className="group relative">
                    <FaRobot className="w-4 h-4 text-blue-500 cursor-help" />
                    <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      AI uses this for personalized review suggestions
                    </div>
                  </div>
                </label>
                <Input
                  placeholder="Last name"
                  value={formData.emp_last_name}
                  onChange={(e) => updateFormData('emp_last_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pronouns
                </label>
                <Input
                  placeholder="they/them, she/her, he/him"
                  value={formData.emp_pronouns}
                  onChange={(e) => updateFormData('emp_pronouns', e.target.value)}
                />
              </div>
            </div>

            {/* Headshot Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Headshot
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Upload a professional photo that can replace your business logo on this page.
              </p>
              <div className="flex items-center gap-4">
                {formData.emp_headshot_url && (
                  <img
                    src={formData.emp_headshot_url}
                    alt="Employee headshot"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeadshotUpload}
                    className="hidden"
                    id="headshot-upload"
                    disabled={headshotUploading}
                  />
                  <label
                    htmlFor="headshot-upload"
                    className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 ${
                      headshotUploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <FaCamera className="w-4 h-4" />
                    {headshotUploading ? 'Uploading...' : 'Upload Photo'}
                  </label>
                </div>
              </div>
            </div>

            {/* Position and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Position/Job Title <span className="text-red-600">(required)</span>
                  <div className="group relative">
                    <FaRobot className="w-4 h-4 text-blue-500 cursor-help" />
                    <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      AI uses this to create role-specific review suggestions
                    </div>
                  </div>
                </label>
                <Input
                  placeholder="Sales Manager, Customer Success Rep, etc."
                  value={formData.emp_position}
                  onChange={(e) => updateFormData('emp_position', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Business Location/Branch
                  <div className="group relative">
                    <FaRobot className="w-4 h-4 text-blue-500 cursor-help" />
                    <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      AI uses this for location-specific review context
                    </div>
                  </div>
                </label>
                <Input
                  placeholder="Downtown office, West branch, etc."
                  value={formData.emp_location}
                  onChange={(e) => updateFormData('emp_location', e.target.value)}
                />
              </div>
            </div>

            {/* Years at Business */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Years at Business
                <div className="group relative">
                  <FaRobot className="w-4 h-4 text-blue-500 cursor-help" />
                  <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    AI uses this to highlight experience and dedication
                  </div>
                </div>
              </label>
              <Input
                placeholder="2.5, 5, 10+"
                value={formData.emp_years_at_business}
                onChange={(e) => updateFormData('emp_years_at_business', e.target.value)}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Short Bio
                <div className="group relative">
                  <FaRobot className="w-4 h-4 text-blue-500 cursor-help" />
                  <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    AI uses this to create personalized, authentic reviews
                  </div>
                </div>
              </label>
              <Textarea
                placeholder="A brief description of the employee, their background, and what makes them special..."
                value={formData.emp_bio}
                onChange={(e) => updateFormData('emp_bio', e.target.value)}
                rows={4}
              />
            </div>

            {/* Fun Facts */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Fun Facts
                <div className="group relative">
                  <FaRobot className="w-4 h-4 text-blue-500 cursor-help" />
                  <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    AI uses these to create more engaging, personal reviews
                  </div>
                </div>
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Add interesting facts about the employee to make them more relatable.
              </p>
              {(formData.emp_fun_facts || []).map((fact, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    placeholder={`Fun fact ${index + 1}`}
                    value={fact}
                    onChange={(e) => updateArrayField('emp_fun_facts', index, e.target.value)}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('emp_fun_facts', index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('emp_fun_facts')}
                className="inline-flex items-center gap-2 text-slate-blue hover:text-slate-blue/80"
              >
                <FaPlus className="w-4 h-4" />
                Add fun fact
              </button>
            </div>

            {/* Skills */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Key Skills & Strengths
                <div className="group relative">
                  <FaRobot className="w-4 h-4 text-blue-500 cursor-help" />
                  <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    AI highlights these skills in review suggestions
                  </div>
                </div>
              </label>
              <p className="text-sm text-gray-600 mb-4">
                List the employee's key skills and strengths that customers should know about.
              </p>
              {(formData.emp_skills || []).map((skill, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    placeholder={`Skill ${index + 1}`}
                    value={skill}
                    onChange={(e) => updateArrayField('emp_skills', index, e.target.value)}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('emp_skills', index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('emp_skills')}
                className="inline-flex items-center gap-2 text-slate-blue hover:text-slate-blue/80"
              >
                <FaPlus className="w-4 h-4" />
                Add skill
              </button>
            </div>

            {/* Review Guidance */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                What should people mention in reviews?
                <div className="group relative">
                  <FaRobot className="w-4 h-4 text-blue-500 cursor-help" />
                  <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    AI uses this to guide review content and suggestions
                  </div>
                </div>
              </label>
              <Textarea
                placeholder="Suggest what customers should highlight when reviewing this employee's work..."
                value={formData.emp_review_guidance}
                onChange={(e) => updateFormData('emp_review_guidance', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Review Platforms Section */}
        <ReviewWriteSection
          value={Array.isArray(formData.review_platforms) ? formData.review_platforms : []}
          onChange={(platforms) => updateFormData('review_platforms', platforms)}
          onGenerateReview={handleGenerateAIReview}
          hideReviewTemplateFields={isUniversal}
        />

        {/* Offers Section */}
        <OfferSection
          enabled={formData.offer_enabled || false}
          onToggle={() => updateFormData('offer_enabled', !formData.offer_enabled)}
          title={formData.offer_title || ''}
          onTitleChange={(title) => updateFormData('offer_title', title)}
          description={formData.offer_body || ''}
          onDescriptionChange={(body) => updateFormData('offer_body', body)}
          url={formData.offer_url || ''}
          onUrlChange={(url) => updateFormData('offer_url', url)}
        />

        {/* Personalized Note Popup Section */}
        <div className="rounded-lg p-4 bg-slate-50 border border-slate-200 flex flex-col gap-2 shadow relative">
          <div className="flex items-center justify-between mb-2 px-2 py-2">
            <div className="flex items-center gap-3">
              <FaStickyNote className="w-7 h-7 text-slate-blue" />
              <span className="text-2xl font-bold text-slate-blue">
                Personalized note pop-up
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (formData.emojiSentimentEnabled) {
                  // Show conflict modal would go here
                  return;
                }
                updateFormData('show_friendly_note', !formData.show_friendly_note);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.show_friendly_note ? "bg-slate-blue" : "bg-gray-200"}`}
              aria-pressed={!!formData.show_friendly_note}
              disabled={formData.emojiSentimentEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${formData.show_friendly_note ? "translate-x-5" : "translate-x-1"}`}
              />
            </button>
          </div>
          <div className="text-sm text-gray-700 mb-3 max-w-[85ch] px-2">
            Add a friendly, personal message to make this employee review request feel special.
          </div>
          {formData.show_friendly_note && (
            <div className="px-2">
              <Textarea
                placeholder="Write a personal note to make this employee review request feel special..."
                value={formData.friendly_note || ''}
                onChange={(e) => updateFormData('friendly_note', e.target.value)}
                rows={3}
                className="bg-white border border-yellow-300"
              />
            </div>
          )}
        </div>

        {/* Emoji Sentiment Section */}
        <EmojiSentimentSection
          enabled={formData.emojiSentimentEnabled || false}
          onToggle={(enabled) => {
            if (formData.show_friendly_note) {
              // Show conflict modal would go here
              return;
            }
            updateFormData('emojiSentimentEnabled', enabled);
          }}
          question={formData.emojiSentimentQuestion || ''}
          onQuestionChange={(question) => updateFormData('emojiSentimentQuestion', question)}
          feedbackMessage={formData.emojiFeedbackMessage || ''}
          onFeedbackMessageChange={(message) => updateFormData('emojiFeedbackMessage', message)}
          feedbackPageHeader={formData.emojiFeedbackPageHeader || ''}
          onFeedbackPageHeaderChange={(header) => updateFormData('emojiFeedbackPageHeader', header)}
          thankYouMessage={formData.emojiThankYouMessage || ''}
          onThankYouMessageChange={(message) => updateFormData('emojiThankYouMessage', message)}
          disabled={!!formData.show_friendly_note}
          slug={formData.slug}
        />

        {/* Falling Stars Section */}
        <FallingStarsSection
          enabled={formData.fallingEnabled || false}
          onToggle={(enabled) => updateFormData('fallingEnabled', enabled)}
          icon={formData.fallingIcon || formData.falling_icon || 'star'}
          onIconChange={(icon) => updateFormData('fallingIcon', icon)}
          color={formData.falling_icon_color || '#facc15'}
          onColorChange={(color) => updateFormData('falling_icon_color', color)}
        />

        {/* Disable AI Generation Section */}
        <DisableAIGenerationSection
          aiGenerationEnabled={aiGenerationEnabled}
          onToggleAI={() => setAiGenerationEnabled(!aiGenerationEnabled)}
          fixGrammarEnabled={fixGrammarEnabled}
          onToggleGrammar={() => setFixGrammarEnabled(!fixGrammarEnabled)}
        />

        {/* Error Display */}
        {formError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <FaInfoCircle className="w-5 h-5" />
              <span>{formError}</span>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <BottomNavigation
          onSave={handleSave}
          isSaving={isSaving}
          onCancel={() => router.push('/prompt-pages')}
        />
      </form>
    </>
  );
} 