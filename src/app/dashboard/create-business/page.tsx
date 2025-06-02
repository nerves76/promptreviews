// Deployment test comment - forcing a new commit to ensure Vercel builds the latest code
"use client";

import { useState, useRef, useCallback, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { useAuthGuard } from '@/utils/authGuard';
import { sanitizePromptPageInsert } from '@/utils/sanitizePromptPageInsert';
import { slugify } from '@/utils/slugify';
import { FaImage, FaBuilding, FaInfoCircle, FaAddressBook, FaList, FaShareAlt, FaClock, FaMapMarkerAlt, FaGift, FaStore } from 'react-icons/fa';
import { getUserOrMock } from '@/utils/supabase';
import BusinessForm from '../components/BusinessForm';
import { useRequirePlan } from '@/utils/useRequirePlan';

interface Platform {
  name: string;
  url: string;
  wordCount: number;
  customPlatform?: string;
}

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block align-middle ml-1">
      <button
        type="button"
        tabIndex={0}
        aria-label="Show help"
        className="text-gray-400 hover:text-dustyPlum focus:outline-none"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        style={{ lineHeight: 1 }}
      >
        <span
          className="flex items-center justify-center rounded-full bg-softPeach"
          style={{ width: 16, height: 16, fontSize: 12, color: '#2563eb', fontWeight: 400 }}
        >
          ?
        </span>
      </button>
      {show && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-56 p-2 bg-white border border-gray-200 rounded shadow text-xs text-dustyPlum">
          {text}
        </div>
      )}
    </span>
  );
}

export default function CreateBusinessPage() {
  useAuthGuard({ requireBusinessProfile: false });
  const [form, setForm] = useState({
    name: "",
    features_or_benefits: "",
    company_values: "",
    differentiators: "",
    years_in_business: "",
    industries_served: "",
    taglines: "",
    team_info: "",
    review_platforms: [],
    platform_word_counts: "",
    keywords: "",
    facebook_url: "",
    instagram_url: "",
    bluesky_url: "",
    tiktok_url: "",
    youtube_url: "",
    linkedin_url: "",
    pinterest_url: "",
    default_offer_enabled: false,
    default_offer_title: 'Special Offer',
    default_offer_body: '',
    default_offer_url: '',
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    address_country: "",
    business_website: "",
    business_email: "",
    industry: "",
    industry_other: "",
    ai_dos: "",
    ai_donts: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [platforms, setPlatforms] = useState<Platform[]>([
    { name: '', url: '', wordCount: 200 }
  ]);
  const [platformErrors, setPlatformErrors] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [services, setServices] = useState<string[]>([""]);
  const [success, setSuccess] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [rawLogoFile, setRawLogoFile] = useState<File | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [showTrialConfirmation, setShowTrialConfirmation] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch account info for plan modal
  useEffect(() => {
    const fetchAccount = async () => {
      const { data: { user } } = await getUserOrMock(supabase);
      if (!user) return;
      const { data: accountData } = await supabase
        .from('accounts')
        .select('id, plan, is_free_account, subscription_status, has_had_paid_plan')
        .eq('id', user.id)
        .single();
      setAccount(accountData);
    };
    fetchAccount();
  }, [supabase]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('showGrowerSuccess') === '1') {
      setShowTrialConfirmation(true);
      localStorage.removeItem('showGrowerSuccess');
      setTimeout(() => setShowTrialConfirmation(false), 4000);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleServiceChange = (idx: number, value: string) => {
    const newServices = [...services];
    newServices[idx] = value;
    setServices(newServices);
  };

  const addService = () => setServices([...services, ""]);

  const removeService = (idx: number) => setServices(services.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setLogoError("");
    setSuccess("");
    const { data: { user }, error: userError } = await getUserOrMock(supabase);
    if (userError || !user) {
      setError("You must be signed in to create a business profile.");
      setLoading(false);
      return;
    }
    // Ensure account exists
    await supabase
      .from('accounts')
      .upsert([{ id: user.id }], { onConflict: 'id' });
    let uploadedLogoUrl = logoUrl;
    if (logoFile) {
      // Upload to Supabase Storage
      const fileExt = logoFile.name.split('.').pop();
      const filePath = `business-logos/${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('logos').upload(filePath, logoFile, { upsert: true, contentType: logoFile.type });
      if (uploadError) {
        setLogoError('Failed to upload logo.');
        setLoading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(filePath);
      uploadedLogoUrl = publicUrlData?.publicUrl || null;
    }
    // Set word count to 200 for each platform
    const platformsWithWordCount = platforms.map(p => ({ ...p, wordCount: 200 }));
    // Create business profile
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .upsert({
        id: user.id,
        account_id: user.id,
        name: form.name,
        features_or_benefits: Array.isArray(services)
          ? services.filter((s: string) => s && s.trim())
          : typeof services === 'string'
            ? [services].filter((s: string) => s && s.trim())
            : [],
        company_values: form.company_values,
        differentiators: form.differentiators,
        years_in_business: form.years_in_business,
        industry: Array.isArray(form.industry) ? form.industry : form.industry ? [form.industry] : [],
        industries_served: form.industries_served,
        industries_other: form.industry_other,
        taglines: form.taglines,
        team_info: form.team_info,
        review_platforms: platforms,
        logo_url: uploadedLogoUrl,
        keywords: form.keywords,
        facebook_url: form.facebook_url,
        instagram_url: form.instagram_url,
        bluesky_url: form.bluesky_url,
        tiktok_url: form.tiktok_url,
        youtube_url: form.youtube_url,
        linkedin_url: form.linkedin_url,
        pinterest_url: form.pinterest_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        default_offer_enabled: form.default_offer_enabled,
        default_offer_title: form.default_offer_title,
        default_offer_body: form.default_offer_body,
        default_offer_url: form.default_offer_url,
        address_street: form.address_street,
        address_city: form.address_city,
        address_state: form.address_state,
        address_zip: form.address_zip,
        address_country: form.address_country,
        business_website: form.business_website,
        business_email: form.business_email,
        signup_email: user.email,
        ai_dos: form.ai_dos,
        ai_donts: form.ai_donts,
      })
      .select()
      .single();
    if (businessError) {
      setError(businessError.message);
      setLoading(false);
      return;
    }
    // Create Universal Prompt Page
    console.log('About to insert universal prompt page');
    const promptPageData = sanitizePromptPageInsert({
      account_id: user.id,
      slug: `universal-${slugify(form.name)}`,
      client_name: '',
      location: '',
      tone_of_voice: '',
      project_type: '',
      features_or_benefits: typeof services === 'string'
        ? [services].filter((s: string) => s && s.trim())
        : Array.isArray(services)
          ? (services as string[]).filter((s: string) => s && s.trim())
          : [],
      product_description: '',
      date_completed: '',
      team_member: null,
      review_platforms: platformsWithWordCount,
      status: 'draft',
      is_universal: true
    });
    // Log for debugging
    console.log('UNIVERSAL PROMPT PAGE features_or_benefits:', promptPageData.features_or_benefits, Array.isArray(promptPageData.features_or_benefits));
    // Force remove date_completed if falsy
    if (!promptPageData.date_completed) {
      delete promptPageData.date_completed;
    }
    console.log('Prompt page data being inserted:', JSON.stringify(promptPageData, null, 2));
    const { error: universalError } = await supabase
      .from('prompt_pages')
      .upsert([promptPageData], { onConflict: 'slug' });
    console.log('Insert result:', universalError);
    if (universalError) {
      setError('Business created, but failed to create Universal Prompt Page: ' + universalError.message);
      setLoading(false);
      return;
    }
    router.push('/dashboard?success=business-created');
  };

  // Helper to validate review URLs for known platforms
  const validatePlatformUrl = (name: string, url: string) => {
    if (!name || !url) return '';
    if (name.toLowerCase() === 'google') {
      return url.match(/^https:\/\/g\.page\/|^https:\/\/search\.google\.com\/local\/write\/review\?placeid=/)
        ? '' : 'Get Your Google Review Link.<br>Your Google review link can be accessed when you are logged into your Google business account. <a href="https://support.google.com/business/answer/3474122?hl=en#:~:text=Share%20a%20link%20or%20QR,used%20to%20send%20the%20email." target="_blank" rel="noopener noreferrer" class="underline text-dustyPlum">Click here for instructions.</a>';
    }
    if (name.toLowerCase() === 'facebook') {
      return url.match(/^https:\/\/www\.facebook\.com\/.+\/reviews/) ? '' : 'Enter a valid Facebook review link.';
    }
    if (name.toLowerCase() === 'yelp') {
      return url.match(/^https:\/\/www\.yelp\.com\/writeareview\?/) ? '' : 'Enter a valid Yelp review link.';
    }
    return '';
  };

  const handlePlatformChange = (idx: number, field: 'name' | 'url' | 'customPlatform' | 'wordCount', value: string) => {
    const newPlatforms = [...platforms];
    if (field === 'name') {
      newPlatforms[idx].name = value;
    } else if (field === 'url') {
      newPlatforms[idx].url = value;
    } else if (field === 'customPlatform') {
      newPlatforms[idx] = { ...newPlatforms[idx], customPlatform: value };
    } else if (field === 'wordCount') {
      newPlatforms[idx].wordCount = Number(value);
    }
    setPlatforms(newPlatforms);
    // Validate on change
    const error = validatePlatformUrl(newPlatforms[idx].name, newPlatforms[idx].url);
    const newErrors = [...platformErrors];
    newErrors[idx] = error;
    setPlatformErrors(newErrors);
  };

  const addPlatform = () => {
    setPlatforms([...platforms, { name: '', url: '', wordCount: 200 }]);
    setPlatformErrors([...platformErrors, '']);
  };

  const removePlatform = (idx: number) => {
    setPlatforms(platforms.filter((_, i) => i !== idx));
    setPlatformErrors(platformErrors.filter((_, i) => i !== idx));
  };

  // Helper to get cropped image as a blob
  const getCroppedImg = async (imageSrc: string, cropPixels: Area) => {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => { image.onload = resolve; });
    const canvas = document.createElement('canvas');
    canvas.width = cropPixels.width;
    canvas.height = cropPixels.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(
      image,
      cropPixels.x,
      cropPixels.y,
      cropPixels.width,
      cropPixels.height,
      0,
      0,
      cropPixels.width,
      cropPixels.height
    );
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/png');
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setLogoError('Only PNG or JPG images are allowed.');
      return;
    }
    if (file.size > 300 * 1024) {
      setLogoError('Logo must be 300KB or less.');
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      if (img.width > 400 || img.height > 400) {
        setLogoError('Logo must be no larger than 400x400 pixels.');
        setLogoFile(null);
        setLogoUrl(null);
      } else {
        setRawLogoFile(file);
        setShowCropper(true);
        setLogoUrl(URL.createObjectURL(file));
      }
    };
    img.onerror = () => setLogoError('Invalid image file.');
    img.src = URL.createObjectURL(file);
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!logoUrl || !croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(logoUrl, croppedAreaPixels);
    const croppedFile = new File([croppedBlob], rawLogoFile?.name || 'logo.png', { type: 'image/png' });
    setLogoFile(croppedFile);
    setLogoUrl(URL.createObjectURL(croppedFile));
    setShowCropper(false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setLogoFile(null);
    setLogoUrl(null);
    setRawLogoFile(null);
  };

  useRequirePlan(account, ['/dashboard/account', '/dashboard/billing']);

  return (
    <>
      {/* Floating Icon */}
      <div className="absolute -top-6 -left-6 z-10 bg-white rounded-full shadow p-3 flex items-center justify-center w-16 h-16">
        <FaStore className="w-9 h-9 text-slate-blue" />
      </div>
      {showTrialConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-green-100 border border-green-300 text-green-900 px-6 py-4 rounded-lg shadow-lg flex items-center gap-4 text-lg font-semibold pointer-events-auto">
            Your free trial has started! You have 14 days to explore all features.
            <button onClick={() => setShowTrialConfirmation(false)} className="ml-2 text-green-900 hover:text-green-700 text-2xl font-bold" aria-label="Dismiss">&times;</button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold text-slate-blue">Create Business</h1>
          <p className="text-sm text-gray-600 mt-2 max-w-xl">Fill out your profile as thoroughly as you can. This will help Prompt AI write better prompt reviews. (You will also be able to add/edit this info later.)</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            className="py-2 px-4 border border-indigo-300 rounded-md shadow-sm text-xs font-medium text-indigo-800 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-800"
            onClick={() => {
              setForm({
                name: 'Diviner',
                address_street: '2652 SE 89th ave',
                address_city: 'Portland',
                address_state: 'OR',
                address_zip: '97266',
                address_country: 'US',
                business_email: 'chris@diviner.agency',
                business_website: '',
                facebook_url: '',
                instagram_url: '',
                bluesky_url: '',
                tiktok_url: '',
                youtube_url: '',
                linkedin_url: 'https://www.linkedin.com/in/chris-bolton-a7b146a/',
                pinterest_url: '',
                industry: 'B2B',
                industry_other: 'professional services',
                industries_served: 'agencies, small business',
                features_or_benefits: '', // handled by setServices
                company_values: 'radical candor, authenticity, partnership',
                differentiators: 'support for navigating how ai is changing marketing',
                years_in_business: '1',
                taglines: '',
                team_info: '',
                review_platforms: [], // handled by setPlatforms
                platform_word_counts: '',
                keywords: 'SEO expert, friendly, authentic',
                default_offer_enabled: false,
                default_offer_title: 'Special Offer',
                default_offer_body: '',
                default_offer_url: '',
                ai_dos: '',
                ai_donts: '',
              });
              setServices(['SEO', 'Marketing Consulting', 'SEO Audit']);
              setPlatforms([
                { name: 'Google', url: 'https://g.page/r/CTI0Oyvd6N23EAE/review', wordCount: 200 }
              ]);
            }}
          >
            Fill with Test Data
          </button>
          <button
            type="submit"
            form="create-business-form"
            disabled={loading}
            className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-800 hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      <BusinessForm
        form={form}
        setForm={setForm}
        services={services}
        setServices={setServices}
        platforms={platforms}
        setPlatforms={setPlatforms}
        platformErrors={platformErrors}
        setPlatformErrors={setPlatformErrors}
        logoUrl={logoUrl}
        setLogoUrl={setLogoUrl}
        logoFile={logoFile}
        setLogoFile={setLogoFile}
        logoError={logoError}
        setLogoError={setLogoError}
        // @ts-expect-error: React.RefObject<HTMLInputElement> can be initialized with null
        fileInputRef={fileInputRef}
        showCropper={showCropper}
        setShowCropper={setShowCropper}
        crop={crop}
        setCrop={setCrop}
        zoom={zoom}
        setZoom={setZoom}
        croppedAreaPixels={croppedAreaPixels}
        setCroppedAreaPixels={setCroppedAreaPixels}
        rawLogoFile={rawLogoFile}
        setRawLogoFile={setRawLogoFile}
        loading={loading}
        error={error}
        success={success}
        onSubmit={handleSubmit}
        handleChange={handleChange}
        handleServiceChange={handleServiceChange}
        addService={addService}
        removeService={removeService}
        handlePlatformChange={handlePlatformChange}
        addPlatform={addPlatform}
        removePlatform={removePlatform}
        handleLogoChange={handleLogoChange}
        handleCropConfirm={handleCropConfirm}
        handleCropCancel={handleCropCancel}
        formId="create-business-form"
      />
    </>
  );
} 