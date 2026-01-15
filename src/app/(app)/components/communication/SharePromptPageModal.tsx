"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/app/(app)/components/ui/button";
import { Textarea } from "@/app/(app)/components/ui/textarea";
import Icon from "@/components/Icon";
import TemplateSelector from "./TemplateSelector";
import { applyTemplateVariables } from "@/utils/communication";

interface SharePromptPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptPageUrl: string;
  businessName?: string;
  initialTab?: 'email' | 'sms';
}

export default function SharePromptPageModal({
  isOpen,
  onClose,
  promptPageUrl,
  businessName = "your business",
  initialTab = 'sms'
}: SharePromptPageModalProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'sms'>(initialTab);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();

  // Generate default message based on active tab (only if no template is selected)
  useEffect(() => {
    if (!isOpen) return;
    // Skip if a template is already selected
    if (selectedTemplateId) return;

    const baseMessage = activeTab === 'sms'
      ? `Hi! I'd love to get your feedback on ${businessName}. Please leave a review here: ${promptPageUrl}`
      : `Hi,\n\nI'd love to get your feedback on ${businessName}. Please leave a review here: ${promptPageUrl}\n\nThank you!`;

    if (activeTab === 'email') {
      setSubject('Please leave a review');
      setMessage(baseMessage);
    } else {
      setMessage(baseMessage);
    }
  }, [isOpen, activeTab, promptPageUrl, businessName, selectedTemplateId]);

  // Reset template selection when tab changes
  useEffect(() => {
    setSelectedTemplateId(undefined);
  }, [activeTab]);

  // Handle template selection
  const handleTemplateSelect = (template: {
    id: string;
    name: string;
    subject_template?: string;
    message_template: string;
  }) => {
    setSelectedTemplateId(template.id);

    // Apply template variables
    const variables = {
      business_name: businessName,
      customer_name: "there", // Generic greeting for universal pages
      review_url: promptPageUrl,
    };

    const processedMessage = applyTemplateVariables(template.message_template, variables);
    setMessage(processedMessage);

    if (activeTab === 'email' && template.subject_template) {
      const processedSubject = applyTemplateVariables(template.subject_template, variables);
      setSubject(processedSubject);
    }
  };

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
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  };

  const handleSend = () => {
    if (activeTab === 'email') {
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      window.location.href = mailtoLink;
    } else {
      const smsLink = `sms:?&body=${encodeURIComponent(message)}`;
      window.location.href = smsLink;
    }

    // Close modal after a brief delay to allow the link to open
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50" aria-label="Share prompt page">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full bg-white rounded-xl shadow-lg">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Share prompt page
              </Dialog.Title>
              <p className="text-sm text-gray-500 mt-1">
                Send a review request via SMS or email
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex -mb-px" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('sms')}
                className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'sms'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon name="FaMobile" className="w-4 h-4" />
                  <span>SMS</span>
                </div>
              </button>
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
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6 space-y-4">
            {/* Template Selector */}
            <TemplateSelector
              communicationType={activeTab}
              onSelect={handleTemplateSelect}
              selectedTemplateId={selectedTemplateId}
            />

            {/* Email Subject (for emails only) */}
            {activeTab === 'email' && (
              <div>
                <label htmlFor="share-subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  id="share-subject"
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
              <label htmlFor="share-message" className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <Textarea
                id="share-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={activeTab === 'email' ? 6 : 4}
                className="w-full resize-none"
                placeholder={`Enter your ${activeTab === 'email' ? 'email' : 'SMS'} message...`}
              />
              <p className="text-xs text-gray-500 mt-1">
                {message.length} characters
                {activeTab === 'sms' && message.length > 160 &&
                  ` (${Math.ceil(message.length / 160)} SMS segments)`}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t bg-gray-50 rounded-b-xl">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>

              {/* Copy to Clipboard Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyToClipboard}
                className={`flex items-center gap-2 ${
                  copiedToClipboard
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon name={copiedToClipboard ? 'FaCheck' : 'FaCopy'} className="w-4 h-4" />
                {copiedToClipboard ? 'Copied!' : 'Copy'}
              </Button>

              <Button
                type="button"
                onClick={handleSend}
                className={`flex items-center gap-2 ${
                  activeTab === 'sms'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                <Icon name={activeTab === 'sms' ? 'FaMobile' : 'FaEnvelope'} className="w-4 h-4" />
                {activeTab === 'email' ? 'Open in email' : 'Open in messages'}
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
