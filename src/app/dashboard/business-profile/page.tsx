"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { useAuthGuard } from '@/utils/authGuard';

export default function BusinessProfilePage() {
  useAuthGuard();
  const [form, setForm] = useState({
    name: "",
    services_offered: "",
    company_values: "",
    differentiators: "",
    years_in_business: "",
    industries_served: "",
    taglines: "",
    keywords: "",
    team_info: "",
    review_platforms: [],
    platform_word_counts: "",
    facebook_url: "",
    instagram_url: "",
    bluesky_url: "",
    tiktok_url: "",
    youtube_url: "",
    linkedin_url: "",
    pinterest_url: "",
    default_offer_enabled: false,
    default_offer_title: "Review Rewards",
    default_offer_body: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [noProfile, setNoProfile] = useState(false);
  const [services, setServices] = useState<string[]>([""]);
  const [platforms, setPlatforms] = useState([
    { name: '', url: '', wordCount: 200 }
  ]);
  const [platformErrors, setPlatformErrors] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [rawLogoFile, setRawLogoFile] = useState<File | null>(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);

  // Helper to validate review URLs for known platforms
  const validatePlatformUrl = (name: string, url: string) => {
    if (!name || !url) return '';
    if (name.toLowerCase() === 'google') {
      return url.match(/^https:\/\/g\.page\/|^https:\/\/search\.google\.com\/local\/write\/review\?placeid=/)
        ? '' : 'Enter a valid Google review link.';
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
    newPlatforms[idx][field] = value;
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

  useEffect(() => {
    const fetchProfileAndUser = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      // Fetch user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be signed in to view your business profile.');
        setLoading(false);
        return;
      }
      setAccountId(user.id);
      // Fetch business profile (existing logic)
      const { data, error: fetchError } = await supabase
        .from("businesses")
        .select("*")
        .eq("account_id", user.id)
        .single();
      if (fetchError) {
        if (fetchError.code === "PGRST116") { // No rows found
          setNoProfile(true);
          // Automatically log out the user if no business profile is found
          await supabase.auth.signOut();
          router.push('/auth/sign-in');
        } else {
          setError(fetchError.message);
        }
        setLoading(false);
        return;
      }
      setForm(data);
      setServices(
        Array.isArray(data.services_offered)
          ? data.services_offered
          : (typeof data.services_offered === 'string' && data.services_offered.length > 0)
            ? data.services_offered.split('\n')
            : [""]
      );
      // Initialize platforms from JSON or fallback
      let loadedPlatforms = [{ name: '', url: '', wordCount: 200 }];
      if (Array.isArray(data.review_platforms)) {
        loadedPlatforms = data.review_platforms;
      }
      setPlatforms(loadedPlatforms);
      setPlatformErrors(loadedPlatforms.map(() => ''));
      setLogoUrl(data.logo_url || null);
      setLoading(false);
    };
    fetchProfileAndUser();
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

  // Helper to get cropped image as a blob
  const getCroppedImg = async (imageSrc: string, cropPixels: any) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setLogoError("");
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("You must be signed in to update your business profile.");
      setLoading(false);
      return;
    }
    let uploadedLogoUrl = logoUrl;
    if (logoFile) {
      // Upload to Supabase Storage
      const fileExt = logoFile.name.split('.').pop();
      const filePath = `business-logos/${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('logos').upload(filePath, logoFile, { upsert: true, contentType: logoFile.type });
      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        setLogoError('Failed to upload logo.');
        setLoading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(filePath);
      uploadedLogoUrl = publicUrlData?.publicUrl || null;
    }
    const { error: updateError } = await supabase
      .from("businesses")
      .update({
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
        keywords: form.keywords,
        team_info: form.team_info,
        review_platforms: platforms,
        platform_word_counts: form.platform_word_counts,
        logo_url: uploadedLogoUrl,
        facebook_url: form.facebook_url,
        instagram_url: form.instagram_url,
        bluesky_url: form.bluesky_url,
        tiktok_url: form.tiktok_url,
        youtube_url: form.youtube_url,
        linkedin_url: form.linkedin_url,
        pinterest_url: form.pinterest_url,
        default_offer_enabled: form.default_offer_enabled,
        default_offer_title: form.default_offer_title,
        default_offer_body: form.default_offer_body,
      })
      .eq("account_id", user.id);
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    setSuccess("Profile updated successfully!");
    setLoading(false);
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">Loading...</div>;
  }

  if (noProfile) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-4">No Business Profile Found</h1>
        <p className="mb-4">You don't have a business profile yet.</p>
        <a href="/dashboard/create-business" className="text-blue-600 underline">Create your business profile</a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-8 bg-white rounded-lg shadow">
      {/* Account ID Display */}
      {accountId && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-gray-500">Account ID:</span>
          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded select-all">{accountId}</span>
          <button
            className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
            onClick={() => {
              navigator.clipboard.writeText(accountId);
              setCopySuccess('Copied!');
              setTimeout(() => setCopySuccess(''), 1500);
            }}
          >
            Copy
          </button>
          {copySuccess && <span className="ml-2 text-green-600 text-xs font-semibold">{copySuccess}</span>}
        </div>
      )}
      {logoUrl && (
        <div className="mb-6 text-center">
          <img src={logoUrl} alt="Business Logo" className="mx-auto rounded-full max-h-40 max-w-40 object-contain border" />
          <p className="text-sm text-gray-500 mt-2">Your current logo</p>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4">Edit Your Business Profile</h1>
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
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <input type="number" name="years_in_business" className="w-full border px-3 py-2 rounded" value={form.years_in_business} onChange={handleChange} required />
          <p className="text-sm text-gray-500 mt-1">How many years have you been in business? Enter a number.</p>
        </div>
        <div>
          <label className="block font-medium mb-1">Industries Served *</label>
          <textarea name="industries_served" className="w-full border px-3 py-2 rounded" value={form.industries_served} onChange={handleChange} required />
          <p className="text-sm text-gray-500 mt-1">List the industries or types of clients you typically serve (e.g., healthcare, retail, tech).</p>
        </div>
        <div>
          <label className="block font-medium mb-1">Taglines</label>
          <textarea name="taglines" className="w-full border px-3 py-2 rounded" value={form.taglines} onChange={handleChange} />
          <p className="text-sm text-gray-500 mt-1">Enter any slogans or taglines you use in your marketing.</p>
        </div>
        <div>
          <label className="block font-medium mb-1">Keywords (comma separated)</label>
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
        <div>
          <label className="block font-medium mb-1">Team or Founder Info (optional)</label>
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
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Social Media Links</h2>
          <div>
            <label className="block font-medium mb-1">Facebook URL</label>
            <input type="url" name="facebook_url" className="w-full border px-3 py-2 rounded" value={form.facebook_url} onChange={handleChange} placeholder="https://facebook.com/yourbusiness" />
          </div>
          <div>
            <label className="block font-medium mb-1">Instagram URL</label>
            <input type="url" name="instagram_url" className="w-full border px-3 py-2 rounded" value={form.instagram_url} onChange={handleChange} placeholder="https://instagram.com/yourbusiness" />
          </div>
          <div>
            <label className="block font-medium mb-1">Bluesky URL</label>
            <input type="url" name="bluesky_url" className="w-full border px-3 py-2 rounded" value={form.bluesky_url} onChange={handleChange} placeholder="https://bsky.app/profile/yourbusiness" />
          </div>
          <div>
            <label className="block font-medium mb-1">TikTok URL</label>
            <input type="url" name="tiktok_url" className="w-full border px-3 py-2 rounded" value={form.tiktok_url} onChange={handleChange} placeholder="https://tiktok.com/@yourbusiness" />
          </div>
          <div>
            <label className="block font-medium mb-1">YouTube URL</label>
            <input type="url" name="youtube_url" className="w-full border px-3 py-2 rounded" value={form.youtube_url} onChange={handleChange} placeholder="https://youtube.com/@yourbusiness" />
          </div>
          <div>
            <label className="block font-medium mb-1">LinkedIn URL</label>
            <input type="url" name="linkedin_url" className="w-full border px-3 py-2 rounded" value={form.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/company/yourbusiness" />
          </div>
          <div>
            <label className="block font-medium mb-1">Pinterest URL</label>
            <input type="url" name="pinterest_url" className="w-full border px-3 py-2 rounded" value={form.pinterest_url} onChange={handleChange} placeholder="https://pinterest.com/yourbusiness" />
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Preferred Review Platforms *</label>
          <div className="space-y-4">
            {/* Labels for platform fields */}
            <div className="flex gap-2 mb-1 text-sm font-semibold text-gray-700">
              <div className="w-1/4">Platform</div>
              <div className="w-1/3">Link</div>
              <div className="w-24">Word count limit</div>
            </div>
            {platforms.map((platform, idx) => {
              return (
                <div key={idx} className="border rounded p-3 bg-gray-50 relative">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Platform Name (e.g., Google)"
                      className="border px-2 py-1 rounded w-1/4"
                      value={platform.name ?? ""}
                      onChange={e => handlePlatformChange(idx, 'name', e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Review URL"
                      className="border px-2 py-1 rounded w-1/3"
                      value={platform.url ?? ""}
                      onChange={e => handlePlatformChange(idx, 'url', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      min={50}
                      max={1000}
                      placeholder="Word Count"
                      className="border px-2 py-1 rounded w-24"
                      value={platform.wordCount ?? 200}
                      onChange={e => {
                        const newPlatforms = [...platforms];
                        newPlatforms[idx].wordCount = parseInt(e.target.value, 10) || 200;
                        setPlatforms(newPlatforms);
                      }}
                      required
                    />
                    {platforms.length > 1 && (
                      <button type="button" onClick={() => removePlatform(idx)} className="ml-2 text-red-600 font-bold">&times;</button>
                    )}
                  </div>
                  {platformErrors[idx] && (
                    <p className="text-sm text-red-600">{platformErrors[idx]}</p>
                  )}
                </div>
              );
            })}
            <button type="button" onClick={addPlatform} className="text-blue-600 underline mt-2">+ Add Platform</button>
            <p className="text-sm text-gray-500 mt-1">Add each review platform you want to collect reviews on. For Google, Facebook, or Yelp, please enter the correct review link.</p>
          </div>
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
            {success}
          </div>
        )}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
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
    </div>
  );
} 