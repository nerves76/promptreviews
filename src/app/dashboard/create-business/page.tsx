// Deployment test comment - forcing a new commit to ensure Vercel builds the latest code
"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

export default function CreateBusinessPage() {
  const [form, setForm] = useState({
    name: "",
    services_offered: "",
    company_values: "",
    differentiators: "",
    years_in_business: "",
    industries_served: "",
    taglines: "",
    team_info: "",
    preferred_review_platforms: "",
    platform_word_counts: "",
    keywords: "best therapist in Portland, amazing ADHD therapist, group sessions, works with most insurance companies, compassionate",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [platforms, setPlatforms] = useState([
    { name: '', url: '', buttonText: '' }
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
    // Insert the business profile
    const { error: insertError } = await supabase
      .from("businesses")
      .insert([
        {
          name: form.name,
          services_offered: services.filter(s => s.trim()).join("\n"),
          company_values: form.company_values,
          differentiators: form.differentiators,
          years_in_business: form.years_in_business,
          industries_served: form.industries_served,
          taglines: form.taglines,
          team_info: form.team_info,
          preferred_review_platforms: JSON.stringify(platformsWithWordCount),
          platform_word_counts: '', // not used on create
          owner_id: user.id,
          logo_url: uploadedLogoUrl,
          keywords: form.keywords,
        },
      ]);
    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }
    // Create Universal Prompt Page
    const { error: universalError } = await supabase
      .from('prompt_pages')
      .insert({
        account_id: user.id,
        client_name: '',
        project_type: '',
        outcomes: '',
        review_platform_links: platformsWithWordCount,
        custom_incentive_text: null,
        is_universal: true,
      });
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

  const handlePlatformChange = (idx: number, field: 'name' | 'url' | 'buttonText', value: string) => {
    const newPlatforms = [...platforms];
    newPlatforms[idx][field] = value;
    setPlatforms(newPlatforms);
    // Validate on change
    const error = validatePlatformUrl(newPlatforms[idx].name, newPlatforms[idx].url);
    const newErrors = [...platformErrors];
    newErrors[idx] = error;
    setPlatformErrors(newErrors);
  };

  const addPlatform = () => {
    setPlatforms([...platforms, { name: '', url: '', buttonText: '' }]);
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

  const apiKey = process.env.OPENAI_API_KEY;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Create Your Business Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6 text-center">
            <p className="font-semibold">{success}</p>
            <a href="/create-prompt-page" className="inline-block mt-2 text-blue-700 underline font-medium">Create Prompt Page</a>
          </div>
        )}
        <div>
          <label className="block font-medium mb-1">Business Name *</label>
          <input type="text" name="name" className="w-full border px-3 py-2 rounded" value={form.name} onChange={handleChange} required />
          <p className="text-sm text-gray-500 mt-1">The name of your business or organization as you want it to appear to clients.</p>
        </div>
        <div>
          <label className="block font-medium mb-1">Services Offered *</label>
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
        <div>
          <label className="block font-medium mb-1">Company Values *</label>
          <textarea name="company_values" className="w-full border px-3 py-2 rounded" value={form.company_values} onChange={handleChange} required />
          <p className="text-sm text-gray-500 mt-1">Share your core values or guiding principles (e.g., integrity, innovation, customer focus).</p>
        </div>
        <div>
          <label className="block font-medium mb-1">Differentiators / Unique Selling Points *</label>
          <textarea name="differentiators" className="w-full border px-3 py-2 rounded" value={form.differentiators} onChange={handleChange} required />
          <p className="text-sm text-gray-500 mt-1">What makes your business stand out from competitors? (e.g., experience, awards, specializations)</p>
        </div>
        <div>
          <label className="block font-medium mb-1">Years in Business *</label>
          <input type="number" name="years_in_business" min="0" className="w-full border px-3 py-2 rounded" value={form.years_in_business} onChange={handleChange} required />
          <p className="text-sm text-gray-500 mt-1">How many years have you been in business? Enter a number.</p>
        </div>
        <div>
          <label className="block font-medium mb-1">Industries Served *</label>
          <textarea name="industries_served" className="w-full border px-3 py-2 rounded" value={form.industries_served} onChange={handleChange} required />
          <p className="text-sm text-gray-500 mt-1">List the industries or types of clients you typically serve (e.g., healthcare, retail, tech).</p>
        </div>
        <div>
          <label className="block font-medium mb-1">Taglines *</label>
          <textarea name="taglines" className="w-full border px-3 py-2 rounded" value={form.taglines} onChange={handleChange} />
          <p className="text-sm text-gray-500 mt-1">Enter any slogans or taglines you use in your marketing.</p>
        </div>
        <div>
          <label className="block font-medium mb-1">Team or Founder Info (optional)</label>
          <textarea name="team_info" className="w-full border px-3 py-2 rounded" value={form.team_info} onChange={handleChange} />
          <p className="text-sm text-gray-500 mt-1">Share a brief bio or background about your team or founder (optional).</p>
        </div>
        <div>
          <label className="block font-medium mb-1">Preferred Review Platforms *</label>
          <div className="space-y-4">
            {platforms.map((platform, idx) => (
              <div key={idx} className="border rounded p-3 bg-gray-50 relative">
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
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      placeholder="Submit Review"
                      className="border px-2 py-1 rounded w-full"
                      value={platform.buttonText}
                      onChange={e => handlePlatformChange(idx, 'buttonText', e.target.value)}
                      required
                    />
                  </div>
                  {platforms.length > 1 && (
                    <button type="button" onClick={() => removePlatform(idx)} className="ml-2 text-red-600 font-bold">&times;</button>
                  )}
                </div>
                {platformErrors[idx] && (
                  <p className="text-sm text-red-600" dangerouslySetInnerHTML={{ __html: platformErrors[idx] }} />
                )}
              </div>
            ))}
            <button type="button" onClick={addPlatform} className="text-blue-600 underline mt-2">+ Add Platform</button>
            <p className="text-sm text-gray-500 mt-1">Add each review platform you want to collect reviews on. For Google, Facebook, or Yelp, please enter the correct review link.</p>
          </div>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Business Logo (PNG or JPG, max 400x400px, max 300KB)</label>
          <input
            type="file"
            accept="image/png, image/jpeg"
            ref={fileInputRef}
            onChange={handleLogoChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {logoError && <p className="text-sm text-red-600 mt-1">{logoError}</p>}
          {logoUrl && (
            <img src={logoUrl} alt="Logo Preview" className="mt-2 rounded max-h-32 max-w-32 object-contain border" />
          )}
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
        <div>
          <label className="block font-medium mb-1">Keywords (comma separated)</label>
          <input
            type="text"
            name="keywords"
            className="w-full border px-3 py-2 rounded"
            value={form.keywords}
            onChange={handleChange}
            placeholder="best therapist in Portland, amazing ADHD therapist, group sessions, works with most insurance companies, compassionate"
          />
          <p className="text-sm text-gray-500 mt-1">Add 5-10 keywords that you would like to see appear in your reviews.</p>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={loading || !!success}>
          {loading ? "Creating..." : "Create Business"}
        </button>
      </form>
    </div>
  );
} 