"use client";

import React, { useState, useMemo, useEffect } from "react";
import Icon from "@/components/Icon";
import { useAuthUser } from "@/auth/hooks/granularAuthHooks";

interface BusinessData {
  name?: string;
  logo_url?: string;
  business_email?: string;
  phone?: string;
  business_website?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  bluesky_url?: string;
  pinterest_url?: string;
}

interface EmailSignatureEmbedGeneratorProps {
  promptPageUrl: string;
  business?: BusinessData | null;
}

// Social icon configuration with email-compatible PNG icons
// Using img.icons8.com ios-filled style for consistent single-color look
// Color is passed dynamically to generate the URL
const SOCIAL_ICONS: Record<string, { label: string; iconName: string }> = {
  facebook: { label: "Facebook", iconName: "facebook-new" },
  instagram: { label: "Instagram", iconName: "instagram-new--v1" },
  linkedin: { label: "LinkedIn", iconName: "linkedin" },
  tiktok: { label: "TikTok", iconName: "tiktok--v1" },
  youtube: { label: "YouTube", iconName: "youtube-play" },
  bluesky: { label: "Bluesky", iconName: "butterfly" },
  pinterest: { label: "Pinterest", iconName: "pinterest--v1" },
};

// Generate icon URL with dynamic color (remove # from hex color)
const getIconUrl = (iconName: string, color: string) => {
  const colorHex = color.replace('#', '');
  return `https://img.icons8.com/ios-filled/50/${colorHex}/${iconName}.png`;
};

const DEFAULT_TEXT_COLOR = "#374151";
const DEFAULT_LINK_COLOR = "#2E4A7D";
const DEFAULT_CTA_TEXT = "Reviews help small businesses grow.";

const EmailSignatureEmbedGenerator: React.FC<EmailSignatureEmbedGeneratorProps> = ({
  promptPageUrl,
  business,
}) => {
  // Get user info for auto-populating name
  const { user } = useAuthUser();

  // Extract user's name from metadata or email
  const getUserDisplayName = () => {
    // Check for first_name and last_name
    const firstName = user?.user_metadata?.first_name;
    const lastName = user?.user_metadata?.last_name;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;

    // Check for full_name or name
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.user_metadata?.name) return user.user_metadata.name;

    // Fallback: extract from email
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      return emailName
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }
    return "";
  };

  // Form state - all fields are editable
  const [contactName, setContactName] = useState("");
  const [title, setTitle] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR);
  const [linkColor, setLinkColor] = useState(DEFAULT_LINK_COLOR);
  const [ctaText, setCtaText] = useState(DEFAULT_CTA_TEXT);
  const [showLogo, setShowLogo] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showWebsite, setShowWebsite] = useState(true);
  const [showSocialLinks, setShowSocialLinks] = useState(true);
  const [copyStatus, setCopyStatus] = useState("");
  const [logoSize, setLogoSize] = useState(90); // Logo size in pixels (60-120)
  const [logoSpacing, setLogoSpacing] = useState(12); // Spacing between logo and text (4-32px)
  const [iconColor, setIconColor] = useState("#2E4A7D"); // Social icon color (slate-blue)
  const [buttonText, setButtonText] = useState("Review Us!");

  // Social media URLs - editable
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [blueskyUrl, setBlueskyUrl] = useState("");
  const [pinterestUrl, setPinterestUrl] = useState("");

  // Initialize form with business data and user name
  useEffect(() => {
    if (business) {
      setBusinessName(business.name || "");
      setPhone(business.phone || "");
      setEmail(business.business_email || "");
      setWebsite(business.business_website || "");
      setLogoUrl(business.logo_url || "");
      // Social URLs
      setFacebookUrl(business.facebook_url || "");
      setInstagramUrl(business.instagram_url || "");
      setLinkedinUrl(business.linkedin_url || "");
      setTiktokUrl(business.tiktok_url || "");
      setYoutubeUrl(business.youtube_url || "");
      setBlueskyUrl(business.bluesky_url || "");
      setPinterestUrl(business.pinterest_url || "");
    }
    const userName = getUserDisplayName();
    if (userName && !contactName) {
      setContactName(userName);
    }
  }, [business, user]);

  // Get available social links from form state
  const availableSocials = useMemo(() => {
    const socials: { key: string; url: string }[] = [];
    if (facebookUrl) socials.push({ key: "facebook", url: facebookUrl });
    if (instagramUrl) socials.push({ key: "instagram", url: instagramUrl });
    if (linkedinUrl) socials.push({ key: "linkedin", url: linkedinUrl });
    if (tiktokUrl) socials.push({ key: "tiktok", url: tiktokUrl });
    if (youtubeUrl) socials.push({ key: "youtube", url: youtubeUrl });
    if (blueskyUrl) socials.push({ key: "bluesky", url: blueskyUrl });
    if (pinterestUrl) socials.push({ key: "pinterest", url: pinterestUrl });
    return socials;
  }, [facebookUrl, instagramUrl, linkedinUrl, tiktokUrl, youtubeUrl, blueskyUrl, pinterestUrl]);

  // Computed display values
  const displayName = contactName || "Your Name";
  const displayBusinessName = businessName || "Your Business";

  const generateEmbedHTML = () => {
    const logoHtml = showLogo && logoUrl ? `
      <td style="vertical-align:middle;padding-right:${logoSpacing}px;">
        <img src="${logoUrl}" alt="${displayBusinessName}" style="width:${logoSize}px;height:${logoSize}px;border-radius:50%;object-fit:cover;display:block;" />
      </td>` : '';

    // Build secondary contact line (phone | website)
    const secondaryContactParts: string[] = [];
    if (showPhone && phone) {
      secondaryContactParts.push(`<span style="color:${textColor};">${phone}</span>`);
    }
    if (showWebsite && website) {
      const cleanWebsite = website.replace(/^https?:\/\//, '');
      secondaryContactParts.push(`<a href="${website.startsWith('http') ? website : 'https://' + website}" target="_blank" style="color:${linkColor};text-decoration:none;">${cleanWebsite}</a>`);
    }

    const socialLinksHtml = showSocialLinks && availableSocials.length > 0 ? `
      <tr>
        <td ${showLogo && logoUrl ? 'colspan="2"' : ''} style="padding-top:10px;padding-bottom:6px;">
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            ${availableSocials.map(social => {
              const iconInfo = SOCIAL_ICONS[social.key];
              const iconUrl = getIconUrl(iconInfo.iconName, iconColor);
              return `<td style="padding-right:10px;"><a href="${social.url}" target="_blank" style="text-decoration:none;"><img src="${iconUrl}" alt="${iconInfo.label}" width="24" height="24" style="display:block;border:none;" /></a></td>`;
            }).join('')}
          </tr></table>
        </td>
      </tr>` : '';

    return `<!-- Email signature by Prompt Reviews promptreviews.app -->
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.4;">
  <tr>
    ${logoHtml}
    <td style="vertical-align:middle;">
      <div style="font-weight:600;font-size:16px;color:${textColor};margin-bottom:2px;">${displayName}${title ? ` <span style="color:#CBD5E1;">|</span> <span style="font-weight:400;opacity:0.8;">${title}</span>` : ''}</div>
      <div style="font-weight:500;color:${textColor};margin-bottom:4px;">${displayBusinessName}</div>
      ${showEmail && email ? `<div style="font-size:13px;margin-bottom:2px;"><a href="mailto:${email}" style="color:${linkColor};text-decoration:none;">${email}</a></div>` : ''}
      ${secondaryContactParts.length > 0 ? `<div style="font-size:13px;">${secondaryContactParts.join(' <span style="color:#CBD5E1;margin:0 6px;">|</span> ')}</div>` : ''}
    </td>
  </tr>
  ${socialLinksHtml}
  <tr>
    <td ${showLogo && logoUrl ? 'colspan="2"' : ''} style="padding-top:16px;border-top:1px solid #E5E7EB;margin-top:12px;">
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;"><tr>
        <td style="color:${textColor};font-size:14px;font-weight:500;padding-right:12px;">${ctaText}</td>
        <td style="white-space:nowrap;">
          <a href="${promptPageUrl}" target="_blank" style="display:inline-block;padding:6px 14px;border:1px solid ${iconColor};border-radius:4px;color:${iconColor};text-decoration:none;font-size:12px;font-weight:500;">
            ${buttonText}
          </a>
        </td>
      </tr></table>
    </td>
  </tr>
</table>`;
  };

  // Copy as rich text (styled HTML that pastes formatted)
  const handleCopyStyled = async () => {
    const html = generateEmbedHTML();
    try {
      // Create a blob with HTML content
      const blob = new Blob([html], { type: 'text/html' });
      const plainBlob = new Blob([html], { type: 'text/plain' });

      // Use ClipboardItem to copy as rich text
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blob,
          'text/plain': plainBlob,
        })
      ]);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (err) {
      // Fallback to plain text copy
      try {
        await navigator.clipboard.writeText(html);
        setCopyStatus('Copied as HTML');
        setTimeout(() => setCopyStatus(''), 2000);
      } catch {
        setCopyStatus('Failed to copy');
        setTimeout(() => setCopyStatus(''), 2000);
      }
    }
  };

  // Copy as raw HTML code
  const handleCopyHTML = async () => {
    const html = generateEmbedHTML();
    try {
      await navigator.clipboard.writeText(html);
      setCopyStatus('HTML Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch {
      setCopyStatus('Failed to copy');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  const hasBusinessData = business && (business.name || business.logo_url);

  return (
    <div className="space-y-6">
      {/* Missing business data warning */}
      {!hasBusinessData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Icon name="FaExclamationTriangle" className="text-amber-500 mt-0.5" size={18} />
          <div>
            <p className="text-amber-800 font-medium">Business profile incomplete</p>
            <p className="text-amber-700 text-sm mt-1">
              Add your business logo, contact info, and social links in{" "}
              <a href="/dashboard/business-profile" className="underline hover:no-underline">
                Your Business
              </a>{" "}
              to auto-populate your signature.
            </p>
          </div>
        </div>
      )}

      {/* Live Preview */}
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-1 text-center">Live preview</h3>
        <p className="text-sm text-gray-500 text-center mb-4">Note: changes made here are not saved to your account. Be sure to copy your code before closing.</p>
        <div className="border border-gray-200 rounded-lg p-8 bg-gray-50">
          <table cellPadding={0} cellSpacing={0} style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', lineHeight: 1.4 }}>
            <tbody>
              <tr>
                {showLogo && logoUrl && (
                  <td style={{ verticalAlign: 'middle', paddingRight: `${logoSpacing}px` }}>
                    <img
                      src={logoUrl}
                      alt={displayBusinessName}
                      style={{ width: `${logoSize}px`, height: `${logoSize}px`, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                    />
                  </td>
                )}
                <td style={{ verticalAlign: 'middle' }}>
                  <div style={{ fontWeight: 600, fontSize: '16px', color: textColor, marginBottom: '2px' }}>
                    {displayName}
                    {title && (
                      <>
                        <span style={{ color: '#CBD5E1' }}> | </span>
                        <span style={{ fontWeight: 400, opacity: 0.8 }}>{title}</span>
                      </>
                    )}
                  </div>
                  <div style={{ fontWeight: 500, color: textColor, marginBottom: '4px' }}>
                    {displayBusinessName}
                  </div>
                  {showEmail && email && (
                    <div style={{ fontSize: '13px', marginBottom: '2px' }}>
                      <a href={`mailto:${email}`} style={{ color: linkColor, textDecoration: 'none' }}>{email}</a>
                    </div>
                  )}
                  {(showPhone && phone) || (showWebsite && website) ? (
                    <div style={{ fontSize: '13px' }}>
                      {showPhone && phone && (
                        <span style={{ color: textColor }}>{phone}</span>
                      )}
                      {showPhone && phone && showWebsite && website && (
                        <span style={{ color: '#CBD5E1', margin: '0 6px' }}>|</span>
                      )}
                      {showWebsite && website && (
                        <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: 'none' }}>
                          {website.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </div>
                  ) : null}
                </td>
              </tr>
              {showSocialLinks && availableSocials.length > 0 && (
                <tr>
                  <td colSpan={showLogo && logoUrl ? 2 : 1} style={{ paddingTop: '10px', paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {availableSocials.map(social => {
                        const iconInfo = SOCIAL_ICONS[social.key];
                        const iconUrl = getIconUrl(iconInfo.iconName, iconColor);
                        return (
                          <a key={social.key} href={social.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                            <img src={iconUrl} alt={iconInfo.label} width={24} height={24} style={{ display: 'block', border: 'none' }} />
                          </a>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              )}
              <tr>
                <td colSpan={showLogo && logoUrl ? 2 : 1} style={{ paddingTop: '16px', borderTop: '1px solid #E5E7EB', marginTop: '12px' }}>
                  <table cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
                    <tbody>
                      <tr>
                        <td style={{ color: textColor, fontSize: '14px', fontWeight: 500, paddingRight: '12px' }}>{ctaText}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <a href={promptPageUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '6px 14px', border: `1px solid ${iconColor}`, borderRadius: '4px', color: iconColor, textDecoration: 'none', fontSize: '12px', fontWeight: 500 }}>
                            {buttonText}
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Colors, Logo Size, and Copy Buttons */}
      <div className="flex items-end justify-between gap-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-10 h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Links</label>
            <input
              type="color"
              value={linkColor}
              onChange={(e) => setLinkColor(e.target.value)}
              className="w-10 h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icons</label>
            <input
              type="color"
              value={iconColor}
              onChange={(e) => setIconColor(e.target.value)}
              className="w-10 h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
          <div className="w-28">
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo {logoSize}px</label>
            <input
              type="range"
              min="60"
              max="120"
              step="5"
              value={logoSize}
              onChange={(e) => setLogoSize(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={!logoUrl}
            />
          </div>
          <div className="w-28">
            <label className="block text-sm font-medium text-gray-700 mb-1">Gap {logoSpacing}px</label>
            <input
              type="range"
              min="0"
              max="32"
              step="2"
              value={logoSpacing}
              onChange={(e) => setLogoSpacing(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={!logoUrl}
            />
          </div>
        </div>
        <div className="text-right">
          <div className="flex gap-3 mb-2">
            <button
              type="button"
              className="px-5 py-2.5 bg-slate-blue text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
              onClick={handleCopyStyled}
            >
              {copyStatus || 'Copy Signature'}
            </button>
            <button
              type="button"
              className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium text-sm"
              onClick={handleCopyHTML}
            >
              Copy HTML
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Use <strong>Copy Signature</strong> for Gmail/Outlook<br />
            Use <strong>Copy HTML</strong> for raw code
          </p>
        </div>
      </div>

      {/* Customization Options */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Customize your signature</h3>

        {/* Personal Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-medium text-gray-700 mb-2">Your name:</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-2">Title (optional):</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
              placeholder="Sales Manager"
            />
          </div>
        </div>

        {/* Business Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-medium text-gray-700 mb-2">Business name:</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
              placeholder="Acme Inc."
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-2">Phone:</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-medium text-gray-700 mb-2">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-2">Website:</label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
              placeholder="www.company.com"
            />
          </div>
        </div>

        {/* Logo URL */}
        <div className="mb-4">
          <label className="block font-medium text-gray-700 mb-2">Logo URL:</label>
          <input
            type="text"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
            placeholder="https://example.com/logo.png"
          />
          <p className="text-xs text-gray-500 mt-1">Use a publicly accessible image URL</p>
        </div>

        {/* CTA Text and Button */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-medium text-gray-700 mb-2">Review request text:</label>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
              placeholder={DEFAULT_CTA_TEXT}
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-2">Button text:</label>
            <input
              type="text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
              placeholder="Review Us!"
            />
          </div>
        </div>

        {/* Social Media Links */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-3">Social media links:</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Facebook</label>
              <input
                type="text"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Instagram</label>
              <input
                type="text"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm"
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">LinkedIn</label>
              <input
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm"
                placeholder="https://linkedin.com/..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">TikTok</label>
              <input
                type="text"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm"
                placeholder="https://tiktok.com/..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">YouTube</label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm"
                placeholder="https://youtube.com/..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Bluesky</label>
              <input
                type="text"
                value={blueskyUrl}
                onChange={(e) => setBlueskyUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm"
                placeholder="https://bsky.app/..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Pinterest</label>
              <input
                type="text"
                value={pinterestUrl}
                onChange={(e) => setPinterestUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm"
                placeholder="https://pinterest.com/..."
              />
            </div>
          </div>
        </div>

        {/* Toggle Options */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Show in signature:</h4>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLogo}
                onChange={(e) => setShowLogo(e.target.checked)}
                disabled={!logoUrl}
                className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500 disabled:opacity-50"
              />
              <span className={`text-gray-700 ${!logoUrl ? 'opacity-50' : ''}`}>Logo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPhone}
                onChange={(e) => setShowPhone(e.target.checked)}
                disabled={!phone}
                className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500 disabled:opacity-50"
              />
              <span className={`text-gray-700 ${!phone ? 'opacity-50' : ''}`}>Phone</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showEmail}
                onChange={(e) => setShowEmail(e.target.checked)}
                disabled={!email}
                className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500 disabled:opacity-50"
              />
              <span className={`text-gray-700 ${!email ? 'opacity-50' : ''}`}>Email</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showWebsite}
                onChange={(e) => setShowWebsite(e.target.checked)}
                disabled={!website}
                className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500 disabled:opacity-50"
              />
              <span className={`text-gray-700 ${!website ? 'opacity-50' : ''}`}>Website</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer col-span-2">
              <input
                type="checkbox"
                checked={showSocialLinks}
                onChange={(e) => setShowSocialLinks(e.target.checked)}
                disabled={availableSocials.length === 0}
                className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500 disabled:opacity-50"
              />
              <span className={`text-gray-700 ${availableSocials.length === 0 ? 'opacity-50' : ''}`}>Social links</span>
              {availableSocials.length === 0 && <span className="text-xs text-gray-500">(add URLs above)</span>}
              {availableSocials.length > 0 && <span className="text-xs text-gray-500">({availableSocials.length} linked)</span>}
            </label>
          </div>
        </div>
      </div>

    </div>
  );
};

export default EmailSignatureEmbedGenerator;
