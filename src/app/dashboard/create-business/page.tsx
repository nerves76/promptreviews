// Deployment test comment - forcing a new commit to ensure Vercel builds the latest code
"use client";

import { useState, useRef, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { useAuthGuard } from '@/utils/authGuard';
import { sanitizePromptPageInsert } from '@/utils/sanitizePromptPageInsert';
import { slugify } from '@/utils/slugify';
import { FaImage, FaBuilding, FaInfoCircle, FaAddressBook, FaList, FaShareAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

export default function CreateBusinessPage() {
  useAuthGuard({ requireBusinessProfile: false });
  const [form, setForm] = useState({
    name: "",
    services_offered: "",
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
    default_offer_title: 'Review Rewards',
    default_offer_body: '',
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    address_country: "",
    business_website: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [platforms, setPlatforms] = useState([
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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
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
        services_offered: Array.isArray(services)
          ? services.filter((s: string) => s && s.trim())
          : typeof services === 'string'
            ? [services].filter((s: string) => s && s.trim())
            : [],
        company_values: form.company_values,
        differentiators: form.differentiators,
        years_in_business: form.years_in_business,
        industries_served: form.industries_served,
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
        address_street: form.address_street,
        address_city: form.address_city,
        address_state: form.address_state,
        address_zip: form.address_zip,
        address_country: form.address_country,
        business_website: form.business_website,
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
      services_offered: typeof services === 'string'
        ? [services].filter((s: string) => s && s.trim())
        : Array.isArray(services)
          ? (services as string[]).filter((s: string) => s && s.trim())
          : [],
      outcomes: '',
      date_completed: '',
      team_member: null,
      review_platforms: platformsWithWordCount,
      status: 'published',
      is_universal: true
    });
    // Log for debugging
    console.log('UNIVERSAL PROMPT PAGE services_offered:', promptPageData.services_offered, Array.isArray(promptPageData.services_offered));
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
        ? '' : 'Get Your Google Review Link.<br>Your Google review link can be accessed when you are logged into your Google business account. <a href="https://support.google.com/business/answer/3474122?hl=en#:~:text=Share%20a%20link%20or%20QR,used%20to%20send%20the%20email." target="_blank" rel="noopener noreferrer" class="underline text-blue-600">Click here for instructions.</a>';
    }
    if (name.toLowerCase() === 'facebook') {
      return url.match(/^https:\/\/www\.facebook\.com\/.+\/reviews/) ? '' : 'Enter a valid Facebook review link.';
    }
    if (name.toLowerCase() === 'yelp') {
      return url.match(/^https:\/\/www\.yelp\.com\/writeareview\?/) ? '' : 'Enter a valid Yelp review link.';
    }
    return '';
  };

  const handlePlatformChange = (idx: number, field: 'name' | 'url', value: string) => {
    const newPlatforms = [...platforms];
    newPlatforms[idx] = { ...newPlatforms[idx], [field]: value };
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

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="max-w-[850px] mx-auto mt-10 p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <FaBuilding className="text-indigo-500" />
          Create Business
        </h1>

        {/* Business Information Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <FaInfoCircle className="text-indigo-500" />
            Business Information
          </h2>
          <div className="mb-4">
            <label className="block font-semibold text-sm text-gray-500 mb-1">Business Name *</label>
            <input type="text" name="name" className="w-full border px-3 py-2 rounded" value={form.name} onChange={handleChange} required />
            <p className="text-sm text-gray-500 mt-1">The name of your business or organization as you want it to appear to clients.</p>
          </div>
          <div className="mb-4">
            <label className="block font-semibold text-sm text-gray-500 mb-1">Business Website</label>
            <input
              type="url"
              name="business_website"
              className="w-full border px-3 py-2 rounded"
              value={form.business_website || ''}
              onChange={handleChange}
              placeholder="https://yourbusiness.com"
            />
            <p className="text-sm text-gray-500 mt-1">Add your main website URL. This will be shown on your public prompt page.</p>
          </div>
          <div className="mb-4">
            <label className="block font-semibold text-sm text-gray-500 mb-1">Business Address *</label>
            <input type="text" name="address_street" className="w-full border px-3 py-2 rounded mb-2" value={form.address_street} onChange={handleChange} required placeholder="Street Address" />
            <div className="flex gap-2 mb-2">
              <input type="text" name="address_city" className="flex-1 border px-3 py-2 rounded" value={form.address_city} onChange={handleChange} required placeholder="City" />
              <input type="text" name="address_state" className="w-24 border px-3 py-2 rounded" value={form.address_state} onChange={handleChange} required placeholder="State" />
              <input type="text" name="address_zip" className="w-32 border px-3 py-2 rounded" value={form.address_zip} onChange={handleChange} required placeholder="ZIP" />
            </div>
            <input type="text" name="address_country" className="w-full border px-3 py-2 rounded" value={form.address_country} onChange={handleChange} required placeholder="Country" />
            <p className="text-sm text-gray-500 mt-1">Enter your primary business address. This will help with location-specific features in the future.</p>
          </div>
          <div className="mb-4">
            <label className="block font-semibold text-sm text-gray-500 mb-1">Services Offered *</label>
            <div className="space-y-2">
              {services.map((service, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="w-full border px-3 py-2 rounded"
                    value={service}
                    onChange={e => handleServiceChange(idx, e.target.value)}
                    required
                    placeholder="e.g., Web Design"
                  />
                  {services.length > 1 && (
                    <button type="button" onClick={() => removeService(idx)} className="text-red-600 font-bold">&times;</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addService} className="text-blue-600 underline mt-2">+ Add Service</button>
            </div>
            <p className="text-sm text-gray-500 mt-1">Add each service or product you provide as a separate line.</p>
          </div>
          <div className="mb-4">
            <label className="block font-semibold text-sm text-gray-500 mb-1">Company Values *</label>
            <textarea name="company_values" className="w-full border px-3 py-2 rounded" value={form.company_values} onChange={handleChange} required />
            <p className="text-sm text-gray-500 mt-1">Share your core values or guiding principles (e.g., integrity, innovation, customer focus).</p>
          </div>
          <div className="mb-4">
            <label className="block font-semibold text-sm text-gray-500 mb-1">Differentiators / Unique Selling Points *</label>
            <textarea name="differentiators" className="w-full border px-3 py-2 rounded" value={form.differentiators} onChange={handleChange} required />
            <p className="text-sm text-gray-500 mt-1">What makes your business stand out from competitors? (e.g., experience, awards, specializations)</p>
          </div>
          <div className="mb-4">
            <label className="block font-semibold text-sm text-gray-500 mb-1">Years in Business *</label>
            <input type="number" name="years_in_business" min="0" className="w-full border px-3 py-2 rounded" value={form.years_in_business} onChange={handleChange} required />
            <p className="text-sm text-gray-500 mt-1">How many years have you been in business? Enter a number.</p>
          </div>
          <div className="mb-4">
            <label className="block font-semibold text-sm text-gray-500 mb-1">Industries Served *</label>
            <textarea name="industries_served" className="w-full border px-3 py-2 rounded" value={form.industries_served} onChange={handleChange} required />
            <p className="text-sm text-gray-500 mt-1">List the industries or types of clients you typically serve (e.g., healthcare, retail, tech).</p>
          </div>
          <div className="mb-4">
            <label className="block font-semibold text-sm text-gray-500 mb-1">Taglines</label>
            <textarea name="taglines" className="w-full border px-3 py-2 rounded" value={form.taglines} onChange={handleChange} />
            <p className="text-sm text-gray-500 mt-1">Enter any slogans or taglines you use in your marketing.</p>
          </div>
          <div className="mb-4">
            <label className="block font-semibold text-sm text-gray-500 mb-1">Team or Founder Info (optional)</label>
            <textarea name="team_info" className="w-full border px-3 py-2 rounded" value={form.team_info} onChange={handleChange} />
            <p className="text-sm text-gray-500 mt-1">Share a brief bio or background about your team or founder (optional).</p>
          </div>
          {/* Review Rewards Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-lg font-semibold text-indigo-800">Review Rewards</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, default_offer_enabled: !f.default_offer_enabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${form.default_offer_enabled ? 'bg-indigo-500' : 'bg-gray-300'}`}
                aria-pressed={!!form.default_offer_enabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.default_offer_enabled ? 'translate-x-5' : 'translate-x-1'}`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">Reward users who complete a set number of reviews and include a link to your rewards page or contact form so they can claim their prize.</p>
            <div className={`rounded-lg border border-indigo-200 bg-indigo-50 p-4 ${!form.default_offer_enabled ? 'opacity-60' : ''}`}>
              <input
                type="text"
                name="default_offer_title"
                value={form.default_offer_title ?? 'Review Rewards'}
                onChange={e => setForm(f => ({ ...f, default_offer_title: e.target.value }))}
                placeholder="Offer Title (e.g., Review Rewards)"
                className="block w-full rounded-md border border-indigo-200 bg-indigo-50 focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-2 px-3 mb-2 font-semibold"
                disabled={!form.default_offer_enabled}
              />
              <textarea
                name="default_offer_body"
                value={form.default_offer_body || ''}
                onChange={e => setForm(f => ({ ...f, default_offer_body: e.target.value }))}
                placeholder="Review us on 3 platforms and get 10% off your next service!"
                className="block w-full rounded-md border border-indigo-200 bg-indigo-50 focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-3 px-4"
                rows={2}
                disabled={!form.default_offer_enabled}
              />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <FaAddressBook className="text-indigo-500" />
            Contact Information
          </h2>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-indigo-700 mb-16 flex items-center gap-2">Social Media Links</h2>
            <div className="mb-4">
              <label className="block font-semibold text-sm text-gray-500 mb-1">Facebook URL</label>
              <input type="url" name="facebook_url" className="w-full border px-3 py-2 rounded" value={form.facebook_url} onChange={handleChange} placeholder="https://facebook.com/yourbusiness" />
            </div>
            <div className="mb-4">
              <label className="block font-semibold text-sm text-gray-500 mb-1">Instagram URL</label>
              <input type="url" name="instagram_url" className="w-full border px-3 py-2 rounded" value={form.instagram_url} onChange={handleChange} placeholder="https://instagram.com/yourbusiness" />
            </div>
            <div className="mb-4">
              <label className="block font-semibold text-sm text-gray-500 mb-1">Bluesky URL</label>
              <input type="url" name="bluesky_url" className="w-full border px-3 py-2 rounded" value={form.bluesky_url} onChange={handleChange} placeholder="https://bsky.app/profile/yourbusiness" />
            </div>
            <div className="mb-4">
              <label className="block font-semibold text-sm text-gray-500 mb-1">TikTok URL</label>
              <input type="url" name="tiktok_url" className="w-full border px-3 py-2 rounded" value={form.tiktok_url} onChange={handleChange} placeholder="https://tiktok.com/@yourbusiness" />
            </div>
            <div className="mb-4">
              <label className="block font-semibold text-sm text-gray-500 mb-1">YouTube URL</label>
              <input type="url" name="youtube_url" className="w-full border px-3 py-2 rounded" value={form.youtube_url} onChange={handleChange} placeholder="https://youtube.com/@yourbusiness" />
            </div>
            <div className="mb-4">
              <label className="block font-semibold text-sm text-gray-500 mb-1">LinkedIn URL</label>
              <input type="url" name="linkedin_url" className="w-full border px-3 py-2 rounded" value={form.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/company/yourbusiness" />
            </div>
            <div className="mb-4">
              <label className="block font-semibold text-sm text-gray-500 mb-1">Pinterest URL</label>
              <input type="url" name="pinterest_url" className="w-full border px-3 py-2 rounded" value={form.pinterest_url} onChange={handleChange} placeholder="https://pinterest.com/yourbusiness" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block font-semibold text-sm text-gray-500 mb-1">Preferred Review Platforms *</label>
            <p className="text-sm text-gray-500 mb-6">
              Add your preferred review platforms. We recommend adding at least 3 and we HIGHLY recommend adding your
              <a href="https://business.google.com/us/business-profile/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline mx-1">Google Business Profile</a>
              review link because adding reviews can drastically improve your local search visibility.
            </p>
            <div className="space-y-4">
              {platforms.map((platform, idx) => (
                <div key={idx} className="border rounded p-3 bg-gray-50 relative">
                  <div className="flex gap-2 mb-1 text-sm font-semibold text-gray-700">
                    <div className="w-1/4">Platform</div>
                    <div className="w-1/3">Link</div>
                    <div className="w-24 whitespace-nowrap">Word Count</div>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Platform</label>
                      <input
                        type="text"
                        placeholder="Google Business"
                        className="border px-2 py-1 rounded w-full"
                        value={platform.name}
                        onChange={e => handlePlatformChange(idx, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Review URL</label>
                      <input
                        type="text"
                        placeholder="https://g.page/yourbusiness"
                        className="border px-2 py-1 rounded w-full"
                        value={platform.url}
                        onChange={e => handlePlatformChange(idx, 'url', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setPlatforms([...platforms, { name: '', url: '', wordCount: 200 }])}
                className="text-blue-600 underline mt-2"
              >
                + Add Platform
              </button>
              <p className="text-sm text-gray-500 mt-1">Popular review sites: Google Business, Yelp, BBB, Trustpilot, Angi (formerly Angie's List), G2 / Capterra, Facebook, ConsumerAffairs, TripAdvisor</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-indigo-700 mb-16 flex items-center gap-2">
            <FaImage className="w-6 h-6 text-indigo-400" />
            Logo
          </h2>
          <div className="mb-10 flex flex-col md:flex-row items-center gap-6">
            {logoUrl && (
              <img src={logoUrl} alt="Business Logo" className="rounded-full max-h-32 max-w-32 object-contain border shadow" />
            )}
            <div className="flex-1 w-full max-w-xs">
              <label className="block font-medium text-sm text-gray-500 mb-1">Business Logo (PNG or JPG, max 400x400px, max 300KB)</label>
              <input
                type="file"
                accept="image/png, image/jpeg"
                ref={fileInputRef}
                onChange={handleLogoChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {logoError && <p className="text-sm text-red-600 mt-1">{logoError}</p>}
            </div>
          </div>
          {/* Cropping Modal */}
          {showCropper && logoUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
                <h2 className="text-lg font-bold mb-4">Crop Your Logo</h2>
                <div className="relative w-full h-64 bg-gray-100">
                  <Cropper
                    image={logoUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <label className="text-sm">Zoom</label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={e => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button onClick={handleCropCancel} type="button" className="px-4 py-2 rounded bg-gray-200 text-gray-700">Cancel</button>
                  <button onClick={handleCropConfirm} type="button" className="px-4 py-2 rounded bg-indigo-600 text-white">Crop & Save</button>
                </div>
              </div>
            </div>
          )}
          <div className="mb-4">
            <label className="block font-semibold text-sm text-gray-500 mb-1">Keywords (comma separated)</label>
            <textarea
              name="keywords"
              className="w-full border px-3 py-2 rounded min-h-[80px]"
              value={form.keywords}
              onChange={handleChange}
              placeholder="best therapist in Portland, amazing ADHD therapist, group sessions, works with most insurance companies, compassionate"
              rows={4}
            />
            <p className="text-sm text-gray-500 mt-1">Add 5-10 keywords that you would like to see appear in your reviews.</p>
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <FaList className="text-indigo-500" />
            Services
          </h2>
          {/* ... content ... */}
        </div>

        {/* Social Media Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <FaShareAlt className="text-indigo-500" />
            Social Media
          </h2>
          {/* ... content ... */}
        </div>

        {/* Business Hours Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <FaClock className="text-indigo-500" />
            Business Hours
          </h2>
          {/* ... content ... */}
        </div>

        {/* Location Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <FaMapMarkerAlt className="text-indigo-500" />
            Location
          </h2>
          {/* ... content ... */}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Business
          </button>
        </div>
      </div>
    </Suspense>
  );
} 