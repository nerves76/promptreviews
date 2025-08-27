/**
 * Integration Example for Communication Tracking System
 * 
 * This shows how to integrate the communication buttons into existing prompt page components
 * and communication history into contact profile pages.
 */

"use client";

import React, { useState } from 'react';
import CommunicationButtons from './CommunicationButtons';
import CommunicationHistory from './CommunicationHistory';

// Example: Adding communication buttons to a prompt page component
export function PromptPageWithCommunication() {
  const [promptPage, setPromptPage] = useState({
    id: 'prompt-123',
    slug: 'my-business-review',
    status: 'draft',
    client_name: 'Amazing Restaurant',
    location: 'Portland, OR'
  });

  const contact = {
    id: 'contact-123',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@email.com',
    phone: '+1234567890'
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">
        Review Request for {contact.first_name} {contact.last_name}
      </h2>
      
      <div className="mb-6">
        <p className="text-gray-600">Business: {promptPage.client_name}</p>
        <p className="text-gray-600">Location: {promptPage.location}</p>
        <p className="text-gray-600">Status: <span className="font-medium">{promptPage.status}</span></p>
      </div>

      {/* Communication Buttons - Only show if contact has email or phone */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Send Review Request</h3>
        <CommunicationButtons
          contact={contact}
          promptPage={promptPage}
          onCommunicationSent={() => {
            // Refresh data, show success message, etc.
            console.log('Communication sent successfully!');
            // You might want to refresh the page data here
          }}
          onStatusUpdated={(newStatus) => {
            // Update local state when status changes
            setPromptPage(prev => ({ ...prev, status: newStatus }));
            console.log('Status updated to:', newStatus);
          }}
          className="flex gap-2"
        />
      </div>

      {/* Show communication history for this contact */}
      <div className="mt-6">
        <CommunicationHistory 
          contactId={contact.id}
          className="border-t pt-4"
        />
      </div>
    </div>
  );
}

// Example: Adding communication history to a contact profile page
export function ContactProfileWithHistory() {
  const contact = {
    id: 'contact-456',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1987654321',
    category: 'VIP Customer',
    notes: 'Always leaves great reviews'
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {contact.first_name} {contact.last_name}
            </h1>
            <div className="space-y-1 text-gray-600">
              {contact.email && (
                <p className="flex items-center gap-2">
                  📧 {contact.email}
                </p>
              )}
              {contact.phone && (
                <p className="flex items-center gap-2">
                  📱 {contact.phone}
                </p>
              )}
              {contact.category && (
                <p className="flex items-center gap-2">
                  🏷️ {contact.category}
                </p>
              )}
            </div>
          </div>
          
          {/* Quick action buttons could go here */}
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
              Edit Contact
            </button>
          </div>
        </div>
        
        {contact.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{contact.notes}</p>
          </div>
        )}
      </div>

      {/* Communication History */}
      <CommunicationHistory 
        contactId={contact.id}
        className="bg-white rounded-lg shadow-lg"
      />
    </div>
  );
}

// Example: Integration in your existing contact list/table
export function ContactTableRowWithCommunication({ contact }: { contact: any }) {
  // Example prompt page - in real usage, you'd get this from your data
  const promptPage = {
    id: 'prompt-' + contact.id,
    slug: 'contact-' + contact.id,
    status: 'draft',
    client_name: contact.business_name || 'Your Business',
    location: contact.location
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3">{contact.first_name} {contact.last_name}</td>
      <td className="px-4 py-3">{contact.email || '-'}</td>
      <td className="px-4 py-3">{contact.phone || '-'}</td>
      <td className="px-4 py-3">
        {/* Only render communication buttons if contact has email or phone */}
        {(contact.email || contact.phone) && (
          <CommunicationButtons
            contact={contact}
            promptPage={promptPage}
            onCommunicationSent={() => {
              // Handle success - maybe show a toast notification
            }}
            onStatusUpdated={(newStatus) => {
              // Update the contact's prompt page status
              console.log('Updated status for', contact.first_name, 'to', newStatus);
            }}
            className="flex gap-1"
          />
        )}
      </td>
    </tr>
  );
}

// Example: Bulk communication for multiple contacts
export function BulkCommunicationExample() {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [communicationType, setCommunicationType] = useState<'email' | 'sms'>('email');

  const contacts = [
    { id: '1', first_name: 'Alice', last_name: 'Brown', email: 'alice@email.com' },
    { id: '2', first_name: 'Bob', last_name: 'Wilson', phone: '+1234567890' },
    { id: '3', first_name: 'Carol', last_name: 'Davis', email: 'carol@email.com', phone: '+1987654321' }
  ];

  const handleBulkSend = async () => {
    // For bulk operations, you'd loop through selected contacts
    // and create communication records for each
    for (const contactId of selectedContacts) {
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) continue;

      // Check if contact has the required communication method
      if (communicationType === 'email' && !contact.email) continue;
      if (communicationType === 'sms' && !contact.phone) continue;

      // Create communication record (you'd call your API here)
      console.log(`Sending ${communicationType} to ${contact.first_name} ${contact.last_name}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Bulk Communication</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Communication Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="email"
              checked={communicationType === 'email'}
              onChange={(e) => setCommunicationType(e.target.value as 'email')}
              className="mr-2"
            />
            Email
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="sms"
              checked={communicationType === 'sms'}
              onChange={(e) => setCommunicationType(e.target.value as 'sms')}
              className="mr-2"
            />
            SMS
          </label>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Select Contacts</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {contacts.map(contact => {
            const canReceive = communicationType === 'email' ? contact.email : contact.phone;
            return (
              <label key={contact.id} className={`flex items-center p-2 rounded ${!canReceive ? 'opacity-50' : ''}`}>
                <input
                  type="checkbox"
                  disabled={!canReceive}
                  checked={selectedContacts.includes(contact.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedContacts([...selectedContacts, contact.id]);
                    } else {
                      setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                    }
                  }}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                  <p className="text-sm text-gray-500">
                    {communicationType === 'email' ? contact.email || 'No email' : contact.phone || 'No phone'}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleBulkSend}
        disabled={selectedContacts.length === 0}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send to {selectedContacts.length} contacts
      </button>
    </div>
  );
}