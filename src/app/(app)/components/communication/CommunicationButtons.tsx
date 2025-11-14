"use client";

import React, { useState } from "react";
import { Button } from "@/app/(app)/components/ui/button";
import Icon from "@/components/Icon";
import CommunicationTrackingModal from "./CommunicationTrackingModal";
import { apiClient } from "@/utils/apiClient";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
}

interface PromptPage {
  id: string;
  slug: string;
  status: string;
  client_name?: string;
  location?: string;
  account_id?: string;
}

interface CommunicationButtonsProps {
  contact: Contact;
  promptPage: PromptPage;
  onCommunicationSent?: () => void;
  onStatusUpdated?: (newStatus: string) => void;
  onContactLogged?: (timestamp: string, newStatus: string) => void;
  className?: string;
  singleButton?: boolean; // Show single "Share" button instead of separate Email/Text
  buttonText?: string; // Custom button text for single button mode
}

interface CommunicationData {
  contactId: string;
  promptPageId: string;
  communicationType: 'email' | 'sms';
  subject?: string;
  message: string;
  followUpReminder?: string;
  newStatus: string;
}

export default function CommunicationButtons({
  contact,
  promptPage,
  onCommunicationSent,
  onStatusUpdated,
  onContactLogged,
  className = "",
  singleButton = false,
  buttonText = "Share"
}: CommunicationButtonsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCommunicationType, setSelectedCommunicationType] = useState<'email' | 'sms'>('email');
  const [isLoading, setIsLoading] = useState(false);

  // Don't render anything if contact has no email or phone
  if (!contact.email && !contact.phone) {
    return null;
  }

  const handleButtonClick = (type?: 'email' | 'sms') => {
    // If single button mode and both email and phone exist, let modal handle selection
    // Otherwise, set the available type
    if (type) {
      setSelectedCommunicationType(type);
    } else if (contact.email && !contact.phone) {
      setSelectedCommunicationType('email');
    } else if (!contact.email && contact.phone) {
      setSelectedCommunicationType('sms');
    } else {
      // Both available, default to email
      setSelectedCommunicationType('email');
    }
    setIsModalOpen(true);
  };

  const handleSendCommunication = async (data: CommunicationData) => {
    setIsLoading(true);

    try {
      // Create communication record
      await apiClient.post('/communication/records', {
        contactId: data.contactId,
        promptPageId: data.promptPageId,
        communicationType: data.communicationType,
        subject: data.subject,
        message: data.message,
        followUpReminder: data.followUpReminder
      });

      const timestamp = new Date().toISOString();
      onContactLogged?.(timestamp, data.newStatus);

      // Log campaign action for the communication
      try {
        await fetch('/api/campaign-actions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            promptPageId: data.promptPageId,
            contactId: data.contactId,
            accountId: promptPage.account_id,
            activityType: data.communicationType,
            content: data.communicationType === 'email'
              ? `Email sent: ${data.subject || 'No subject'}`
              : `SMS sent: ${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}`,
            metadata: {
              subject: data.subject,
              message: data.message,
            },
          }),
        });
      } catch (activityError) {
        // Don't fail the whole operation if campaign action logging fails
        console.error('Failed to log campaign action:', activityError);
      }

      // Update prompt page status if changed
      if (data.newStatus !== promptPage.status) {
        await apiClient.patch('/prompt-pages/update-status', {
          id: promptPage.id,
          status: data.newStatus
        });
        onStatusUpdated?.(data.newStatus);
      }

      // Callback to parent component
      onCommunicationSent?.();

    } catch (error: any) {
      throw new Error(error.message || 'Failed to record communication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await apiClient.patch('/prompt-pages/update-status', {
        id: promptPage.id,
        status: newStatus
      });

      onStatusUpdated?.(newStatus);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update prompt page status');
    }
  };

  return (
    <>
      {singleButton ? (
        // Single button mode - show one "Share" button
        <button
          type="button"
          onClick={() => handleButtonClick()}
          disabled={isLoading}
          className={className || "flex items-center gap-2 bg-teal-100 text-teal-800 rounded hover:bg-teal-200 text-sm font-medium shadow"}
        >
          <Icon name="FaShare" className="w-4 h-4" />
          <span>{buttonText}</span>
        </button>
      ) : (
        // Multiple button mode - show separate Email and Text buttons
        <div className={`flex gap-2 ${className}`}>
          {/* Email Button - only show if contact has email */}
          {contact.email && (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleButtonClick('email')}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Icon name="FaEnvelope" className="w-4 h-4" />
              <span className="hidden sm:inline">Email</span>
            </Button>
          )}

          {/* SMS Button - only show if contact has phone */}
          {contact.phone && (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleButtonClick('sms')}
              disabled={isLoading}
              className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              <Icon name="FaMobile" className="w-4 h-4" />
              <span className="hidden sm:inline">SMS</span>
            </Button>
          )}
        </div>
      )}

      {/* Communication Tracking Modal */}
      {isModalOpen && (
        <CommunicationTrackingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          contact={contact}
          promptPage={promptPage}
          communicationType={singleButton ? undefined : selectedCommunicationType}
          onSend={handleSendCommunication}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </>
  );
}
