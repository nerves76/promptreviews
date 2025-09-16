// -----------------------------------------------------------------------------
// Location Card Component
// Displays a business location with sharing functionality similar to universal prompt page
// Includes QR code, email, SMS, copy link, and other sharing options
// -----------------------------------------------------------------------------

import React, { useState } from 'react';
import Icon from '@/components/Icon';
import { BusinessLocation } from '@/types/business';
import QRCodeModal from './QRCodeModal';

interface LocationCardProps {
  location: BusinessLocation;
  businessName?: string;
  businessLogoUrl?: string;
  onEdit?: (location: BusinessLocation) => void;
  onDelete?: (locationId: string) => void;
}

export default function LocationCard({
  location,
  businessName,
  businessLogoUrl,
  onEdit,
  onDelete,
}: LocationCardProps) {
  const [copySuccess, setCopySuccess] = useState("");
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    url: string;
    clientName: string;
    logoUrl?: string;
    showNfcText?: boolean;
  } | null>(null);

  const handleCopyLink = async () => {
    if (!location.prompt_page_slug) return;
    
    try {
      const url = `${window.location.origin}/r/${location.prompt_page_slug}`;
      await navigator.clipboard.writeText(url);
      setCopySuccess("Copied!");
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      setCopySuccess("Failed to copy");
      setTimeout(() => setCopySuccess(""), 2000);
    }
  };

  const handleSendSMS = () => {
    if (!location.prompt_page_slug) return;
    
    const businessNameText = businessName || "your business";
    const reviewUrl = `${window.location.origin}/r/${location.prompt_page_slug}`;
    const message = `Hi! I'd love to get your feedback on ${businessNameText}. Please leave a review here: ${reviewUrl}`;
    window.location.href = `sms:?&body=${encodeURIComponent(message)}`;
  };

  const handleSendEmail = () => {
    if (!location.prompt_page_slug) return;
    
    const businessNameText = businessName || "your business";
    const reviewUrl = `${window.location.origin}/r/${location.prompt_page_slug}`;
    const subject = "Please leave a review";
    const message = `Hi,\n\nI'd love to get your feedback on ${businessNameText}. Please leave a review here: ${reviewUrl}\n\nThank you!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  };

  const handleQRCode = () => {
    if (!location.prompt_page_slug) return;
    
    setQrModal({
      open: true,
      url: `${window.location.origin}/r/${location.prompt_page_slug}`,
      clientName: location.name || "Location",
      logoUrl: location.location_photo_url || businessLogoUrl,
      showNfcText: location.nfc_text_enabled ?? false,
    });
  };

  const getLocationAddress = () => {
    const parts = [
      location.address_street,
      location.address_city,
      location.address_state,
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'Address not specified';
  };

  return (
    <>
      <div className="rounded-lg p-6 bg-blue-50 border border-blue-200 flex items-center gap-4 shadow relative">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-blue flex items-center gap-3">
                <Icon name="FaMapMarker" className="w-7 h-7 text-slate-blue" size={28} />
                {location.name}
              </h2>
            </div>
            <div className="flex gap-4 items-center">
              {location.prompt_page_slug && (
                <a
                  href={`/r/${location.prompt_page_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-blue underline hover:text-slate-blue/80 hover:underline"
                >
                  View
                </a>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(location)}
                  className="text-slate-blue underline hover:text-slate-blue/80 hover:underline"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
          
          <p className="mt-4 text-blue-900 mb-4 text-sm">
            {getLocationAddress()}
          </p>
          
          {location.business_description && (
            <p className="mt-2 text-blue-800 text-sm mb-4">
              {location.business_description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex flex-wrap gap-2 items-center">
              {location.prompt_page_slug && (
                <>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                  >
                    <Icon name="FaLink" className="w-4 h-4" style={{ color: "#1A237E" }} size={16} />
                    Copy link
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleQRCode}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                  >
                    <Icon name="MdDownload" size={22} style={{ color: "#b45309" }} />
                    QR code
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSendSMS}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                  >
                    <Icon name="FaMobile" className="w-5 h-5" style={{ color: "#1A237E" }} size={20} />
                    Send SMS
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                  >
                    <Icon name="FaEnvelope" className="w-5 h-5" style={{ color: "#1A237E" }} size={20} />
                    Send Email
                  </button>
                </>
              )}

              {copySuccess && (
                <span className="ml-2 text-green-600 text-xs font-semibold">
                  {copySuccess}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModal?.open || false}
        onClose={() => setQrModal(null)}
        url={qrModal?.url || ""}
        clientName={qrModal?.clientName || ""}
        logoUrl={qrModal?.logoUrl}
        showNfcText={qrModal?.showNfcText}
      />
    </>
  );
} 