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
import KeywordsInput from "./KeywordsInput";
import {
  OfferFeature,
  EmojiSentimentFeature,
  FallingStarsFeature,
  AISettingsFeature,
  PersonalizedNoteFeature,
  KickstartersFeature,
  RecentReviewsFeature,
  KeywordInspirationFeature,
  MotivationalNudgeFeature
} from "./prompt-features";
import { useFallingStars } from "@/hooks/useFallingStars";
import { Input } from "@/app/(app)/components/ui/input";
import { Textarea } from "@/app/(app)/components/ui/textarea";
import SectionHeader from "./SectionHeader";
import { TopNavigation, BottomNavigation } from "./sections/StepNavigation";
import { generateContextualReview } from "@/utils/aiReviewGeneration";
import Icon from "@/components/Icon";


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
    recent_reviews_enabled: initialData.recent_reviews_enabled ?? false,
    keyword_inspiration_enabled: initialData.keyword_inspiration_enabled ?? businessProfile?.default_keyword_inspiration_enabled ?? false,
    selected_keyword_inspirations: Array.isArray(initialData.selected_keyword_inspirations)
      ? initialData.selected_keyword_inspirations
      : (Array.isArray(businessProfile?.default_selected_keyword_inspirations) ? businessProfile.default_selected_keyword_inspirations : []),
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

  // Update form data when initialData changes (for inheritance)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData((prev: any) => {
        const newData = { ...prev, ...initialData };
        return newData;
      });
    }
  }, [initialData]);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [headshotUploading, setHeadshotUploading] = useState(false);
  const [aiGeneratingIndex, setAiGeneratingIndex] = useState<number | null>(null);
  
  // AI settings state
  const [aiGenerationEnabled, setAiGenerationEnabled] = useState(
    initialData?.aiButtonEnabled !== false
  );
  const [fixGrammarEnabled, setFixGrammarEnabled] = useState(
    initialData?.fix_grammar_enabled !== false
  );

  // Motivational Nudge state
  const [motivationalNudgeEnabled, setMotivationalNudgeEnabled] = useState(
    initialData?.motivational_nudge_enabled ?? true
  );
  const [motivationalNudgeText, setMotivationalNudgeText] = useState(
    initialData?.motivational_nudge_text || "Your review helps us get found online and hold our own against bigger brands"
  );

  // Keywords state
  const [keywords, setKeywords] = useState<string[]>(() => {
    if (Array.isArray(initialData?.keywords) && initialData.keywords.length > 0) {
      return initialData.keywords;
    } else if (mode === "create" && Array.isArray(businessProfile?.keywords)) {
      return businessProfile.keywords;
    }
    return [];
  });

  // Initialize form data only once on mount or when initialData changes significantly
  useEffect(() => {
    const isInitialLoad = !formData || Object.keys(formData).length === 0;
    const isDifferentRecord = initialData?.id && formData?.id && initialData.id !== formData.id;

    if (!isSaving && initialData && (isInitialLoad || isDifferentRecord)) {
      setFormData(safeInitialData);
    }
  }, [initialData, isSaving]);

  // Synchronize motivational nudge state with initialData
  useEffect(() => {
    if (initialData?.motivational_nudge_enabled !== undefined) {
      setMotivationalNudgeEnabled(initialData.motivational_nudge_enabled);
    }
    if (initialData?.motivational_nudge_text !== undefined) {
      setMotivationalNudgeText(initialData.motivational_nudge_text || "Your review helps us get found online and hold our own against bigger brands");
    }
  }, [initialData?.motivational_nudge_enabled, initialData?.motivational_nudge_text]);

  // Form data update helper
  const updateFormData = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
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
    const newArray = currentArray.filter((_: any, i: number) => i !== index);
    updateFormData(fieldName, newArray);
  };

  // Generate AI review with employee context
  const handleGenerateAIReview = async (idx: number) => {
    setAiGeneratingIndex(idx);
    
    if (!businessProfile) {
      setAiGeneratingIndex(null);
      return;
    }

    const platforms = formData.review_platforms || [];
    if (!platforms[idx]) {
      setAiGeneratingIndex(null);
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
      employee_skills: formData.emp_skills?.filter((skill: any) => skill.trim()),
      employee_review_guidance: formData.emp_review_guidance,
      client_name: formData.first_name || '',
      client_role: formData.role || '',
      friendly_note: formData.friendly_note || '',
      keywords: keywords,
    };

    try {
      const generatedReview = await generateContextualReview(
        formData.emp_review_guidance || '',
        formData.emp_bio || '',
        formData.emp_skills?.join(', ') || '',
        'google',
        businessProfile,
        JSON.stringify(employeePageData),
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
    } finally {
      setAiGeneratingIndex(null);
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
        // Explicitly include kickstarters fields to ensure they're saved
        kickstarters_enabled: formData.kickstarters_enabled,
        selected_kickstarters: formData.selected_kickstarters,
        // Keyword inspiration fields
        keyword_inspiration_enabled: formData.keyword_inspiration_enabled,
        selected_keyword_inspirations: formData.selected_keyword_inspirations,
        // Keywords
        keywords: keywords,
        // Motivational Nudge
        motivational_nudge_enabled: motivationalNudgeEnabled,
        motivational_nudge_text: motivationalNudgeText,
      };
      const result = await onSave(saveData);
      if (onPublishSuccess && (result as any)?.slug) {
        onPublishSuccess((result as any).slug);
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
  const { startCelebration, submitted } = useFallingStars() as any;

  return (
    <>
      {/* Page Title and Save Button */}
      <div className="mb-8 flex justify-between items-start">
        <div>
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
        {/* Top Save Button */}
        <TopNavigation
          mode={mode}
          onSave={handleSave}
          isSaving={isSaving}
        />
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

        {/* Campaign Name (Public campaigns only) */}
        {campaignType === 'public' && (
          <div className="mb-6">
            <div className="mb-6 flex items-center gap-3">
              <Icon name="FaUser" className="w-7 h-7 text-slate-blue" size={28} />
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
                setFormData((prev: any) => ({ ...prev, ...updates }));
              }
            }}
            campaignType={campaignType}
          />
        )}

        {/* Employee Information */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Icon name="FaUser" className="w-5 h-5 text-[#1A237E]" size={20} />
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
                    <Icon name="prompty" className="w-4 h-4 text-slate-blue cursor-help" size={16} />
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
                    <Icon name="prompty" className="w-4 h-4 text-slate-blue cursor-help" size={16} />
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
                    <Icon name="FaCamera" className="w-4 h-4" size={16} />
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
                    <Icon name="prompty" className="w-4 h-4 text-slate-blue cursor-help" size={16} />
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
                    <Icon name="prompty" className="w-4 h-4 text-slate-blue cursor-help" size={16} />
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
                  <Icon name="prompty" className="w-4 h-4 text-slate-blue cursor-help" size={16} />
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
                  <Icon name="prompty" className="w-4 h-4 text-slate-blue cursor-help" size={16} />
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
                  <Icon name="prompty" className="w-4 h-4 text-slate-blue cursor-help" size={16} />
                  <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    AI uses these to create more engaging, personal reviews
                  </div>
                </div>
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Add interesting facts about the employee to make them more relatable.
              </p>
              {(formData.emp_fun_facts || []).map((fact: any, index: number) => (
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
                    <Icon name="FaTrash" className="w-4 h-4" size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('emp_fun_facts')}
                className="inline-flex items-center gap-2 text-slate-blue hover:text-slate-blue/80"
              >
                <Icon name="FaPlus" className="w-4 h-4" size={16} />
                Add fun fact
              </button>
            </div>

            {/* Skills */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Key Skills & Strengths
                <div className="group relative">
                  <Icon name="prompty" className="w-4 h-4 text-slate-blue cursor-help" size={16} />
                  <div className="absolute left-0 bottom-6 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    AI highlights these skills in review suggestions
                  </div>
                </div>
              </label>
              <p className="text-sm text-gray-600 mb-4">
                List the employee's key skills and strengths that customers should know about.
              </p>
              {(formData.emp_skills || []).map((skill: any, index: number) => (
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
                    <Icon name="FaTrash" className="w-4 h-4" size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('emp_skills')}
                className="inline-flex items-center gap-2 text-slate-blue hover:text-slate-blue/80"
              >
                <Icon name="FaPlus" className="w-4 h-4" size={16} />
                Add skill
              </button>
            </div>

            {/* Review Guidance */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                What should people mention in reviews?
                <div className="group relative">
                  <Icon name="prompty" className="w-4 h-4 text-slate-blue cursor-help" size={16} />
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
          hideReviewTemplateFields={campaignType === 'public'}
          aiGeneratingIndex={aiGeneratingIndex}
        />

        {/* Keyword Phrases Section */}
        <div className="rounded-lg p-6 bg-green-50 border border-green-200 shadow">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="FaKey" className="w-7 h-7 text-slate-blue" size={28} />
            <h3 className="text-2xl font-bold text-slate-blue">Keyword-Powered Reviews</h3>
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suggest keyword-powered phrases that your customers can use in reviews. This will improve your visibility in search and AI engines
            </label>
            <KeywordsInput
              keywords={keywords}
              onChange={setKeywords}
              placeholder="Enter keywords separated by commas (e.g., best pizza Seattle, wood-fired oven, authentic Italian)"
              businessInfo={{
                name: businessProfile?.name,
                industry: businessProfile?.industry,
                industries_other: businessProfile?.industries_other,
                industry_other: businessProfile?.industry_other,
                address_city: businessProfile?.address_city,
                address_state: businessProfile?.address_state,
                accountId: businessProfile?.account_id,
                about_us: businessProfile?.about_us,
                differentiators: businessProfile?.differentiators,
                years_in_business: businessProfile?.years_in_business,
                services_offered: businessProfile?.services_offered,
                industries_served: businessProfile?.industries_served
              }}
            />
          </div>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>How it works:</strong> Keywords are pre-populated from your global settings for new pages.
              You can add, remove, or customize them for this specific prompt page without affecting your global keywords.
            </p>
          </div>
        </div>

        {/* Shared Feature Components */}
        <div className="space-y-8">
          {/* Kickstarters Feature */}
          <KickstartersFeature
            enabled={formData.kickstarters_enabled || false}
            selectedKickstarters={formData.selected_kickstarters || []}
            businessName={businessProfile?.name || businessProfile?.business_name || "Business Name"}
            onEnabledChange={(enabled) => updateFormData('kickstarters_enabled', enabled)}
            onKickstartersChange={(kickstarters) => updateFormData('selected_kickstarters', kickstarters)}
            initialData={{
              kickstarters_enabled: formData.kickstarters_enabled,
              selected_kickstarters: formData.selected_kickstarters,
            }}
            editMode={true}
            accountId={businessProfile?.account_id}
          />

          {/* Recent Reviews Feature */}
          <RecentReviewsFeature
            enabled={formData.recent_reviews_enabled}
            onEnabledChange={(enabled) => updateFormData('recent_reviews_enabled', enabled)}
            initialData={{
              recent_reviews_enabled: formData.recent_reviews_enabled,
            }}
            editMode={true}
          />

          {/* Keyword Inspiration Feature */}
          <KeywordInspirationFeature
            enabled={formData.keyword_inspiration_enabled}
            onEnabledChange={(enabled) => updateFormData('keyword_inspiration_enabled', enabled)}
            selectedKeywords={formData.selected_keyword_inspirations}
            onKeywordsChange={(keywords) => updateFormData('selected_keyword_inspirations', keywords)}
            availableKeywords={keywords || []}
            initialData={{
              keyword_inspiration_enabled: formData.keyword_inspiration_enabled,
              selected_keyword_inspirations: formData.selected_keyword_inspirations,
            }}
            editMode={true}
          />

          {/* Offer Feature */}
          <OfferFeature
            enabled={formData.offer_enabled || false}
            onToggle={() => updateFormData('offer_enabled', !formData.offer_enabled)}
            title={formData.offer_title || ''}
            onTitleChange={(title) => updateFormData('offer_title', title)}
            description={formData.offer_body || ''}
            onDescriptionChange={(body) => updateFormData('offer_body', body)}
            url={formData.offer_url || ''}
            onUrlChange={(url) => updateFormData('offer_url', url)}
          />

          {/* Personalized Note Feature */}
          <PersonalizedNoteFeature
            enabled={formData.show_friendly_note || false}
            onEnabledChange={(enabled) => updateFormData('show_friendly_note', enabled)}
            note={formData.friendly_note || ''}
            onNoteChange={(note) => updateFormData('friendly_note', note)}
            emojiSentimentEnabled={formData.emojiSentimentEnabled}
            editMode={true}
          />

          {/* Emoji Sentiment Feature */}
          <EmojiSentimentFeature
            enabled={formData.emojiSentimentEnabled || false}
            onEnabledChange={(enabled) => updateFormData('emojiSentimentEnabled', enabled)}
            question={formData.emojiSentimentQuestion || ''}
            onQuestionChange={(question) => updateFormData('emojiSentimentQuestion', question)}
            feedbackMessage={formData.emojiFeedbackMessage || ''}
            onFeedbackMessageChange={(message) => updateFormData('emojiFeedbackMessage', message)}
            feedbackPageHeader={formData.emojiFeedbackPageHeader || ''}
            onFeedbackPageHeaderChange={(header) => updateFormData('emojiFeedbackPageHeader', header)}
            thankYouMessage={formData.emojiThankYouMessage || ''}
            onThankYouMessageChange={(message) => updateFormData('emojiThankYouMessage', message)}
            personalizedNoteEnabled={formData.show_friendly_note}
            slug={formData.slug}
            editMode={true}
          />

          {/* Falling Stars Feature */}
          <FallingStarsFeature
            enabled={formData.fallingEnabled || false}
            onToggle={() => updateFormData('fallingEnabled', true)}
            icon={formData.fallingIcon || formData.falling_icon || 'star'}
            onIconChange={(icon) => updateFormData('fallingIcon', icon)}
            color={formData.falling_icon_color || '#facc15'}
            onColorChange={(color) => updateFormData('falling_icon_color', color)}
            editMode={true}
          />

          {/* AI Settings Feature */}
          <AISettingsFeature
            aiGenerationEnabled={formData.ai_generation_enabled !== false}
            fixGrammarEnabled={formData.fix_grammar_enabled ?? true}
            onAIEnabledChange={(enabled) => updateFormData('ai_generation_enabled', enabled)}
            onGrammarEnabledChange={(enabled) => updateFormData('fix_grammar_enabled', enabled)}
          />

          <MotivationalNudgeFeature
            enabled={motivationalNudgeEnabled}
            text={motivationalNudgeText}
            onEnabledChange={setMotivationalNudgeEnabled}
            onTextChange={setMotivationalNudgeText}
            editMode={true}
          />

        </div>



        {/* Error Display */}
        {formError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <Icon name="FaInfoCircle" className="w-5 h-5" size={20} />
              <span>{formError}</span>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <BottomNavigation
          mode="create"
          onSave={handleSave}
          isSaving={isSaving}
          onCancel={() => router.push('/prompt-pages')}
        />
      </form>
    </>
  );
} 