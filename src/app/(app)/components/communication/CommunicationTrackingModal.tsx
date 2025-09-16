"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/app/(app)/components/ui/button";
import { Textarea } from "@/app/(app)/components/ui/textarea";
import { Card } from "@/app/(app)/components/ui/card";
import Icon from "@/components/Icon";
import CommunicationProcessIndicator from "./CommunicationProcessIndicator";

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
}

interface CommunicationTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  promptPage: PromptPage;
  communicationType?: 'email' | 'sms'; // Optional - will determine initial tab
  onSend: (data: CommunicationData) => Promise<void>;
  onStatusUpdate: (newStatus: string) => Promise<void>;
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

const FOLLOW_UP_OPTIONS = [
  { value: '', label: 'No follow-up' },
  { value: '1_week', label: '1 week' },
  { value: '2_weeks', label: '2 weeks' },
  { value: '3_weeks', label: '3 weeks' },
  { value: '1_month', label: '1 month' },
  { value: '2_months', label: '2 months' },
  { value: '3_months', label: '3 months' },
  { value: '4_months', label: '4 months' },
  { value: '5_months', label: '5 months' },
  { value: '6_months', label: '6 months' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', description: 'Still being worked on' },
  { value: 'in_queue', label: 'In queue', description: 'Ready to send for review' },
  { value: 'sent', label: 'Sent', description: 'Communication sent to customer' },
  { value: 'follow_up', label: 'Follow up', description: 'Needs follow up' },
  { value: 'complete', label: 'Complete', description: 'Review submitted' },
];

export default function CommunicationTrackingModal({
  isOpen,
  onClose,
  contact,
  promptPage,
  communicationType: initialCommunicationType,
  onSend,
  onStatusUpdate
}: CommunicationTrackingModalProps) {
  // Determine available tabs based on contact info
  const hasSMS = !!contact.phone;
  const hasEmail = !!contact.email;
  
  // Set initial tab - prefer SMS if available, otherwise use what's passed or email
  const getInitialTab = () => {
    if (initialCommunicationType) return initialCommunicationType;
    if (hasSMS) return 'sms';
    if (hasEmail) return 'email';
    return 'sms';
  };
  
  const [activeTab, setActiveTab] = useState<'email' | 'sms'>(getInitialTab());
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [followUpReminder, setFollowUpReminder] = useState('1_week');
  const [newStatus, setNewStatus] = useState('sent');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  
  // Generate default message based on active tab and prompt page
  useEffect(() => {
    if (!isOpen) return;
    
    const businessName = promptPage?.location || promptPage?.client_name || 'Our Business';
    const customerName = contact?.first_name || 'there';
    const reviewUrl = `${window.location.origin}/r/${promptPage?.slug}`;
    
    if (activeTab === 'email') {
      setSubject(`Quick Review Request from ${businessName}`);
      setMessage(
        `Hi ${customerName},\n\n` +
        `Thank you for choosing ${businessName}! We hope you had a great experience with us.\n\n` +
        `We would greatly appreciate it if you could take a moment to share your feedback by leaving us a review. Your review helps us improve our services and helps other customers find us.\n\n` +
        `You can leave your review here: ${reviewUrl}\n\n` +
        `Thank you for your time and support!\n\n` +
        `Best regards,\n${businessName} Team`
      );
    } else {
      setMessage(
        `Hi ${customerName}, do you have 1-3 minutes to leave a review for ${businessName}? ` +
        `I have a review you can use and everything. Positive reviews really help small businesses get found online. ` +
        `Thanks so much! ${reviewUrl}`
      );
    }
  }, [isOpen, activeTab, contact, promptPage]);

  const handleCopyToClipboard = async () => {
    try {
      let clipboardContent = '';
      
      if (activeTab === 'email') {
        clipboardContent = `Subject: ${subject}\n\n${message}`;
      } else {
        clipboardContent = message;
      }
      
      await navigator.clipboard.writeText(clipboardContent);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
      return true;
    } catch (err) {
      setError('Failed to copy to clipboard');
      return false;
    }
  };

  const handleCopyAndSend = async (openApp: boolean = true) => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (activeTab === 'email' && !subject.trim()) {
      setError('Please enter a subject for the email');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data: CommunicationData = {
        contactId: contact.id,
        promptPageId: promptPage.id,
        communicationType: activeTab,
        message: message.trim(),
        followUpReminder: followUpReminder || undefined,
        newStatus
      };

      if (activeTab === 'email') {
        data.subject = subject.trim();
      }

      await onSend(data);
      
      // Update prompt page status if changed
      if (newStatus !== promptPage.status) {
        await onStatusUpdate(newStatus);
      }
      
      // Open the communication app with pre-filled message if requested
      if (openApp) {
        if (activeTab === 'email' && contact.email) {
          const mailtoLink = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
          window.location.href = mailtoLink;
        } else if (activeTab === 'sms' && contact.phone) {
          // Format phone number for SMS
          const phoneNumber = contact.phone.replace(/\D/g, '');
          const smsLink = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
          window.location.href = smsLink;
        }
      }

      // Close modal after a brief delay to allow the link to open
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to send communication');
    } finally {
      setIsLoading(false);
    }
  };


  // Don't render if contact has no communication methods
  if (!hasEmail && !hasSMS) {
    return null;
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-lg">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Share Prompt Page with {contact.first_name} {contact.last_name}
              </Dialog.Title>
              <p className="text-sm text-gray-500 mt-1">
                Send a review request via SMS or Email
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="border-b">
            <nav className="flex -mb-px" aria-label="Tabs">
              {hasSMS && (
                <button
                  onClick={() => setActiveTab('sms')}
                  className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'sms'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon name="FaComments" className="w-4 h-4" />
                    <span>SMS</span>
                    {contact.phone && (
                      <span className="text-xs text-gray-400">({contact.phone})</span>
                    )}
                  </div>
                </button>
              )}
              {hasEmail && (
                <button
                  onClick={() => setActiveTab('email')}
                  className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'email'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon name="FaEnvelope" className="w-4 h-4" />
                    <span>Email</span>
                    {contact.email && (
                      <span className="text-xs text-gray-400">({contact.email})</span>
                    )}
                  </div>
                </button>
              )}
            </nav>
          </div>
          
          {/* Process Indicator */}
          <div className="px-6 pt-4">
            <CommunicationProcessIndicator 
              communicationType={activeTab}
              primaryColor={activeTab === 'sms' ? '#10B981' : '#3B82F6'}
            />
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Email Subject (for emails only) */}
            {activeTab === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email subject..."
                />
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="w-full resize-none"
                placeholder={`Enter your ${activeTab} message...`}
              />
              <p className="text-xs text-gray-500 mt-1">
                {message.length} characters
                {activeTab === 'sms' && message.length > 160 && 
                  ` (${Math.ceil(message.length / 160)} SMS messages)`}
              </p>
            </div>

            {/* Follow-up Reminder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Set Follow-up Reminder
              </label>
              <select
                value={followUpReminder}
                onChange={(e) => setFollowUpReminder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FOLLOW_UP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                We'll remind you to follow up if no review is received
              </p>
            </div>
            
          </div>

          {/* Status Update and Actions - At the bottom */}
          <div className="p-6 border-t bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between">
              {/* Status Dropdown - Left side */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">
                  Status:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="text-sm px-3 py-1.5 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Action Buttons - Right side */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                
                {/* Copy to Clipboard Button (for email only) */}
                {activeTab === 'email' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const copied = await handleCopyToClipboard();
                      if (copied) {
                        // Still save record, update status, and set follow-up
                        await handleCopyAndSend(false);
                      }
                    }}
                    disabled={isLoading}
                    className={`flex items-center gap-2 ${
                      copiedToClipboard 
                        ? 'bg-green-50 border-green-500 text-green-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon name={copiedToClipboard ? 'FaCheck' : 'FaCopy'} className="w-4 h-4" />
                    {copiedToClipboard ? 'Copied!' : 'Copy Only'}
                  </Button>
                )}
                
                <Button
                  type="button"
                  onClick={() => handleCopyAndSend(true)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 ${
                    activeTab === 'sms' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Icon name={activeTab === 'sms' ? 'FaComments' : 'FaEnvelope'} className="w-4 h-4" />
                      {activeTab === 'email' ? 'Open in Email' : 'Copy & Send'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}