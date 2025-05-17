"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { useAuthGuard } from '@/utils/authGuard';
import { FaRegStar, FaPhone, FaMapMarkerAlt, FaImage, FaListAlt, FaInfoCircle, FaStar, FaShareAlt, FaClipboardList, FaCheckCircle, FaTimesCircle, FaBuilding, FaAddressBook, FaClock, FaList, FaQuestionCircle } from 'react-icons/fa';

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block align-middle ml-1">
      <button
        type="button"
        tabIndex={0}
        aria-label="Show help"
        className="text-gray-400 hover:text-indigo-600 focus:outline-none"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        style={{ lineHeight: 1 }}
      >
        <span
          className="flex items-center justify-center rounded-full bg-blue-100"
          style={{ width: 16, height: 16, fontSize: 12, color: '#2563eb', fontWeight: 400 }}
        >
          ?
        </span>
      </button>
      {show && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-56 p-2 bg-white border border-gray-200 rounded shadow text-xs text-gray-700">
          {text}
        </div>
      )}
    </span>
  );
}

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
    default_offer_url: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    address_country: "",
    phone: "",
    business_website: "",
    offer_learn_more_url: "",
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
      return url.match(/^https:\/\/www\.yelp\.com\/biz\/[a-zA-Z0-9\-_]+/)
        ? '' : 'Please share a link to your business page on Yelp. Should look like: https://www.yelp.com/biz/your-business';
    }
    return '';
  };

  const handlePlatformChange = (idx: number, field: 'name' | 'url' | 'customPlatform', value: string) => {
    const newPlatforms = [...platforms];
    if (field === 'name') {
      newPlatforms[idx].name = value;
    } else if (field === 'url') {
      newPlatforms[idx].url = value;
    } else if (field === 'customPlatform') {
      newPlatforms[idx].customPlatform = value;
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
      setForm({
        ...data,
        business_website: data.business_website || "",
        phone: data.phone || "",
        address_street: data.address_street || "",
        address_city: data.address_city || "",
        address_state: data.address_state || "",
        address_zip: data.address_zip || "",
        address_country: data.address_country || "",
        offer_learn_more_url: data.offer_learn_more_url || "",
      });
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
        default_offer_url: form.default_offer_url,
        address_street: form.address_street,
        address_city: form.address_city,
        address_state: form.address_state,
        address_zip: form.address_zip,
        address_country: form.address_country,
        phone: form.phone,
        business_website: form.business_website,
        offer_learn_more_url: form.offer_learn_more_url,
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
    return (
      <div className="min-h-screen py-12 px-2">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your business...</p>
          </div>
        </div>
      </div>
    );
  }

  if (noProfile) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-gray-50 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">No Business Found</h1>
        <p className="mb-4">You don't have a business yet.</p>
        <a href="/dashboard/create-business" className="text-blue-600 underline">Create your business</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-2">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-gray-50 rounded-lg shadow pt-4 pb-24 px-8 relative">
        <div className="absolute -top-4 -left-4 bg-gray-50 rounded-full shadow p-2 flex items-center justify-center">
          <FaBuilding className="w-7 h-7 text-indigo-500" />
        </div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900">
            Your Business
          </h1>
        </div>
        <p className="text-sm text-gray-600 mb-16 max-w-2xl">
          Share more details about your business to get better prompts and reviews.
        </p>
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-3 mb-4">
            <FaBuilding className="w-7 h-7 text-indigo-500" />
            Business Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
                Business Name *
                <Tooltip text="The name of your business or organization as you want it to appear to clients." />
              </label>
              <input type="text" name="name" className="w-full border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.name || ""} onChange={handleChange} required />
            </div>
            <div className="mb-4">
              <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
                Business Website
                <Tooltip text="Add your main website URL. This will be shown on your public prompt page." />
              </label>
              <input
                type="url"
                name="business_website"
                className="w-full border px-3 py-2 rounded"
                value={form.business_website || ''}
                onChange={handleChange}
                placeholder="https://yourbusiness.com"
              />
            </div>
            <div className="mb-4">
              <label className="block font-semibold text-sm text-gray-500 mb-1">Business Phone</label>
              <input type="tel" name="phone" className="w-full border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.phone || ''} onChange={handleChange} placeholder="e.g., (555) 123-4567" />
            </div>
          </div>
          <div className="mt-6">
            <label className="block font-semibold text-sm text-gray-500 mb-1">Business Address *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="address_street" className="border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.address_street || ''} onChange={handleChange} required placeholder="Street Address" />
              <input type="text" name="address_city" className="border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.address_city || ''} onChange={handleChange} required placeholder="City" />
              <input type="text" name="address_state" className="border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.address_state || ''} onChange={handleChange} required placeholder="State" />
              <input type="text" name="address_zip" className="border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.address_zip || ''} onChange={handleChange} required placeholder="ZIP" />
              <input type="text" name="address_country" className="border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300 md:col-span-2" value={form.address_country || ''} onChange={handleChange} required placeholder="Country" />
            </div>
          </div>
        </div>

        {/* About Your Business Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-3 mb-12">
            <FaAddressBook className="w-7 h-7 text-indigo-500" />
            About Your Business
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
                Company Values
                <Tooltip text="Share your core values or guiding principles (e.g., integrity, innovation, customer focus)." />
              </label>
              <textarea name="company_values" className="w-full border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.company_values} onChange={handleChange} />
            </div>
            <div>
              <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
                Differentiators
                <Tooltip text="What makes your business stand out from competitors? (e.g., experience, awards, specializations)" />
              </label>
              <textarea name="differentiators" className="w-full border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.differentiators} onChange={handleChange} />
            </div>
            <div>
              <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
                Years in Business
                <Tooltip text="How many years have you been in business? Enter a number." />
              </label>
              <input type="number" name="years_in_business" className="w-full border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.years_in_business || ''} onChange={handleChange} />
            </div>
            <div>
              <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
                Industries Served
                <Tooltip text="List the industries or types of clients you typically serve (e.g., healthcare, retail, tech)." />
              </label>
              <textarea name="industries_served" className="w-full border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.industries_served} onChange={handleChange} />
            </div>
            <div>
              <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
                Tagline
                <Tooltip text="Enter any slogans or taglines you use in your marketing." />
              </label>
              <textarea name="taglines" className="w-full border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.taglines} onChange={handleChange} />
            </div>
            <div>
              <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
                Keywords (comma separated)
                <Tooltip text="Add relevant keywords that describe your business and services. These help with search and prompt generation." />
              </label>
              <textarea
                name="keywords"
                className="w-full border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300 min-h-[80px]"
                value={form.keywords}
                onChange={handleChange}
                placeholder="best therapist in Portland, amazing ADHD therapist, group sessions, works with most insurance companies, compassionate"
                rows={4}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold text-sm text-gray-500 mb-1 flex items-center">
                Team or Founder Info (optional)
                <Tooltip text="Share a brief bio or background about your team or founder (optional)." />
              </label>
              <textarea name="team_info" className="w-full border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.team_info} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-3 mb-12">
            <FaList className="w-7 h-7 text-indigo-500" />
            Services
          </h2>
          <div className="space-y-2">
            {services.map((service, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300"
                  value={service}
                  onChange={e => handleServiceChange(idx, e.target.value)}
                  required
                  placeholder="e.g., Web Design"
                />
                {services.length > 1 && (
                  <button type="button" onClick={() => removeService(idx)} className="text-red-600 font-bold text-xl">&times;</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addService} className="text-blue-600 underline mt-2">+ Add Service</button>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-3 mb-12">
            <FaShareAlt className="w-7 h-7 text-indigo-500" />
            Social Media
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-sm text-gray-500 mb-1">Facebook URL</label>
              <input type="url" name="facebook_url" className="w-full border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.facebook_url} onChange={handleChange} placeholder="https://facebook.com/yourbusiness" />
            </div>
            <div>
              <label className="block font-semibold text-sm text-gray-500 mb-1">Instagram URL</label>
              <input type="url" name="instagram_url" className="w-full border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.instagram_url} onChange={handleChange} placeholder="https://instagram.com/yourbusiness" />
            </div>
            <div>
              <label className="block font-semibold text-sm text-gray-500 mb-1">Bluesky URL</label>
              <input type="url" name="bluesky_url" className="w-full border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.bluesky_url} onChange={handleChange} placeholder="https://bsky.app/profile/yourbusiness" />
            </div>
            <div>
              <label className="block font-semibold text-sm text-gray-500 mb-1">TikTok URL</label>
              <input type="url" name="tiktok_url" className="w-full border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.tiktok_url} onChange={handleChange} placeholder="https://tiktok.com/@yourbusiness" />
            </div>
            <div>
              <label className="block font-semibold text-sm text-gray-500 mb-1">YouTube URL</label>
              <input type="url" name="youtube_url" className="w-full border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.youtube_url} onChange={handleChange} placeholder="https://youtube.com/@yourbusiness" />
            </div>
            <div>
              <label className="block font-semibold text-sm text-gray-500 mb-1">LinkedIn URL</label>
              <input type="url" name="linkedin_url" className="w-full border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/company/yourbusiness" />
            </div>
            <div>
              <label className="block font-semibold text-sm text-gray-500 mb-1">Pinterest URL</label>
              <input type="url" name="pinterest_url" className="w-full border px-3 py-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-300" value={form.pinterest_url} onChange={handleChange} placeholder="https://pinterest.com/yourbusiness" />
            </div>
          </div>
        </div>

        {/* Review Rewards Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-3 mb-12">
            <FaRegStar className="w-7 h-7 text-indigo-500" />
            Review Rewards
          </h2>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-lg font-semibold text-indigo-800 flex items-center">
                Enable Review Rewards
                <Tooltip text="Reward users who complete a set number of reviews and include a link to your rewards page or contact form so they can claim their prize." />
              </label>
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
              <input
                type="url"
                name="default_offer_url"
                value={form.default_offer_url || ''}
                onChange={e => setForm(f => ({ ...f, default_offer_url: e.target.value }))}
                placeholder="Offer URL (e.g., https://yourbusiness.com/claim-reward)"
                className="block w-full rounded-md border border-indigo-200 bg-indigo-50 focus:ring-2 focus:ring-indigo-300 focus:outline-none sm:text-sm py-2 px-3 mt-2"
                disabled={!form.default_offer_enabled}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex flex-col items-end gap-4">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 text-green-700 rounded-lg">
              {success}
            </div>
          )}
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Save Changes
          </button>
        </div>

        {/* Cropping Modal */}
        {showCropper && logoUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-gray-50 rounded-lg shadow-lg p-6 max-w-lg w-full">
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
      </form>
    </div>
  );
} 